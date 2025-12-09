
import React, { useState } from 'react';
import { RetainingWallType } from '../types';

interface RetainingWallSettingsModalProps {
  initialType: RetainingWallType;
  onConfirm: (type: RetainingWallType) => void;
  onCancel: () => void;
}

export const RetainingWallSettingsModal: React.FC<RetainingWallSettingsModalProps> = ({
  initialType,
  onConfirm,
  onCancel,
}) => {
  const [wallType, setWallType] = useState<RetainingWallType>(initialType);

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">擁壁設定</h3>
        
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">擁壁の種類</label>
                <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
                        <input 
                            type="radio" 
                            name="wallType" 
                            value="vertical" 
                            checked={wallType === 'vertical'} 
                            onChange={() => setWallType('vertical')}
                            className="text-blue-500 focus:ring-blue-400 h-4 w-4"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">直擁壁</span>
                            <span className="text-xs text-gray-500">垂直な壁として描画します</span>
                        </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
                        <input 
                            type="radio" 
                            name="wallType" 
                            value="sloped" 
                            checked={wallType === 'sloped'} 
                            onChange={() => setWallType('sloped')}
                            className="text-blue-500 focus:ring-blue-400 h-4 w-4"
                        />
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">斜め擁壁</span>
                            <span className="text-xs text-gray-500">境界から20cm平場、75度勾配</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm">
            キャンセル
          </button>
          <button onClick={() => onConfirm(wallType)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
            決定
          </button>
        </div>
      </div>
    </div>
  );
};
