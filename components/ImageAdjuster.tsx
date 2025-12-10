import React, { useState, useEffect } from 'react';

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

const pinchIconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAARRSURBVHhe7ZxLyBxFFMd/X4giiKAgeBBFRG8ePSoKHgQ9eBE8eBEUvXgQBUU8KAiCoIegeFA8ioiCGxU8SAQFERU/X8/M7E53dVXVdNd0p+OHD6ap6qrf/lV1VW9nZ2lpqdAoLAkLw5JwoawRFoYl4UBZEhaGJeFAMiW8A1s3t+K2rZtC2YI3JTwE2zY/he3bN4eyBW9KeB+2b34KGzZcC2UL3pTwCGzc9AM2bngplC14U8ID2LjhB2zc+FMoW/CmBG/b+AM2b34Oylb8SgmnA5u3fAhLli0IZQt+KeF3sHjpG1i6ZFOoW/BLCcfBkiU7sHj5plC24JcSjgItmzaDhQu/C2ULfimgS7hwwQ4sXbYllC14U0CXsHj5b7BkyapQtgJ+KeE8WLJkM1i8eFsoWwE/JTwaLF68JdSo/CsBXcKFC3/DkiUboWwF/FSgS1i2bAPWLX8WylYgEwE/BVs3/wrLlu0IZSvwUsKPYNnyF2Dhwo9C2Qp4KeEnsHDhB2zc+CMoW4FPCLY3409g/fr1oWwF/JTwEVi//hfYvPlvoWwF/JSQhL9g8+bXsG79llC2Ap8QfC3WLf8K69d/D8pW4FNCfMGaNSuwefOzULYCnxB8DZs3P4V161eGsgU/IfgSVq/uwoYNEULZgp8QfAkbNnwfaxb9GcoW/ITgC1i0+A/s3r0llC34CcEXsHv3l7Bo0etQtuAnBF/BokXfwNYNaULZgp8QvAVr1qwIZQuwQfA0rFy5FpQtARpB8LTYuHEjKFuAFlAt4eLiIigtLQ1lS1ATPFpaWpCVlQWVLcGc4MvKyvDu3TsoW4I5wVdWVga/v7+hbAkmA98QvLi4GNLS0qBsCSYDf0vwi4uLoKWlJZRtgU0Q/NraWnh6esq16fPz8+Dz8xPKtmATGBC8vr4eUlJSkGvTIyMj4OXlJZRtgU0Q/Pj4GPLz85Nr048fP4bAwEAo2wKbIDAwMDDgrWmfPn1CaGgoKFuBTRAICwub8Nb0/v37QkBAACjbApsgcHJyMtymz8nJAQkJCaFsC2yCwMnJSd6anpSUBCQkJKRsC2yCQHh4uLetTU5OQkpKSsrd3R3o6uoKZVtgEwQCAgLe2t7W1hYkJSUh5eXlQHt7OyhbApsgEBAQ4K3t9fV1SEtLw5N4bm4u6O7uDmULTYFNkP+8/4x3gby8PISFheGTeGJiIujo6Ah1lG0CTRB+fHyw3gV5eXk4deoUv7q6Ojg4OAh1lG0CTRD+/v5Yb4Lw8HDcuXMHdXR0BGtra0IdZdtAqAS3trYGHR0duHHjBq5fv44LCwuB7u5uKCNd2wCpBHd2doK2tjZcu3YNV69exbm5uUBHR0eoI13bAKkEt7a2go6ODvj6+uLK5eVgZ2cn1JGu7QClEvT19QWdnp64cnEx2NjYCOpI1zZAKkFdXR3o6emJc3Nzgc7OTkId6doGSBXY0tICJBIJ3JmZCQoLC0Id6dpA7A5KSkqCX1hYCAoKCuA1dHR0BPo6ugO8vr4O8Pb2DkB5eXkI6urqA2wJCAjwhr03OTmJdHR0hL29vQHPz8+Djo6OgJ+fnwcLCwshNTU1AG1tbW2A2+E3JTwE2zY/he3bN4eyBW9KeB+2b34KGzZcC2UL3pTwCGzc9AM2bngplC14U8ID2LjhB2zc+FMoW/CmBPeHl+FhWRKOFBaGJeFANiW8D/s/9v6Q/9wV+9EAAAAASUVORK5CYII=";


interface ImageAdjusterProps {
  onCancel: () => void;
  onRotate90: () => void;
  onConfirm: () => void;
}

export const ImageAdjuster: React.FC<ImageAdjusterProps> = ({ onCancel, onRotate90, onConfirm }) => {
  const [showPinchHint, setShowPinchHint] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPinchHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Corner Guides */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-gray-800/70 rounded-tl-md"></div>
      <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-gray-800/70 rounded-tr-md"></div>
      <div className="absolute bottom-24 left-4 w-16 h-16 border-b-4 border-l-4 border-gray-800/70 rounded-bl-md"></div>
      <div className="absolute bottom-24 right-4 w-16 h-16 border-b-4 border-r-4 border-gray-800/70 rounded-br-md"></div>

      {showPinchHint && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-black/60 p-4 rounded-lg animate-pinch-hint">
            <img src={pinchIconBase64} alt="ピンチ操作で調整" className="w-32 h-32 invert" />
          </div>
        </div>
      )}

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