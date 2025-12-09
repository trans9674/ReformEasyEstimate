
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

interface ConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  message?: string; // Kept for prop compatibility, but not used in the new UI
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      <div className="absolute top-5 left-5 pointer-events-auto">
        <button 
          onClick={onCancel} 
          className="bg-gray-800 bg-opacity-70 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-opacity-90 transition-all"
          aria-label="キャンセル"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="absolute top-5 right-5 pointer-events-auto">
        <button 
          onClick={onConfirm} 
          className="bg-yellow-400 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors"
          aria-label="決定"
        >
          <CheckIcon className="w-7 h-7 text-gray-800" />
        </button>
      </div>
    </div>
  );
};
