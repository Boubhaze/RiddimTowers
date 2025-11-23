import React, { useRef, useEffect } from 'react';
import { FrequencyBand, PreampState } from '../types';
import { BAND_CONFIGS } from '../constants';
import Knob from './Knob';
import Fader from './Fader';

interface PreampProps {
  state: PreampState;
  onGainChange: (band: FrequencyBand, val: number) => void;
  onMuteToggle: (band: FrequencyBand) => void;
  bandAnalysers: Record<FrequencyBand, AnalyserNode | null>;
}

// Fixed VU Meter Component with Physics Decay
const VuMeter: React.FC<{ analyser: AnalyserNode | null }> = ({ analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const frameIdRef = useRef<number>(0);
    const currentLevelRef = useRef<number>(0); // Store previous frame level
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Configuration
        const SEGMENTS = 20; // Number of LED segments
        const GAP = 1;
        const DECAY = 0.9; // Smoothing factor (0.9 = slow decay, 0.5 = fast)
        
        // If no analyser, just draw empty state
        if (!analyser) {
            ctx.clearRect(0,0, canvas.width, canvas.height);
            return;
        }

        const bufferLength = analyser.frequencyBinCount; 
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            frameIdRef.current = requestAnimationFrame(draw);
            analyser.getByteTimeDomainData(dataArray);

            // Calculate RMS
            let sum = 0;
            for(let i=0; i < bufferLength; i++) {
                 // Convert 0..255 to -1..1
                 const x = (dataArray[i] - 128) / 128.0;
                 sum += x * x;
            }
            const rms = Math.sqrt(sum / bufferLength);
            
            // Normalize and boost slightly for visual effect
            let targetLevel = rms * 5; 
            if (targetLevel > 1) targetLevel = 1;

            // Physics: Instant Attack, Smooth Decay
            if (targetLevel > currentLevelRef.current) {
                currentLevelRef.current = targetLevel;
            } else {
                currentLevelRef.current = currentLevelRef.current * DECAY;
            }

            // prevent tiny float numbers
            if (currentLevelRef.current < 0.001) currentLevelRef.current = 0;

            const displayLevel = currentLevelRef.current;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const segmentHeight = (canvas.height - (SEGMENTS * GAP)) / SEGMENTS;
            
            // How many segments to light up
            const activeSegments = Math.floor(displayLevel * SEGMENTS);

            for (let i = 0; i < SEGMENTS; i++) {
                // Draw from bottom up
                const y = canvas.height - ((i + 1) * (segmentHeight + GAP));
                
                // Color Logic
                let fill = '#eee'; // Inactive
                
                if (i < activeSegments) {
                    // Active Colors
                    if (i > SEGMENTS * 0.8) fill = '#000'; // Peak (Top 20%)
                    else if (i > SEGMENTS * 0.5) fill = '#666'; // Mid
                    else fill = '#999'; // Low
                }

                ctx.fillStyle = fill;
                ctx.fillRect(0, y, canvas.width, segmentHeight);
            }
        };
        
        draw();
        
        return () => {
            if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
        };
    }, [analyser]);

    return <canvas ref={canvasRef} width={12} height={160} className="bg-transparent" />;
}

const Preamp: React.FC<PreampProps> = ({ state, onGainChange, onMuteToggle, bandAnalysers }) => {
  const bands = Object.values(FrequencyBand);

  return (
    <div className="w-full h-full border-t border-b border-black flex flex-col bg-white">
      <div className="flex-1 flex divide-x divide-black">
      {bands.map((band) => {
        const config = BAND_CONFIGS[band];
        const bandState = state.bands[band];

        return (
          <div key={band} className="flex-1 flex flex-col relative group">
            
            {/* Header / Info */}
            <div className="h-12 border-b border-black p-2 flex justify-between items-start">
                 <div className="text-[9px] font-mono leading-tight text-gray-500">
                    {config.desc}
                 </div>
            </div>

            {/* Controls */}
            <div className="flex-1 flex flex-col items-center py-6 gap-6">
                
                {/* Kill Switch Area with Border */}
                <div className="flex flex-col items-center gap-2 border border-gray-200 p-2 rounded-sm bg-gray-50/50">
                    <span className="text-[8px] font-mono text-gray-400">KILL</span>
                    <button 
                        onClick={() => onMuteToggle(band)}
                        className={`w-6 h-6 border border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] ${bandState.muted ? 'bg-black' : 'bg-white hover:bg-gray-100'}`}
                        title="Mute"
                    >
                    </button>
                </div>

                {/* Gain Trim */}
                <Knob 
                    value={bandState.gain} 
                    onChange={(v) => onGainChange(band, v)}
                    size="sm"
                    label="TRIM"
                />

                {/* Fader & VU Group */}
                <div className="flex-1 w-full flex justify-center gap-4 px-2">
                    <div className="flex-1 max-w-[40px]">
                        <Fader 
                            value={bandState.gain} 
                            onChange={(v) => onGainChange(band, v)} 
                            label={config.label}
                            muted={bandState.muted}
                            readOnly={true}
                        />
                    </div>
                    {/* VU Meter Column */}
                    <div className="h-full pt-4 pb-12 flex flex-col justify-end">
                         <VuMeter analyser={bandAnalysers[band]} />
                    </div>
                </div>
            </div>
            
            {/* Mute Indicator Text (Bottom) */}
             <div className={`absolute bottom-2 left-0 right-0 text-center pointer-events-none transition-opacity ${bandState.muted ? 'opacity-100' : 'opacity-0'}`}>
                <span className="bg-black text-white text-[9px] px-1 font-mono">MUTED</span>
             </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default Preamp;