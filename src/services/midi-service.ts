/**
 * Donner DED-300X Web MIDI Controller Service
 * Real-time USB MIDI connectivity, pad mappings, CC4 pedal monitoring and diagnostics
 */
import { DrumRowId, DrumArticulation } from '../types/drum';
import { MidiState, MidiHitEvent, MidiLogItem, MidiDeviceInput } from '../types/midi';
import { StorageService } from './storage';

export class DonnerMidiService {
  private midiAccess: MIDIAccess | null = null;
  private selectedInputId: string = 'all';
  private connectedDeviceName: string | null = null;
  public hiHatPedalValue: number = 0; // 0 (open) to 127 (closed)

  private defaultNoteMap: Record<number, DrumRowId> = {
    // Kick
    36: 'KICK', 35: 'KICK',
    // Snare
    38: 'SNARE', 40: 'SNARE', 37: 'SNARE',
    // Hi-Hat
    42: 'HI_HAT', 44: 'HI_HAT', 46: 'HI_HAT', 22: 'HI_HAT', 26: 'HI_HAT',
    23: 'HI_HAT', 24: 'HI_HAT', 25: 'HI_HAT', 92: 'HI_HAT', 98: 'HI_HAT',
    // Toms
    48: 'TOM_1', 50: 'TOM_1',
    45: 'TOM_2', 47: 'TOM_2',
    43: 'TOM_3', 41: 'TOM_3', 58: 'TOM_3',
    // Cymbals
    49: 'CRASH', 55: 'CRASH', 57: 'CRASH', 52: 'CRASH',
    51: 'RIDE', 53: 'RIDE', 59: 'RIDE',
    // Electronic Cymbal Choke Notes
    85: 'CRASH', 87: 'CRASH', 89: 'RIDE',
  };

  private noteArticulations: Record<number, DrumArticulation> = {
    46: 'open',
    26: 'open',
    42: 'closed',
    22: 'closed',
    44: 'pedal',
    23: 'half_open',
    24: 'half_open',
    25: 'half_open',
    92: 'half_open',
    98: 'half_open',
    53: 'bell',
    51: 'normal',
    59: 'normal',
    40: 'cross_stick',
    37: 'cross_stick',
    38: 'normal',
    85: 'choke',
    87: 'choke',
    89: 'choke',
  };

  private noteMap: Record<number, DrumRowId> = { ...this.defaultNoteMap };

  // Listeners
  private hitListeners: Array<(hit: MidiHitEvent) => void> = [];
  private rawMidiListeners: Array<(log: MidiLogItem) => void> = [];
  private stateListeners: Array<(state: MidiState) => void> = [];
  private pedalListeners: Array<(val: number) => void> = [];
  private chokeListeners: Array<(cymbal: 'CRASH' | 'RIDE') => void> = [];
  private programListeners: Array<(kitNum: number) => void> = [];

  // Calibration capture hook
  public captureHook: ((note: number, vel: number) => void) | null = null;

  constructor() {
    this.loadCustomMap();
  }

  private loadCustomMap(): void {
    const custom = StorageService.getCustomMidiMap();
    if (custom) {
      for (const [noteStr, rowStr] of Object.entries(custom)) {
        const n = Number(noteStr);
        if (!isNaN(n) && rowStr) {
          this.noteMap[n] = rowStr as DrumRowId;
        }
      }
    }
  }

  public setCustomNote(note: number, row: DrumRowId): void {
    this.noteMap[note] = row;
    const current = StorageService.getCustomMidiMap() || {};
    current[note] = row;
    StorageService.setCustomMidiMap(current);
  }

  public resetFactoryMap(): void {
    this.noteMap = { ...this.defaultNoteMap };
    StorageService.clearCustomMidiMap();
  }

  public async init(): Promise<boolean> {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.isSecureContext && !isLocal) {
      this.notifyState({
        status: 'insecure_context',
        message: 'Acceso bloqueado por seguridad: requiere HTTPS o localhost.',
        deviceName: null,
        isNetworkInsecure: true,
      });
      return false;
    }

    if (!navigator.requestMIDIAccess) {
      this.notifyState({
        status: 'unsupported',
        message: 'Tu navegador no soporta Web MIDI API. Usa Chrome, Edge o Brave.',
        deviceName: null,
      });
      return false;
    }

