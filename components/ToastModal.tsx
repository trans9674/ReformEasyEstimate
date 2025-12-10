import React, { useState, useEffect } from 'react';

interface ToastModalProps {
  title: string;
  message: string;
}

export const ToastModal: React.FC<ToastModalProps> = ({ title, message }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        const inTimer = setTimeout(() => setIsVisible(true), 10);
        // Start fade out before parent component unmounts it
        const outTimer = setTimeout(() => setIsVisible(false), 3500); 
        
        return () => {
            clearTimeout(inTimer);
            clearTimeout(outTimer);
        };
    }, []);

    return (
        <div 
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] p-4 w-[90%] max-w-md bg-black/80 backdrop-blur-sm text-white rounded-xl shadow-2xl transition-all duration-300 ease-in-out pointer-events-none ${
                isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
        >
            <h3 className="text-lg font-bold text-center mb-2">{title}</h3>
            <p className="text-sm text-center">{message}</p>
        </div>
    );
};