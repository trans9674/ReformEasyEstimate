
import React from 'react';

interface FlipModalProps {
  onHorizontal: () => void;
  onVertical: () => void;
  onCancel: () => void;
}

export const FlipModal: React.FC<FlipModalProps> = ({ onHorizontal, onVertical, onCancel }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl text-center max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">反転方向を選択</h3>
        <div className="flex flex-col gap-3">
          <button onClick={onHorizontal} className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors font-medium border border-blue-200">
            左右反転
          </button>
          <button onClick={onVertical} className="w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors font-medium border border-blue-200">
            上下反転
          </button>
        </div>
        <button onClick={onCancel} className="mt-4 w-full px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">
          キャンセル
        </button>
      </div>
    </div>
  );
};
