import React, { useState } from 'react';

interface HeightModalProps {
  onConfirm: (height: number) => void;
  onCancel: () => void;
  initialValue: number;
}

export const HeightModal: React.FC<HeightModalProps> = ({ onConfirm, onCancel, initialValue }) => {
  const [height, setHeight] = useState(initialValue.toString());

  const handleConfirm = () => {
    const numHeight = parseFloat(height);
    if (!isNaN(numHeight)) {
      onConfirm(numHeight);
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
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">高低差を入力</h3>
        <p className="text-sm text-gray-600 mb-4">敷地を基準とした道路の高低差(メートル)を入力してください。プラスの場合は道路が高く、マイナスの場合は道路が低くなります。</p>
        <div className="flex items-center">
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="例: 0.5 or -0.2"
            autoFocus
            style={{ backgroundColor: 'white' }}
          />
          <span className="ml-2 text-gray-700">m</span>
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={handleConfirm} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
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
