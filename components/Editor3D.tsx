import React, { useMemo, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Site, ExteriorItem, ItemType, Point } from '../types';

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

// Basic textures and materials
const floorMaterial = new THREE.MeshStandardMaterial({ color: '#D2B48C', transparent: true, opacity: 0.8, side: THREE.DoubleSide }); // Light wood
const tatamiMaterial = new THREE.MeshStandardMaterial({ color: '#ADDB88', transparent: true, opacity: 0.8, side: THREE.DoubleSide }); // Greenish
const wallMaterial = new THREE.MeshStandardMaterial({ color: '#F0F0F0', side: THREE.DoubleSide });

const Wall: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    if (item.points.length !== 2) return null;

    const p1_2d = get3DPoint(item.points[0]);
    const p2_2d = get3DPoint(item.points[1]);

    const height = item.height || 2.4;
    const thickness = 0.1;

    const p1 = new THREE.Vector3(p1_2d.x, 0, p1_2d.z);
    const p2 = new THREE.Vector3(p2_2d.x, 0, p2_2d.z);
    
    const length = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    return (
        <mesh position={[mid.x, height / 2 + 0.01, mid.z]} rotation={[0, -angle, 0]} castShadow receiveShadow>
            <boxGeometry args={[length, height, thickness]} />
            <meshStandardMaterial color="#E5E5E5" />
        </mesh>
    );
};

const Flooring: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    const points3D_flat = useMemo(() => {
        return item.points.map(p => get3DPoint(p));
    }, [item.points, get3DPoint]);

    const geometry = useMemo(() => {
        if (points3D_flat.length < 3) return null;
        const shape = new THREE.Shape(points3D_flat.map(v => new THREE.Vector2(v.x, v.z)));
        const geom = new THREE.ShapeGeometry(shape);
        // Rotate from local XY plane to world XZ plane, ensuring normal points up (+Y).
        geom.rotateX(-Math.PI / 2);
        return geom;
    }, [points3D_flat]);
    
    if (!geometry) return null;

    let material = floorMaterial;
    let yPosition = 0.01;
    if (item.type === ItemType.TATAMI) {
        material = tatamiMaterial;
        yPosition += 0.18; // 18cm up
    }

    return (
        <mesh geometry={geometry} rotation={[0, 0, 0]} position={[0, yPosition, 0]} receiveShadow>
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const Closet: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    const points3D_flat = useMemo(() => {
        return item.points.map(p => get3DPoint(p));
    }, [item.points, get3DPoint]);

    const geometry = useMemo(() => {
        if (points3D_flat.length < 3) return null;
        const shape = new THREE.Shape(points3D_flat.map(v => new THREE.Vector2(v.x, v.z)));
        const height = item.type === ItemType.KITCHEN ? (item.height || 0.85) : (item.height || 2.2);
        const extrudeSettings = {
            steps: 1,
            depth: height,
            bevelEnabled: false,
        };
        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.rotateX(-Math.PI / 2);
        return geom;
    }, [points3D_flat, item.height, item.type]);
    
    if (!geometry) return null;

    const material = item.type === ItemType.KITCHEN 
        ? new THREE.MeshStandardMaterial({ color: "#EF4444", side: THREE.DoubleSide })
        : new THREE.MeshStandardMaterial({ color: "#FFE4C4", side: THREE.DoubleSide });

    return (
        <mesh geometry={geometry} position={[0, 0.01, 0]} castShadow receiveShadow>
            <primitive object={material} attach="material" />
        </mesh>
    );
};

const Window: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
     if (item.points.length !== 2) return null;
    const p1 = get3DPoint(item.points[0]);
    const p2 = get3DPoint(item.points[1]);
    const height = item.height || 1.2;
    const sillHeight = 0.9;

    const length = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    return (
        <group position={[mid.x, sillHeight + height/2, mid.z]} rotation={[0, -angle, 0]}>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[length, height, 0.1]} />
                <meshStandardMaterial color="#87CEEB" transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

