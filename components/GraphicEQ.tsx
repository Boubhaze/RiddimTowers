import React from 'react';
import Knob from './Knob';

interface GraphicEQProps {
  gains: number[]; // Array of 10 values (-12 to 12)
  onChange: (index: number, val: number) => void;
}

const FREQS = ['31', '63', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];

const GraphicEQ: React.FC<GraphicEQProps> = ({ gains, onChange }) => {
  return (
    <div className="w-full h-full border border-black dark:border-white bg-white dark:bg-black flex flex-col transition-colors">
      <div className="h-8 border-b border-black dark:border-white flex items-center px-3 bg-white dark:bg-black">
        <h3 className="text-[10px] font-bold tracking-widest text-black dark:text-white">GRAPHIC EQUALIZER (10-BAND)</h3>
      </div>
      
      <div className="flex-1 flex items-center justify-between px-4 py-2">
        {gains.map((gain, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <Knob 
                value={gain} 
                min={-12} 
                max={12} 
                onChange={(v) => onChange(i, v)}
                size="sm"
            />
            <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-black dark:text-white font-bold">{FREQS[i]}</span>
                <span className="text-[8px] font-mono text-gray-400 dark:text-gray-500">
                    {gain > 0 ? '+' : ''}{Math.round(gain)}
                </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GraphicEQ;