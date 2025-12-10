// ... (imports and top of file remain unchanged)
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Site, ExteriorItem, Point, ToolMode, ItemType, DrawingElement, LineStyle } from '../types';
import { ITEM_CATALOG } from '../constants';

// ... (interfaces and helper functions remain unchanged)
interface Editor2DProps {
  backgroundImage: string | null;
  imageSize: {width: number, height: number} | null;
  site: Site;
  items: ExteriorItem[];
  drawings: DrawingElement[];
  toolMode: ToolMode;
  tempPoints: Point[];
  onCanvasClick: (point: Point) => void;
  activeItemType: ItemType | null;
  onSiteEdgeMouseDown: (edgeIndex: number, point: Point) => void;
  onSiteVertexMouseDown: (vertexIndex: number) => void;
  onCanvasMouseMove: (point: Point) => void;
  onCanvasMouseUp: () => void;
  isEditing: boolean;
  scalePoints: Point[];
  snapDistancePixels: number;
  zoom: number;
  onZoom: (factor: number) => void;
  pan: Point;
  onPan: (dx: number, dy: number) => void;
  rotation: number;
  onRotate: (newAngle: number) => void;
  currentLineStyle: LineStyle;
  selectedItemId: string | null;
  onItemSelect: (id: string) => void;
  onItemContextMenu: (id: string, e: React.MouseEvent) => void;
  onCancelDrawing: () => void;
  onCancelLastSitePoint: () => void;
  scale: number | null;
  pendingConfirmation: { type: 'site' | 'item', points: Point[] } | null;
  onCancelConfirmation: () => void;
  currentSetupStep: number;
}

const getDistance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

function getPointToSegmentDistance(p: Point, a: Point, b: Point) {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (l2 === 0) return getDistance(p, a);
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const closestPoint = {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y)
    };
    return getDistance(p, closestPoint);
}

function getClosestPointOnSegment(p: Point, a: Point, b: Point): Point {
    const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
    if (l2 === 0) return a;
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y)
    };
}

const MINOR_GRID_SPACING = 80;
const MAJOR_GRID_SPACING = 400;