const Furniture: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
    if (item.points.length !== 1) return null;
    const p = get3DPoint(item.points[0]);
    
    let color = '#CCCCCC';
    let width = 0.5, height = 0.5, depth = 0.5;

    switch (item.type) {
        case ItemType.BATH:
            color = '#3B82F6'; width = 1.6; height = 2.0; depth = 1.6;
            break;
        case ItemType.TOILET:
            color = '#ffffff'; width = 0.4; height = 0.8; depth = 0.7;
            break;
        case ItemType.WASHBASIN:
            color = '#06B6D4'; width = 0.75; height = 0.8; depth = 0.5;
            break;
    }

    return (
        <mesh position={[p.x, height/2 + 0.01, p.z]} castShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

const Door: React.FC<ItemComponentProps> = ({ item, get3DPoint }) => {
     if (item.points.length !== 2) return null;
    const p1 = get3DPoint(item.points[0]);
    const p2 = get3DPoint(item.points[1]);
    const height = item.height || 2.0;

    const length = p1.distanceTo(p2);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    return (
        <group position={[mid.x, height/2 + 0.01, mid.z]} rotation={[0, -angle, 0]}>
            <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[length, height, 0.05]} />
                <meshStandardMaterial color="#8B4513" transparent opacity={0.7} />
            </mesh>
        </group>
    );
};

const SiteWalls: React.FC<{ site: Site, get3DPoint: (p: Point) => THREE.Vector3 }> = ({ site, get3DPoint }) => {
    const geometry = useMemo(() => {
         if (site.points.length < 3) return null;
         
         // Generate walls along the perimeter of the site
         // Note: this is a simple implementation. Real interior walls need boolean operations with windows/doors.
         
         const height = 2.4;
         const thickness = 0.15; // External walls usually thicker
         
         const meshes: React.ReactNode[] = [];
         
         for(let i=0; i<site.points.length; i++) {
             const p1 = get3DPoint(site.points[i]);
             const p2 = get3DPoint(site.points[(i+1)%site.points.length]);
             
             const length = p1.distanceTo(p2);
             const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
             const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
             
             meshes.push(
                 <mesh key={`site-wall-${i}`} position={[mid.x, height/2 + 0.01, mid.z]} rotation={[0, -angle, 0]} receiveShadow castShadow>
                     <boxGeometry args={[length, height, thickness]} />
                     <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} />
                 </mesh>
             );
         }
         return meshes;
    }, [site.points, get3DPoint]);

    return <group>{geometry}</group>;
};

const Scene: React.FC<Editor3DProps> = ({ site, items, backgroundImage, imageSize, scale, onItemUpdate, rotation }) => {
  const texture = useLoader(THREE.TextureLoader, backgroundImage || '');
  
  const get3DPoint = useCallback((p: {x: number, y: number}) => {
    if (!imageSize || !scale) return new THREE.Vector3(0, 0, 0);
    const meterPerPixel = 1 / scale;
    return new THREE.Vector3(
      (p.x - imageSize.width / 2) * meterPerPixel,
      0,
      -(p.y - imageSize.height / 2) * meterPerPixel
    );
  }, [imageSize, scale]);

  const groundPlaneSize = useMemo(() => imageSize && scale
    ? { width: imageSize.width * (1/scale), height: imageSize.height * (1/scale) }
    : { width: 100, height: 100 }, [imageSize, scale]);
  
  const imageOffsetYInMeters = 0;

  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, 30, 20]} intensity={0.5} castShadow />
      
      <group>
        <group rotation={[0, -rotation * Math.PI / 180, 0]}>
            {backgroundImage && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, imageOffsetYInMeters]} receiveShadow>
                <planeGeometry args={[groundPlaneSize.width, groundPlaneSize.height]} />
                <meshStandardMaterial map={texture} />
                </mesh>
            )}
            
            <SiteWalls site={site} get3DPoint={get3DPoint} />

            {items.map(item => {
                const key = item.id;
                switch (item.type) {
                    case ItemType.FLOORING:
                    case ItemType.TATAMI:
                        return <Flooring key={key} item={item} get3DPoint={get3DPoint} />;
                    case ItemType.WALL_CROSS:
                        return <Wall key={key} item={item} get3DPoint={get3DPoint} />;
                    case ItemType.DOOR:
                        return <Door key={key} item={item} get3DPoint={get3DPoint} />;
                    case ItemType.WINDOW:
                        return <Window key={key} item={item} get3DPoint={get3DPoint} />;
                    case ItemType.CLOSET:
                    case ItemType.KITCHEN:
                        return <Closet key={key} item={item} get3DPoint={get3DPoint} />;
                    case ItemType.BATH:
                    case ItemType.TOILET:
                    case ItemType.WASHBASIN:
                        return <Furniture key={key} item={item} get3DPoint={get3DPoint} />;
                    default:
                        return null;
                }
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
                {!props.backgroundImage ? "2Dモードで間取り図を読み込んでください" : "2Dモードで縮尺を設定してください"}
            </p>
          </div>
      )}
    </div>
  );
};