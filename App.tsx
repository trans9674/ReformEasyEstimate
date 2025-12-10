// FIX: Removed extraneous file content that was concatenated to this file, causing compilation errors.
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Editor2D } from './components/Editor2D';
import { Editor3D } from './components/Editor3D';
import { ControlPanel } from './components/ControlPanel';
import { Site, ExteriorItem, Point, ViewMode, ToolMode, ItemType, BoundaryType, DrawingElement, LineStyle } from './types';
import { ITEM_CATALOG, SNAP_DISTANCE_METER } from './constants';
import { ConfirmationModal as ConfirmationControls } from './components/ConfirmationModal';
import { ScaleModal as ScaleControl } from './components/ScaleModal';
import { RotationModal } from './components/RotationModal';
import { Header } from './components/Header';
import { ItemActionModal } from './components/ItemActionModal';
import { NumericMoveModal } from './components/NumericMoveModal';
import { FlipModal } from './components/FlipModal';
import { ImageAdjuster } from './components/ImageAdjuster';
import { CameraIcon } from './components/Icons';
import { SetupStepper } from './components/SetupStepper';
import polygonClipping from 'polygon-clipping';
import * as pdfjsLib from 'pdfjs-dist';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs';

const getDistance = (p1: Point, p2: Point) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

function onSegment(p: Point, q: Point, r: Point): boolean {
    return (
        q.x <= Math.max(p.x, r.x) &&
        q.x >= Math.min(p.x, r.x) &&
        q.y <= Math.max(p.y, r.y) &&
        q.y >= Math.min(p.y, r.y)
    );
}

function orientation(p: Point, q: Point, r: Point): number {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0; // Collinear
    return val > 0 ? 1 : 2; // Clockwise or Counterclockwise
}

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
    let isInside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y))
            && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;
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

function getCentroid(points: Point[]): Point {
    if (points.length === 0) return { x: 0, y: 0 };
    let x = 0, y = 0;
    for (const p of points) {
        x += p.x;
        y += p.y;
    }
    return { x: x / points.length, y: y / points.length };
}

function isClockwise(points: Point[]): boolean {
    let area = 0;
    if (points.length < 3) return false;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += (p2.x - p1.x) * (p2.y + p1.y);
    }
    // For screen coordinates where Y is down, positive area means clockwise.
    return area > 0;
}


type EditingState = {
    type: 'edge';
    edgeIndex: number;
    startPoint: Point;
    edgeNormal: Point;
    originalP1: Point;
    originalP2: Point;
} | {
    type: 'vertex';
    vertexIndex: number;
};

type HistoryState = {
    site: Site;
    items: ExteriorItem[];
    scale: number | null;
    drawings: DrawingElement[];
};

type ConfirmationState = {
    type: 'site' | 'item';
    points: Point[];
    itemType?: ItemType;
} | {
    type: 'overwrite_intersecting_item';
    newItemPoints: Point[];
    newItemType: ItemType;
    intersectedItemIds: string[];
};


