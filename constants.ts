
import { ItemType, ItemInfo } from './types';
import { ParkingIcon, FenceIcon, BlockWallIcon, GateIcon, CarportIcon, WoodDeckIcon, PlantingIcon, ApproachIcon } from './components/Icons';

export const ITEM_CATALOG: Record<ItemType, ItemInfo> = {
  [ItemType.PARKING_AREA]: {
    name: '駐車場',
    unit: 'm²',
    pricePerUnit: 15000, // 土間コンクリート
    pointsRequired: 3, // Polygon
    icon: ParkingIcon,
  },
  [ItemType.FENCE]: {
    name: 'フェンス',
    unit: 'm',
    pricePerUnit: 18000, // メッシュフェンス H800
    pointsRequired: 2,
    icon: FenceIcon,
    defaultHeight: 0.8,
  },
  [ItemType.BLOCK_WALL]: {
    name: 'ブロック塀',
    unit: 'm',
    pricePerUnit: 20000, // 2段積み
    pointsRequired: 2,
    icon: BlockWallIcon,
    defaultHeight: 0.4,
  },
  [ItemType.GATE]: {
    name: '門扉',
    unit: 'item',
    pricePerUnit: 150000,
    pointsRequired: 2, // Width and orientation
    icon: GateIcon,
    defaultHeight: 1.2,
  },
  [ItemType.CARPORT]: {
    name: 'カーポート',
    unit: 'item',
    pricePerUnit: 300000, // 1台用
    pointsRequired: 1,
    icon: CarportIcon,
    defaultHeight: 2.3,
  },
  [ItemType.WOOD_DECK]: {
    name: 'ウッドデッキ',
    unit: 'm²',
    pricePerUnit: 25000,
    pointsRequired: 3, // Polygon
    icon: WoodDeckIcon,
  },
  [ItemType.PLANTING]: {
    name: '植栽',
    unit: 'item',
    pricePerUnit: 30000, // 中木
    pointsRequired: 1,
    icon: PlantingIcon,
  },
  [ItemType.APPROACH]: {
    name: 'アプローチ',
    unit: 'm²',
    pricePerUnit: 20000, // 乱形石貼り
    pointsRequired: 3, // Polygon
    icon: ApproachIcon,
  },
};

export const SNAP_DISTANCE_METER = 0.1; // 10cm for exterior precision