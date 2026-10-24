/**
 * Studio Master Context & State Coordinator
 * Connects Web Audio, Web MIDI, Metronome, Scoring, Songsterr & Visual Renderers
 */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import {
  SongData,
  Measure,
  DrumRowId,
  DrumNote,
  PresetSong,
  LessonItem,
  DrumKitId,
  AudioSourceOption,
  PlaybackAudioMode,
  SubdivisionCount,
  MidiState,
  MidiLogItem,
  ScoreStats,
  HitEvaluation,
  ChunkSizeMode,
  MidiHitEvent,
} from '../types';
import { drumAudio } from '../services/audio-engine';
import { donnerMidi } from '../services/midi-service';
import { SongService } from '../services/song-service';
import { StorageService } from '../services/storage';

interface StudioContextValue {
  // Song & Measures
  song: SongData | null;
  currentMeasureIndex: number;
  totalMeasures: number;
  currentMeasure: Measure | null;
  loopStart: number;
  loopEnd: number;
  selectedMeasures: number[];
  chunkSize: ChunkSizeMode;
  autoAdvance: boolean;
  handedness: 'right' | 'left';
  setMeasure: (idx: number) => void;
  setChunkSize: (size: ChunkSizeMode) => void;
  setAutoAdvance: (enabled: boolean) => void;
  setHandedness: (h: 'right' | 'left') => void;
  setPracticeLoop: (start: number, end: number) => void;
  toggleMeasureSelection: (idx: number) => void;
  loadSong: (idOrUrl: string) => Promise<void>;
  isLoadingSong: boolean;

  // Sequencer Interactive Note Editing
  toggleSequencerNote: (measureIdx: number, row: DrumRowId, subdivIdx: number) => void;
  clearCurrentMeasureNotes: () => void;
  loadPatternPreset: (patternKey: string) => void;

  // Playback & Timing
  isPlaying: boolean;
  playheadPos: number; // 0.0 to 1.0 within current measure
  currentBeat: number; // 0 to (beatsPerMeasure - 1)
  currentSubTick: number; // 0 to (beats * clicks - 1)
  bpm: number;
  defaultBpm: number;
  beatsPerMeasure: number;
  clicksPerBeat: SubdivisionCount;
  clickSoundEnabled: boolean;
  scrollMode: 'guitar_hero' | 'page';
  showSticking: boolean;
  togglePlay: () => void;
  setBpm: (bpm: number) => void;
  adjustBpm: (delta: number) => void;
  resetBpm: () => void;
  handleTapTempo: () => void;
  setBeatsPerMeasure: (beats: number) => void;
  setClicksPerBeat: (clicks: SubdivisionCount) => void;
  setClickSoundEnabled: (enabled: boolean) => void;
  setScrollMode: (mode: 'guitar_hero' | 'page') => void;
  setShowSticking: (show: boolean) => void;

  // Audio & Kits
  drumKit: DrumKitId;
  masterVolume: number;
  audioMode: PlaybackAudioMode;
  audioSource: AudioSourceOption;
  playbackSpeed: number;
  syncOffsetMs: number;
  autoDemoMode: boolean;
  setDrumKit: (kit: DrumKitId) => void;
  setMasterVolume: (vol: number) => void;
  setAudioMode: (mode: PlaybackAudioMode) => void;
  setAudioSource: (src: AudioSourceOption) => void;
  setPlaybackSpeed: (speed: number) => void;
  adjustSyncOffset: (deltaMs: number) => void;
  resetSyncOffset: () => void;
  setAutoDemoMode: (enabled: boolean) => void;
  triggerPadSound: (row: DrumRowId, velocity?: number) => void;

  // Sensors & MIDI
  midiState: MidiState;
  hiHatPedalPos: number;
  lastVelocity: number;
  lastHitPad: DrumRowId | null;
  midiLogs: MidiLogItem[];
  clearMidiLogs: () => void;
  setManualPedal: (val: number) => void;
  rescanMidi: () => Promise<void>;

