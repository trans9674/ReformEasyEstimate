
import React, { useState, useEffect } from 'react';

interface InstructionalPanelProps {
  title: string;
  message: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
}

export const InstructionalPanel: React.FC<InstructionalPanelProps> = ({ title, message, actions }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in on mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={`absolute bottom-4 left-4 right-4 z-40 pointer-events-auto transition-all duration-500 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      <div 
        className="bg-white p-4 rounded-lg shadow-lg text-left border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-700 mt-2">
          {message}
        </div>
        {actions && <div className="flex justify-start gap-4 mt-4">{actions}</div>}
      </div>
    </div>
  );
};
