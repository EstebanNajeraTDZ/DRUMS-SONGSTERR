/**
 * Web MIDI API and Donner DED-300X Types
 */
import { DrumRowId, DrumArticulation } from './drum';

export type MidiConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'unsupported'
  | 'insecure_context'
  | 'permission_denied';

export interface MidiState {
  status: MidiConnectionStatus;
  message: string;
  deviceName: string | null;
  isNetworkInsecure?: boolean;
}

export interface MidiHitEvent {
  row: DrumRowId;
  midi: number;
  velocity: number;      // 0 - 127
  timestamp: number;     // performance.now()
  articulation: DrumArticulation;
  channel?: number;
  isChoke?: boolean;
}

export interface MidiLogItem {
  id: string;
  time: string;
  note: number;
  velocity: number;
  row: DrumRowId;
  articulation: DrumArticulation;
  channel: number;
  rawType: string;
}

export interface MidiDeviceInput {
  id: string;
  name: string;
  manufacturer: string;
  state: string;
}

export interface CalibrationStep {
  id: string;
  padName: string;
  targetRow: DrumRowId;
  targetArticulation: DrumArticulation;
  icon: string;
  instruction: string;
  expectedNoteDefault: number;
  recordedNote?: number;
  recordedVelocity?: number;
  status: 'pending' | 'waiting' | 'recorded' | 'skipped';
}
