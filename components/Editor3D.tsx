import React, { useMemo, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Site, ExteriorItem, ItemType, Point } from '../types';
import { ITEM_CATALOG } from '../constants';

interface Editor3DProps {
  site: Site;
  items: ExteriorItem[];
  backgroundImage: string | null;
  imageSize: {width: number, height: number} | null;
  scale: number | null;
  onItemUpdate: (itemId: string, updates: Partial<ExteriorItem>) => void;
  rotation: number;
}

interface ItemComponentProps {
    item: ExteriorItem;
    get3DPoint: (p: Point) => THREE.Vector3;
    onItemUpdate?: (itemId: string, updates: Partial<ExteriorItem>) => void;
}

// Basic materials
const parkingMaterial = new THREE.MeshStandardMaterial({ color: '#E5E7EB', transparent: true, opacity: 0.9 });
const deckMaterial = new THREE.MeshStandardMaterial({ color: '#A36F4D', transparent: true, opacity: 0.9 });
const carportMaterial = new THREE.MeshStandardMaterial({ color: '#6B7280', transparent: true, opacity: 0.7 });

const LineItem3D: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    if (item.points.length < 2) return null;

    const p1_3d = get3DPoint(item.points[0]);
    const p2_3d = get3DPoint(item.points[1]);

    const height = item.height || 1.2;
    const thickness = 0.1;

    const p1 = new THREE.Vector3(p1_3d.x, 0, p1_3d.z);
    const p2 = new THREE.Vector3(p2_3d.x, 0, p2_3d.z);
    
    const length = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    let color = '#888888';
    if (item.type === ItemType.FENCE) color = '#A1A1AA';
    if (item.type === ItemType.BLOCK) color = '#D4D4D8';
    if (item.type === ItemType.GATE) color = '#52525B';
    if (item.type === ItemType.RETAINING_WALL) color = '#A8A29E';

    return (
        <mesh position={[mid.x, height / 2, mid.z]} rotation={[0, -angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

const PolygonItem3D: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    const points3D_flat = useMemo(() => {
        const reversedPoints = [...item.points].reverse();
        return reversedPoints.map(p => get3DPoint(p));
    }, [item.points, get3DPoint]);

    const geometry = useMemo(() => {
        if (points3D_flat.length < 3) return null;
        const shape = new THREE.Shape(points3D_flat.map(v => new THREE.Vector2(v.x, v.z)));
        const geom = new THREE.ShapeGeometry(shape);
        geom.rotateX(-Math.PI / 2);
        return geom;
    }, [points3D_flat]);
    
    if (!geometry) return null;

    let material = parkingMaterial;
    if (item.type === ItemType.DECK) material = deckMaterial;
    if (item.type === ItemType.CARPORT) material = carportMaterial;

    return (
        <mesh geometry={geometry} rotation={[0, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const PointItem3D: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    if (item.points.length !== 1) return null;
    const p = get3DPoint(item.points[0]);
    
    let color = '#22C55E';
    let width = 0.5, height = 1.5, depth = 0.5;

    return (
        <mesh position={[p.x, height/2, p.z]} castShadow>
            <coneGeometry args={[width/2, height, 8]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};


const SiteWalls: React.FC<{ site: Site, get3DPoint: (p: Point) => THREE.Vector3 }> = ({ site, get3DPoint }) => {
    const meshes = useMemo(() => {
         if (site.points.length < 2) return null;
         
         const height = 0.1; // Site boundary visualization height
         const thickness = 0.1;
         
         const nodes: React.ReactNode[] = [];
         
         for(let i=0; i<site.points.length; i++) {
             const p1 = get3DPoint(site.points[i]);
             const p2 = get3DPoint(site.points[(i+1)%site.points.length]);
             
             const length = p1.distanceTo(p2);
             const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
             const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
             
             nodes.push(
                 <mesh key={`site-wall-${i}`} position={[mid.x, height/2, mid.z]} rotation={[0, -angle, 0]}>
                     <boxGeometry args={[length, height, thickness]} />
                     <meshStandardMaterial color="#F97316" transparent opacity={0.5} />
                 </mesh>
             );
         }
         return nodes;
    }, [site.points, get3DPoint]);

    return <group>{meshes}</group>;
};

const Scene: React.FC<Editor3DProps> = ({ site, items, backgroundImage, imageSize, scale, onItemUpdate, rotation }) => {
  const texture = useLoader(THREE.TextureLoader, backgroundImage || '');
  
  const get3DPoint = useCallback((p: {x: number, y: number}) => {
    if (!imageSize || !scale) return new THREE.Vector3(0, 0, 0);
    const meterPerPixel = 1 / scale;
    return new THREE.Vector3(
      (p.x - imageSize.width / 2) * meterPerPixel,
      0,
      (p.y - imageSize.height / 2) * meterPerPixel
    );
  }, [imageSize, scale]);

  const groundPlaneSize = useMemo(() => imageSize && scale
    ? { width: imageSize.width * (1/scale), height: imageSize.height * (1/scale) }
    : { width: 100, height: 100 }, [imageSize, scale]);

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 30, 20]} intensity={0.5} castShadow />
      
      <group>
        <group rotation={[0, -rotation * Math.PI / 180, 0]}>
            {backgroundImage && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[groundPlaneSize.width, groundPlaneSize.height]} />
                <meshStandardMaterial map={texture} />
                </mesh>
            )}
            
            <SiteWalls site={site} get3DPoint={get3DPoint} />

            {items.map(item => {
                const key = item.id;
                const itemInfo = ITEM_CATALOG[item.type];

                if (itemInfo.unit === 'm²') {
                    return <PolygonItem3D key={key} item={item} get3DPoint={get3DPoint} />;
                }
                if (itemInfo.unit === 'm' || (itemInfo.unit === 'item' && itemInfo.pointsRequired === 2)) {
                    return <LineItem3D key={key} item={item} get3DPoint={get3DPoint} />;
                }
                if (itemInfo.unit === 'item' && itemInfo.pointsRequired === 1) {
                    return <PointItem3D key={key} item={item} get3DPoint={get3DPoint} />;
                }
                return null;
            })}
        </group>
      </group>
      
      <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
    </>
  );
};


export const Editor3D: React.FC<Editor3DProps> = (props) => {
  return (
    <div className="w-full h-full bg-gray-100">
      <Canvas shadows camera={{ position: [0, 10, 10], fov: 50 }}>
        {props.backgroundImage && props.scale && <Scene {...props} />}
      </Canvas>
      {(!props.backgroundImage || !props.scale) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700 pointer-events-none">
            <p className="text-white text-lg">
                {!props.backgroundImage ? "2Dモードで敷地図を読み込んでください" : "2Dモードで縮尺を設定してください"}
            </p>
          </div>
      )}
    </div>
  );
};