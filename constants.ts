import { ItemType, ItemInfo } from './types';
import { FenceIcon, GateIcon, CarportIcon, ParkingIcon, DeckIcon, BlockIcon, PlantingIcon, RetainingWallIcon } from './components/Icons';

export const ITEM_CATALOG: Record<ItemType, ItemInfo> = {
  [ItemType.FENCE]: {
    name: 'フェンス',
    unit: 'm',
    pricePerUnit: 15000,
    pointsRequired: 2,
    icon: FenceIcon,
    defaultHeight: 1.2,
  },
  [ItemType.GATE]: {
    name: '門扉',
    unit: 'item',
    pricePerUnit: 80000,
    pointsRequired: 2,
    icon: GateIcon,
    defaultHeight: 1.4,
  },
  [ItemType.CARPORT]: {
    name: 'カーポート',
    unit: 'm²',
    pricePerUnit: 25000,
    pointsRequired: 3, // Polygon
    icon: CarportIcon,
    defaultHeight: 2.5,
  },
  [ItemType.PARKING]: {
    name: '駐車場土間',
    unit: 'm²',
    pricePerUnit: 5000,
    pointsRequired: 3, // Polygon
    icon: ParkingIcon,
  },
  [ItemType.DECK]: {
    name: 'ウッドデッキ',
    unit: 'm²',
    pricePerUnit: 20000,
    pointsRequired: 3, // Polygon
    icon: DeckIcon,
  },
  [ItemType.BLOCK]: {
    name: 'ブロック塀',
    unit: 'm',
    pricePerUnit: 18000,
    pointsRequired: 2,
    icon: BlockIcon,
    defaultHeight: 1.0,
  },
  [ItemType.PLANTING]: {
    name: '植栽',
    unit: 'item',
    pricePerUnit: 25000,
    pointsRequired: 1,
    icon: PlantingIcon,
  },
  [ItemType.RETAINING_WALL]: {
    name: '擁壁',
    unit: 'm',
    pricePerUnit: 40000,
    pointsRequired: 2,
    icon: RetainingWallIcon,
    defaultHeight: 1.5,
  }
};

export const SNAP_DISTANCE_METER = 0.3; // 30cm snap distance for exterior planning