const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TWO_D);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [activeItemType, setActiveItemType] = useState<ItemType | null>(null);

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{width: number, height: number} | null>(null);

  const [site, setSite] = useState<Site>({ points: [], boundaryTypes: [], vertexHeights: [] });
  const [items, setItems] = useState<ExteriorItem[]>([]);
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [currentLineStyle, setCurrentLineStyle] = useState<LineStyle>('solid');

  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationState | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);

  const [scale, setScale] = useState<number | null>(null); // pixels per meter
  const [scalePoints, setScalePoints] = useState<Point[]>([]);
  const [isSettingScale, setIsSettingScale] = useState(false);
  const [scaleInputValue, setScaleInputValue] = useState('');
  const [isRotationModalOpen, setIsRotationModalOpen] = useState(false);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isItemActionModalOpen, setIsItemActionModalOpen] = useState(false);
  const [isNumericMoveModalOpen, setIsNumericMoveModalOpen] = useState(false);
  const [isItemRotationModalOpen, setIsItemRotationModalOpen] = useState(false);
  const [isFlipModalOpen, setIsFlipModalOpen] = useState(false);
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // degrees
  const [rotationAdjusted, setRotationAdjusted] = useState(false);
  const [isSiteFinalized, setIsSiteFinalized] = useState(false);


  const commitState = useCallback((newSite: Site, newItems: ExteriorItem[], newScale: number | null, newDrawings: DrawingElement[]) => {
    const newState = { site: newSite, items: newItems, scale: newScale, drawings: newDrawings };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    // If tool mode changes, cancel any ongoing drag operation
    setEditingState(null);
    if (toolMode !== ToolMode.SELECT) {
        setSelectedItemId(null);
    }
  }, [toolMode]);

  const isSiteDefined = site.points.length > 0;

  useEffect(() => {
    const isImageLoaded = !!backgroundImage;
    const isSetupComplete = !!(isImageLoaded && rotationAdjusted && isSiteFinalized && scale);
    
    if (isSetupComplete) {
        if(toolMode === ToolMode.DRAW_SITE || toolMode === ToolMode.SET_SCALE){
            setToolMode(ToolMode.SELECT);
        }
        return;
    }
    
    if (!isImageLoaded) {
      // Waiting for image
    } else if (!rotationAdjusted) {
      setToolMode(ToolMode.SELECT);
    } else if (!isSiteFinalized) {
      setToolMode(ToolMode.DRAW_SITE);
    } else if (!scale) {
      setToolMode(ToolMode.SET_SCALE);
    }
  }, [backgroundImage, isSiteFinalized, rotationAdjusted, scale, toolMode]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      const processAndSetImage = (imageUrl: string) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(imageUrl);
          setImageSize({ width: img.width, height: img.height });
          // Reset everything on new image
          setSite({ points: [], boundaryTypes: [], vertexHeights: [] });
          setItems([]);
          setDrawings([]);
          setTempPoints([]);
          setScale(null);
          setScalePoints([]);
          setZoom(1);
          setPan({ x: 0, y: 0 });
          setRotation(0);
          setRotationAdjusted(false);
          setIsSiteFinalized(false);
          setHistory([]);
          setHistoryIndex(-1);
          setToolMode(ToolMode.SELECT);
          setSelectedItemId(null);
        };
        img.src = imageUrl;
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          processAndSetImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer) return;

          try {
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            const page = await pdf.getPage(1); // Render the first page
            
            const scale = 2.0; 
            const viewport = page.getViewport({ scale });

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (!context) {
              throw new Error('Could not get canvas context');
            }

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            await page.render(renderContext).promise;
            
            const imageUrl = canvas.toDataURL('image/png');
            processAndSetImage(imageUrl);
          } catch (error) {
            console.error('Error processing PDF:', error);
            alert('PDFファイルの処理中にエラーが発生しました。ファイルが破損しているか、サポートされていない形式の可能性があります。');
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('サポートされていないファイル形式です。画像（JPG, PNGなど）またはPDFファイルをアップロードしてください。');
      }
    }
  }, []);
  
  // Increase default snap distance to 45px (screen pixels) for better mobile experience
  // Ensure it's at least 45 pixels even if scaled
  const snapDistancePixels = useMemo(() => {
    const minScreenPixels = 45;
    if (scale) {
        const physicalPixels = SNAP_DISTANCE_METER * scale;
        return Math.max(physicalPixels, minScreenPixels);
    }
    return minScreenPixels;
  }, [scale]);

  const handleCanvasClick = useCallback((point: Point) => {
    if (pendingConfirmation || isSettingScale) return;
    
    // De-select item if clicking on empty space (unless handled by Editor2D item click)
    // Actually Editor2D handles propagation, so if we reach here, it's a canvas click.
    if (toolMode === ToolMode.SELECT) {
        setSelectedItemId(null);
    }

    // Drawing Tools Logic
    if (
        toolMode === ToolMode.DRAW_LINE || 
        toolMode === ToolMode.DRAW_RECT || 
        toolMode === ToolMode.DRAW_CIRCLE || 
        toolMode === ToolMode.DRAW_ARC || 
        toolMode === ToolMode.DRAW_DOUBLE_LINE
    ) {
        const newTempPoints = [...tempPoints, point];
        let requiredPoints = 2; // Default for line, rect, circle, double line (start/end)
        
        if (toolMode === ToolMode.DRAW_ARC) requiredPoints = 3;
        if (toolMode === ToolMode.DRAW_DOUBLE_LINE) requiredPoints = 2; 
        
        if (newTempPoints.length === requiredPoints) {
            const newDrawing: DrawingElement = {
                id: `${Date.now()}`,
                tool: toolMode,
                points: newTempPoints,
                style: currentLineStyle
            };
            const newDrawings = [...drawings, newDrawing];
            setDrawings(newDrawings);
            commitState(site, items, scale, newDrawings);
            setTempPoints([]);
        } else {
            setTempPoints(newTempPoints);
        }
        return;
    }

    if (toolMode === ToolMode.SET_SCALE) {
        if (site.points.length < 2) return;

        let closestVertex: Point | null = null;
        let minDistance = snapDistancePixels / zoom;

        for (const vertex of site.points) {
            const distance = getDistance(point, vertex);
            if (distance < minDistance) {
                minDistance = distance;
                closestVertex = vertex;
            }
        }

        if (closestVertex) {
            if (scalePoints.length === 1 && scalePoints[0].x === closestVertex.x && scalePoints[0].y === closestVertex.y) {
                return;
            }

            const newScalePoints = [...scalePoints, closestVertex];
            setScalePoints(newScalePoints);
            if (newScalePoints.length === 2) {
                setScaleInputValue('');
                setIsSettingScale(true);
            }
        }
    } else if (toolMode === ToolMode.DRAW_SITE) {
        const currentPoints = site.points;
        const closeSnapDistance = (snapDistancePixels * 4.0) / zoom;
        
        if (currentPoints.length >= 3 && getDistance(point, currentPoints[0]) < closeSnapDistance) {
            setPendingConfirmation({ type: 'site', points: currentPoints });
        } else {
            let finalPoint = { ...point };
            const snapDistanceSVG = snapDistancePixels / zoom;

            if (currentPoints.length > 0) {
                const lastPoint = currentPoints[currentPoints.length - 1];
                const allPointsForSnap = [...site.points];
        
                const dx = Math.abs(finalPoint.x - lastPoint.x);
                const dy = Math.abs(finalPoint.y - lastPoint.y);
        
                // Force orthogonal lines.
                if (dx > dy) {
                    // Horizontal movement is dominant
                    finalPoint.y = lastPoint.y;
                    // Snap to X-coordinates of other points
                    for (const p of allPointsForSnap) {
                        if (Math.abs(finalPoint.x - p.x) < snapDistanceSVG) {
                            finalPoint.x = p.x;
                            break;
                        }
                    }
                } else {
                    // Vertical movement is dominant
                    finalPoint.x = lastPoint.x;
                    // Snap to Y-coordinates of other points
                    for (const p of allPointsForSnap) {
                        if (Math.abs(finalPoint.y - p.y) < snapDistanceSVG) {
                            finalPoint.y = p.y;
                            break;
                        }
                    }
                }
            }
            
            const newSite = { ...site, points: [...site.points, finalPoint] };
            setSite(newSite);
            commitState(newSite, items, scale, drawings);
        }
    } else if (toolMode === ToolMode.ADD_ITEM && activeItemType) {
        let finalPoint = point;
        let isSnapped = false;
        const snapDistanceSVG = snapDistancePixels / zoom;

        if (site.points.length > 0) {
            let closestVertex: Point | null = null;
            let minDistance = Infinity;

            for (const vertex of site.points) {
                const distance = getDistance(point, vertex);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestVertex = vertex;
                }
            }
            
            if (closestVertex && minDistance < snapDistanceSVG) {
                finalPoint = closestVertex;
                isSnapped = true;
            }
        }

        if (!isSnapped && site.points.length > 1) {
            let minDistance = Infinity;
            let closestPointOnEdge: Point | null = null;

            for (let i = 0; i < site.points.length; i++) {
                const p1 = site.points[i];
                const p2 = site.points[(i + 1) % site.points.length];
                const currentClosestPoint = getClosestPointOnSegment(point, p1, p2);
                const distance = getDistance(point, currentClosestPoint);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestPointOnEdge = currentClosestPoint;
                }
            }
            
            if (minDistance <= snapDistanceSVG && closestPointOnEdge) {
                finalPoint = closestPointOnEdge;
                isSnapped = true;
            }
        }

        if (!isSnapped) {
             finalPoint = point;
        }
        
        const itemInfo = ITEM_CATALOG[activeItemType];
        const isPolygon = itemInfo.unit === 'm²';
        
        if (isPolygon) {
            const currentPoints = tempPoints;

            if (
                (activeItemType === ItemType.FLOORING || activeItemType === ItemType.TATAMI) &&
                currentPoints.length > 0
            ) {
                const lastPoint = currentPoints[currentPoints.length - 1];

                const dx = finalPoint.x - lastPoint.x;
                const dy = finalPoint.y - lastPoint.y;
                const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
                const snapThreshold = 20;

                const isHorizontalIntent = Math.abs(angleDeg) < snapThreshold || Math.abs(Math.abs(angleDeg) - 180) < snapThreshold;
                const isVerticalIntent = Math.abs(Math.abs(angleDeg) - 90) < snapThreshold;

                const allPointsForSnap = [...currentPoints, ...site.points];
                const snapXCoords = allPointsForSnap.map(p => p.x);
                const snapYCoords = allPointsForSnap.map(p => p.y);

                if (isHorizontalIntent) {
                    finalPoint.y = lastPoint.y; // Maintain right angle (horizontal)
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
                } else if (isVerticalIntent) {
                    finalPoint.x = lastPoint.x; // Maintain right angle (vertical)
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
            }
            
            const closeSnapDistance = (snapDistancePixels * 4.0) / zoom;

            if (currentPoints.length >= 2 && getDistance(finalPoint, currentPoints[0]) < closeSnapDistance) {
                let pointsToConfirm = [...currentPoints];

                if ((activeItemType === ItemType.FLOORING || activeItemType === ItemType.TATAMI) && site.points.length >= 3) {
                    try {
                        const siteRing = site.points.map(p => [p.x, p.y] as [number, number]);
                        if (siteRing[0][0] !== siteRing[siteRing.length-1][0] || siteRing[0][1] !== siteRing[siteRing.length-1][1]) {
                            siteRing.push([siteRing[0][0], siteRing[0][1]]);
                        }

                        const slabRing = currentPoints.map(p => [p.x, p.y] as [number, number]);
                        if (slabRing[0][0] !== slabRing[slabRing.length-1][0] || slabRing[0][1] !== slabRing[slabRing.length-1][1]) {
                             slabRing.push([slabRing[0][0], slabRing[0][1]]);
                        }

                        const intersected = polygonClipping.intersection([slabRing], [siteRing]);

                        if (intersected.length > 0 && intersected[0].length > 0) {
                            const resultRing = intersected[0][0];
                            pointsToConfirm = resultRing.map(p => ({ x: p[0], y: p[1] }));
                            if (pointsToConfirm.length > 1) {
                                const first = pointsToConfirm[0];
                                const last = pointsToConfirm[pointsToConfirm.length - 1];
                                if (Math.abs(first.x - last.x) < 1e-9 && Math.abs(first.y - last.y) < 1e-9) {
                                    pointsToConfirm.pop();
                                }
                            }
                            if (isClockwise(pointsToConfirm)) {
                                pointsToConfirm.reverse();
                            }
                        }
                    } catch (e) {
                        console.error("Clipping failed:", e);
                    }
                }

                setPendingConfirmation({ type: 'item', points: pointsToConfirm, itemType: activeItemType });
            } else {
                setTempPoints(prev => [...prev, finalPoint]);
            }
        } else { // Line or Point item
            const newTempPoints = [...tempPoints, finalPoint];
            if (newTempPoints.length === itemInfo.pointsRequired) {
                const newItems = [...items, {
                    id: `${Date.now()}`,
                    type: activeItemType,
                    points: newTempPoints,
                    height: itemInfo.defaultHeight,
                }];
                setItems(newItems);
                commitState(site, newItems, scale, drawings);
                setTempPoints([]);
            } else {
                setTempPoints(newTempPoints);
            }
        }
    }
  }, [toolMode, activeItemType, tempPoints, site, items, drawings, scalePoints, snapDistancePixels, scale, commitState, currentLineStyle, pendingConfirmation, isSettingScale, zoom]);

  const handleItemSelect = useCallback((itemId: string) => {
      if (toolMode === ToolMode.SELECT) {
          setSelectedItemId(itemId);
      }
  }, [toolMode]);

  const handleItemContextMenu = useCallback((itemId: string, event: React.MouseEvent) => {
      event.preventDefault();
      if (toolMode === ToolMode.SELECT) {
          setSelectedItemId(itemId);
          setIsItemActionModalOpen(true);
      }
  }, [toolMode]);

  // Geometry Actions
  const updateItemPoints = (itemId: string, newPoints: Point[]) => {
      const newItems = items.map(item => item.id === itemId ? { ...item, points: newPoints } : item);
      setItems(newItems);
      commitState(site, newItems, scale, drawings);
  };

  const handleDeleteItem = () => {
      if (!selectedItemId) return;
      const newItems = items.filter(item => item.id !== selectedItemId);
      setItems(newItems);
      commitState(site, newItems, scale, drawings);
      setSelectedItemId(null);
      setIsItemActionModalOpen(false);
  };

  const handleNumericMove = (xM: number, yM: number) => {
      if (!selectedItemId || !scale) return;
      const item = items.find(i => i.id === selectedItemId);
      if (!item) return;

      const pxX = xM * scale;
      const pxY = yM * scale;

      const newPoints = item.points.map(p => ({ x: p.x + pxX, y: p.y + pxY }));
      updateItemPoints(selectedItemId, newPoints);
      setIsNumericMoveModalOpen(false);
  };

  const handleRotateItem = (angleDeg: number) => {
      if (!selectedItemId) return;
      const item = items.find(i => i.id === selectedItemId);
      if (!item) return;

      const center = getCentroid(item.points);
      const rad = angleDeg * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const newPoints = item.points.map(p => ({
          x: center.x + (p.x - center.x) * cos - (p.y - center.y) * sin,
          y: center.y + (p.x - center.x) * sin + (p.y - center.y) * cos
      }));

      updateItemPoints(selectedItemId, newPoints);
      setIsItemRotationModalOpen(false);
  };

  const handleFlipItem = (direction: 'horizontal' | 'vertical') => {
      if (!selectedItemId) return;
      const item = items.find(i => i.id === selectedItemId);
      if (!item) return;
  
      const itemInfo = ITEM_CATALOG[item.type];
      const isPolygon = itemInfo.unit === 'm²';
  
      const center = getCentroid(item.points);
      let newPoints = item.points.map(p => ({
          x: direction === 'horizontal' ? center.x - (p.x - center.x) : p.x,
          y: direction === 'vertical' ? center.y - (p.y - center.y) : p.y
      }));
  
      // For polygons, flipping the coordinates reverses the winding order.
      // We need to reverse the array to maintain the correct orientation.
      if (isPolygon) {
        newPoints.reverse();
      }
  
      updateItemPoints(selectedItemId, newPoints);
      setIsFlipModalOpen(false);
  };
  

  const handleSiteEdgeMouseDown = useCallback((edgeIndex: number, clickPoint: Point) => {
    if (toolMode !== ToolMode.EDIT_SITE || !site.points[edgeIndex]) return;

    const p1Index = edgeIndex;
    const p2Index = (edgeIndex + 1) % site.points.length;
    const p1 = site.points[p1Index];
    const p2 = site.points[p2Index];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;
    const normal = { x: -dy / length, y: dx / length };

    setEditingState({
        type: 'edge',
        edgeIndex,
        startPoint: clickPoint,
        edgeNormal: normal,
        originalP1: p1,
        originalP2: p2,
    });
  }, [toolMode, site.points]);

  const handleSiteVertexMouseDown = useCallback((vertexIndex: number) => {
    if (toolMode !== ToolMode.EDIT_SITE) return;
    setEditingState({
        type: 'vertex',
        vertexIndex,
    });
  }, [toolMode]);

  const handleCanvasMouseMove = useCallback((movePoint: Point) => {
    if (!editingState) return;
    
    let newSitePoints = [...site.points];
    if (editingState.type === 'edge') {
        const { startPoint, edgeNormal, originalP1, originalP2, edgeIndex } = editingState;
        const moveVector = { x: movePoint.x - startPoint.x, y: movePoint.y - startPoint.y };
        const displacement = moveVector.x * edgeNormal.x + moveVector.y * edgeNormal.y;
        
        const newP1 = { x: originalP1.x + edgeNormal.x * displacement, y: originalP1.y + edgeNormal.y * displacement };
        const newP2 = { x: originalP2.x + edgeNormal.x * displacement, y: originalP2.y + edgeNormal.y * displacement };
        
        const p1Index = edgeIndex;
        const p2Index = (edgeIndex + 1) % site.points.length;
        
        newSitePoints[p1Index] = newP1;
        newSitePoints[p2Index] = newP2;
    
    } else if (editingState.type === 'vertex') {
        newSitePoints[editingState.vertexIndex] = movePoint;
    }
    setSite({ ...site, points: newSitePoints });

  }, [editingState, site]);

  const handleCanvasMouseUp = useCallback(() => {
    if(editingState){
      commitState(site, items, scale, drawings);
    }
    setEditingState(null);
  }, [editingState, site, items, scale, drawings, commitState]);

  const handleToolModeChange = (mode: ToolMode) => {
    setToolMode(mode);
    if (mode !== ToolMode.ADD_ITEM) {
        setActiveItemType(null);
    }
    if (mode === ToolMode.SET_SCALE) {
        setScalePoints([]);
    }
    setTempPoints([]);
  };

  const handleDraftingToolSelect = (mode: ToolMode, style?: LineStyle) => {
      setToolMode(mode);
      if (style) setCurrentLineStyle(style);
      setTempPoints([]);
      setActiveItemType(null);
  };

  const selectItemType = (type: ItemType | null) => {
    setActiveItemType(type);
    setToolMode(type ? ToolMode.ADD_ITEM : ToolMode.SELECT);
    setTempPoints([]);
  };

  const handleNewFile = useCallback(() => {
    setBackgroundImage(null);
    setImageSize(null);
    setSite({ points: [], boundaryTypes: [], vertexHeights: [] });
    setItems([]);
    setDrawings([]);
    setTempPoints([]);
    setScale(null);
    setScalePoints([]);
    setIsSettingScale(false);
    setToolMode(ToolMode.SELECT);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
    setRotationAdjusted(false);
    setIsSiteFinalized(false);
    setHistory([]);
    setHistoryIndex(-1);
    setSelectedItemId(null);
  }, []);
  
  const handlePendingConfirm = () => {
    if (!pendingConfirmation) return;

    if (pendingConfirmation.type === 'site') {
        const newSite = { 
            points: pendingConfirmation.points,
            boundaryTypes: Array(pendingConfirmation.points.length).fill('外壁') as BoundaryType[],
            vertexHeights: Array(pendingConfirmation.points.length).fill(0)
        };
        setSite(newSite);
        setIsSiteFinalized(true);
        commitState(newSite, items, scale, drawings);
    } else if (pendingConfirmation.type === 'item' && pendingConfirmation.itemType) {
        const newItems = [...items, {
            id: `${Date.now()}`,
            type: pendingConfirmation.itemType!,
            points: pendingConfirmation.points,
            height: ITEM_CATALOG[pendingConfirmation.itemType!].defaultHeight
        }];
        setItems(newItems);
        commitState(site, newItems, scale, drawings);
        setTempPoints([]);
    } 
    setPendingConfirmation(null);
  };

  const handlePendingCancel = () => {
      if (pendingConfirmation?.type === 'item' || pendingConfirmation?.type === 'overwrite_intersecting_item') {
          setTempPoints([]);
      }
      setPendingConfirmation(null);
  };
  
  const handleScaleSet = () => {
    const distanceInMeters = parseFloat(scaleInputValue);
    if (scalePoints.length !== 2 || isNaN(distanceInMeters) || distanceInMeters <= 0) {
      alert('有効な数値を入力してください。');
      return;
    }

    const [p1, p2] = scalePoints;
    const pixelDistance = getDistance(p1, p2);

    if (pixelDistance === 0) {
      alert("基準となる2点に同じ点が選ばれています。異なる点を選んでください。");
      handleScaleCancel();
      return;
    }

    const newScale = pixelDistance / distanceInMeters;
    setScale(newScale);
    commitState(site, items, newScale, drawings);

    setIsSettingScale(false);
    setScalePoints([]);
    setScaleInputValue('');
    setToolMode(ToolMode.SELECT);
  };

  const handleScaleCancel = () => {
    setIsSettingScale(false);
    setScalePoints([]);
    setScaleInputValue('');
  };
  
  const handleRotationSet = (angle: number) => {
      setRotation(angle);
      setIsRotationModalOpen(false);
  };

  const handleRotate90 = () => {
    setRotation(r => (r + 90) % 360);
  };

  const handleRotationConfirm = () => {
    setRotationAdjusted(true);
  };

  const handleZoom = (factor: number) => {
    setZoom(z => Math.max(0.1, Math.min(z * factor, 10)));
  };

  const handlePan = (dx: number, dy: number) => {
    setPan(prevPan => ({ x: prevPan.x + dx, y: prevPan.y + dy }));
  };

  const handleItemUpdate = useCallback((itemId: string, updates: Partial<ExteriorItem>) => {
    const newItems = items.map(item => item.id === itemId ? { ...item, ...updates } : item);
    setItems(newItems);
    commitState(site, newItems, scale, drawings);
  }, [items, site, scale, drawings, commitState]);

  const handleCancelDrawing = useCallback(() => {
    setTempPoints([]);
  }, []);

  const handleCancelLastSitePoint = useCallback(() => {
    if (site.points.length > 0) {
        const newSite = { ...site, points: site.points.slice(0, -1) };
        setSite(newSite);
        commitState(newSite, items, scale, drawings);
    }
  }, [site, items, scale, drawings, commitState]);

  const quote = useMemo(() => {
    if (!scale) return [];
    const meterPerPixel = 1 / scale;
    return items.map(item => {
      const itemInfo = ITEM_CATALOG[item.type];
      let quantity = 0;
      if (itemInfo.unit === 'm' && item.points.length === 2) {
        const [p1, p2] = item.points;
        quantity = getDistance(p1, p2) * meterPerPixel;
      } else if (itemInfo.unit === 'm²' && item.points.length >= 3) {
        let area = 0;
        for (let i = 0; i < item.points.length; i++) {
          const p1 = item.points[i];
          const p2 = item.points[(i + 1) % item.points.length];
          area += p1.x * p2.y - p2.x * p1.y;
        }
        quantity = Math.abs(area / 2) * meterPerPixel * meterPerPixel;
      } else if (itemInfo.unit === 'item' || itemInfo.unit === 'set') {
          quantity = 1;
      }
      return {
        id: item.id,
        name: itemInfo.name,
        quantity,
        unit: itemInfo.unit,
        unitPrice: itemInfo.pricePerUnit,
        total: quantity * itemInfo.pricePerUnit
      };
    });
  }, [items, scale]);

  const totalCost = useMemo(() => Math.round(quote.reduce((sum, item) => sum + item.total, 0)), [quote]);
  const isImageLoaded = !!backgroundImage;
  const isSetupComplete = !!(isImageLoaded && rotationAdjusted && isSiteFinalized && scale);

  const currentSetupStep = useMemo(() => {
    if (!isImageLoaded) return 1;
    if (!rotationAdjusted) return 2;
    if (!isSiteFinalized) return 3;
    if (!scale) return 4;
    return 5; // setup is complete
  }, [isImageLoaded, rotationAdjusted, isSiteFinalized, scale]);

  const handleGoToStep = useCallback((step: number) => {
    if (step >= currentSetupStep) return;

    if (window.confirm('前のステップに戻りますか？現在のステップ以降の作業内容はリセットされます。')) {
        switch (step) {
            case 1:
                handleNewFile();
                break;
            case 2:
                setRotationAdjusted(false);
                setIsSiteFinalized(false);
                setSite({ points: [], boundaryTypes: [], vertexHeights: [] });
                setScale(null);
                setScalePoints([]);
                setToolMode(ToolMode.SELECT);
                commitState({ points: [], boundaryTypes: [], vertexHeights: [] }, items, null, drawings);
                break;
            case 3:
                setIsSiteFinalized(false);
                setScale(null);
                setScalePoints([]);
                setToolMode(ToolMode.DRAW_SITE);
                break;
        }
    }
  }, [currentSetupStep, handleNewFile, items, drawings, commitState]);

  const UploadScreen = () => (
    <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-full max-w-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-2">間取り図を撮影・読込み</h2>
        <p className="text-gray-600 mb-6 bg-blue-50 p-4 rounded-lg">
          リフォームしたい部屋の間取り図を<br/><strong>真上から</strong>撮影またはファイルを読込んでください。
        </p>
        <label 
          htmlFor="file-upload-camera"
          className="w-full flex flex-col items-center justify-center gap-4 text-white rounded-xl cursor-pointer transition-colors shadow-lg bg-indigo-600 hover:bg-indigo-700 py-8 px-8 text-lg font-bold"
        >
          <CameraIcon className="w-12 h-12" />
          <span>カメラで撮影</span>
        </label>
        <input 
          id="file-upload-camera" 
          type="file" 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleFileChange} 
        />
        <p className="text-sm text-gray-500 mt-4">
          または
          <label htmlFor="file-upload-gallery" className="text-indigo-600 font-medium underline cursor-pointer ml-1">
            ファイルを選択
          </label>
        </p>
        <input 
          id="file-upload-gallery" 
          type="file" 
          className="hidden" 
          accept="image/*,application/pdf" 
          onChange={handleFileChange} 
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-screen font-sans bg-white">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isImageLoaded={isImageLoaded}
        isSiteDefined={isSiteDefined}
        scale={scale}
        totalCost={totalCost}
        isSetupComplete={isSetupComplete}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <main className={`flex-1 relative bg-white md:mb-0 ${isSetupComplete ? 'mb-[190px]' : ''}`}>
          {!isImageLoaded && <UploadScreen />}

          {isImageLoaded && !isSetupComplete && (
            <SetupStepper currentStep={currentSetupStep} onStepClick={handleGoToStep} />
          )}

          {isImageLoaded && !rotationAdjusted && (
            <ImageAdjuster
              onCancel={handleNewFile}
              onRotate90={handleRotate90}
              onConfirm={handleRotationConfirm}
            />
          )}
          
          {viewMode === ViewMode.TWO_D ? (
            <Editor2D
              backgroundImage={backgroundImage}
              imageSize={imageSize}
              site={site}
              items={items}
              drawings={drawings}
              toolMode={toolMode}
              tempPoints={tempPoints}
              onCanvasClick={handleCanvasClick}
              activeItemType={activeItemType}
              onSiteEdgeMouseDown={handleSiteEdgeMouseDown}
              onSiteVertexMouseDown={handleSiteVertexMouseDown}
              onCanvasMouseMove={handleCanvasMouseMove}
              onCanvasMouseUp={handleCanvasMouseUp}
              isEditing={!!editingState}
              scalePoints={scalePoints}
              snapDistancePixels={snapDistancePixels}
              zoom={zoom}
              onZoom={handleZoom}
              pan={pan}
              onPan={handlePan}
              rotation={rotation}
              onRotate={setRotation}
              currentLineStyle={currentLineStyle}
              selectedItemId={selectedItemId}
              onItemSelect={handleItemSelect}
              onItemContextMenu={handleItemContextMenu}
              onCancelDrawing={handleCancelDrawing}
              onCancelLastSitePoint={handleCancelLastSitePoint}
              scale={scale}
              pendingConfirmation={pendingConfirmation}
              onCancelConfirmation={handlePendingCancel}
              currentSetupStep={currentSetupStep}
            />
          ) : (
            <Editor3D 
              site={site} 
              items={items} 
              backgroundImage={backgroundImage} 
              imageSize={imageSize}
              scale={scale}
              onItemUpdate={handleItemUpdate}
              rotation={rotation}
            />
          )}
          {pendingConfirmation && (
              <ConfirmationControls
                  onConfirm={handlePendingConfirm}
                  onCancel={handlePendingCancel}
              />
          )}
          {isSettingScale && (
              <>
                <ScaleControl 
                    value={scaleInputValue} 
                    onChange={setScaleInputValue}
                    onConfirm={handleScaleSet}
                />
                <ConfirmationControls
                    onConfirm={handleScaleSet}
                    onCancel={handleScaleCancel}
                />
              </>
          )}
          {isRotationModalOpen && (
              <RotationModal
                  onConfirm={handleRotationSet}
                  onCancel={() => setIsRotationModalOpen(false)}
                  initialAngle={rotation}
              />
          )}
          {isItemActionModalOpen && (
              <ItemActionModal
                  onMove={() => { setIsItemActionModalOpen(false); setIsNumericMoveModalOpen(true); }}
                  onRotate={() => { setIsItemActionModalOpen(false); setIsItemRotationModalOpen(true); }}
                  onFlip={() => { setIsItemActionModalOpen(false); setIsFlipModalOpen(true); }}
                  onDelete={handleDeleteItem}
                  onCancel={() => setIsItemActionModalOpen(false)}
              />
          )}
          {isNumericMoveModalOpen && (
              <NumericMoveModal
                  onConfirm={handleNumericMove}
                  onCancel={() => setIsNumericMoveModalOpen(false)}
              />
          )}
          {isItemRotationModalOpen && (
              <RotationModal
                  onConfirm={handleRotateItem}
                  onCancel={() => setIsItemRotationModalOpen(false)}
                  initialAngle={0}
              />
          )}
          {isFlipModalOpen && (
              <FlipModal
                  onHorizontal={() => handleFlipItem('horizontal')}
                  onVertical={() => handleFlipItem('vertical')}
                  onCancel={() => setIsFlipModalOpen(false)}
              />
          )}
        </main>
        {isSetupComplete && (
            <ControlPanel
            toolMode={toolMode}
            activeItemType={activeItemType}
            onToolModeChange={handleToolModeChange}
            onSelectItemType={selectItemType}
            onFileUpload={handleFileChange}
            onDraftingToolSelect={handleDraftingToolSelect}
            />
        )}
      </div>
    </div>
  );
};

export default App;