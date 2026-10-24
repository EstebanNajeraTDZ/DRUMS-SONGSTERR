/**
 * Web Audio Engine for Donner DED-300X Drum Practice Studio
 * Real acoustic multi-velocity sampled percussion + analog synthesis + Metronome clicks
 */
import { DrumRowId, DrumArticulation } from '../types/drum';
import { DrumKitId, AudioEngineProgress } from '../types/audio';

type SampleKey =
  | 'kick'
  | 'snare'
  | 'snare_rim'
  | 'hihat_closed'
  | 'hihat_half'
  | 'hihat_open'
  | 'hihat_pedal'
  | 'tom1'
  | 'tom2'
  | 'tom3'
  | 'crash'
  | 'ride'
  | 'ride_bell';

interface ActiveVoice {
  source: AudioBufferSourceNode;
  gain: GainNode;
  filter?: BiquadFilterNode;
}

export class DrumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private mutedVoices: Set<DrumRowId> = new Set();
  private volume: number = 1.0;
  private currentKit: DrumKitId = 'original';
  private directDonnerMode: boolean = false;

  private buffers: Partial<Record<SampleKey, AudioBuffer>> = {};
  public samplesLoaded: boolean = false;
  private samplesLoading: boolean = false;
  private onProgressCallbacks: Array<(progress: AudioEngineProgress) => void> = [];

  // Choke tracking
  private activeHiHats: ActiveVoice[] = [];
  private activeCrashes: ActiveVoice[] = [];
  private activeRides: ActiveVoice[] = [];

  private sampleUrls: Record<SampleKey, string> = {
    kick: '/audio/samples/kick.wav',
    snare: '/audio/samples/snare.wav',
    snare_rim: '/audio/samples/snare_rim.wav',
    hihat_closed: '/audio/samples/hihat_closed.wav',
    hihat_half: '/audio/samples/hihat_half.wav',
    hihat_open: '/audio/samples/hihat_open.wav',
    hihat_pedal: '/audio/samples/hihat_pedal.wav',
    tom1: '/audio/samples/tom1.wav',
    tom2: '/audio/samples/tom2.wav',
    tom3: '/audio/samples/tom3.wav',
    crash: '/audio/samples/crash.wav',
    ride: '/audio/samples/ride.wav',
    ride_bell: '/audio/samples/ride_bell.wav',
  };

  constructor() {
    // Lazy init on first user interaction
  }

  public init(): void {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Studio dynamics compressor + soft limiter for 200% volume boost
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6.0, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(6.0, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4.0, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.06, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    this.preloadSamples();

    // Auto-resume audio context on user gesture
    const unlockHandler = async () => {
      await this.resume();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlockHandler);
        window.removeEventListener('click', unlockHandler);
        window.removeEventListener('keydown', unlockHandler);
        window.removeEventListener('touchstart', unlockHandler);
      }
    };

    window.addEventListener('pointerdown', unlockHandler, { once: false });
    window.addEventListener('click', unlockHandler, { once: false });
    window.addEventListener('keydown', unlockHandler, { once: false });
    window.addEventListener('touchstart', unlockHandler, { once: false });
  }

  public async resume(): Promise<void> {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }
  }

  public onProgress(cb: (progress: AudioEngineProgress) => void): void {
    this.onProgressCallbacks.push(cb);
  }

  private notifyProgress(loaded: number, total: number): void {
    const progress: AudioEngineProgress = {
      loaded,
      total,
      percentage: Math.round((loaded / total) * 100),
    };
    this.onProgressCallbacks.forEach((cb) => cb(progress));
  }

  public async preloadSamples(): Promise<void> {
    if (this.samplesLoading || this.samplesLoaded || !this.ctx) return;
    this.samplesLoading = true;

    const entries = Object.entries(this.sampleUrls) as Array<[SampleKey, string]>;
    let loadedCount = 0;
    const total = entries.length;

    await Promise.all(
      entries.map(async ([key, url]) => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuf = await res.arrayBuffer();
          if (this.ctx) {
            const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
            this.buffers[key] = audioBuf;
          }
        } catch (e) {
          console.warn(`Could not load acoustic sample ${key} from ${url}:`, e);
        } finally {
          loadedCount++;
          this.notifyProgress(loadedCount, total);
        }
      })
    );

    this.samplesLoaded = true;
    this.samplesLoading = false;
  }

  public setVolume(val: number): void {
    // val is 0 to 200
    this.volume = Math.max(0, Math.min(200, val)) / 100;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public setKit(kit: DrumKitId): void {
    this.currentKit = kit;
    this.directDonnerMode = kit === 'donner_direct';
  }

  public toggleMuteVoice(row: DrumRowId, isMuted: boolean): void {
    if (isMuted) {
      this.mutedVoices.add(row);
    } else {
      this.mutedVoices.delete(row);
    }
  }

  public isVoiceMuted(row: DrumRowId): boolean {
    return this.mutedVoices.has(row);
  }

  // --- Voice Trigger Methods ---

  public trigger(
    row: DrumRowId,
    velocity: number = 100,
    time: number | null = null,
    articulation: DrumArticulation = 'normal'
  ): void {
    if (this.directDonnerMode) return;
    if (this.mutedVoices.has(row)) return;

    if (!this.ctx) {
      this.init();
    }
    const t = time ?? (this.ctx ? this.ctx.currentTime : 0);
    const velNorm = Math.max(0.05, Math.min(1.0, velocity / 127));

    // Kit dispatch
    if (this.currentKit === 'electronic') {
      this.synthesizeElectronic(row, velNorm, t, articulation);
      return;
    }

    // Try sample playback
    const sampleKey = this.resolveSampleKey(row, articulation);
    const buffer = sampleKey ? this.buffers[sampleKey] : null;

    if (buffer && this.ctx && this.masterGain) {
      this.playSample(buffer, row, velNorm, t, articulation);
    } else {
      // Fallback synthesis
      this.synthesizeAcoustic(row, velNorm, t, articulation);
    }
  }

  private resolveSampleKey(row: DrumRowId, articulation: DrumArticulation): SampleKey | null {
    switch (row) {
      case 'KICK':
        return 'kick';
      case 'SNARE':
        return articulation === 'cross_stick' || articulation === 'rimshot' ? 'snare_rim' : 'snare';
      case 'HI_HAT':
        if (articulation === 'open') return 'hihat_open';
        if (articulation === 'half_open') return 'hihat_half';
        if (articulation === 'pedal') return 'hihat_pedal';
        return 'hihat_closed';
      case 'TOM_1':
        return 'tom1';
      case 'TOM_2':
        return 'tom2';
      case 'TOM_3':
        return 'tom3';
      case 'CRASH':
        return 'crash';
      case 'RIDE':
        return articulation === 'bell' ? 'ride_bell' : 'ride';
      default:
        return null;
    }
  }

  private playSample(
    buffer: AudioBuffer,
    row: DrumRowId,
    velNorm: number,
    t: number,
    articulation: DrumArticulation
  ): void {
    if (!this.ctx || !this.masterGain) return;

    // Choke Group logic:
    // If closed hi-hat or pedal hit, choke any currently ringing open hi-hats
    if (row === 'HI_HAT' && (articulation === 'closed' || articulation === 'pedal')) {
      this.chokeHiHats(t);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    // Kit pitch tweaks
    if (this.currentKit === 'rock') {
      if (row === 'KICK') source.playbackRate.setValueAtTime(0.92, t);
      if (row === 'SNARE') source.playbackRate.setValueAtTime(1.05, t);
    } else if (this.currentKit === 'jazz') {
      if (row === 'KICK') source.playbackRate.setValueAtTime(1.12, t);
      if (row === 'SNARE') source.playbackRate.setValueAtTime(0.98, t);
    }

    // Velocity to Gain curve (exponential for acoustic dynamic response)
    const gainNode = this.ctx.createGain();
    const expGain = Math.pow(velNorm, 1.4);
    gainNode.gain.setValueAtTime(expGain, t);

    // Dynamic Filter (harder hits are brighter, softer hits are warmer)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const cutoff = 1500 + Math.pow(velNorm, 2) * 16500;
    filter.frequency.setValueAtTime(cutoff, t);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    const voice: ActiveVoice = { source, gain: gainNode, filter };

    // Register active voice for choke tracking
    if (row === 'HI_HAT') {
      this.activeHiHats.push(voice);
    } else if (row === 'CRASH') {
      this.activeCrashes.push(voice);
    } else if (row === 'RIDE') {
      this.activeRides.push(voice);
    }

    source.start(t);

    source.onended = () => {
      this.removeVoice(this.activeHiHats, voice);
      this.removeVoice(this.activeCrashes, voice);
      this.removeVoice(this.activeRides, voice);
    };
  }

  public chokeHiHats(time: number | null = null): void {
    if (!this.ctx) return;
    const t = time ?? this.ctx.currentTime;
    this.activeHiHats.forEach((v) => {
      try {
        v.gain.gain.cancelScheduledValues(t);
        v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        v.source.stop(t + 0.045);
      } catch {
        // Voice already ended
      }
    });
    this.activeHiHats = [];
  }

  public chokeCymbal(cymbal: 'CRASH' | 'RIDE'): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const list = cymbal === 'CRASH' ? this.activeCrashes : this.activeRides;
    list.forEach((v) => {
      try {
        v.gain.gain.cancelScheduledValues(t);
        v.gain.gain.setValueAtTime(v.gain.gain.value, t);
        v.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        v.source.stop(t + 0.035);
      } catch {
        // Voice ended
      }
    });
    if (cymbal === 'CRASH') this.activeCrashes = [];
    else this.activeRides = [];
  }

  private removeVoice(list: ActiveVoice[], voice: ActiveVoice): void {
    const idx = list.indexOf(voice);
    if (idx !== -1) list.splice(idx, 1);
  }

  // --- Acoustic Synthesis Fallbacks ---

  private synthesizeAcoustic(
    row: DrumRowId,
    velNorm: number,
    t: number,
    _articulation: DrumArticulation
  ): void {
    if (!this.ctx || !this.masterGain) return;

    if (row === 'KICK') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.08);
      gain.gain.setValueAtTime(velNorm * 1.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.28);
    } else if (row === 'SNARE') {
      // Noise + body
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.frequency.setValueAtTime(185, t);
      oscGain.gain.setValueAtTime(velNorm * 0.7, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
      this.playWhiteNoise(t, 0.22, velNorm * 0.8, 4500);
    } else if (row === 'HI_HAT') {
      this.playWhiteNoise(t, 0.06, velNorm * 0.5, 9500);
    } else if (row.startsWith('TOM')) {
      const freqs = { TOM_1: 170, TOM_2: 130, TOM_3: 95 };
      const f = freqs[row as 'TOM_1' | 'TOM_2' | 'TOM_3'] || 120;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.3);
      gain.gain.setValueAtTime(velNorm * 0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.35);
    } else {
      // Cymbal
      this.playWhiteNoise(t, 0.9, velNorm * 0.6, 7500);
    }
  }

  private synthesizeElectronic(
    row: DrumRowId,
    velNorm: number,
    t: number,
    _articulation: DrumArticulation
  ): void {
    if (!this.ctx || !this.masterGain) return;

    if (row === 'KICK') {
      // 808 sub boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.07);
      gain.gain.setValueAtTime(velNorm * 1.3, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.46);
    } else if (row === 'SNARE') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.04);
      gain.gain.setValueAtTime(velNorm * 0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.18);
      this.playWhiteNoise(t, 0.16, velNorm * 0.7, 5000);
    } else {
      this.synthesizeAcoustic(row, velNorm, t, _articulation);
    }
  }

  private playWhiteNoise(t: number, duration: number, gainVal: number, filterFreq: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(filterFreq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);
    whiteNoise.stop(t + duration);
  }

  // --- Metronome Click Sounds ---

  public playClick(
    isAccent: boolean,
    isSubBeat: boolean = false,
    time: number | null = null
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const t = time ?? this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isAccent) {
      // Bright high click for Beat 1 (2500Hz)
      osc.frequency.setValueAtTime(2500, t);
      gain.gain.setValueAtTime(0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t);
      osc.stop(t + 0.05);
    } else if (isSubBeat) {
      // Soft woodblock tick for subdivisions (1100Hz)
      osc.frequency.setValueAtTime(1100, t);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      osc.start(t);
      osc.stop(t + 0.03);
    } else {
      // Normal pulse click (1700Hz)
      osc.frequency.setValueAtTime(1700, t);
      gain.gain.setValueAtTime(0.65, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.start(t);
      osc.stop(t + 0.04);
    }

    osc.connect(gain);
    gain.connect(this.masterGain);
  }

  public getCurrentTime(): number {
    return this.ctx ? this.ctx.currentTime : performance.now() / 1000;
  }
}

export const drumAudio = new DrumAudioEngine();
