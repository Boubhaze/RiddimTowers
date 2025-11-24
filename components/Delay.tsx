import React from 'react';
import { DelayModel, DelayState } from '../types';
import Knob from './Knob';

interface DelayProps {
  model: DelayModel;
  state: DelayState;
  setModel: (m: DelayModel) => void;
  onParamChange: (time: number, feed: number, returnLevel: number, musicSend: number, sirenSend: number, hp: number, lp: number) => void;
}

const Delay: React.FC<DelayProps> = ({ model, state, setModel, onParamChange }) => {

  const handleChange = (key: keyof DelayState, val: number) => {
    const newState = { ...state, [key]: val };
    onParamChange(newState.time, newState.feedback, newState.returnLevel, newState.musicSend, newState.sirenSend, newState.filterHp, newState.filterLp);
  };

  return (
    <div className="w-full h-full border border-black dark:border-white bg-white dark:bg-black flex flex-col transition-colors">
       <div className="h-10 border-b border-black dark:border-white flex items-center justify-between px-3 bg-white dark:bg-black">
            <h3 className="text-xs font-medium tracking-wide text-black dark:text-white">ECHO UNIT (TAPE MODEL)</h3>
        </div>

        <div className="flex-1 p-6 grid grid-cols-7 gap-2 items-center">
            {/* Sends */}
            <div className="flex flex-col items-center col-span-1">
                <Knob label="SEND M" value={state.musicSend} min={0} max={1} onChange={(v) => handleChange('musicSend', v)} size="sm" />
            </div>
            <div className="flex flex-col items-center col-span-1 border-r border-gray-200 dark:border-gray-800 pr-2">
                <Knob label="SEND S" value={state.sirenSend} min={0} max={1} onChange={(v) => handleChange('sirenSend', v)} size="sm" />
            </div>

            {/* Main Controls */}
            <div className="flex flex-col items-center col-span-1 pl-2">
                <Knob label="TIME" value={state.time} min={0.05} max={1.5} onChange={(v) => handleChange('time', v)} />
            </div>
            <div className="flex flex-col items-center col-span-1">
                <Knob label="FDBK" value={state.feedback} min={0} max={0.99} onChange={(v) => handleChange('feedback', v)} />
            </div>
            
            {/* Filters */}
            <div className="flex flex-col items-center col-span-1 border-l border-gray-200 dark:border-gray-800 pl-2">
                <Knob label="HPF" value={state.filterHp} min={20} max={1000} onChange={(v) => handleChange('filterHp', v)} size="sm" />
            </div>
             <div className="flex flex-col items-center col-span-1">
                <Knob label="LPF" value={state.filterLp} min={500} max={15000} onChange={(v) => handleChange('filterLp', v)} size="sm" />
            </div>

            {/* Output */}
            <div className="flex flex-col items-center col-span-1 border-l border-gray-200 dark:border-gray-800 pl-2">
                <Knob label="RETURN" value={state.returnLevel} min={0} max={1} onChange={(v) => handleChange('returnLevel', v)} />
            </div>
        </div>
    </div>
  );
};

export default Delay;