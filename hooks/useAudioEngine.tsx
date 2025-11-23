
import { useState, useRef, useCallback } from 'react';
import { AudioEngineContextType, FrequencyBand, SirenModel, DelayModel } from '../types';

export const useAudioEngine = (): AudioEngineContextType => {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Refs for Audio Nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Analysers
  const masterAnalyserRef = useRef<AnalyserNode | null>(null);
  const bandAnalysersRef = useRef<Record<FrequencyBand, AnalyserNode | null>>({
    [FrequencyBand.SUB]: null,
    [FrequencyBand.BASS]: null,
    [FrequencyBand.MID]: null,
    [FrequencyBand.HIGH]: null,
    [FrequencyBand.TWEET]: null,
  });
  
  // EQ Filters (10 Bands)
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);

  // Preamp Gains
  const gainsRef = useRef<Record<FrequencyBand, GainNode | null>>({
    [FrequencyBand.SUB]: null,
    [FrequencyBand.BASS]: null,
    [FrequencyBand.MID]: null,
    [FrequencyBand.HIGH]: null,
    [FrequencyBand.TWEET]: null,
  });

  // FX Routing Nodes
  const musicSendNodeRef = useRef<GainNode | null>(null);
  const sirenSendNodeRef = useRef<GainNode | null>(null);
  const delayReturnNodeRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const delayFilterHpRef = useRef<BiquadFilterNode | null>(null);
  const delayFilterLpRef = useRef<BiquadFilterNode | null>(null);
  
  // Siren Nodes
  const sirenOscRef = useRef<OscillatorNode | null>(null);
  const sirenLfoRef = useRef<OscillatorNode | null>(null);
  const sirenGainRef = useRef<GainNode | null>(null); // Main Siren Volume
  const sirenOutRef = useRef<GainNode | null>(null); // Output split
  const sirenModGainRef = useRef<GainNode | null>(null); // LFO Depth
  const sirenEnvelopeRef = useRef<GainNode | null>(null); // For start/stop click removal

  const initializeAudio = useCallback(async () => {
    if (audioCtxRef.current) return;

    const CtxClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new CtxClass();
    audioCtxRef.current = ctx;

    // --- ANALYSERS ---
    const masterAnalyser = ctx.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterAnalyserRef.current = masterAnalyser;

    const createBandAnalyser = () => {
        const a = ctx.createAnalyser();
        a.fftSize = 128; // Smaller fft for faster updates, we only need amplitude
        a.smoothingTimeConstant = 0.8; // Smoother falloff
        a.minDecibels = -60;
        a.maxDecibels = 0;
        return a;
    };
    bandAnalysersRef.current = {
        [FrequencyBand.SUB]: createBandAnalyser(),
        [FrequencyBand.BASS]: createBandAnalyser(),
        [FrequencyBand.MID]: createBandAnalyser(),
        [FrequencyBand.HIGH]: createBandAnalyser(),
        [FrequencyBand.TWEET]: createBandAnalyser(),
    };

    // --- SOURCE ---
    const audioEl = new Audio();
    audioEl.crossOrigin = "anonymous";
    audioEl.loop = true;
    audioElementRef.current = audioEl;
    const source = ctx.createMediaElementSource(audioEl);
    sourceNodeRef.current = source;

    // --- 10-BAND EQ ---
    const eqFreqs = [31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const eqFilters: BiquadFilterNode[] = [];
    
    let prevNode: AudioNode = source;

    eqFreqs.forEach((freq) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        
        prevNode.connect(filter);
        prevNode = filter;
        eqFilters.push(filter);
    });
    
    eqFiltersRef.current = eqFilters;

    // --- MASTER & MIX BUS ---
    const masterOut = ctx.createGain(); 
    masterOut.connect(masterAnalyser);
    masterAnalyser.connect(ctx.destination);

    // --- DELAY LOOP ---
    const delay = ctx.createDelay(5.0);
    const feedback = ctx.createGain();
    const delayHp = ctx.createBiquadFilter();
    const delayLp = ctx.createBiquadFilter();
    const delayReturn = ctx.createGain(); 
    const musicSend = ctx.createGain();
    const sirenSend = ctx.createGain();
    
    delay.delayTime.value = 0.3;
    feedback.gain.value = 0.4;
    delayReturn.gain.value = 0.5;
    musicSend.gain.value = 0.0;
    // Default siren send to max (1.0)
    sirenSend.gain.value = 1.0;
    
    // Config filters
    delayHp.type = 'highpass';
    delayHp.frequency.value = 100; // Default
    delayHp.Q.value = 0.7;

    delayLp.type = 'lowpass';
    delayLp.frequency.value = 3000; // Default Tape-ish
    delayLp.Q.value = 0.7;

    // Routing
    musicSend.connect(delay);
    sirenSend.connect(delay);
    
    // Loop: Delay -> Feedback -> HPF -> LPF -> Delay
    delay.connect(feedback);
    feedback.connect(delayHp);
    delayHp.connect(delayLp);
    delayLp.connect(delay);
    
    // Output
    delay.connect(delayReturn);
    delayReturn.connect(masterOut);

    delayNodeRef.current = delay;
    delayFeedbackRef.current = feedback;
    delayFilterHpRef.current = delayHp;
    delayFilterLpRef.current = delayLp;
    delayReturnNodeRef.current = delayReturn;
    musicSendNodeRef.current = musicSend;
    sirenSendNodeRef.current = sirenSend;

    // --- PREAMP / CROSSOVER (24dB/Octave) ---
    const createDoubleBand = (type: BiquadFilterType, freq: number, Q: number = 0.707) => {
      const f1 = ctx.createBiquadFilter();
      f1.type = type;
      f1.frequency.value = freq;
      f1.Q.value = Q;
      const f2 = ctx.createBiquadFilter();
      f2.type = type;
      f2.frequency.value = freq;
      f2.Q.value = Q;
      f1.connect(f2);
      const gain = ctx.createGain();
      // Initialize gain at 0.5 to prevent saturation
      gain.gain.value = 0.5;
      return { in: f1, out: f2, gain };
    };

    const createComboBand = (lowFreq: number, highFreq: number) => {
        const hp1 = ctx.createBiquadFilter(); hp1.type = 'highpass'; hp1.frequency.value = lowFreq;
        const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = lowFreq;
        const lp1 = ctx.createBiquadFilter(); lp1.type = 'lowpass'; lp1.frequency.value = highFreq;
        const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = highFreq;
        hp1.connect(hp2); hp2.connect(lp1); lp1.connect(lp2);
        const gain = ctx.createGain();
        // Initialize gain at 0.5 to prevent saturation
        gain.gain.value = 0.5;
        return { in: hp1, out: lp2, gain };
    };

    const createHiPassBand = (freq: number) => {
        const hp1 = ctx.createBiquadFilter(); hp1.type = 'highpass'; hp1.frequency.value = freq;
        const hp2 = ctx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = freq;
        hp1.connect(hp2);
        const gain = ctx.createGain();
        // Initialize gain at 0.5 to prevent saturation
        gain.gain.value = 0.5;
        return { in: hp1, out: hp2, gain };
    };

    const bandSub = createDoubleBand('lowpass', 90);
    const bandBass = createComboBand(90, 250);
    const bandMid = createComboBand(250, 3500); 
    const bandHigh = createComboBand(3500, 7000);
    const bandTweet = createHiPassBand(7000);

    gainsRef.current[FrequencyBand.SUB] = bandSub.gain;
    gainsRef.current[FrequencyBand.BASS] = bandBass.gain;
    gainsRef.current[FrequencyBand.MID] = bandMid.gain;
    gainsRef.current[FrequencyBand.HIGH] = bandHigh.gain;
    gainsRef.current[FrequencyBand.TWEET] = bandTweet.gain;

    const connectToSource = (band: {in: AudioNode, out: AudioNode, gain: GainNode}, bandName: FrequencyBand) => {
        prevNode.connect(band.in);
        band.out.connect(band.gain);
        band.gain.connect(masterOut);
        band.gain.connect(musicSend);
        const analyser = bandAnalysersRef.current[bandName];
        if (analyser) band.gain.connect(analyser);
    };

    connectToSource(bandSub, FrequencyBand.SUB);
    connectToSource(bandBass, FrequencyBand.BASS);
    connectToSource(bandMid, FrequencyBand.MID);
    connectToSource(bandHigh, FrequencyBand.HIGH);
    connectToSource(bandTweet, FrequencyBand.TWEET);

    // --- SIREN ---
    const sirenGain = ctx.createGain(); 
    // Default siren volume very low
    sirenGain.gain.value = 0.1;
    
    const sirenEnvelope = ctx.createGain(); 
    sirenEnvelope.gain.value = 0; 

    const sirenOut = ctx.createGain(); 
    
    sirenEnvelope.connect(sirenGain);
    sirenGain.connect(sirenOut);
    sirenOut.connect(masterOut); 
    sirenOut.connect(sirenSend); 

    sirenGainRef.current = sirenGain;
    sirenEnvelopeRef.current = sirenEnvelope;
    sirenOutRef.current = sirenOut;

    setIsReady(true);
  }, []);

  const loadFile = async (file: File) => {
    if (!audioElementRef.current || !audioCtxRef.current) return;
    const url = URL.createObjectURL(file);
    audioElementRef.current.src = url;
    
    // Do NOT auto-play
    setIsPlaying(false);

    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
  };

  const togglePlay = () => {
    if (!audioElementRef.current) return;
    
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioCtxRef.current?.state === 'suspended') {
         audioCtxRef.current.resume();
      }
      const playPromise = audioElementRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(error => {
             console.warn("Playback prevented/interrupted", error);
             setIsPlaying(false);
          });
      }
    }
  };

  const stopAudio = () => {
    if (!audioElementRef.current) return;
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    setIsPlaying(false);
  }

  const updateBandGain = (band: FrequencyBand, value: number) => {
    const gainNode = gainsRef.current[band];
    if (gainNode && audioCtxRef.current) {
        gainNode.gain.setTargetAtTime(value, audioCtxRef.current.currentTime, 0.05);
    }
  };

  const updateEqGain = (index: number, val: number) => {
      const filter = eqFiltersRef.current[index];
      if (filter && audioCtxRef.current) {
          filter.gain.setTargetAtTime(val, audioCtxRef.current.currentTime, 0.1);
      }
  }

  const toggleBandMute = (band: FrequencyBand) => {
     // Handled by UI state
  };

  const triggerSiren = (active: boolean) => {
    if (!audioCtxRef.current || !sirenEnvelopeRef.current) return;
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    if (active) {
      if (!sirenOscRef.current) {
         // Create Analog-Style Siren Circuit
         // OSC 1: Audio Tone
         // OSC 2: LFO (Modulator)
         const osc = ctx.createOscillator();
         const lfo = ctx.createOscillator();
         const lfoGain = ctx.createGain();
         
         lfo.connect(lfoGain);
         lfoGain.connect(osc.frequency);
         osc.connect(sirenEnvelopeRef.current!);
         
         osc.start(now);
         lfo.start(now);
         
         sirenOscRef.current = osc;
         sirenLfoRef.current = lfo;
         sirenModGainRef.current = lfoGain;
      }
      
      // Fast Attack
      sirenEnvelopeRef.current.gain.cancelScheduledValues(now);
      sirenEnvelopeRef.current.gain.setValueAtTime(sirenEnvelopeRef.current.gain.value, now);
      sirenEnvelopeRef.current.gain.linearRampToValueAtTime(1, now + 0.01);

    } else {
      // Release
      sirenEnvelopeRef.current.gain.cancelScheduledValues(now);
      sirenEnvelopeRef.current.gain.setValueAtTime(sirenEnvelopeRef.current.gain.value, now);
      sirenEnvelopeRef.current.gain.linearRampToValueAtTime(0, now + 0.15);
      
      if (sirenOscRef.current) {
        const stopTime = now + 0.2;
        sirenOscRef.current.stop(stopTime);
        sirenLfoRef.current?.stop(stopTime);
        setTimeout(() => {
            sirenOscRef.current?.disconnect();
            sirenLfoRef.current?.disconnect();
            sirenModGainRef.current?.disconnect();
            sirenOscRef.current = null;
            sirenLfoRef.current = null;
            sirenModGainRef.current = null;
        }, 250);
      }
    }
  };

  const updateSirenParams = (freq: number, rate: number, mode: number, volume: number, model: SirenModel) => {
     const ctx = audioCtxRef.current;
     if (!ctx) return;
     const now = ctx.currentTime;

     if (sirenGainRef.current) {
         sirenGainRef.current.gain.setTargetAtTime(volume, now, 0.1);
     }

     if (sirenOscRef.current && sirenLfoRef.current && sirenModGainRef.current) {
         
         // MODE 0: ROOTS (Sine Tone + Triangle LFO) - Smooth, round
         if (mode === 0) {
             sirenOscRef.current.type = 'sine';
             sirenLfoRef.current.type = 'triangle';
             const depth = freq * 0.25; 
             sirenModGainRef.current.gain.setTargetAtTime(depth, now, 0.05);
         } 
         // MODE 1: DIGITAL / STEPPAS (Square Tone + Triangle LFO) - The Classic 555 Sound
         else if (mode === 1) {
             sirenOscRef.current.type = 'square';
             sirenLfoRef.current.type = 'triangle';
             const depth = freq * 0.4;
             sirenModGainRef.current.gain.setTargetAtTime(depth, now, 0.05);
         } 
         // MODE 2: ALARM / TENSION (Sawtooth Tone + Sawtooth LFO) - Sharp
         else if (mode === 2) {
             sirenOscRef.current.type = 'sawtooth';
             sirenLfoRef.current.type = 'sawtooth';
             const depth = freq * 0.6;
             sirenModGainRef.current.gain.setTargetAtTime(depth, now, 0.05);
         }
         
         sirenOscRef.current.frequency.setTargetAtTime(freq, now, 0.05);
         sirenLfoRef.current.frequency.setTargetAtTime(rate, now, 0.05);
     }
  };

  const updateDelayModel = (model: DelayModel) => {
      // Logic handled via HPF/LPF controls now
  }

  const updateDelayParams = (time: number, feedback: number, returnLevel: number, musicSend: number, sirenSend: number, hp: number, lp: number) => {
    if(!audioCtxRef.current) return;
    const now = audioCtxRef.current.currentTime;
    
    if (delayNodeRef.current) delayNodeRef.current.delayTime.setTargetAtTime(time, now, 0.1);
    if (delayFeedbackRef.current) delayFeedbackRef.current.gain.setTargetAtTime(feedback, now, 0.1);
    if (delayReturnNodeRef.current) delayReturnNodeRef.current.gain.setTargetAtTime(returnLevel, now, 0.1);
    if (musicSendNodeRef.current) musicSendNodeRef.current.gain.setTargetAtTime(musicSend, now, 0.1);
    if (sirenSendNodeRef.current) sirenSendNodeRef.current.gain.setTargetAtTime(sirenSend, now, 0.1);
    
    if (delayFilterHpRef.current) delayFilterHpRef.current.frequency.setTargetAtTime(hp, now, 0.1);
    if (delayFilterLpRef.current) delayFilterLpRef.current.frequency.setTargetAtTime(lp, now, 0.1);
  };

  return {
    isReady,
    isPlaying,
    initializeAudio,
    loadFile,
    togglePlay,
    stopAudio,
    updateBandGain,
    toggleBandMute,
    triggerSiren,
    updateSirenParams,
    updateDelayParams,
    updateDelayModel,
    updateEqGain,
    masterAnalyser: masterAnalyserRef.current,
    bandAnalysers: bandAnalysersRef.current
  };
};
