import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { BeatOrb } from '../atoms/BeatOrb';
import { Toggle } from '../atoms/Toggle';
import { TempoControl } from '../molecules/TempoControl';
import { SubdivisionPills } from '../molecules/SubdivisionPills';

export const MetronomeCard: React.FC = () => {
  const {
    bpm,
    defaultBpm,
    setBpm,
    adjustBpm,
    resetBpm,
    handleTapTempo,
    beatsPerMeasure,
    setBeatsPerMeasure,
    clicksPerBeat,
    setClicksPerBeat,
    clickSoundEnabled,
    setClickSoundEnabled,
    isPlaying,
    togglePlay,
    currentBeat,
  } = useStudio();

  const pulseOptions = [2, 3, 4, 5, 6, 7, 8, 12];

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-2xl glass-surface border border-[var(--color-border)] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-1.5">
          ⏱️ METRONOME PROFESIONAL
        </span>

        {/* Click Sound Toggle */}
        <Toggle
          checked={clickSoundEnabled}
          onChange={setClickSoundEnabled}
          label="Sonido Click"
          size="sm"
        />
      </div>

      {/* Pulses / Compás Selector Pills */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider uppercase">
            PULSOS / COMPÁS:
          </span>
          <span className="text-xs font-mono font-bold text-[var(--color-text-main)]">
            {beatsPerMeasure} pulsos
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
          {pulseOptions.map((b) => (
            <button
              key={b}
              onClick={() => setBeatsPerMeasure(b)}
              className={`flex-1 min-w-[28px] py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                beatsPerMeasure === b
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Subdivisions Controller */}
      <SubdivisionPills
        currentSubdivision={clicksPerBeat}
        onChange={setClicksPerBeat}
        beatsPerMeasure={beatsPerMeasure}
      />

      {/* Flashing Beat Orbs (Images 2 & 3) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
        {Array.from({ length: beatsPerMeasure }).map((_, idx) => {
          const isActive = isPlaying && currentBeat === idx;
          const isAccent = idx === 0;

          return (
            <BeatOrb
              key={idx}
              beatNumber={idx + 1}
              isActive={isActive}
              isAccent={isAccent}
            />
          );
        })}
      </div>

      {/* Tempo Control (Images 2 & 3) */}
      <TempoControl
        bpm={bpm}
        defaultBpm={defaultBpm}
        onBpmChange={setBpm}
        onAdjustBpm={adjustBpm}
        onResetBpm={resetBpm}
        onTapTempo={handleTapTempo}
      />

      {/* Big Master Play / Pause Button (Images 2 & 3) */}
      <button
        onClick={togglePlay}
        className={`w-full py-3.5 px-4 rounded-xl text-base sm:text-lg font-black tracking-wider uppercase flex items-center justify-center gap-3 transition-all duration-150 cursor-pointer select-none active:scale-[0.98] shadow-lg ${
          isPlaying
            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/40 glow-active'
        }`}
        title="Iniciar o pausar práctica (Barra Espaciadora)"
      >
        <span className="text-xl sm:text-2xl">{isPlaying ? '⏸' : '▶'}</span>
        <span>{isPlaying ? 'PAUSAR PRÁCTICA' : 'INICIAR PRÁCTICA'}</span>
      </button>
    </div>
  );
};
