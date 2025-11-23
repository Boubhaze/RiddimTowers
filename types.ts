
export enum FrequencyBand {
  SUB = 'SUB',     // < 90Hz
  BASS = 'BASS',   // 90Hz - 250Hz
  MID = 'MID',     // 250Hz - 1.5kHz
  HIGH = 'HIGH',   // 1.5kHz - 7kHz
  TWEET = 'TWEET', // > 7kHz
}

export enum SirenModel {
  RETRO_BOX = 'NJD_STYLE',
  DIGITAL_RACK = 'DIGITAL_RACK',
  MODULAR_SYNTH = 'MODULAR'
}

export enum DelayModel {
  TAPE_ECHO = 'SPACE_ECHO',
  DIGITAL_DELAY = 'DIGITAL_DELAY',
  BUCKET_BRIGADE = 'BBD'
}

export interface PreampState {
  bands: {
    [key in FrequencyBand]: {
      gain: number; // 0 to 1
      muted: boolean;
    };
  };
  masterVolume: number;
}

export interface SirenState {
  active: boolean;
  frequency: number;
  rate: number;
  mode: number; // 0: Roots, 1: Digi, 2: Alarm
  volume: number;
}

export interface DelayState {
  time: number;
  feedback: number;
  returnLevel: number; // Output volume of delay
  musicSend: number; // Amount of music sent to delay
  sirenSend: number; // Amount of siren sent to delay
  filterHp: number; // High Pass Cutoff
  filterLp: number; // Low Pass Cutoff
}

export interface AudioEngineContextType {
  isReady: boolean;
  isPlaying: boolean;
  initializeAudio: () => Promise<void>;
  loadFile: (file: File) => Promise<void>;
  togglePlay: () => void;
  stopAudio: () => void;
  updateBandGain: (band: FrequencyBand, value: number) => void;
  toggleBandMute: (band: FrequencyBand) => void;
  triggerSiren: (active: boolean) => void;
  updateSirenParams: (freq: number, rate: number, mode: number, volume: number, model: SirenModel) => void;
  updateDelayParams: (time: number, feedback: number, returnLevel: number, musicSend: number, sirenSend: number, hp: number, lp: number) => void;
  updateDelayModel: (model: DelayModel) => void;
  updateEqGain: (index: number, val: number) => void;
  masterAnalyser: AnalyserNode | null;
  bandAnalysers: Record<FrequencyBand, AnalyserNode | null>;
}
