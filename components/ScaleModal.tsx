
import React from 'react';

interface ScaleInputProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
}

export const ScaleModal: React.FC<ScaleInputProps> = ({ value, onChange, onConfirm }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
    <div className="absolute bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="bg-white p-3 rounded-lg shadow-xl flex items-baseline gap-1 border border-gray-200">
        <span className="text-lg font-semibold text-gray-800">長さ</span>
        <span className="text-lg font-semibold text-gray-500">【</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-24 text-center text-3xl font-bold border-none focus:outline-none bg-transparent p-0"
          placeholder=""
          autoFocus
        />
        <span className="text-lg font-semibold text-gray-500">】</span>
        <span className="text-lg font-semibold text-gray-800">m</span>
      </div>
    </div>
  );
};