    return await this.requestAccess();
  }

  public async requestAccess(): Promise<boolean> {
    try {
      this.notifyState({
        status: 'connecting',
        message: 'Solicitando acceso a puertos MIDI USB...',
        deviceName: null,
      });

      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.bindInputs();

      this.midiAccess.onstatechange = () => {
        this.bindInputs();
      };

      return true;
    } catch (err) {
      this.notifyState({
        status: 'permission_denied',
        message: `Permiso denegado para Web MIDI: ${err instanceof Error ? err.message : String(err)}`,
        deviceName: null,
      });
      return false;
    }
  }

  public getAvailableInputs(): MidiDeviceInput[] {
    if (!this.midiAccess) return [];
    const inputs: MidiDeviceInput[] = [];
    this.midiAccess.inputs.forEach((inp) => {
      inputs.push({
        id: inp.id,
        name: inp.name || 'Dispositivo MIDI Desconocido',
        manufacturer: inp.manufacturer || 'Desconocido',
        state: inp.state || 'connected',
      });
    });
    return inputs;
  }

  public selectInput(inputId: string): void {
    this.selectedInputId = inputId;
    this.bindInputs();
  }

  private bindInputs(): void {
    if (!this.midiAccess) return;

    let donnerFound = false;
    let anyConnected = false;
    let firstName: string | null = null;

    this.midiAccess.inputs.forEach((input) => {
      // Remove old listener
      input.onmidimessage = null;

      if (this.selectedInputId === 'all' || this.selectedInputId === input.id) {
        anyConnected = true;
        if (!firstName) firstName = input.name || 'Dispositivo USB';

        if (input.name && (input.name.toLowerCase().includes('donner') || input.name.toLowerCase().includes('ded-300') || input.name.toLowerCase().includes('e-drum'))) {
          donnerFound = true;
          this.connectedDeviceName = input.name;
        }

        input.onmidimessage = (event: MIDIMessageEvent) => this.handleMidiMessage(event);
      }
    });

    if (donnerFound) {
      this.notifyState({
        status: 'connected',
        message: `Conectado: ${this.connectedDeviceName}`,
        deviceName: this.connectedDeviceName,
      });
    } else if (anyConnected) {
      this.connectedDeviceName = firstName;
      this.notifyState({
        status: 'connected',
        message: `Dispositivo detectado: ${firstName}`,
        deviceName: firstName,
      });
    } else {
      this.connectedDeviceName = null;
      this.notifyState({
        status: 'disconnected',
        message: 'Buscando Donner DED-300X... Conecta el cable USB.',
        deviceName: null,
      });
    }
  }

  private handleMidiMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 2) return;

    const statusByte = event.data[0];
    const messageType = statusByte >> 4;
    const channel = (statusByte & 0x0f) + 1;
    const data1 = event.data[1];
    const data2 = event.data.length > 2 ? event.data[2] : 0;

    // CC (Continuous Controller) - Message Type 11 (0xB0)
    if (messageType === 11) {
      const ccNumber = data1;
      const ccVal = data2;

      // CC 4: Foot Controller (Hi-Hat pedal position)
      if (ccNumber === 4) {
        this.hiHatPedalValue = ccVal;
        this.pedalListeners.forEach((cb) => cb(ccVal));
      }
      return;
    }

    // Program Change - Message Type 12 (0xC0) - Kit Preset changed on module
    if (messageType === 12) {
      this.programListeners.forEach((cb) => cb(data1 + 1));
      return;
    }

    // Note On (Type 9) or Note Off (Type 8 / Note On with 0 velocity)
    const isNoteOn = messageType === 9 && data2 > 0;
    if (!isNoteOn) return;

    const note = data1;
    const velocity = data2;

    // Intercept if calibration wizard is waiting for hit
    if (this.captureHook) {
      this.captureHook(note, velocity);
      return;
    }

    const row = this.noteMap[note];
    let articulation = this.noteArticulations[note] || 'normal';

    // If hi-hat hit, check pedal state to refine articulation
    if (row === 'HI_HAT') {
      if (note === 44) {
        articulation = 'pedal';
      } else if (this.hiHatPedalValue > 90) {
        articulation = 'closed';
      } else if (this.hiHatPedalValue > 30) {
        articulation = 'half_open';
      } else {
        articulation = 'open';
      }
    }

    // Choke detection
    const isChoke = articulation === 'choke' || note === 85 || note === 87 || note === 89;
    if (isChoke) {
      const cymbal: 'CRASH' | 'RIDE' = (note === 89 || row === 'RIDE') ? 'RIDE' : 'CRASH';
      this.chokeListeners.forEach((cb) => cb(cymbal));
    }

    const hitEvent: MidiHitEvent = {
      row: row || 'SNARE',
      midi: note,
      velocity,
      timestamp: performance.now(),
      articulation,
      channel,
      isChoke,
    };

    // Log to monitor
    const d = new Date();
    const timeStr = `${d.toTimeString().split(' ')[0]}.${String(d.getMilliseconds()).padStart(3, '0')}`;
    const logItem: MidiLogItem = {
      id: `${Date.now()}-${Math.random()}`,
      time: timeStr,
      note,
      velocity,
      row: row || 'SNARE',
      articulation,
      channel,
      rawType: isChoke ? 'Choke' : 'NoteOn',
    };

    this.rawMidiListeners.forEach((cb) => cb(logItem));
    this.hitListeners.forEach((cb) => cb(hitEvent));
  }

  // --- Manual Pedal Emulation for Testing ---
  public setPedalValue(val: number): void {
    this.hiHatPedalValue = Math.max(0, Math.min(127, val));
    this.pedalListeners.forEach((cb) => cb(this.hiHatPedalValue));
  }

  // --- Event Subscriptions ---
  public onHit(cb: (hit: MidiHitEvent) => void): () => void {
    this.hitListeners.push(cb);
    return () => {
      this.hitListeners = this.hitListeners.filter((c) => c !== cb);
    };
  }

  public onRawMidi(cb: (log: MidiLogItem) => void): () => void {
    this.rawMidiListeners.push(cb);
    return () => {
      this.rawMidiListeners = this.rawMidiListeners.filter((c) => c !== cb);
    };
  }

  public onStateChange(cb: (state: MidiState) => void): () => void {
    this.stateListeners.push(cb);
    return () => {
      this.stateListeners = this.stateListeners.filter((c) => c !== cb);
    };
  }

  public onPedalChange(cb: (val: number) => void): () => void {
    this.pedalListeners.push(cb);
    return () => {
      this.pedalListeners = this.pedalListeners.filter((c) => c !== cb);
    };
  }

  public onChoke(cb: (cymbal: 'CRASH' | 'RIDE') => void): () => void {
    this.chokeListeners.push(cb);
    return () => {
      this.chokeListeners = this.chokeListeners.filter((c) => c !== cb);
    };
  }

  public onProgramChange(cb: (kitNum: number) => void): () => void {
    this.programListeners.push(cb);
    return () => {
      this.programListeners = this.programListeners.filter((c) => c !== cb);
    };
  }

  private notifyState(state: MidiState): void {
    this.stateListeners.forEach((cb) => cb(state));
  }
}

export const donnerMidi = new DonnerMidiService();
