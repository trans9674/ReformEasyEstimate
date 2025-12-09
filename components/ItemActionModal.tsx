
import React from 'react';
import { TrashIcon, RotateIcon, EditIcon } from './Icons'; // Reusing existing icons where appropriate

// We can create simple SVG icons for Move and Flip here or import if added to Icons.tsx
const MoveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><polyline points="15 19 12 22 9 19" /><polyline points="19 15 22 12 19 9" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
);

const FlipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 12v-3a3 3 0 0 1 3-3h13" /><path d="m16 2 4 4-4 4" /><path d="M20 12v3a3 3 0 0 1-3 3H4" /><path d="m8 22-4-4 4-4" /></svg>
);

interface ItemActionModalProps {
  onMove: () => void;
  onRotate: () => void;
  onFlip: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export const ItemActionModal: React.FC<ItemActionModalProps> = ({ onMove, onRotate, onFlip, onDelete, onCancel }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">アイテム操作</h3>
        <div className="flex flex-col gap-2">
          <button onClick={onMove} className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700 text-left">
            <MoveIcon className="w-5 h-5 text-blue-500" />
            <span className="font-medium">数値移動</span>
          </button>
          <button onClick={onRotate} className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700 text-left">
            <RotateIcon className="w-5 h-5 text-green-500" />
            <span className="font-medium">回転</span>
          </button>
          <button onClick={onFlip} className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700 text-left">
            <FlipIcon className="w-5 h-5 text-orange-500" />
            <span className="font-medium">反転</span>
          </button>
          <button onClick={onDelete} className="flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-md transition-colors text-red-600 text-left">
            <TrashIcon className="w-5 h-5" />
            <span className="font-medium">削除</span>
          </button>
        </div>
        <button onClick={onCancel} className="mt-4 w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">
          キャンセル
        </button>
      </div>
    </div>
  );
};
