import React from 'react';
import { SirenModel, SirenState } from '../types';
import Knob from './Knob';

interface SirenProps {
  model: SirenModel;
  state: SirenState;
  setModel: (m: SirenModel) => void;
  onTrigger: (active: boolean) => void;
  onParamChange: (freq: number, rate: number, mode: number, vol: number) => void;
}

const Siren: React.FC<SirenProps> = ({ model, state, setModel, onTrigger, onParamChange }) => {
  
  // Exponential scaling helpers for LFO Rate
  const MIN_RATE = 0.05;
  const MAX_RATE = 15;

  const rateToLinear = (hz: number) => {
    return Math.log(hz / MIN_RATE) / Math.log(MAX_RATE / MIN_RATE);
  };

  const linearToRate = (val: number) => {
    return MIN_RATE * Math.pow(MAX_RATE / MIN_RATE, val);
  };

  const handleKnobChange = (key: 'frequency' | 'rate' | 'volume', val: number) => {
    const newState = { ...state, [key]: val };
    onParamChange(newState.frequency, newState.rate, newState.mode, newState.volume);
  };

  const handleModeChange = (newMode: number) => {
      onParamChange(state.frequency, state.rate, newMode, state.volume);
  }

  return (
    <div className="w-full h-full border border-black dark:border-white bg-white dark:bg-black flex flex-col transition-colors">
        {/* Header */}
        <div className="h-10 border-b border-black dark:border-white flex items-center justify-between px-3 bg-white dark:bg-black">
            <h3 className="text-xs font-medium tracking-wide text-black dark:text-white">ANALOG SIREN UNIT</h3>
        </div>

        {/* Main Controls */}
        <div className="flex-1 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <Knob 
                    label="PITCH" 
                    value={state.frequency} 
                    min={100} max={1500} 
                    onChange={(v) => handleKnobChange('frequency', v)} 
                    size="sm"
                />
                
                <Knob 
                    label="LFO RATE" 
                    value={rateToLinear(state.rate)} 
                    min={0} max={1} 
                    onChange={(v) => handleKnobChange('rate', linearToRate(v))}
                    size="sm"
                />
                
                <Knob 
                    label="LEVEL" 
                    value={state.volume} 
                    min={0} max={1} 
                    onChange={(v) => handleKnobChange('volume', v)}
                    size="sm"
                />
            </div>

            <div className="flex flex-col gap-4">
                 {/* Waveform Select */}
                <div className="flex border-t border-b border-gray-200 dark:border-gray-800 divide-x divide-gray-200 dark:divide-gray-800">
                     {[1, 2].map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`flex-1 py-2 text-[9px] font-mono text-center uppercase transition-colors 
                                ${state.mode === m ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'}`}
                        >
                            {m === 1 ? 'DIGI' : 'ALARM'}
                        </button>
                     ))}
                </div>

                {/* Trigger */}
                <button
                    onMouseDown={() => onTrigger(true)}
                    onMouseUp={() => onTrigger(false)}
                    onMouseLeave={() => onTrigger(false)}
                    onTouchStart={() => onTrigger(true)}
                    onTouchEnd={() => onTrigger(false)}
                    className={`w-full h-12 border border-black dark:border-white flex items-center justify-center transition-all active:scale-[0.98]
                        ${state.active ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 text-black dark:text-white'}
                    `}
                >
                    <span className="font-sans font-bold text-xs tracking-widest">TRIGGER SIGNAL (KEY: 6)</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default Siren;