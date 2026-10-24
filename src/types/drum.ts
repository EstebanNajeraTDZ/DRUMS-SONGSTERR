/**
 * Drum Notation and Song Model Types
 */

export type DrumRowId =
  | 'CRASH'
  | 'HI_HAT'
  | 'RIDE'
  | 'TOM_1'
  | 'TOM_2'
  | 'TOM_3'
  | 'SNARE'
  | 'KICK';

export type StickingHand = 'R' | 'L' | 'K' | 'F' | '-';

export type NoteVelocity = 'ppp' | 'pp' | 'p' | 'mp' | 'mf' | 'f' | 'ff' | 'fff';

export type HiHatArticulation = 'closed' | 'open' | 'half_open' | 'pedal';
export type SnareArticulation = 'normal' | 'cross_stick' | 'rimshot';
export type RideArticulation = 'normal' | 'bell';
export type CymbalArticulation = 'normal' | 'choke';

export type DrumArticulation =
  | HiHatArticulation
  | SnareArticulation
  | RideArticulation
  | CymbalArticulation;

export interface DrumNote {
  midi: number;
  row: DrumRowId;
  row_idx: number;
  tick: number;             // tick position within the measure (0 to measure_ticks)
  duration: [number, number]; // [numerator, denominator] e.g. [1, 16]
  beat_ticks: number;
  velocity: NoteVelocity | string;
  accent: boolean;
  ghost: boolean;
  sticking?: StickingHand;
  articulation?: DrumArticulation;
}

export interface MeasureSection {
  name: string;
  measure_index: number;
  measure_number: number;
}

export interface Measure {
  measure_index: number;
  measure_number: number;
  signature: [number, number]; // e.g. [4, 4]
  bpm: number;
  marker?: string;
  measure_ticks: number;       // standard 1920 ticks in 4/4
  subdivision_count: number;   // e.g. 16 for 16ths, 24 for sextuplets
  notes: DrumNote[];
}

export interface SongData {
  song_id: string | number;
  artist: string;
  title: string;
  default_bpm: number;
  total_measures: number;
  sections: MeasureSection[];
  measures: Measure[];
  drum_track_name?: string;
  youtube_video_id?: string;
  has_drums?: boolean;
  signature?: [number, number];
  is_custom?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PresetSong {
  id: string;
  artist: string;
  title: string;
  bpm: number;
  is_featured: boolean;
}

export interface LessonItem {
  id: string;
  category?: string;
  title: string;
  description: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  bpm: number;
  bpm_range?: [number, number];
  signature: [number, number];
  sticking: string;
}

export interface LessonCategory {
  name: string;
  lessons: LessonItem[];
}

export interface LessonsResponse {
  categories: LessonCategory[];
  all: LessonItem[];
}

export interface SearchResultItem {
  songId: number;
  artist: string;
  title: string;
  hasDrums: boolean;
}

export const DRUM_ROW_DEFINITIONS: Array<{
  id: DrumRowId;
  name: string;
  shortName: string;
  color: string;
  dotColor: string;
  stavePosition: number; // 0 = lowest line/space, up to top
  defaultMidi: number;
}> = [
  { id: 'CRASH',  name: 'CRASH',  shortName: 'CR', color: '#64748b', dotColor: '#94a3b8', stavePosition: 7, defaultMidi: 49 },
  { id: 'HI_HAT', name: 'HI-HAT', shortName: 'HH', color: '#eab308', dotColor: '#facc15', stavePosition: 6, defaultMidi: 42 },
  { id: 'RIDE',   name: 'RIDE',   shortName: 'RD', color: '#ec4899', dotColor: '#f472b6', stavePosition: 5, defaultMidi: 51 },
  { id: 'TOM_1',  name: 'TOM 1',  shortName: 'T1', color: '#3b82f6', dotColor: '#60a5fa', stavePosition: 4, defaultMidi: 48 },
  { id: 'TOM_2',  name: 'TOM 2',  shortName: 'T2', color: '#22c55e', dotColor: '#4ade80', stavePosition: 3, defaultMidi: 45 },
  { id: 'TOM_3',  name: 'TOM 3',  shortName: 'T3', color: '#a855f7', dotColor: '#c084fc', stavePosition: 2, defaultMidi: 43 },
  { id: 'SNARE',  name: 'SNARE',  shortName: 'SN', color: '#ef4444', dotColor: '#f87171', stavePosition: 1, defaultMidi: 38 },
  { id: 'KICK',   name: 'KICK',   shortName: 'KK', color: '#f97316', dotColor: '#fb923c', stavePosition: 0, defaultMidi: 36 },
];
