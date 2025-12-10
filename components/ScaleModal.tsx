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
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto">
      <div className="bg-white p-2 rounded-lg shadow-xl flex items-baseline gap-1 border border-gray-200">
        <span className="text-base font-semibold text-gray-800">長さ</span>
        <span className="text-base font-semibold text-gray-500">【</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 text-center text-2xl font-bold border-none focus:outline-none bg-transparent p-0"
          placeholder=""
          autoFocus
        />
        <span className="text-base font-semibold text-gray-500">】</span>
        <span className="text-base font-semibold text-gray-800">m</span>
      </div>
    </div>
  );
};