import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { Button } from '../atoms/Button';
import { SpeedPills } from '../molecules/SpeedPills';
import { SyncNudgeBar } from '../molecules/SyncNudgeBar';
import { Slider } from '../atoms/Slider';
import { AudioSourceOption } from '../../types';

export const AudioControllerCard: React.FC = () => {
  const {
    audioSource,
    setAudioSource,
    audioMode,
    setAudioMode,
    playbackSpeed,
    setPlaybackSpeed,
    syncOffsetMs,
    adjustSyncOffset,
    resetSyncOffset,
    captureBeat1,
    autoDemoMode,
    setAutoDemoMode,
    masterVolume,
    setMasterVolume,
    isYouTubeActive,
    toggleYouTubeVideo,
  } = useStudio();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 p-3.5 rounded-2xl glass-surface border border-[var(--color-border)] shadow-md">
      {/* Segment 1: Audio Source & Mode Pill */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)]">
        <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase flex items-center gap-1.5">
          🎵 PISTA DE AUDIO & VIDEO
        </span>

        <div className="flex items-center gap-2">
          <span className="text-sm">🎧</span>
          <select
            value={audioSource}
            onChange={(e) => setAudioSource(e.target.value as AudioSourceOption)}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-brand-primary)] cursor-pointer"
            title="Selecciona la pista de audio de Songsterr"
          >
            <option value="full">Mezcla completa (Audio Original)</option>
            <option value="backing">Pista de acompañamiento (Sin Batería)</option>
            <option value="solo">Pista Solo (Instrumento)</option>
            <option value="synth">Sintetizador Virtual (Web Drums)</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          <Button
            size="xs"
            variant="subtle"
            onClick={toggleYouTubeVideo}
            title="Mostrar u ocultar pantalla de video de YouTube sincronizado"
          >
            🎬 {isYouTubeActive ? 'Ocultar Video' : 'Ver Video'}
          </Button>

          {/* Practice Mode Pill */}
          <div
            className="inline-flex rounded-lg bg-[var(--color-bg-surface)] p-0.5 border border-[var(--color-border)]"
            title="Elige si deseas escuchar la canción original o practicar solo con tu batería"
          >
            <button
              onClick={() => setAudioMode('orig')}
              className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                audioMode === 'orig'
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              CON CANCIÓN
            </button>
            <button
              onClick={() => setAudioMode('synth')}
              className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all ${
                audioMode === 'synth'
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
            >
              SIN CANCIÓN
            </button>
          </div>
        </div>
      </div>

      {/* Segment 2: Speed & Audio/Video Sync Offset */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)]">
        <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase flex items-center gap-1.5">
          ⏱ VELOCIDAD & SINCRONIZACIÓN
        </span>

        {/* Speed Pills */}
        <SpeedPills speed={playbackSpeed} onChange={setPlaybackSpeed} />

        {/* Sync Offset Calibration Nudge */}
        <div className="mt-auto pt-1">
          <SyncNudgeBar
            offsetMs={syncOffsetMs}
            onAdjust={adjustSyncOffset}
            onReset={resetSyncOffset}
            onCaptureBeat1={captureBeat1}
          />
        </div>
      </div>

      {/* Segment 3: Auto-Demo Mode & Master Volume Boost (0% - 200%) */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)]">
        <span className="text-[11px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase flex items-center gap-1.5">
          🔊 VOLUMEN & DEMO BATERÍA
        </span>

        <div className="flex items-center gap-2">
          {/* Auto-Demo Button */}
          <Button
            size="sm"
            variant={autoDemoMode ? 'accent' : 'secondary'}
            onClick={() => setAutoDemoMode(!autoDemoMode)}
            title="Modo Auto / Demo: Las notas suenan solas automáticamente para que escuches el ritmo"
            className="flex-1 text-xs font-bold"
          >
            <span>🤖 {autoDemoMode ? 'MODO DEMO: ON' : 'MODO DEMO: OFF'}</span>
          </Button>
        </div>

        {/* Master Volume with 200% Boost */}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="text-xs select-none">🔊</span>
          <Slider
            min={0}
            max={200}
            value={masterVolume}
            onChange={setMasterVolume}
            title="Volumen maestro de batería con boost de hasta 200%"
          />
          <span className="text-xs font-mono font-bold text-[var(--color-brand-primary)] min-w-[42px] text-right">
            {masterVolume}%
          </span>
        </div>
      </div>
    </div>
  );
};
