

import React from 'react';

export interface Point {
  x: number;
  y: number;
}

// Simplified boundary for interior (optional use)
export type BoundaryType = '外壁' | '開口部';

export interface Site {
  points: Point[];
  boundaryTypes: BoundaryType[]; // Can be used for wall types if needed
  vertexHeights?: number[]; // Not strictly needed for flat floor plans but kept for compatibility
}

export enum ItemType {
  FLOORING = 'FLOORING',      // ポリゴン: フローリング
  TATAMI = 'TATAMI',          // ポリゴン: 畳
  WALL_CROSS = 'WALL_CROSS',  // ライン: 壁（クロス張り替え）
  KITCHEN = 'KITCHEN',        // ポイント: キッチン
  TOILET = 'TOILET',          // ポイント: トイレ
  BATH = 'BATH',              // ポイント: ユニットバス
  WASHBASIN = 'WASHBASIN',    // ポイント: 洗面台
  DOOR = 'DOOR',              // ライン/ポイント: ドア
  // FIX: Add WINDOW and CLOSET to resolve errors in Editor2D.tsx
  WINDOW = 'WINDOW',          // ライン: 窓
  CLOSET = 'CLOSET',          // ポリゴン: クローゼット
}

export interface ExteriorItem {
  id: string;
  type: ItemType;
  points: Point[];
  height?: number; // 家具や壁の高さなど
  rotation?: number; // ポイントアイテムの回転
}

export enum ViewMode {
  TWO_D = '2D',
  THREE_D = '3D'
}

export enum ToolMode {
  SELECT = 'SELECT',
  DRAW_SITE = 'DRAW_SITE',
  ADD_ITEM = 'ADD_ITEM',
  EDIT_SITE = 'EDIT_SITE',
  SET_SCALE = 'SET_SCALE',
  // Drawing Tools
  DRAW_LINE = 'DRAW_LINE',
  DRAW_RECT = 'DRAW_RECT',
  DRAW_CIRCLE = 'DRAW_CIRCLE',
  DRAW_ARC = 'DRAW_ARC',
  DRAW_DOUBLE_LINE = 'DRAW_DOUBLE_LINE',
}

export type LineStyle = 'solid' | 'dashed' | 'dashdot';

export interface DrawingElement {
  id: string;
  tool: ToolMode;
  points: Point[];
  style: LineStyle;
}

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface ItemInfo {
  name: string;
  unit: 'm' | 'm²' | 'item' | 'set';
  pricePerUnit: number;
  pointsRequired: number;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
  defaultHeight?: number;
}

// FIX: Added shared ConfirmationState type to resolve type error between App and Editor2D.
export type ConfirmationState = {
    type: 'site' | 'item';
    points: Point[];
    itemType?: ItemType;
} | {
    type: 'overwrite_intersecting_item';
    newItemPoints: Point[];
    newItemType: ItemType;
    intersectedItemIds: string[];
};

export type BlockType = 'normal' | 'decorative_a' | 'decorative_b';
export type FenceType = 'none' | 'mesh' | 'horizontal' | 'vertical';
export type RetainingWallType = 'vertical' | 'sloped';
