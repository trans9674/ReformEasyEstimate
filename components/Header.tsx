import React from 'react';
import { ViewMode } from '../types';
import { CameraIcon, CubeIcon, RotateIcon as Rotate90Icon } from './Icons';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isImageLoaded: boolean;
  isSiteDefined: boolean;
  scale: number | null;
  totalCost: number;
  isSetupComplete: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRotate90?: () => void;
}

const CloseIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
  
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  isImageLoaded,
  isSiteDefined,
  scale,
  totalCost,
  isSetupComplete,
  onConfirm,
  onCancel,
  onRotate90
}) => {

  return (
    <header className="bg-white shadow-md flex items-center z-10 shrink-0 h-14">
      <div className="flex items-center gap-4 px-4 py-1 w-full">
        <h1 className="text-lg font-bold text-indigo-600 shrink-0 hidden md:block">リフォーム・間取り見積もり</h1>
        
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

        <div className="flex-grow min-w-[10px]"></div>

        {onConfirm && onCancel ? (
          <div className="flex items-center gap-2 shrink-0">
            {onRotate90 && (
              <button
                onClick={onRotate90}
                className="bg-gray-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-gray-600 transition-colors"
                aria-label="90度回転"
              >
                <Rotate90Icon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onCancel}
              className="bg-gray-700 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-gray-600 transition-colors"
              aria-label="キャンセル"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onConfirm}
              className="bg-yellow-400 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors"
              aria-label="決定"
            >
              <CheckIcon className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        ) : isSetupComplete ? (
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500 whitespace-nowrap">概算お見積り</p>
            <p className="text-xl font-bold text-gray-800 whitespace-nowrap">
              {totalCost.toLocaleString('ja-JP')}円
            </p>
          </div>
        ) : null}

      </div>
    </header>
  );
};