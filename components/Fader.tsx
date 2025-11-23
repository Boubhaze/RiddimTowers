import React from 'react';

interface FaderProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  muted?: boolean;
  readOnly?: boolean;
}

const Fader: React.FC<FaderProps> = ({ value, onChange, label, muted, readOnly }) => {
  return (
    <div className="flex flex-col items-center h-full w-full gap-3 py-4">
      <div className="relative flex-1 w-12 flex justify-center group">
        
        {/* Track Line */}
        <div className="absolute h-full w-[1px] bg-gray-200"></div>
        <div className="absolute h-full w-[1px] bg-black top-0 transition-all duration-75" style={{ height: `${(1-value) * 100}%` }}></div>
        
        {/* Invisible Input (Disabled if readOnly) */}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          disabled={readOnly}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`absolute w-[200px] h-12 -rotate-90 top-[40%] -left-[76px] opacity-0 z-20 ${readOnly ? 'pointer-events-none' : 'cursor-pointer'}`}
        />

        {/* Handle */}
        <div 
            className={`absolute w-8 h-4 border border-black bg-white z-10 pointer-events-none transition-all duration-75 ease-out flex items-center justify-center
            ${muted ? 'opacity-50' : ''}
            `}
            style={{ bottom: `calc(${value * 100}% - 8px)` }}
        >
            <div className="w-4 h-[1px] bg-black"></div>
        </div>
      </div>
      
      {/* Label */}
      <div className="text-center">
         <span className={`block text-[10px] font-mono uppercase tracking-widest ${muted ? 'line-through text-gray-400' : 'text-black'}`}>
            {label}
         </span>
         <span className="text-[8px] text-gray-400 font-mono">
            {(value * 10).toFixed(1)}
         </span>
      </div>
    </div>
  );
};

export default Fader;