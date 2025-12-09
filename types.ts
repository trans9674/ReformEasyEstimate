import React from 'react';

export interface Point {
  x: number;
  y: number;
}

export type BoundaryType = '隣地境界線' | '道路境界線';

export interface Site {
  points: Point[];
  boundaryTypes: BoundaryType[];
  vertexHeights?: number[];
}

export enum ItemType {
  FENCE = 'FENCE',          // ライン: フェンス
  GATE = 'GATE',            // ライン: 門扉
  CARPORT = 'CARPORT',      // ポリゴン: カーポート
  PARKING = 'PARKING',      // ポリゴン: 駐車場土間
  DECK = 'DECK',            // ポリゴン: ウッドデッキ
  BLOCK = 'BLOCK',          // ライン: ブロック塀
  PLANTING = 'PLANTING',    // ポイント: 植栽
  RETAINING_WALL = 'RETAINING_WALL', // ライン: 擁壁
}

export interface ExteriorItem {
  id: string;
  type: ItemType;
  points: Point[];
  height?: number; 
  rotation?: number;
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

export type BlockType = 'normal' | 'decorative_a' | 'decorative_b';
export type FenceType = 'none' | 'mesh' | 'horizontal' | 'vertical';
export type RetainingWallType = 'vertical' | 'sloped';