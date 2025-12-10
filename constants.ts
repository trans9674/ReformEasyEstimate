import { ItemType, ItemInfo } from './types';
// FIX: Import WindowIcon and ClosetIcon
import { FlooringIcon, TatamiIcon, WallIcon, KitchenIcon, ToiletIcon, BathIcon, WashbasinIcon, DoorIcon, WindowIcon, ClosetIcon } from './components/Icons';

export const ITEM_CATALOG: Record<ItemType, ItemInfo> = {
  [ItemType.FLOORING]: {
    name: 'フローリング',
    unit: 'm²',
    pricePerUnit: 8000,
    pointsRequired: 3, // Polygon
    icon: FlooringIcon,
  },
  [ItemType.TATAMI]: {
    name: '畳',
    unit: 'm²',
    pricePerUnit: 12000,
    pointsRequired: 3, // Polygon
    icon: TatamiIcon,
  },
  [ItemType.WALL_CROSS]: {
    name: '壁紙',
    unit: 'm', // Using linear meters for simplicity in this tool (approx height 2.4m)
    pricePerUnit: 3500, // Cost per meter width (assuming standard height)
    pointsRequired: 2,
    icon: WallIcon,
    defaultHeight: 2.4,
  },
  [ItemType.KITCHEN]: {
    name: 'キッチン',
    unit: 'm²',
    pricePerUnit: 800000,
    pointsRequired: 2,
    icon: KitchenIcon,
    defaultHeight: 0.85,
  },
  [ItemType.BATH]: {
    name: 'ユニットバス',
    unit: 'item',
    pricePerUnit: 1000000,
    pointsRequired: 1,
    icon: BathIcon,
  },
  [ItemType.TOILET]: {
    name: 'トイレ',
    unit: 'item',
    pricePerUnit: 150000,
    pointsRequired: 1,
    icon: ToiletIcon,
  },
  [ItemType.WASHBASIN]: {
    name: '洗面台',
    unit: 'item',
    pricePerUnit: 120000,
    pointsRequired: 1,
    icon: WashbasinIcon,
  },
  [ItemType.DOOR]: {
    name: '室内ドア',
    unit: 'item',
    pricePerUnit: 50000,
    pointsRequired: 2, // Width and orientation
    icon: DoorIcon,
    defaultHeight: 2.0,
  },
  // FIX: Add WINDOW and CLOSET items to fix errors in Editor2D.tsx
  [ItemType.WINDOW]: {
    name: '窓',
    unit: 'item',
    pricePerUnit: 40000,
    pointsRequired: 2,
    icon: WindowIcon,
    defaultHeight: 1.2,
  },
  [ItemType.CLOSET]: {
    name: 'クローゼット',
    unit: 'm²',
    pricePerUnit: 20000,
    pointsRequired: 3, // Polygon
    icon: ClosetIcon,
  },
};

export const SNAP_DISTANCE_METER = 0.3; // 30cm for interior precision