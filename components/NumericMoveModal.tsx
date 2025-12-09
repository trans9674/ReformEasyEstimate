
import React, { useState } from 'react';

interface NumericMoveModalProps {
  onConfirm: (x: number, y: number) => void;
  onCancel: () => void;
}

export const NumericMoveModal: React.FC<NumericMoveModalProps> = ({ onConfirm, onCancel }) => {
  const [x, setX] = useState('0');
  const [y, setY] = useState('0');

  const handleConfirm = () => {
    const numX = parseFloat(x);
    const numY = parseFloat(y);
    if (!isNaN(numX) && !isNaN(numY)) {
      onConfirm(numX, numY);
    } else {
      alert('有効な数値を入力してください。');
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">数値移動</h3>
        <p className="text-sm text-gray-600 mb-4">移動量(メートル)を入力してください。</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <label className="w-12 text-right text-gray-600">X:</label>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="0"
            />
            <span className="text-gray-500 w-6">m</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-12 text-right text-gray-600">Y:</label>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="0"
            />
            <span className="text-gray-500 w-6">m</span>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
            移動
          </button>
          <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