export const Editor2D: React.FC<Editor2DProps> = ({
  backgroundImage,
  imageSize,
  site,
  items,
  drawings,
  toolMode,
  tempPoints,
  onCanvasClick,
  activeItemType,
  onSiteEdgeMouseDown,
  onSiteVertexMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  isEditing,
  scalePoints,
  snapDistancePixels,
  zoom,
  onZoom,
  pan,
  onPan,
  rotation,
  onRotate,
  currentLineStyle,
  selectedItemId,
  onItemSelect,
  onItemContextMenu,
  onCancelDrawing,
  onCancelLastSitePoint,
  scale,
  pendingConfirmation,
  onCancelConfirmation,
  currentSetupStep,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const panZoomGroupRef = useRef<SVGGElement>(null);
  const contentGroupRef = useRef<SVGGElement>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [hoveredEdgeIndex, setHoveredEdgeIndex] = useState<number | null>(null);
  const [hoveredVertexIndex, setHoveredVertexIndex] = useState<number | null>(null);
  const [hoveredScaleVertexIndex, setHoveredScaleVertexIndex] = useState<number | null>(null);
  const [suggestedScalePoints, setSuggestedScalePoints] = useState<Point[]>([]);
  
  const [snappedPoint, setSnappedPoint] = useState<{point: Point, type: 'vertex' | 'edge'} | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const panStartPointRef = useRef<Point | null>(null);

  const activePointersRef = useRef<Map<number, Point>>(new Map());
  const gestureStateRef = useRef<{
    initialDistance: number;
    initialRotation: number;
    panStart: Point;
    isGesturing: boolean;
    currentDistance: number;
  } | null>(null);
  
  // FIX: The return type of setTimeout in the browser is number, not NodeJS.Timeout.
  const longPressTimerRef = useRef<number | null>(null);
  const longPressDragInfoRef = useRef<{ startPoint: Point } | null>(null);

  useEffect(() => {
    if (toolMode === ToolMode.SET_SCALE && scalePoints.length === 1 && site.points.length > 1) {
      const p1 = scalePoints[0];
      const suggestions: Point[] = [];
      
      site.points.forEach(p2 => {
        if (p1.x !== p2.x || p1.y !== p2.y) {
          if (Math.abs(p1.x - p2.x) < 1e-6 || Math.abs(p1.y - p2.y) < 1e-6) {
            suggestions.push(p2);
          }
        }
      });
      
      const uniqueSuggestions = Array.from(new Set(suggestions.map(p => JSON.stringify(p)))).map(s => JSON.parse(s));
      setSuggestedScalePoints(uniqueSuggestions);
    } else {
      setSuggestedScalePoints([]);
    }
  }, [toolMode, scalePoints, site.points]);

  const getCursor = () => {
    if (isPanning || gestureStateRef.current?.isGesturing) return 'grabbing';
    if (toolMode === ToolMode.EDIT_SITE || (currentSetupStep === 3 && isEditing)) {
        if(isEditing) return 'grabbing';
        if (hoveredVertexIndex !== null) return 'grab';
        if (hoveredEdgeIndex !== null) return 'move';
    }
    if (toolMode === ToolMode.SET_SCALE && hoveredScaleVertexIndex !== null) {
      return 'pointer';
    }
    if (toolMode === ToolMode.ADD_ITEM && snappedPoint) {
        return 'copy';
    }
    switch (toolMode) {
      case ToolMode.DRAW_SITE:
      case ToolMode.ADD_ITEM:
      case ToolMode.SET_SCALE:
      case ToolMode.DRAW_LINE:
      case ToolMode.DRAW_RECT:
      case ToolMode.DRAW_CIRCLE:
      case ToolMode.DRAW_ARC:
      case ToolMode.DRAW_DOUBLE_LINE:
        return 'crosshair';
      default:
        return 'default';
    }
  };

  const getSVGPoint = (e: React.PointerEvent | React.MouseEvent | React.WheelEvent): Point => {
    if (!svgRef.current || !panZoomGroupRef.current) return { x: 0, y: 0 };
    
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Get the CTM of the pan/zoom group
    const ctm = panZoomGroupRef.current.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };

    // Transform to the coordinate system of the pan/zoom group
    let transformedPoint = pt.matrixTransform(ctm.inverse());

    // Manually apply the inverse rotation
    if (rotation !== 0 && imageSize) {
        const center = { x: imageSize.width / 2, y: imageSize.height / 2 };
        const angleRad = -rotation * (Math.PI / 180);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const tx = transformedPoint.x - center.x;
        const ty = transformedPoint.y - center.y;

        const rotatedX = tx * cos - ty * sin;
        const rotatedY = tx * sin + ty * cos;

        transformedPoint.x = rotatedX + center.x;
        transformedPoint.y = rotatedY + center.y;
    }

    return { x: transformedPoint.x, y: transformedPoint.y };
  };
  
  const applyZoom = useCallback((factor: number, screenCenter: Point) => {
    if (!svgRef.current || !contentGroupRef.current) return;
    
    const newZoom = Math.max(0.1, Math.min(zoom * factor, 10));
    if (Math.abs(newZoom - zoom) < 1e-6) return;
    
    const actualFactor = newZoom / zoom;
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const pt = svgRef.current.createSVGPoint();
    pt.x = screenCenter.x - svgRect.left;
    pt.y = screenCenter.y - svgRect.top;
    
    const ctm = contentGroupRef.current.getScreenCTM()!;
    const svgPoint = pt.matrixTransform(ctm.inverse());

    const panDx = (svgPoint.x - pan.x) * (1 - actualFactor) * newZoom;
    const panDy = (svgPoint.y - pan.y) * (1 - actualFactor) * newZoom;
    
    onZoom(actualFactor);
    onPan(panDx, panDy);
  }, [zoom, pan, onZoom, onPan]);

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Disable gestures in steps 3 and 4
    if (currentSetupStep === 3 || currentSetupStep === 4) {
      // Allow single pointer down for clicks and long-press
    } else {
        if (activePointersRef.current.size === 2) {
          const pointers: Point[] = Array.from(activePointersRef.current.values());
          const [p1, p2] = pointers;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          gestureStateRef.current = {
            initialDistance: distance,
            initialRotation: rotation,
            panStart: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
            isGesturing: true,
            currentDistance: distance,
          };
          setIsPanning(false);
          panStartPointRef.current = null;
        } else if (activePointersRef.current.size === 1) {
          if (e.button === 2 || e.pointerType === 'touch') {
              setIsPanning(true);
              panStartPointRef.current = { x: e.clientX, y: e.clientY };
          }
        }
    }
    
    if (activePointersRef.current.size > 1) return;

    const point = getSVGPoint(e);

    // Long press logic for Step 3 (Site Drawing) to move vertices
    if (currentSetupStep === 3 && toolMode === ToolMode.DRAW_SITE && !isEditing) {
        const vertexHoverDist = snapDistancePixels / zoom;
        let vertexToDrag = -1;
        for (let i = 0; i < site.points.length; i++) {
            if (getDistance(point, site.points[i]) < vertexHoverDist) {
                vertexToDrag = i;
                break;
            }
        }

        if (vertexToDrag !== -1) {
            longPressDragInfoRef.current = { startPoint: { x: e.clientX, y: e.clientY } };

            longPressTimerRef.current = window.setTimeout(() => {
                if (longPressDragInfoRef.current) {
                    onSiteVertexMouseDown(vertexToDrag);
                    longPressDragInfoRef.current = null;
                }
            }, 400);

            e.preventDefault();
            return;
        }
    }

    if (toolMode === ToolMode.EDIT_SITE) {
        if (hoveredVertexIndex !== null) {
            onSiteVertexMouseDown(hoveredVertexIndex);
        } else if (hoveredEdgeIndex !== null) {
            onSiteEdgeMouseDown(hoveredEdgeIndex, point);
        }
    } else {
        if(e.button !== 2) {
            onCanvasClick(point);
        }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (longPressDragInfoRef.current && !isEditing) {
        const moveDist = Math.sqrt(
            (e.clientX - longPressDragInfoRef.current.startPoint.x)**2 + 
            (e.clientY - longPressDragInfoRef.current.startPoint.y)**2
        );
        if (moveDist > 10) { // 10px tolerance to prevent cancelling on small jitters
            if (longPressTimerRef.current) {
                clearTimeout(longPressTimerRef.current);
                longPressTimerRef.current = null;
            }
            longPressDragInfoRef.current = null;
        }
    }

    if (gestureStateRef.current?.isGesturing && activePointersRef.current.size >= 2) {
      const pointers: Point[] = Array.from(activePointersRef.current.values());
      const [p1, p2] = pointers;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const center = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      const gesture = gestureStateRef.current;

      // Pan
      const panDx = (center.x - gesture.panStart.x) * 1.2;
      const panDy = (center.y - gesture.panStart.y) * 1.2;
      onPan(panDx, panDy);
      gesture.panStart = center;
      
      // Zoom
      if (gesture.currentDistance > 0) {
        const zoomFactor = distance / gesture.currentDistance;
        const moderatedZoomFactor = 1 + (zoomFactor - 1) * 0.15;
        applyZoom(moderatedZoomFactor, center);
      }
      gesture.currentDistance = distance;
      return;
    }
    
    if (isPanning && panStartPointRef.current) {
        if (currentSetupStep === 3 || currentSetupStep === 4) return;
        const dx = (e.clientX - panStartPointRef.current.x) * 1.2;
        const dy = (e.clientY - panStartPointRef.current.y) * 1.2;
        panStartPointRef.current = { x: e.clientX, y: e.clientY };
        onPan(dx, dy);
        return;
    }

    const currentPoint = getSVGPoint(e);
    setMousePos(currentPoint);

    if (isEditing) {
        onCanvasMouseMove(currentPoint);
        return;
    }
        
    setHoveredVertexIndex(null);
    setHoveredEdgeIndex(null);
    setHoveredScaleVertexIndex(null);
    setSnappedPoint(null);

    const vertexHoverDist = (snapDistancePixels / 2) / zoom;
    const edgeHoverDist = 10 / zoom;

    const isDrawingOrPlacing = [
        ToolMode.ADD_ITEM,
        ToolMode.DRAW_SITE,
        ToolMode.DRAW_LINE,
        ToolMode.DRAW_RECT,
        ToolMode.DRAW_CIRCLE,
        ToolMode.DRAW_ARC,
        ToolMode.DRAW_DOUBLE_LINE,
    ].includes(toolMode);

    if (toolMode === ToolMode.EDIT_SITE) {
        let vertexFound = false;
        for(let i = 0; i < site.points.length; i++) {
            if (getDistance(currentPoint, site.points[i]) < vertexHoverDist) {
                setHoveredVertexIndex(i);
                vertexFound = true;
                break;
            }
        }
        
        if (vertexFound) return;

        let closestEdge = -1;
        let minDistance = Infinity;
        
        if (site.points.length > 1) {
            for (let i = 0; i < site.points.length; i++) {
                const p1 = site.points[i];
                const p2 = site.points[(i + 1) % site.points.length];
                const distance = getPointToSegmentDistance(currentPoint, p1, p2);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEdge = i;
                }
            }
        }

        if (minDistance < edgeHoverDist) {
            setHoveredEdgeIndex(closestEdge);
        }

    } else if (toolMode === ToolMode.SET_SCALE) {
        let closestVertexIndex: number | null = null;
        let minDistance = snapDistancePixels / zoom;

        for (let i = 0; i < site.points.length; i++) {
            const vertex = site.points[i];
            const distance = getDistance(currentPoint, vertex);
            if (distance < minDistance) {
                minDistance = distance;
                closestVertexIndex = i;
            }
        }
        
        if (closestVertexIndex !== null) {
            const firstScalePoint = scalePoints.length > 0 ? scalePoints[0] : null;
            const closestVertexPoint = site.points[closestVertexIndex];
            if (firstScalePoint && firstScalePoint.x === closestVertexPoint.x && firstScalePoint.y === closestVertexPoint.y) {
                 // Don't highlight the already selected point
            } else {
                setHoveredScaleVertexIndex(closestVertexIndex);
            }
        }
    } else if (isDrawingOrPlacing) {
        const allVertices: Point[] = [...site.points];
        const allSegments: {p1: Point, p2: Point}[] = [];

        if (site.points.length > 1) {
            for (let i = 0; i < site.points.length; i++) {
                allSegments.push({ p1: site.points[i], p2: site.points[(i + 1) % site.points.length] });
            }
        }

        items.forEach(item => {
            allVertices.push(...item.points);
            if (item.points.length >= 2) {
                const itemInfo = ITEM_CATALOG[item.type];
                const isPolygon = itemInfo && itemInfo.unit === 'm²';
                for (let i = 0; i < item.points.length - 1; i++) {
                    allSegments.push({ p1: item.points[i], p2: item.points[i + 1] });
                }
                if (isPolygon && item.points.length > 2) {
                    allSegments.push({ p1: item.points[item.points.length - 1], p2: item.points[0] });
                }
            }
        });

        let foundSnap = false;
        let minDistance = snapDistancePixels / zoom;
        let bestVertex: Point | null = null;

        for (const vertex of allVertices) {
            const distance = getDistance(currentPoint, vertex);
            if (distance < minDistance) {
                minDistance = distance;
                bestVertex = vertex;
            }
        }

        if (bestVertex) {
            setSnappedPoint({ point: bestVertex, type: 'vertex' });
            foundSnap = true;
        }

        if (!foundSnap) {
             let closestPointOnEdge: Point | null = null;
             let minEdgeDist = snapDistancePixels / zoom;

             for (const segment of allSegments) {
                const pt = getClosestPointOnSegment(currentPoint, segment.p1, segment.p2);
                const distance = getDistance(currentPoint, pt);

                if (distance < minEdgeDist) {
                    minEdgeDist = distance;
                    closestPointOnEdge = pt;
                }
            }

            if (closestPointOnEdge) {
                setSnappedPoint({ point: closestPointOnEdge, type: 'edge' });
            }
        }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    activePointersRef.current.delete(e.pointerId);

    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        // If timer is cleared before firing, it was a short click.
        // We might want to trigger a normal click here if needed, but for now we do nothing on short-clicking a vertex in step 3.
    }
    longPressDragInfoRef.current = null;

    if (activePointersRef.current.size < 2 && gestureStateRef.current?.isGesturing) {
      gestureStateRef.current = null;
    }
  
    if (activePointersRef.current.size === 0) {
      setIsPanning(false);
      panStartPointRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      const [pointer]: Point[] = Array.from(activePointersRef.current.values());
      setIsPanning(true);
      panStartPointRef.current = pointer;
    }
    
    onCanvasMouseUp();
  };
  
  const handlePointerLeave = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    activePointersRef.current.delete(e.pointerId);

    if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
    }
    longPressDragInfoRef.current = null;
    
    if (activePointersRef.current.size < 2 && gestureStateRef.current?.isGesturing) {
      gestureStateRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      setIsPanning(false);
      panStartPointRef.current = null;
    } else if (activePointersRef.current.size === 1) {
      const [pointer]: Point[] = Array.from(activePointersRef.current.values());
      setIsPanning(true);
      panStartPointRef.current = pointer;
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (currentSetupStep === 3 || currentSetupStep === 4) return;
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    applyZoom(zoomFactor, { x: e.clientX, y: e.clientY });
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pendingConfirmation) {
      onCancelConfirmation();
      return;
    }
    if (toolMode === ToolMode.DRAW_SITE && site.points.length > 0) {
      onCancelLastSitePoint();
      return;
    }
    if (tempPoints.length > 0) {
      onCancelDrawing();
    }
  };
  
  const isDrawingPolygon = toolMode === ToolMode.DRAW_SITE || (toolMode === ToolMode.ADD_ITEM && activeItemType && ITEM_CATALOG[activeItemType].unit === 'm²');
  const currentDrawingPoints = toolMode === ToolMode.DRAW_SITE ? site.points : tempPoints;
  const lastActivePoint = currentDrawingPoints.length > 0 ? currentDrawingPoints[currentDrawingPoints.length - 1] : null;
  const minPointsToClose = toolMode === ToolMode.DRAW_SITE ? 3 : 2;
  const canCloseShape = isDrawingPolygon && currentDrawingPoints.length >= minPointsToClose;
  const closeSnapDistance = snapDistancePixels * 4.0;
  
  const calculatedEndPoint = useMemo(() => {
    if (!mousePos) return null;
    if (canCloseShape && getDistance(currentDrawingPoints[0], mousePos) < closeSnapDistance / zoom) {
      return currentDrawingPoints[0];
    }
    if (snappedPoint) {
      return snappedPoint.point;
    }
    
    const isOrthogonalSnappingActive = (toolMode === ToolMode.DRAW_SITE && lastActivePoint) || 
                                     (toolMode === ToolMode.ADD_ITEM &&
                                      (activeItemType === ItemType.FLOORING || activeItemType === ItemType.TATAMI) &&
                                      lastActivePoint);

    if (isOrthogonalSnappingActive) {
        let finalPoint = { ...mousePos };
        const snapDistanceSVG = snapDistancePixels / zoom;
        const lastPoint = lastActivePoint!; 
        
        const dxAbs = Math.abs(finalPoint.x - lastPoint.x);
        const dyAbs = Math.abs(finalPoint.y - lastPoint.y);
        
        const pointsForSnapping = toolMode === ToolMode.DRAW_SITE 
            ? site.points 
            : [...currentDrawingPoints, ...site.points];
        const snapXCoords = pointsForSnapping.map(p => p.x);
        const snapYCoords = pointsForSnapping.map(p => p.y);

        if (dxAbs > dyAbs) { // Horizontal movement is dominant
            finalPoint.y = lastPoint.y;
            let closestX = finalPoint.x;
            let minDx = snapDistanceSVG;
            for (const x of snapXCoords) {
                const dist = Math.abs(finalPoint.x - x);
                if (dist < minDx) {
                    minDx = dist;
                    closestX = x;
                }
            }
            finalPoint.x = closestX;
        } else { // Vertical movement is dominant
            finalPoint.x = lastPoint.x;
            let closestY = finalPoint.y;
            let minDy = snapDistanceSVG;
            for (const y of snapYCoords) {
                const dist = Math.abs(finalPoint.y - y);
                if (dist < minDy) {
                    minDy = dist;
                    closestY = y;
                }
            }
            finalPoint.y = closestY;
        }
        
        return finalPoint;
    }
    return mousePos;
  }, [mousePos, snappedPoint, toolMode, site.points, tempPoints, activeItemType, closeSnapDistance, zoom, canCloseShape, currentDrawingPoints, lastActivePoint, snapDistancePixels]);

  const isCloseToStart = canCloseShape && mousePos && getDistance(currentDrawingPoints[0], mousePos) < closeSnapDistance / zoom;
  const dynamicEndPoint = calculatedEndPoint;
  
  const getStrokeDashArray = (style: LineStyle) => {
      switch (style) {
          case 'dashed': return `${10/zoom}, ${5/zoom}`;
          case 'dashdot': return `${10/zoom}, ${4/zoom}, ${2/zoom}, ${4/zoom}`;
          default: return 'none';
      }
  };
  
  const isConfirming = !!pendingConfirmation;

  const renderDrawingElement = (drawing: DrawingElement) => {
      const { tool, points, style, id } = drawing;
      const strokeWidth = 2 / zoom;
      const strokeDasharray = getStrokeDashArray(style);
      const strokeColor = "#333";

      if (points.length < 2) return null;

      if (tool === ToolMode.DRAW_LINE) {
          return <line key={id} x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      } else if (tool === ToolMode.DRAW_RECT) {
          const x = Math.min(points[0].x, points[1].x);
          const y = Math.min(points[0].y, points[1].y);
          const w = Math.abs(points[0].x - points[1].x);
          const h = Math.abs(points[0].y - points[1].y);
          return <rect key={id} x={x} y={y} width={w} height={h} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
      } else if (tool === ToolMode.DRAW_CIRCLE) {
          const r = getDistance(points[0], points[1]);
          return <circle key={id} cx={points[0].x} cy={points[0].y} r={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
      } else if (tool === ToolMode.DRAW_ARC) {
          if (points.length < 3) return null;
          return <path key={id} d={`M ${points[0].x} ${points[0].y} Q ${points[1].x} ${points[1].y} ${points[2].x} ${points[2].y}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
      } else if (tool === ToolMode.DRAW_DOUBLE_LINE) {
          const p1 = points[0];
          const p2 = points[1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len === 0) return null;
          
          const offset = (15 / zoom);
          const nx = -dy / len * offset / 2;
          const ny = dx / len * offset / 2;

          return (
              <g key={id}>
                  <line x1={p1.x + nx} y1={p1.y + ny} x2={p2.x + nx} y2={p2.y + ny} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1={p1.x - nx} y1={p1.y - ny} x2={p2.x - nx} y2={p2.y - ny} stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
          );
      }
      return null;
  };

  const renderTempDrawing = () => {
      if (tempPoints.length === 0 || !mousePos) return null;
      const strokeWidth = 2 / zoom;
      const strokeDasharray = getStrokeDashArray(currentLineStyle);
      const strokeColor = "#3B82F6"; 

      if (toolMode === ToolMode.DRAW_LINE) {
          return <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={mousePos.x} y2={mousePos.y} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} />;
      } else if (toolMode === ToolMode.DRAW_RECT) {
          const x = Math.min(tempPoints[0].x, mousePos.x);
          const y = Math.min(tempPoints[0].y, mousePos.y);
          const w = Math.abs(tempPoints[0].x - mousePos.x);
          const h = Math.abs(tempPoints[0].y - mousePos.y);
          return <rect x={x} y={y} width={w} height={h} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
      } else if (toolMode === ToolMode.DRAW_CIRCLE) {
          const r = getDistance(tempPoints[0], mousePos);
          return <circle cx={tempPoints[0].x} cy={tempPoints[0].y} r={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
      } else if (toolMode === ToolMode.DRAW_ARC) {
          if (tempPoints.length === 1) {
              return <line x1={tempPoints[0].x} y1={tempPoints[0].y} x2={mousePos.x} y2={mousePos.y} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="4 4" opacity="0.5" />;
          } else if (tempPoints.length === 2) {
              return <path d={`M ${tempPoints[0].x} ${tempPoints[0].y} Q ${tempPoints[1].x} ${tempPoints[1].y} ${mousePos.x} ${mousePos.y}`} stroke={strokeColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={strokeDasharray} />;
          }
      } else if (toolMode === ToolMode.DRAW_DOUBLE_LINE) {
          const p1 = tempPoints[0];
          const p2 = mousePos;
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len === 0) return null;
          
          const offset = (15 / zoom);
          const nx = -dy / len * offset / 2;
          const ny = dx / len * offset / 2;

          return (
              <g>
                  <line x1={p1.x + nx} y1={p1.y + ny} x2={p2.x + nx} y2={p2.y + ny} stroke={strokeColor} strokeWidth={strokeWidth} />
                  <line x1={p1.x - nx} y1={p1.y - ny} x2={p2.x - nx} y2={p2.y - ny} stroke={strokeColor} strokeWidth={strokeWidth} />
              </g>
          );
      }
      return null;
  };

  const renderItem = (item: ExteriorItem) => {
    const { id, type, points } = item;
    const itemInfo = ITEM_CATALOG[type];
    
    if (points.length === 0) return null;
    
    const isSelected = selectedItemId === id;
    const strokeWidth = (isSelected ? 4 : 2) / zoom;
    const strokeColorBase = isSelected ? '#EF4444' : '#555'; 

    const handleProps = {
        onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onItemSelect(id);
        },
        onContextMenu: (e: React.MouseEvent) => {
            e.stopPropagation();
            onItemContextMenu(id, e);
        },
        style: { cursor: toolMode === ToolMode.SELECT ? 'pointer' : 'default' }
    };

    if (itemInfo.unit === 'm²') {
        if (points.length < 3) return null;
        let fillColor = 'rgba(200, 200, 200, 0.5)';
        if (type === ItemType.FLOORING) fillColor = 'rgba(210, 180, 140, 0.8)';
        else if (type === ItemType.TATAMI) fillColor = 'rgba(173, 219, 136, 0.8)';
        else if (type === ItemType.CLOSET) fillColor = 'rgba(255, 228, 196, 0.6)';

        return (
            <polygon
                key={id}
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill={isSelected ? fillColor.replace(/[\d.]+\)/, '0.95)') : fillColor}
                stroke={strokeColorBase}
                strokeWidth={strokeWidth}
                {...handleProps}
            />
        );
    }
    
    if (type === ItemType.WALL_CROSS || type === ItemType.DOOR || type === ItemType.WINDOW) {
        if (points.length < 2) return null;
        let color = '#333';
        let width = 4 / zoom;
        
        if (type === ItemType.WALL_CROSS) { color = '#555'; width = 6 / zoom; }
        else if (type === ItemType.DOOR) { color = '#8B4513'; width = 4 / zoom; }
        else if (type === ItemType.WINDOW) { color = '#87CEEB'; width = 4 / zoom; }
        
        if (isSelected) {
            color = '#EF4444';
            width += 2 / zoom;
        }

        return (
            <polyline
                key={id}
                points={points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={color}
                strokeWidth={width}
                strokeLinecap="round"
                {...handleProps}
            />
        );
    }

    if (points.length === 1) {
        const p = points[0];
        let r = 8 / zoom;
        let fill = '#10B981';
        
        if (type === ItemType.KITCHEN) { fill = '#EF4444'; r = 10 / zoom; }
        else if (type === ItemType.BATH) { fill = '#3B82F6'; r = 12 / zoom; }
        else if (type === ItemType.TOILET) { fill = '#6366F1'; r = 6 / zoom; }
        else if (type === ItemType.WASHBASIN) { fill = '#06B6D4'; r = 6 / zoom; }

        const baseCircle = <circle cx={p.x} cy={p.y} r={r} fill={fill} stroke="white" strokeWidth={1/zoom} fillOpacity={0.8} />;

        if (isSelected) {
            return (
                <g key={id} {...handleProps}>
                    {baseCircle}
                    <circle cx={p.x} cy={p.y} r={r} fill="none" stroke="#EF4444" strokeWidth={3 / zoom} />
                </g>
            );
        }
        return <g key={id} {...handleProps}>{baseCircle}</g>;
    }

    return null;
  };

  const center = imageSize ? { x: imageSize.width / 2, y: imageSize.height / 2 } : { x: 50, y: 50 };
  const gridCoverageSize = imageSize ? Math.max(imageSize.width, imageSize.height) * 10 : 10000;

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full overflow-hidden bg-white">
        <style>
          {`
            @keyframes pulse-ring { 0% { r: 6px; opacity: 0.8; } 50% { r: 20px; opacity: 0; } 100% { r: 6px; opacity: 0.8; } }
            .pulse-circle { animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; transform-origin: center; fill: rgba(249, 115, 22, 0.6); }
            @keyframes blink-effect { 50% { opacity: 0.5; } }
            .blinking-dot { animation: blink-effect 1.2s step-end infinite; }
            @keyframes ripple-effect { 0% { transform: scale(1); opacity: 0.6; } 100% { transform: scale(3); opacity: 0; } }
            .ripple-circle { animation: ripple-effect 1.5s ease-out infinite; transform-origin: center; stroke: #4ade80; fill: none; }
            @keyframes move-dashes { to { stroke-dashoffset: -40px; } }
            .scaling-line-animated { animation: move-dashes 0.8s linear infinite; }
          `}
        </style>
        {!backgroundImage && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-lg">間取り図をアップロードまたは撮影してください</p>
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={imageSize ? `0 0 ${imageSize.width} ${imageSize.height}` : '0 0 100 100'}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
          style={{ cursor: getCursor(), touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
        >
            <defs>
                <pattern id="minorGrid" width={MINOR_GRID_SPACING} height={MINOR_GRID_SPACING} patternUnits="userSpaceOnUse"><path d={`M ${MINOR_GRID_SPACING} 0 L 0 0 0 ${MINOR_GRID_SPACING}`} fill="none" stroke="#E0E0E0" strokeWidth="0.5" vectorEffect="non-scaling-stroke" /></pattern>
                <pattern id="majorGrid" width={MAJOR_GRID_SPACING} height={MAJOR_GRID_SPACING} patternUnits="userSpaceOnUse"><rect width={MAJOR_GRID_SPACING} height={MAJOR_GRID_SPACING} fill="url(#minorGrid)"/><path d={`M ${MAJOR_GRID_SPACING} 0 L 0 0 0 ${MAJOR_GRID_SPACING}`} fill="none" stroke="#CCCCCC" strokeWidth="1" vectorEffect="non-scaling-stroke" /></pattern>
            </defs>
            <g ref={panZoomGroupRef} transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
                <g ref={contentGroupRef} transform={`rotate(${rotation} ${center.x} ${center.y})`}>
                    {imageSize && (<rect x={center.x - gridCoverageSize / 2} y={center.y - gridCoverageSize / 2} width={gridCoverageSize} height={gridCoverageSize} fill="url(#majorGrid)" />)}
                    {backgroundImage && <image href={backgroundImage} x="0" y="0" width="100%" height="100%" />}
                    {drawings.map(renderDrawingElement)}
                    {items.map(renderItem)}
                    {pendingConfirmation?.type === 'item' && (<polygon points={pendingConfirmation.points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(239, 68, 68, 0.3)" stroke="#EF4444" strokeWidth={3 / zoom} strokeDasharray={`${6 / zoom}`} />)}
                    <g>
                        <polygon points={site.points.map(p => `${p.x},${p.y}`).join(' ')} fill={isConfirming && pendingConfirmation?.type === 'site' ? "rgba(249, 115, 22, 0.3)" : "rgba(249, 115, 22, 0.1)"} stroke="#A1A1AA" strokeWidth={18 / zoom} strokeLinejoin="round" />
                        <polygon points={site.points.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#F97316" strokeWidth={10 / zoom} strokeLinejoin="round" />
                    </g>
                    {site.points.map((p, i) => { const isStartPoint = i === 0; const showBlink = toolMode === ToolMode.DRAW_SITE && !isConfirming && site.points.length >= 1 && isStartPoint; return (<circle key={`site-vertex-${i}`} cx={p.x} cy={p.y} r={54 / zoom} fill="#F97316" stroke="white" strokeWidth={3/zoom} className={showBlink ? 'blinking-dot' : ''} />); })}
                    {toolMode === ToolMode.DRAW_SITE && !isConfirming && mousePos && site.points.length > 0 && dynamicEndPoint && (<g><line x1={site.points[site.points.length - 1].x} y1={site.points[site.points.length - 1].y} x2={dynamicEndPoint.x} y2={dynamicEndPoint.y} stroke="#A1A1AA" strokeWidth={18 / zoom} strokeDasharray={`${24 / zoom}`} strokeLinecap="round" /><line x1={site.points[site.points.length - 1].x} y1={site.points[site.points.length - 1].y} x2={dynamicEndPoint.x} y2={dynamicEndPoint.y} stroke="#F97316" strokeWidth={10 / zoom} strokeDasharray={`${24 / zoom}`} strokeLinecap="round" /></g>)}
                    {toolMode === ToolMode.ADD_ITEM && !isConfirming && tempPoints.length > 0 && mousePos && activeItemType && dynamicEndPoint && (<polyline points={[...tempPoints, dynamicEndPoint].map(p => `${p.x},${p.y}`).join(' ')} stroke="#EF4444" strokeWidth={12 / zoom} fill={ITEM_CATALOG[activeItemType].unit === 'm²' && isCloseToStart ? 'rgba(239, 68, 68, 0.3)' : 'none'} strokeDasharray={`${24 / zoom}`} />)}
                    {renderTempDrawing()}
                    {toolMode === ToolMode.ADD_ITEM && activeItemType && (ITEM_CATALOG[activeItemType].unit === 'item') && mousePos && (<circle cx={mousePos.x} cy={mousePos.y} r={54 / zoom} fill="rgba(239, 68, 68, 0.5)" />)}
                    {tempPoints.map((p, i) => { const isPolygonItem = activeItemType && ITEM_CATALOG[activeItemType].unit === 'm²'; const isStartPoint = i === 0; const showBlink = toolMode === ToolMode.ADD_ITEM && !isConfirming && isPolygonItem && tempPoints.length >= 1 && isStartPoint; return (<circle key={`temp-${i}`} cx={p.x} cy={p.y} r={54 / zoom} fill="#EF4444" stroke="white" strokeWidth={3/zoom} className={showBlink ? 'blinking-dot' : ''} />); })}
                    {isDrawingPolygon && lastActivePoint && !isConfirming && (<circle cx={lastActivePoint.x} cy={lastActivePoint.y} className="pulse-circle" style={{ animationDuration: '1.5s', vectorEffect: 'non-scaling-stroke' }} />)}
                    {toolMode === ToolMode.SET_SCALE && (<g>{scalePoints.map((p, i) => (<circle key={`scale-pt-${i}`} cx={p.x} cy={p.y} r={54 / zoom} fill="rgba(59, 130, 246, 1)" stroke="white" strokeWidth={2 / zoom} className={i === 0 && scalePoints.length === 1 ? 'blinking-dot' : ''} />))}{suggestedScalePoints.map((p, i) => (<g key={`suggestion-${i}`}><circle cx={p.x} cy={p.y} r={30 / zoom} fill="rgba(74, 222, 128, 0.3)" style={{ pointerEvents: 'none' }} /><circle className="ripple-circle" cx={p.x} cy={p.y} r={30 / zoom} strokeWidth={3 / zoom} style={{ pointerEvents: 'none' }} /></g>))}{mousePos && scalePoints.length === 1 && (<line className="scaling-line-animated" x1={scalePoints[0].x} y1={scalePoints[0].y} x2={hoveredScaleVertexIndex !== null ? site.points[hoveredScaleVertexIndex].x : mousePos.x} y2={hoveredScaleVertexIndex !== null ? site.points[hoveredScaleVertexIndex].y : mousePos.y} stroke="rgba(59, 130, 246, 0.8)" strokeWidth={4 / zoom} strokeDasharray={`${10 / zoom} ${5 / zoom}`} />)}{scalePoints.length === 2 && (() => { const p1 = scalePoints[0]; const p2 = scalePoints[1]; const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x); const arrowSize = 40 / zoom; const arrowAngle = Math.PI / 6; const p1_arrow_p2 = { x: p1.x - arrowSize * Math.cos(angleRad + arrowAngle), y: p1.y - arrowSize * Math.sin(angleRad + arrowAngle) }; const p1_arrow_p3 = { x: p1.x - arrowSize * Math.cos(angleRad - arrowAngle), y: p1.y - arrowSize * Math.sin(angleRad - arrowAngle) }; const p2_arrow_p2 = { x: p2.x + arrowSize * Math.cos(angleRad + arrowAngle), y: p2.y + arrowSize * Math.sin(angleRad + arrowAngle) }; const p2_arrow_p3 = { x: p2.x + arrowSize * Math.cos(angleRad - arrowAngle), y: p2.y + arrowSize * Math.sin(angleRad - arrowAngle) }; return (<g><line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#3B82F6" strokeWidth={6 / zoom} /><polygon points={`${p1.x},${p1.y} ${p1_arrow_p2.x},${p1_arrow_p2.y} ${p1_arrow_p3.x},${p1_arrow_p3.y}`} fill="#3B82F6" /><polygon points={`${p2.x},${p2.y} ${p2_arrow_p2.x},${p2_arrow_p2.y} ${p2_arrow_p3.x},${p2_arrow_p3.y}`} fill="#3B82F6" /></g>); })()}{hoveredScaleVertexIndex !== null && (<circle cx={site.points[hoveredScaleVertexIndex].x} cy={site.points[hoveredScaleVertexIndex].y} r={60 / zoom} fill="rgba(59, 130, 246, 0.5)" style={{ pointerEvents: 'none' }} />)}</g>)}
                    {isCloseToStart && !isConfirming && (<circle cx={currentDrawingPoints[0].x} cy={currentDrawingPoints[0].y} r={(closeSnapDistance) / zoom} fill="rgba(249, 115, 22, 0.5)" stroke="#F97316" strokeWidth={2 / zoom} style={{ cursor: 'pointer' }} />)}
                    {snappedPoint && (<g style={{ pointerEvents: 'none' }}><circle cx={snappedPoint.point.x} cy={snappedPoint.point.y} r={snappedPoint.type === 'vertex' ? (54 / zoom) : (18 / zoom)} fill={snappedPoint.type === 'vertex' ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.4)"} stroke={snappedPoint.type === 'vertex' ? "#EF4444" : "#F97316"} strokeWidth={2 / zoom} />{snappedPoint.type === 'vertex' ? (<circle cx={snappedPoint.point.x} cy={snappedPoint.point.y} r={3 / zoom} fill="#EF4444" />) : (<path d={`M ${snappedPoint.point.x - 4/zoom} ${snappedPoint.point.y - 4/zoom} L ${snappedPoint.point.x + 4/zoom} ${snappedPoint.point.y + 4/zoom} M ${snappedPoint.point.x - 4/zoom} ${snappedPoint.point.y + 4/zoom} L ${snappedPoint.point.x + 4/zoom} ${snappedPoint.point.y - 4/zoom}`} stroke="#F97316" strokeWidth={2 / zoom} />)}</g>)}
                    {toolMode === ToolMode.EDIT_SITE && site.points.map((p, i) => (<circle key={`handle-vertex-${i}`} cx={p.x} cy={p.y} r={(hoveredVertexIndex === i ? 40 : 36) / zoom} fill={hoveredVertexIndex === i ? 'rgba(234, 179, 8, 1)' : 'rgba(249, 115, 22, 0.8)'} stroke="white" strokeWidth={3 / zoom} />))}
                    {toolMode === ToolMode.EDIT_SITE && hoveredEdgeIndex !== null && hoveredVertexIndex === null && (() => { const p1 = site.points[hoveredEdgeIndex]; const p2 = site.points[(hoveredEdgeIndex + 1) % site.points.length]; const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }; const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI; return (<g><line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(234, 179, 8, 0.8)" strokeWidth={8 / zoom} strokeLinecap="round" /><g transform={`translate(${midPoint.x}, ${midPoint.y}) rotate(${angle + 90}) scale(${1 / zoom})`} style={{ pointerEvents: 'none' }}><rect x="-30" y="-15" width="60" height="30" fill="rgba(255,255,255,0.7)" rx="5" /><text fontSize="32" fill="#F97316" textAnchor="middle" dominantBaseline="central" style={{ userSelect: 'none' }}>↔</text></g></g>); })()}
                </g>
            </g>
        </svg>
      </div>
    </div>
  );
};