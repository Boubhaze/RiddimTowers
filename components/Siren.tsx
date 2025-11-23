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
  // Min Rate: 0.05Hz, Max Rate: 15Hz
  const MIN_RATE = 0.05;
  const MAX_RATE = 15;

  // Converts Hz (state) to Linear 0-1 (knob position)
  const rateToLinear = (hz: number) => {
    return Math.log(hz / MIN_RATE) / Math.log(MAX_RATE / MIN_RATE);
  };

  // Converts Linear 0-1 (knob position) to Hz (state)
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
    <div className="w-full h-full border border-black bg-white flex flex-col">
        {/* Header */}
        <div className="h-10 border-b border-black flex items-center justify-between px-3 bg-white">
            <h3 className="text-xs font-medium tracking-wide">ANALOG SIREN UNIT</h3>
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
                
                {/* LFO Knob with Exponential Scaling */}
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
                 {/* Waveform Select - Removed ROOTS (0), Only DIGI (1) and ALARM (2) */}
                <div className="flex border-t border-b border-gray-200 divide-x divide-gray-200">
                     {[1, 2].map((m) => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`flex-1 py-2 text-[9px] font-mono text-center uppercase ${state.mode === m ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
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
                    className={`w-full h-12 border border-black flex items-center justify-center transition-all active:scale-[0.98]
                        ${state.active ? 'bg-black text-white' : 'bg-white hover:bg-gray-50 text-black'}
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