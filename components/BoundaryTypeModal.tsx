

import React from 'react';
import { BoundaryType } from '../types';

interface BoundaryTypeModalProps {
  onSelect: (type: BoundaryType) => void;
  onClose: () => void;
}

export const BoundaryTypeModal: React.FC<BoundaryTypeModalProps> = ({ onSelect, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">境界線の種類を選択</h3>
        <div className="flex flex-col gap-4">
          {/* FIX: Use values that conform to the BoundaryType enum. */}
          <button onClick={() => onSelect('外壁')} className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold">
            外壁
          </button>
          {/* FIX: Use values that conform to the BoundaryType enum. */}
          <button onClick={() => onSelect('開口部')} className="w-full px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 font-semibold">
            開口部
          </button>
          <button onClick={onClose} className="mt-4 w-full px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
