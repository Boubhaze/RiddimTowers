import React, { useState, useEffect } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { FrequencyBand, SirenModel, DelayModel, PreampState, SirenState, DelayState } from './types';
import { INITIAL_PREAMP_STATE } from './constants';
import Preamp from './components/Preamp';
import Siren from './components/Siren';
import Delay from './components/Delay';
import Visualizer from './components/Visualizer';
import GraphicEQ from './components/GraphicEQ';
import AsciiDisplay from './components/AsciiDisplay';

const App: React.FC = () => {
  const engine = useAudioEngine();
  
  // View State
  const [view, setView] = useState<'LANDING' | 'APP'>('LANDING');

  // App State
  const [preampState, setPreampState] = useState<PreampState>(INITIAL_PREAMP_STATE);
  // Default mode: 1 (DIGI), Volume: 0.1 (Low)
  const [sirenState, setSirenState] = useState<SirenState>({ active: false, frequency: 440, rate: 5, mode: 1, volume: 0.1 });
  // Delay State with Filters. Siren Send defaults to 1 (Max)
  const [delayState, setDelayState] = useState<DelayState>({ 
      time: 0.3, 
      feedback: 0.4, 
      returnLevel: 0.5, 
      musicSend: 0, 
      sirenSend: 1.0,
      filterHp: 100,
      filterLp: 3000
  });
  const [eqState, setEqState] = useState<number[]>(new Array(10).fill(0));
  
  const [sirenModel, setSirenModel] = useState<SirenModel>(SirenModel.RETRO_BOX);
  const [delayModel, setDelayModel] = useState<DelayModel>(DelayModel.TAPE_ECHO);

  // Audio Handlers
  const handleGainChange = (band: FrequencyBand, val: number) => {
    setPreampState(prev => ({
      ...prev,
      bands: { ...prev.bands, [band]: { ...prev.bands[band], gain: val } }
    }));
    engine.updateBandGain(band, val);
  };

  const handleMuteToggle = (band: FrequencyBand) => {
    const isMuted = !preampState.bands[band].muted;
    setPreampState(prev => ({
      ...prev,
      bands: { ...prev.bands, [band]: { ...prev.bands[band], muted: isMuted } }
    }));
    engine.updateBandGain(band, isMuted ? 0 : preampState.bands[band].gain);
  };

  const handleSirenTrigger = (active: boolean) => {
      // Must pass current mode to ensure oscillator starts with correct waveform
      if(active) {
          engine.triggerSiren(true);
          engine.updateSirenParams(sirenState.frequency, sirenState.rate, sirenState.mode, sirenState.volume, sirenModel);
      } else {
          engine.triggerSiren(false);
      }
      setSirenState(prev => ({ ...prev, active }));
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (view !== 'APP') return;

        // Map keys 1-5 to FrequencyBands
        const keyMap: Record<string, FrequencyBand> = {
            '1': FrequencyBand.SUB,
            '2': FrequencyBand.BASS,
            '3': FrequencyBand.MID,
            '4': FrequencyBand.HIGH,
            '5': FrequencyBand.TWEET
        };

        const band = keyMap[e.key];
        if (band) {
            handleMuteToggle(band);
        }

        // Siren Trigger on '6'
        if (e.key === '6' && !sirenState.active) {
            handleSirenTrigger(true);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (view !== 'APP') return;
        
        if (e.key === '6') {
            handleSirenTrigger(false);
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [view, preampState, engine, sirenState, sirenModel]); 

  const handleSirenParams = (freq: number, rate: number, mode: number, vol: number) => {
      setSirenState(prev => ({ ...prev, frequency: freq, rate, mode, volume: vol }));
      engine.updateSirenParams(freq, rate, mode, vol, sirenModel);
  };
  
  const handleSirenModelChange = (model: SirenModel) => {
      setSirenModel(model);
      engine.updateSirenParams(sirenState.frequency, sirenState.rate, sirenState.mode, sirenState.volume, model);
  }

  const handleDelayModelChange = (model: DelayModel) => {
      setDelayModel(model);
      engine.updateDelayModel(model);
  }

  const handleDelayParams = (time: number, feed: number, returnLevel: number, musicSend: number, sirenSend: number, hp: number, lp: number) => {
      setDelayState({ time, feedback: feed, returnLevel, musicSend, sirenSend, filterHp: hp, filterLp: lp });
      engine.updateDelayParams(time, feed, returnLevel, musicSend, sirenSend, hp, lp);
  };

  const handleEqChange = (index: number, val: number) => {
      const newEq = [...eqState];
      newEq[index] = val;
      setEqState(newEq);
      engine.updateEqGain(index, val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      engine.initializeAudio().then(() => {
          engine.loadFile(file);
      });
    }
  };

  const enterApp = () => {
    setView('APP');
    engine.initializeAudio();
  };

  if (view === 'LANDING') {
      return (
          <div className="min-h-screen bg-white text-black flex flex-col p-6 sm:p-12 selection:bg-black selection:text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
              
              <nav className="flex justify-between items-start z-10 mb-8">
                  <div className="text-xs font-mono uppercase tracking-widest border-b border-black pb-1">V2.0 // SYSTEM_READY</div>
                  <div className="text-right text-xs font-mono hidden sm:block opacity-60">
                      <div>AUDIO_CORE: ACTIVE</div>
                      <div>LATENCY: 12ms</div>
                  </div>
              </nav>

              <main className="w-full z-10 flex-1 flex flex-col justify-center gap-12">
                  {/* Title - Massive & Single Line */}
                  <h1 className="text-[11vw] font-black tracking-tighter leading-none animate-slide-up text-black whitespace-nowrap text-center xl:text-left mt-4 xl:mt-0">
                      RIDDIM TOWER
                  </h1>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-end">
                      
                      {/* Description Column (Wider now) */}
                      <div className="xl:col-span-5 flex flex-col gap-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
                          <div className="h-[4px] w-24 bg-black mb-2"></div>
                          <p className="text-xl sm:text-2xl font-medium leading-tight">
                              Vivez l'Expérience Sound System.
                          </p>
                          <p className="text-sm font-mono text-gray-600 leading-relaxed uppercase tracking-wide text-justify">
                              <strong className="text-black">Tour de Contrôle Virtuelle.</strong><br/>
                              Prenez les commandes d'une session Dub authentique. Pilotez un Préampli 5 voies, sculptez le signal avec des "Kills" précis, et créez l'ambiance avec une Sirène analogique et un Echo à bande.
                              Une immersion directe dans l'art du mixage live et de la culture Reggae.
                          </p>
                          
                          <div className="pt-4">
                              <button 
                                onClick={enterApp}
                                className="w-full sm:w-auto group flex items-center justify-center gap-6 text-sm font-bold uppercase tracking-widest bg-black text-white px-10 py-5 hover:bg-gray-900 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:translate-y-[-2px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)]"
                              >
                                  START THE SESSION
                                  <span className="text-xl font-light group-hover:translate-x-2 transition-transform">→</span>
                              </button>
                          </div>
                      </div>

                      {/* ASCII Column - Centered */}
                      <div className="xl:col-span-7 flex justify-center animate-fade-in" style={{animationDelay: '0.4s'}}>
                           <AsciiDisplay />
                      </div>
                  </div>
              </main>

              <footer className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex flex-col sm:flex-row justify-between z-10 mt-12 border-t border-gray-100 pt-4">
                  <span>© 2025 Riddim Tower Project</span>
                  <span className="mt-2 sm:mt-0">Created by <strong className="text-black">Raw Powa Studio</strong></span>
              </footer>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black flex flex-col p-4 font-sans">
      
      {/* APP HEADER */}
      <header className="w-full mx-auto max-w-[1400px] flex items-center justify-between mb-6 border-b border-black pb-4 pt-2">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setView('LANDING')}
                className="w-8 h-8 flex items-center justify-center border border-transparent hover:border-black hover:bg-white transition-all rounded-full group"
                title="Return Home"
            >
                <span className="group-hover:-translate-x-[1px] transition-transform">←</span>
            </button>
            <h1 className="text-xl font-bold tracking-tight border-r border-black pr-4 mr-4">RIDDIM TOWER</h1>
            <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 rounded-full">ONLINE</span>
            <span className="text-[9px] font-mono text-gray-500 hidden md:inline ml-2">[HOTKEYS: 1-5 for KILLS, 6 for SIREN]</span>
        </div>

        <div className="flex items-center gap-6">
             <label className="cursor-pointer text-xs font-bold uppercase hover:underline">
                [ Charger Audio ]
                <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
            </label>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={engine.togglePlay}
                    disabled={!engine.isReady}
                    className="w-20 h-8 border border-black flex items-center justify-center text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-30"
                >
                    {engine.isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button 
                    onClick={engine.stopAudio}
                    disabled={!engine.isReady}
                    className="w-20 h-8 border border-black flex items-center justify-center text-xs font-bold uppercase hover:bg-red-600 hover:text-white hover:border-red-600 transition-colors disabled:opacity-30"
                >
                    STOP
                </button>
            </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="w-full mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-start h-full pb-12">
        
        {/* Left: Preamp & EQ Section */}
        <section className="lg:col-span-8 flex flex-col gap-6 shadow-sm">
            
            {/* 10-Band EQ (Full Width) */}
            <div className="h-32 w-full shadow-[0_5px_15px_-5px_rgba(0,0,0,0.05)]">
                 <GraphicEQ 
                    gains={eqState} 
                    onChange={handleEqChange} 
                 />
            </div>

            {/* Visualizer (Full Width) */}
            <div className="h-24 w-full border border-black p-[1px] bg-white">
                  <Visualizer analyser={engine.masterAnalyser} />
            </div>

            {/* Preamp (Full Width) */}
            <div className="h-[520px] w-full shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)]">
                <Preamp 
                    state={preampState} 
                    onGainChange={handleGainChange} 
                    onMuteToggle={handleMuteToggle}
                    bandAnalysers={engine.bandAnalysers}
                />
            </div>
        </section>

        {/* Right: FX Rack */}
        <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="h-72 w-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                <Siren 
                    model={sirenModel} 
                    state={sirenState} 
                    setModel={handleSirenModelChange}
                    onTrigger={handleSirenTrigger}
                    onParamChange={handleSirenParams}
                />
            </div>
            <div className="h-64 w-full shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                <Delay 
                    model={delayModel}
                    state={delayState}
                    setModel={handleDelayModelChange}
                    onParamChange={handleDelayParams}
                />
            </div>
            
            {/* Guide Opérateur */}
            <div className="mt-auto pt-6 border-t border-black/10">
                <h4 className="text-[10px] font-bold uppercase mb-3">Guide Opérateur</h4>
                <ul className="text-[10px] text-gray-500 font-mono space-y-2 leading-relaxed list-disc pl-3">
                    <li><strong>Charger Audio:</strong> Sélectionnez votre fichier pour commencer.</li>
                    <li><strong>Kills (1-5):</strong> Utilisez le clavier pour couper les fréquences instantanément.</li>
                    <li><strong>Sirène (6):</strong> Déclenchez l'alerte. Ajustez le LFO pour les montées.</li>
                    <li><strong>Dub Echo:</strong> Montez les <span className="text-black font-bold">SEND M/S</span> pour envoyer le signal dans la chambre d'écho.</li>
                </ul>
            </div>
        </section>

      </main>
    </div>
  );
};

export default App;