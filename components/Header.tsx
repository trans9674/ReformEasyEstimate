import React from 'react';
import { ViewMode } from '../types';
import { CameraIcon, CubeIcon, CheckIcon } from './Icons';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isImageLoaded: boolean;
  isSiteDefined: boolean;
  scale: number | null;
  totalCost: number;
  isSetupComplete: boolean;
  currentSetupStep: number;
  onConfirmAdjustment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  isImageLoaded,
  isSiteDefined,
  scale,
  totalCost,
  isSetupComplete,
  currentSetupStep,
  onConfirmAdjustment,
}) => {

  return (
    <header className="bg-white shadow-md flex items-center justify-between z-20 shrink-0 h-14 px-4 py-1">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-indigo-600 shrink-0 hidden md:block">外構・エクステリア見積もり</h1>
        
        <div className="flex bg-gray-100 rounded-md p-1 shrink-0">
            <button
                onClick={() => onViewModeChange(ViewMode.TWO_D)}
                disabled={!isImageLoaded}
                className={`px-4 py-2 text-base rounded-md flex items-center justify-center gap-2 transition-colors ${viewMode === ViewMode.TWO_D ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-100'}`}
            >
                <CameraIcon className="w-5 h-5" /> 2D
            </button>
            <button
                onClick={() => onViewModeChange(ViewMode.THREE_D)}
                disabled={!isImageLoaded}
                className={`px-4 py-2 text-base rounded-md flex items-center justify-center gap-2 transition-colors ${viewMode === ViewMode.THREE_D ? 'bg-blue-500 text-white shadow' : 'text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-gray-100'}`}
            >
                <CubeIcon className="w-5 h-5" /> 3D
            </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isSetupComplete && (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500 whitespace-nowrap">概算お見積り</p>
            <p className="text-xl font-bold text-gray-800 whitespace-nowrap">
              {totalCost.toLocaleString('ja-JP')}円
            </p>
          </div>
        )}

        {currentSetupStep === 2 && (
          <button
            onClick={onConfirmAdjustment}
            className="bg-yellow-400 rounded-md px-4 py-2 flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors text-gray-800 font-bold"
            aria-label="決定"
          >
            <CheckIcon className="w-5 h-5 mr-1" />
            決定
          </button>
        )}
      </div>
    </header>
  );
};