  // Scoring & Stats
  stats: ScoreStats;
  lastHitEvaluation: HitEvaluation | null;
  timingOffsetMs: number;
  resetScore: () => void;

  // YouTube Backing Sync
  isYouTubeActive: boolean;
  toggleYouTubeVideo: () => void;
  captureBeat1: () => void;

  // Lateral Menu & Drawers
  isLateralMenuOpen: boolean;
  setIsLateralMenuOpen: (open: boolean) => void;
  activeLateralTab: string;
  setActiveLateralTab: (tab: string) => void;
  isFullScoreOpen: boolean;
  setIsFullScoreOpen: (open: boolean) => void;

  // Modals
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isAcademyModalOpen: boolean;
  setIsAcademyModalOpen: (open: boolean) => void;
  isMidiModalOpen: boolean;
  setIsMidiModalOpen: (open: boolean) => void;
  isCalibrationModalOpen: boolean;
  setIsCalibrationModalOpen: (open: boolean) => void;
  isCustomScoreModalOpen: boolean;
  setIsCustomScoreModalOpen: (open: boolean) => void;

  // Presets & Lessons
  presets: PresetSong[];
  lessons: LessonItem[];
}

const StudioContext = createContext<StudioContextValue | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Song State
  const [song, setSong] = useState<SongData | null>(null);
  const [currentMeasureIndex, setCurrentMeasureIndex] = useState<number>(0);
  const [loopStart, setLoopStart] = useState<number>(0);
  const [loopEnd, setLoopEnd] = useState<number>(0);
  const [selectedMeasures, setSelectedMeasures] = useState<number[]>([]);
  const [chunkSize, setChunkSize] = useState<ChunkSizeMode>(0);
  const [autoAdvance, setAutoAdvanceState] = useState<boolean>(() => StorageService.getAutoAdvance());
  const [handedness, setHandednessState] = useState<'right' | 'left'>(() => StorageService.getHandedness());
  const [isLoadingSong, setIsLoadingSong] = useState<boolean>(false);

  // Playback & Metronome State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playheadPos, setPlayheadPos] = useState<number>(0);
  const [currentBeat, setCurrentBeat] = useState<number>(0);
  const [currentSubTick, setCurrentSubTick] = useState<number>(0);
  const [bpm, setBpmState] = useState<number>(83);
  const [defaultBpm, setDefaultBpm] = useState<number>(83);
  const [beatsPerMeasure, setBeatsPerMeasureState] = useState<number>(4);
  const [clicksPerBeat, setClicksPerBeatState] = useState<SubdivisionCount>(1);
  const [clickSoundEnabled, setClickSoundEnabledState] = useState<boolean>(() => StorageService.getClickEnabled());
  const [scrollMode, setScrollModeState] = useState<'guitar_hero' | 'page'>(() =>
    StorageService.getGuitarHeroScroll() ? 'guitar_hero' : 'page'
  );
  const [showSticking, setShowStickingState] = useState<boolean>(() => StorageService.getStickingVisible());

  // Audio & Kits State
  const [drumKit, setDrumKitState] = useState<DrumKitId>(() => StorageService.getDrumKit());
  const [masterVolume, setMasterVolumeState] = useState<number>(() => StorageService.getVolume());
  const [audioMode, setAudioMode] = useState<PlaybackAudioMode>('orig');
  const [audioSource, setAudioSource] = useState<AudioSourceOption>('full');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [syncOffsetMs, setSyncOffsetMs] = useState<number>(0);
  const [autoDemoMode, setAutoDemoMode] = useState<boolean>(false);

  // MIDI & Sensors
  const [midiState, setMidiState] = useState<MidiState>({
    status: 'connecting',
    message: 'Buscando Donner DED-300X...',
    deviceName: null,
  });
  const [hiHatPedalPos, setHiHatPedalPos] = useState<number>(0);
  const [lastVelocity, setLastVelocity] = useState<number>(0);
  const [lastHitPad, setLastHitPad] = useState<DrumRowId | null>(null);
  const [midiLogs, setMidiLogs] = useState<MidiLogItem[]>([]);

  // Scoring
  const [stats, setStats] = useState<ScoreStats>({
    score: 0,
    totalHits: 0,
    perfectCount: 0,
    earlyCount: 0,
    lateCount: 0,
    missCount: 0,
    accuracyPct: 100,
    streak: 0,
    maxStreak: 0,
  });
  const [lastHitEvaluation, setLastHitEvaluation] = useState<HitEvaluation | null>(null);
  const [timingOffsetMs, setTimingOffsetMs] = useState<number>(0);

  // YouTube Player State
  const [isYouTubeActive, setIsYouTubeActive] = useState<boolean>(false);

  // Drawers & Modals
  const [isLateralMenuOpen, setIsLateralMenuOpen] = useState<boolean>(false);
  const [activeLateralTab, setActiveLateralTab] = useState<string>('app');
  const [isFullScoreOpen, setIsFullScoreOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isAcademyModalOpen, setIsAcademyModalOpen] = useState<boolean>(false);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isCalibrationModalOpen, setIsCalibrationModalOpen] = useState<boolean>(false);
  const [isCustomScoreModalOpen, setIsCustomScoreModalOpen] = useState<boolean>(false);

  // Presets & Lessons
  const [presets, setPresets] = useState<PresetSong[]>([]);
  const [lessons, setLessons] = useState<LessonItem[]>([]);

  // Refs for precise playback loop
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;
  const bpmRef = useRef<number>(bpm);
  bpmRef.current = bpm;
  const beatsRef = useRef<number>(beatsPerMeasure);
  beatsRef.current = beatsPerMeasure;
  const clicksRef = useRef<SubdivisionCount>(clicksPerBeat);
  clicksRef.current = clicksPerBeat;
  const currentMeasureIdxRef = useRef<number>(currentMeasureIndex);
  currentMeasureIdxRef.current = currentMeasureIndex;
  const songRef = useRef<SongData | null>(song);
  songRef.current = song;
  const autoDemoRef = useRef<boolean>(autoDemoMode);
  autoDemoRef.current = autoDemoMode;
  const clickEnabledRef = useRef<boolean>(clickSoundEnabled);
  clickEnabledRef.current = clickSoundEnabled;

  const tapHistoryRef = useRef<number[]>([]);
  const lastTickTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const tickCounterRef = useRef<number>(0);
  const consumedNotesRef = useRef<Set<string>>(new Set());

  // Current Measure
  const totalMeasures = song?.measures.length || 1;
  const currentMeasure = song?.measures[currentMeasureIndex] || null;

  // Initialize Audio, MIDI, Presets and Lessons
  useEffect(() => {
    drumAudio.init();
    drumAudio.setVolume(masterVolume);
    drumAudio.setKit(drumKit);

    donnerMidi.init().then(() => {
      // Done init
    });

    const unsubMidiState = donnerMidi.onStateChange((state) => {
      setMidiState(state);
    });

    const unsubPedal = donnerMidi.onPedalChange((val) => {
      setHiHatPedalPos(val);
    });

    const unsubRawMidi = donnerMidi.onRawMidi((log) => {
      setMidiLogs((prev) => [log, ...prev.slice(0, 49)]);
    });

    const unsubChoke = donnerMidi.onChoke((cymbal) => {
      drumAudio.chokeCymbal(cymbal);
    });

    // Load initial featured fill & presets
    SongService.getPresets().then((res) => setPresets(res));
    SongService.getLessons().then((res) => setLessons(res.all));
    loadSong('exercise-sextuplet-fill');

    return () => {
      unsubMidiState();
      unsubPedal();
      unsubRawMidi();
      unsubChoke();
    };
  }, []);

  // Sync Audio Engine Volume & Kit when changed
  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
    drumAudio.setVolume(vol);
    StorageService.setVolume(vol);
  };

  const setDrumKit = (kit: DrumKitId) => {
    setDrumKitState(kit);
    drumAudio.setKit(kit);
    StorageService.setDrumKit(kit);
  };

  const setAutoAdvance = (enabled: boolean) => {
    setAutoAdvanceState(enabled);
    StorageService.setAutoAdvance(enabled);
  };

  const setHandedness = (h: 'right' | 'left') => {
    setHandednessState(h);
    StorageService.setHandedness(h);
    if (song) {
      loadSong(String(song.song_id));
    }
  };

  const setScrollMode = (mode: 'guitar_hero' | 'page') => {
    setScrollModeState(mode);
    StorageService.setGuitarHeroScroll(mode === 'guitar_hero');
  };

  const setShowSticking = (show: boolean) => {
    setShowStickingState(show);
    StorageService.setStickingVisible(show);
  };

  const setClickSoundEnabled = (enabled: boolean) => {
    setClickSoundEnabledState(enabled);
    StorageService.setClickEnabled(enabled);
  };

  // Song Loading
  const loadSong = async (idOrUrl: string): Promise<void> => {
    setIsLoadingSong(true);
    try {
      const data = await SongService.getSong(idOrUrl, handedness);
      setSong(data);
      setCurrentMeasureIndex(0);
      setLoopStart(0);
      setLoopEnd(Math.max(0, data.measures.length - 1));
      setSelectedMeasures([]);
      setDefaultBpm(data.default_bpm || 83);
      setBpmState(data.default_bpm || 83);

      if (data.measures.length > 0 && data.measures[0].signature) {
        setBeatsPerMeasureState(data.measures[0].signature[0] || 4);
      }
      setIsPlaying(false);
      setPlayheadPos(0);
      setCurrentBeat(0);
      setCurrentSubTick(0);
      tickCounterRef.current = 0;
      consumedNotesRef.current.clear();
    } catch (err) {
      console.error('Failed to load song:', err);
    } finally {
      setIsLoadingSong(false);
    }
  };

  // Measure Navigation & Chunking
  const setMeasure = useCallback((idx: number) => {
    if (!songRef.current) return;
    const maxIdx = Math.max(0, songRef.current.measures.length - 1);
    const validIdx = Math.max(0, Math.min(maxIdx, idx));
    setCurrentMeasureIndex(validIdx);
    setPlayheadPos(0);
    setCurrentBeat(0);
    setCurrentSubTick(0);
    tickCounterRef.current = 0;
    consumedNotesRef.current.clear();
  }, []);

  const setPracticeLoop = (start: number, end: number) => {
    setLoopStart(start);
    setLoopEnd(end);
    setMeasure(start);
  };

  const toggleMeasureSelection = (idx: number) => {
    setSelectedMeasures((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b);
      return next;
    });
  };

  // Tempo Adjustment
  const setBpm = (newBpm: number) => {
    const clamped = Math.max(30, Math.min(300, Math.round(newBpm)));
    setBpmState(clamped);
  };

  const adjustBpm = (delta: number) => {
    setBpm(bpm + delta);
  };

  const resetBpm = () => {
    setBpm(defaultBpm);
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const history = tapHistoryRef.current;
    if (history.length > 0 && now - history[history.length - 1] > 2500) {
      history.length = 0; // reset stale taps
    }
    history.push(now);
    if (history.length > 5) history.shift();

    if (history.length >= 2) {
      const intervals = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(history[i] - history[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      setBpm(calculatedBpm);
    }
  };

  const setBeatsPerMeasure = (beats: number) => {
    const val = Math.max(1, Math.min(16, beats));
    setBeatsPerMeasureState(val);
    tickCounterRef.current = 0;
  };

  const setClicksPerBeat = (clicks: SubdivisionCount) => {
    setClicksPerBeatState(clicks);
    tickCounterRef.current = 0;
  };

  // Trigger Pad Sound Manually / On MIDI
  const triggerPadSound = (row: DrumRowId, velocity: number = 100) => {
    drumAudio.resume();
    drumAudio.trigger(row, velocity);
    setLastHitPad(row);
    setLastVelocity(velocity);
  };

  // Scoring Logic against Current Measure Notes
  const evaluateHit = useCallback(
    (hit: MidiHitEvent) => {
      const currentMeas = songRef.current?.measures[currentMeasureIdxRef.current];
      if (!currentMeas) return;

      const currentSec = playheadPos * ((60 / bpmRef.current) * beatsRef.current);
      const measDurationSec = (60 / bpmRef.current) * beatsRef.current;
      const measTicks = currentMeas.measure_ticks || 1920;

      // Find matching note in current measure
      let bestNote: DrumNote | null = null;
      let minDiffMs = 999999;
      let bestNoteKey = '';

      for (let i = 0; i < currentMeas.notes.length; i++) {
        const note = currentMeas.notes[i];
        if (note.row !== hit.row) continue;
        const noteKey = `${currentMeasureIdxRef.current}-${i}-${note.tick}`;
        if (consumedNotesRef.current.has(noteKey)) continue;

        const noteSec = (note.tick / measTicks) * measDurationSec;
        const diffMs = (currentSec - noteSec) * 1000;

        if (Math.abs(diffMs) < Math.abs(minDiffMs)) {
          minDiffMs = diffMs;
          bestNote = note;
          bestNoteKey = noteKey;
        }
      }

      setTimingOffsetMs(minDiffMs);

      if (bestNote && Math.abs(minDiffMs) <= 150) {
        consumedNotesRef.current.add(bestNoteKey);
        let rating: 'PERFECT' | 'EARLY' | 'LATE' = 'PERFECT';
        let pts = 100;
        let color = '#22c55e';
        let label = '¡PERFECTO!';

        if (Math.abs(minDiffMs) <= 40) {
          rating = 'PERFECT';
          pts = 100;
          color = '#22c55e';
          label = '¡PERFECTO!';
        } else if (minDiffMs < 0) {
          rating = 'EARLY';
          pts = 60;
          color = '#38bdf8';
          label = 'EARLY';
        } else {
          rating = 'LATE';
          pts = 60;
          color = '#f59e0b';
          label = 'LATE';
        }

        const evalResult: HitEvaluation = {
          rating,
          offsetMs: Math.round(minDiffMs),
          points: pts,
          label,
          color,
        };
        setLastHitEvaluation(evalResult);

        setStats((prev) => {
          const totalHits = prev.totalHits + 1;
          const perfectCount = rating === 'PERFECT' ? prev.perfectCount + 1 : prev.perfectCount;
          const earlyCount = rating === 'EARLY' ? prev.earlyCount + 1 : prev.earlyCount;
          const lateCount = rating === 'LATE' ? prev.lateCount + 1 : prev.lateCount;
          const score = prev.score + pts;
          const streak = prev.streak + 1;
          const maxStreak = Math.max(prev.maxStreak, streak);
          const accuracyPct = Math.round(((perfectCount * 1.0 + (earlyCount + lateCount) * 0.6) / totalHits) * 100);

          return {
            ...prev,
            score,
            totalHits,
            perfectCount,
            earlyCount,
            lateCount,
            accuracyPct,
            streak,
            maxStreak,
          };
        });
      }
    },
    [playheadPos]
  );

  // Hook into app engine live score & demo mode updates
  useEffect(() => {
    (window as any).onScoreUpdate = (liveStats: any) => {
      setStats((prev) => ({
        ...prev,
        ...liveStats,
      }));
    };
    (window as any).onAutoDemoChange = (enabled: boolean) => {
      setAutoDemoMode(enabled);
    };
    return () => {
      (window as any).onScoreUpdate = null;
      (window as any).onAutoDemoChange = null;
    };
  }, []);

  const handleSetAutoDemoMode = (val: boolean) => {
    setAutoDemoMode(val);
    if ((window as any).app) {
      (window as any).app.autoPlayDrums = val;
      const btn = document.getElementById('auto-demo-btn');
      const text = document.getElementById('demo-btn-text');
      if (btn) btn.classList.toggle('active', val);
      if (text) text.textContent = val ? 'MODO DEMO: ON' : 'MODO DEMO: OFF';
    }
  };

  // Master Playback Loop
  const togglePlay = () => {
    drumAudio.resume();
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      return;
    }

    let startTime = performance.now();
    let currentBarStartMs = startTime - playheadPos * ((60 / bpmRef.current) * beatsRef.current * 1000);
    lastTickTimeRef.current = performance.now();

    const loop = (timestamp: number) => {
      if (!isPlayingRef.current) return;

      const barDurationMs = (60 / bpmRef.current) * beatsRef.current * 1000;
      const elapsedInBar = timestamp - currentBarStartMs;
      let pos = elapsedInBar / barDurationMs;

      // Handle Metronome Click Scheduling
      const totalClicks = beatsRef.current * clicksRef.current;
      const subTickIntervalMs = barDurationMs / totalClicks;
      const currentTickIdx = Math.floor(elapsedInBar / subTickIntervalMs) % totalClicks;

      if (currentTickIdx !== tickCounterRef.current && currentTickIdx >= 0 && currentTickIdx < totalClicks) {
        tickCounterRef.current = currentTickIdx;
        setCurrentSubTick(currentTickIdx);
        const beatIdx = Math.floor(currentTickIdx / clicksRef.current);
        setCurrentBeat(beatIdx);

        if (clickEnabledRef.current) {
          const isAccent = currentTickIdx === 0;
          const isSubBeat = currentTickIdx % clicksRef.current !== 0;
          drumAudio.playClick(isAccent, isSubBeat);
        }
      }

      // Virtual Demo Auto-Drummer Mode
      if (autoDemoRef.current && songRef.current) {
        const curMeas = songRef.current.measures[currentMeasureIdxRef.current];
        if (curMeas) {
          const measTicks = curMeas.measure_ticks || 1920;
          const currentTickInMeas = pos * measTicks;
          for (let i = 0; i < curMeas.notes.length; i++) {
            const n = curMeas.notes[i];
            const key = `auto-${currentMeasureIdxRef.current}-${i}-${n.tick}`;
            if (!consumedNotesRef.current.has(key) && Math.abs(currentTickInMeas - n.tick) < 25) {
              consumedNotesRef.current.add(key);
              drumAudio.trigger(n.row, 105, null, n.articulation);
              setLastHitPad(n.row);
            }
          }
        }
      }

      // Bar complete -> advance or loop
      if (pos >= 1.0) {
        pos = 0.0;
        currentBarStartMs = timestamp;
        tickCounterRef.current = 0;
        consumedNotesRef.current.clear();

        if (songRef.current) {
          const totalM = songRef.current.measures.length;
          let nextM = currentMeasureIdxRef.current + 1;

          // Check chunking / loop logic
          if (chunkSize === 1) {
            nextM = currentMeasureIdxRef.current; // repeat isolated measure
          } else if (chunkSize === 2 || chunkSize === 4) {
            const startChunk = Math.floor(currentMeasureIdxRef.current / chunkSize) * chunkSize;
            const endChunk = Math.min(totalM - 1, startChunk + chunkSize - 1);
            if (nextM > endChunk) {
              nextM = autoAdvance ? (endChunk + 1 < totalM ? endChunk + 1 : startChunk) : startChunk;
            }
          } else if (loopEnd > loopStart && nextM > loopEnd) {
            nextM = loopStart;
          } else if (nextM >= totalM) {
            nextM = 0;
          }

          setCurrentMeasureIndex(nextM);
        }
      }

      setPlayheadPos(pos);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, chunkSize, autoAdvance, loopStart, loopEnd]);

  // Sequencer Interactive Note Editing
  const toggleSequencerNote = (measureIdx: number, row: DrumRowId, subdivIdx: number) => {
    if (!song) return;
    const curMeas = song.measures[measureIdx];
    if (!curMeas) return;

    const totalSubdivs = curMeas.subdivision_count || 16;
    const ticksPerSubdiv = (curMeas.measure_ticks || 1920) / totalSubdivs;
    const targetTick = Math.round(subdivIdx * ticksPerSubdiv);

    // Check if a note already exists at this tick and row
    const existingIdx = curMeas.notes.findIndex((n) => n.row === row && Math.abs(n.tick - targetTick) < ticksPerSubdiv * 0.5);

    let updatedNotes: DrumNote[];
    if (existingIdx !== -1) {
      // Remove note
      updatedNotes = curMeas.notes.filter((_, idx) => idx !== existingIdx);
    } else {
      // Add note
      const newNote: DrumNote = {
        midi: DRUM_NOTE_DEFAULTS[row] || 38,
        row,
        row_idx: 0,
        tick: targetTick,
        duration: [1, totalSubdivs],
        beat_ticks: ticksPerSubdiv,
        velocity: 'f',
        accent: subdivIdx % 4 === 0,
        ghost: false,
        sticking: row === 'KICK' ? 'K' : row === 'HI_HAT' ? 'R' : 'L',
        articulation: 'normal',
      };
      updatedNotes = [...curMeas.notes, newNote].sort((a, b) => a.tick - b.tick);
      // Play acoustic preview
      drumAudio.trigger(row, 100);
      setLastHitPad(row);
    }

    const updatedMeasures = [...song.measures];
    updatedMeasures[measureIdx] = {
      ...curMeas,
      notes: updatedNotes,
    };

    setSong({
      ...song,
      measures: updatedMeasures,
    });
  };

  const clearCurrentMeasureNotes = () => {
    if (!song || !currentMeasure) return;
    const updatedMeasures = [...song.measures];
    updatedMeasures[currentMeasureIndex] = {
      ...currentMeasure,
      notes: [],
    };
    setSong({
      ...song,
      measures: updatedMeasures,
    });
  };

  const loadPatternPreset = (patternKey: string) => {
    if (!song || !currentMeasure) return;
    const newNotes: DrumNote[] = [];
    const ticksPer16th = 120; // 1920 / 16

    if (patternKey === 'rock_basic') {
      // Hi-Hat on all 8ths: 0, 240, 480, 720, 960, 1200, 1440, 1680
      for (let t = 0; t < 1920; t += 240) {
        newNotes.push({
          midi: 42,
          row: 'HI_HAT',
          row_idx: 1,
          tick: t,
          duration: [1, 8],
          beat_ticks: 240,
          velocity: 'mf',
          accent: false,
          ghost: false,
          sticking: 'R',
          articulation: 'closed',
        });
      }
      // Kick on 1 and 3: 0 and 960
      newNotes.push({
        midi: 36,
        row: 'KICK',
        row_idx: 7,
        tick: 0,
        duration: [1, 4],
        beat_ticks: 480,
        velocity: 'f',
        accent: true,
        ghost: false,
        sticking: 'K',
      });
      newNotes.push({
        midi: 36,
        row: 'KICK',
        row_idx: 7,
        tick: 960,
        duration: [1, 4],
        beat_ticks: 480,
        velocity: 'f',
        accent: true,
        ghost: false,
        sticking: 'K',
      });
      // Snare on 2 and 4: 480 and 1440
      newNotes.push({
        midi: 38,
        row: 'SNARE',
        row_idx: 6,
        tick: 480,
        duration: [1, 4],
        beat_ticks: 480,
        velocity: 'ff',
        accent: true,
        ghost: false,
        sticking: 'L',
      });
      newNotes.push({
        midi: 38,
        row: 'SNARE',
        row_idx: 6,
        tick: 1440,
        duration: [1, 4],
        beat_ticks: 480,
        velocity: 'ff',
        accent: true,
        ghost: false,
        sticking: 'L',
      });
    }

    const updatedMeasures = [...song.measures];
    updatedMeasures[currentMeasureIndex] = {
      ...currentMeasure,
      notes: newNotes.sort((a, b) => a.tick - b.tick),
    };
    setSong({
      ...song,
      measures: updatedMeasures,
    });
  };

  // Sync Nudges
  const adjustSyncOffset = (deltaMs: number) => {
    setSyncOffsetMs((prev) => Math.max(-5000, Math.min(5000, prev + deltaMs)));
  };

  const resetSyncOffset = () => {
    setSyncOffsetMs(0);
  };

  const toggleYouTubeVideo = () => {
    setIsYouTubeActive((prev) => !prev);
  };

  const captureBeat1 = () => {
    // Synchronize beat 1 with video offset
    setSyncOffsetMs(0);
  };

  const resetScore = () => {
    setStats({
      score: 0,
      totalHits: 0,
      perfectCount: 0,
      earlyCount: 0,
      lateCount: 0,
      missCount: 0,
      accuracyPct: 100,
      streak: 0,
      maxStreak: 0,
    });
    setLastHitEvaluation(null);
  };

  const clearMidiLogs = () => {
    setMidiLogs([]);
  };

  const setManualPedal = (val: number) => {
    donnerMidi.setPedalValue(val);
  };

  const rescanMidi = async () => {
    await donnerMidi.requestAccess();
  };

  return (
    <StudioContext.Provider
      value={{
        song,
        currentMeasureIndex,
        totalMeasures,
        currentMeasure,
        loopStart,
        loopEnd,
        selectedMeasures,
        chunkSize,
        autoAdvance,
        handedness,
        setMeasure,
        setChunkSize,
        setAutoAdvance,
        setHandedness,
        setPracticeLoop,
        toggleMeasureSelection,
        loadSong,
        isLoadingSong,

        toggleSequencerNote,
        clearCurrentMeasureNotes,
        loadPatternPreset,

        isPlaying,
        playheadPos,
        currentBeat,
        currentSubTick,
        bpm,
        defaultBpm,
        beatsPerMeasure,
        clicksPerBeat,
        clickSoundEnabled,
        scrollMode,
        showSticking,
        togglePlay,
        setBpm,
        adjustBpm,
        resetBpm,
        handleTapTempo,
        setBeatsPerMeasure,
        setClicksPerBeat,
        setClickSoundEnabled,
        setScrollMode,
        setShowSticking,

        drumKit,
        masterVolume,
        audioMode,
        audioSource,
        playbackSpeed,
        syncOffsetMs,
        autoDemoMode,
        setDrumKit,
        setMasterVolume,
        setAudioMode,
        setAudioSource,
        setPlaybackSpeed,
        adjustSyncOffset,
        resetSyncOffset,
        setAutoDemoMode: handleSetAutoDemoMode,
        triggerPadSound,

        midiState,
        hiHatPedalPos,
        lastVelocity,
        lastHitPad,
        midiLogs,
        clearMidiLogs,
        setManualPedal,
        rescanMidi,

        stats,
        lastHitEvaluation,
        timingOffsetMs,
        resetScore,

        isYouTubeActive,
        toggleYouTubeVideo,
        captureBeat1,

        isLateralMenuOpen,
        setIsLateralMenuOpen,
        activeLateralTab,
        setActiveLateralTab,
        isFullScoreOpen,
        setIsFullScoreOpen,

        isSearchModalOpen,
        setIsSearchModalOpen,
        isAcademyModalOpen,
        setIsAcademyModalOpen,
        isMidiModalOpen,
        setIsMidiModalOpen,
        isCalibrationModalOpen,
        setIsCalibrationModalOpen,
        isCustomScoreModalOpen,
        setIsCustomScoreModalOpen,

        presets,
        lessons,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

const DRUM_NOTE_DEFAULTS: Record<DrumRowId, number> = {
  CRASH: 49,
  HI_HAT: 42,
  RIDE: 51,
  TOM_1: 48,
  TOM_2: 45,
  TOM_3: 43,
  SNARE: 38,
  KICK: 36,
};

export const useStudio = (): StudioContextValue => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
};
