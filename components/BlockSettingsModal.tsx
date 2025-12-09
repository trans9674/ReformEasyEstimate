
import React, { useState, useEffect } from 'react';
import { BlockType, FenceType } from '../types';

interface BlockSettingsModalProps {
  initialBlockType: BlockType;
  initialFenceType: FenceType;
  initialFenceHeight: number;
  onConfirm: (blockType: BlockType, fenceType: FenceType, fenceHeight: number) => void;
  onCancel: () => void;
}

export const BlockSettingsModal: React.FC<BlockSettingsModalProps> = ({
  initialBlockType,
  initialFenceType,
  initialFenceHeight,
  onConfirm,
  onCancel,
}) => {
  const [blockType, setBlockType] = useState<BlockType>(initialBlockType);
  const [fenceType, setFenceType] = useState<FenceType>(initialFenceType);
  const [fenceHeight, setFenceHeight] = useState<number>(initialFenceHeight);

  // Focus trap or simple effect if needed
  useEffect(() => {
      // Logic to focus input could go here
  }, []);

  const handleConfirm = () => {
    onConfirm(blockType, fenceType, fenceHeight);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">ブロック塀設定</h3>
        
        <div className="space-y-4">
            {/* Block Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ブロックの種類</label>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="blockType" 
                            value="normal" 
                            checked={blockType === 'normal'} 
                            onChange={() => setBlockType('normal')}
                            className="text-blue-500 focus:ring-blue-400"
                        />
                        <span>普通ブロック (グレー)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="blockType" 
                            value="decorative_a" 
                            checked={blockType === 'decorative_a'} 
                            onChange={() => setBlockType('decorative_a')}
                            className="text-blue-500 focus:ring-blue-400"
                        />
                        <span>化粧ブロックA (ベージュ)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="blockType" 
                            value="decorative_b" 
                            checked={blockType === 'decorative_b'} 
                            onChange={() => setBlockType('decorative_b')}
                            className="text-blue-500 focus:ring-blue-400"
                        />
                        <span>化粧ブロックB (ブラウン)</span>
                    </label>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* Fence Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">フェンスの種類</label>
                <select 
                    value={fenceType} 
                    onChange={(e) => setFenceType(e.target.value as FenceType)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="none">なし</option>
                    <option value="mesh">メッシュフェンス</option>
                    <option value="horizontal">横格子フェンス</option>
                    <option value="vertical">縦格子フェンス</option>
                </select>
            </div>

            {/* Fence Height */}
            {fenceType !== 'none' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">フェンス高さ (m)</label>
                    <div className="flex items-center">
                        <input 
                            type="number" 
                            step="0.1"
                            min="0.4"
                            max="2.0"
                            value={fenceHeight} 
                            onChange={(e) => setFenceHeight(parseFloat(e.target.value))}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-500 text-sm">m</span>
                    </div>
                </div>
            )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors text-sm">
            キャンセル
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm">
            決定
          </button>
        </div>
      </div>
    </div>
  );
};
