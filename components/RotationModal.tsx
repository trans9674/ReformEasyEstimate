
import React, { useState } from 'react';

interface RotationModalProps {
  onConfirm: (angle: number) => void;
  onCancel: () => void;
  initialAngle: number;
}

export const RotationModal: React.FC<RotationModalProps> = ({ onConfirm, onCancel, initialAngle }) => {
  const [angle, setAngle] = useState(initialAngle.toString());

  const handleConfirm = () => {
    const numAngle = parseFloat(angle);
    if (!isNaN(numAngle)) {
      onConfirm(numAngle);
    } else {
      alert('有効な数値を入力してください。');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">回転角度を入力</h3>
        <p className="text-sm text-gray-600 mb-6">
            画像を回転させる角度を入力してください。<br/>
            (＋: 時計回り, －: 反時計回り)
        </p>
        <div className="flex items-center justify-center">
          <input
            type="number"
            value={angle}
            onChange={(e) => setAngle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-32 text-center text-4xl font-bold p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="0"
            autoFocus
            style={{ backgroundColor: 'white' }}
          />
          <span className="ml-3 text-2xl text-gray-700 font-medium">度</span>
        </div>
        <div className="flex justify-center gap-4 mt-8">
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 font-semibold">
            決定
          </button>
          <button onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};
