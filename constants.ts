import { FrequencyBand } from "./types";

// Minimalist configuration: No colors, just structure
export const BAND_CONFIGS = {
  [FrequencyBand.SUB]: { label: 'SUB', freq: 60, desc: '<90Hz' },
  [FrequencyBand.BASS]: { label: 'BASS', freq: 150, desc: '90-250Hz' },
  [FrequencyBand.MID]: { label: 'MID', freq: 600, desc: '250-1.5k' },
  [FrequencyBand.HIGH]: { label: 'HIGH', freq: 3000, desc: '1.5k-7k' },
  [FrequencyBand.TWEET]: { label: 'TOP', freq: 10000, desc: '>7kHz' },
};

export const INITIAL_PREAMP_STATE = {
  bands: {
    [FrequencyBand.SUB]: { gain: 0.5, muted: false },
    [FrequencyBand.BASS]: { gain: 0.5, muted: false },
    [FrequencyBand.MID]: { gain: 0.5, muted: false },
    [FrequencyBand.HIGH]: { gain: 0.5, muted: false },
    [FrequencyBand.TWEET]: { gain: 0.5, muted: false },
  },
  masterVolume: 0.8,
};