/**
 * Audio Engine Types and Sound Kits
 */

export type DrumKitId = 'original' | 'rock' | 'jazz' | 'electronic' | 'donner_direct';

export interface DrumKitOption {
  id: DrumKitId;
  name: string;
  badge: string;
  icon: string;
  description: string;
}

export const DRUM_KIT_OPTIONS: DrumKitOption[] = [
  {
    id: 'original',
    name: 'Acústico Studio (Samples Reales)',
    badge: 'HQ Samples',
    icon: '🥁',
    description: 'Muestras acústicas multicapa de alta fidelidad con dinámica expresiva'
  },
  {
    id: 'rock',
    name: 'Rock & Heavy Punch',
    badge: 'Punchy',
    icon: '🎸',
    description: 'Ataque contundente, tarola brillante y bombo con sub-graves profundos'
  },
  {
    id: 'jazz',
    name: 'Jazz Vintage Bop',
    badge: 'Vintage',
    icon: '🎷',
    description: 'Afinación abierta, plato ride resonante y tarola con bordona cálida'
  },
  {
    id: 'electronic',
    name: 'Electro 808 & Synth',
    badge: 'Synth 808',
    icon: '⚡',
    description: 'Sintetizador analógico estilo 808/909 con pitch envelopes rápidos'
  },
  {
    id: 'donner_direct',
    name: 'Audio Directo Consola Donner',
    badge: 'Hardware Direct',
    icon: '🎧',
    description: 'Silencia la batería virtual para escuchar el sonido nativo de la consola DED-300X por audífonos'
  }
];

export type AudioSourceOption = 'full' | 'backing' | 'solo' | 'synth';

export type PlaybackAudioMode = 'orig' | 'synth';

export interface AudioEngineProgress {
  loaded: number;
  total: number;
  percentage: number;
}
