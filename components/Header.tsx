
import React from 'react';
import { ViewMode } from '../types';
import { MagnetIcon, CameraIcon, CubeIcon } from './Icons';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isImageLoaded: boolean;
  isSiteDefined: boolean;
  scale: number | null;
  isSnappingToSite: boolean;
  onSnapToSiteDown: () => void;
  onSnapToSiteUp: () => void;
  totalCost: number;
  isSetupComplete: boolean;
}

const HeaderButton: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode; tooltip: string; active?: boolean }> = ({ onClick, disabled, children, tooltip, active }) => (
  <div className="relative group shrink-0">
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${
        active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent'
      }`}
    >
      {children}
    </button>
    <div className="hidden md:block absolute top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {tooltip}
    </div>
  </div>
);

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  isImageLoaded,
  isSiteDefined,
  scale,
  isSnappingToSite,
  onSnapToSiteDown,
  onSnapToSiteUp,
  totalCost,
  isSetupComplete,
}) => {

  return (
    <header className="bg-white shadow-md flex items-center z-10 overflow-hidden shrink-0 h-14">
      {/* Scrollable Container for small screens */}
      <div className="flex items-center gap-2 px-4 py-1 w-full overflow-x-auto no-scrollbar whitespace-nowrap">
        <h1 className="text-lg font-bold text-indigo-600 mr-4 shrink-0 hidden md:block">リフォーム・間取り見積もり</h1>
        
        <div className="relative group shrink-0">
            <button
                onMouseDown={onSnapToSiteDown}
                onMouseUp={onSnapToSiteUp}
                onMouseLeave={onSnapToSiteUp}
                disabled={!isSiteDefined || !scale}
                className={`p-2 rounded-md transition-colors ${
                    isSnappingToSite ? 'bg-indigo-500 text-white' : 'hover:bg-gray-200'
                } disabled:text-gray-400 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
            >
                <MagnetIcon className="w-5 h-5" />
            </button>
            <div className="hidden md:block absolute top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                部屋形状にスナップ
            </div>
        </div>
        
        <div className="flex-grow min-w-[10px]"></div>
        
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

        {isSetupComplete && (
          <div className="text-right ml-4 shrink-0">
            <p className="text-xs text-gray-500">概算お見積り</p>
            <p className="text-xl font-bold text-gray-800">
              {totalCost.toLocaleString('ja-JP')}円
            </p>
          </div>
        )}

      </div>
    </header>
  );
};
