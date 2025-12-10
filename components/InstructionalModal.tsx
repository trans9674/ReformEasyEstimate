import React from 'react';

interface InstructionalModalProps {
  title: string;
  message: React.ReactNode;
  buttonText: string;
  onConfirm: () => void;
}

export const InstructionalModal: React.FC<InstructionalModalProps> = ({ title, message, buttonText, onConfirm }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl text-left max-w-md w-full">
        <h3 className="text-xl font-bold mb-4 text-gray-800">{title}</h3>
        <div className="mb-6 text-gray-700 space-y-2">
            {message}
        </div>
        <div className="flex justify-end gap-4">
          <button onClick={onConfirm} className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
