import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  value: number; // 0 to 1
  onChange: (val: number) => void;
  label?: string;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

const Knob: React.FC<KnobProps> = ({ 
  value, 
  onChange, 
  label, 
  min = 0, 
  max = 1, 
  size = 'md'
}) => {
  const [dragging, setDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const knobRef = useRef<HTMLDivElement>(null);

  const normalizedValue = (value - min) / (max - min);
  // -135deg to +135deg range
  const angle = normalizedValue * 270 - 135; 

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const deltaY = startY - e.clientY;
      const sensitivity = 0.005 * (max - min);
      let newValue = startValue + deltaY * sensitivity;
      
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, startY, startValue, onChange, min, max]);

  // Size mapping
  const pxSize = size === 'sm' ? 32 : size === 'lg' ? 64 : 48;

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div 
        ref={knobRef}
        className="relative cursor-ns-resize"
        style={{ width: pxSize, height: pxSize }}
        onMouseDown={handleMouseDown}
      >
        <svg width={pxSize} height={pxSize} viewBox="0 0 100 100">
            {/* Outer Ring / Track (optional, minimal doesn't always need it) */}
            <circle cx="50" cy="50" r="48" fill="none" className="stroke-gray-200 dark:stroke-gray-700 transition-colors" strokeWidth="1" />
            
            {/* The Knob Circle */}
            <g transform={`rotate(${angle} 50 50)`}>
                <circle cx="50" cy="50" r="46" className="fill-white dark:fill-black stroke-black dark:stroke-white transition-colors" strokeWidth="1.5" />
                {/* The Indicator Line */}
                <line x1="50" y1="50" x2="50" y2="10" className="stroke-black dark:stroke-white transition-colors" strokeWidth="2" strokeLinecap="square" />
            </g>
        </svg>
      </div>
      {label && (
        <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-black dark:text-gray-300">
          {label}
        </span>
      )}
    </div>
  );
};

export default Knob;