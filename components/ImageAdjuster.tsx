import React from 'react';

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

const Rotate90Icon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
    </svg>
);


interface ImageAdjusterProps {
  onCancel: () => void;
  onRotate90: () => void;
  onConfirm: () => void;
}

export const ImageAdjuster: React.FC<ImageAdjusterProps> = ({ onCancel, onRotate90, onConfirm }) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute top-5 left-5 flex flex-row gap-2 pointer-events-auto">
        <button 
          onClick={onCancel} 
          className="bg-gray-800 bg-opacity-70 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-all"
          aria-label="再撮影"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onRotate90} 
          className="bg-gray-800 bg-opacity-70 text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-all"
          aria-label="90度回転"
        >
          <Rotate90Icon className="w-5 h-5" />
        </button>
      </div>
      <div className="absolute top-5 right-5 pointer-events-auto">
        <button 
          onClick={onConfirm} 
          className="bg-yellow-400 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors"
          aria-label="決定"
        >
          <CheckIcon className="w-5 h-5 text-gray-800" />
        </button>
      </div>
    </div>
  );
};