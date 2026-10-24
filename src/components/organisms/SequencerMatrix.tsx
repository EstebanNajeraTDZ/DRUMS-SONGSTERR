import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { DRUM_ROW_DEFINITIONS, DrumRowId } from '../../types';
import { Button } from '../atoms/Button';
import { drumAudio } from '../../services/audio-engine';

export const SequencerMatrix: React.FC = () => {
  const {
    currentMeasure,
    currentMeasureIndex,
    playheadPos,
    toggleSequencerNote,
    clearCurrentMeasureNotes,
    loadPatternPreset,
    beatsPerMeasure,
    clicksPerBeat,
    setClicksPerBeat,
  } = useStudio();

  // Track muted instrument rows
  const [mutedRows, setMutedRows] = useState<Set<DrumRowId>>(new Set());

  const toggleMute = (row: DrumRowId) => {
    setMutedRows((prev) => {
      const next = new Set(prev);
      if (next.has(row)) {
        next.delete(row);
        drumAudio.toggleMuteVoice(row, false);
      } else {
        next.add(row);
        drumAudio.toggleMuteVoice(row, true);
      }
      return next;
    });
  };

  const totalSteps = beatsPerMeasure * clicksPerBeat;
  const measTicks = currentMeasure?.measure_ticks || 1920;
  const ticksPerStep = measTicks / totalSteps;

  return (
    <div className="flex flex-col gap-2 rounded-2xl glass-surface border border-[var(--color-border)] p-3.5 shadow-md">
      {/* Header with Subdivisions, Preset Patterns & Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[var(--color-border)] pb-2.5">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-1.5">
            🎛️ MATRIZ DE COMPÁS & NOTAS
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Haz clic en cualquier casilla para pegar o quitar notas con preescucha
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Subdivisions buttons */}
          <div className="inline-flex rounded-lg bg-[var(--color-bg-elevated)] p-0.5 border border-[var(--color-border)]">
            <button
              onClick={() => setClicksPerBeat(2)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                clicksPerBeat === 2
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
              title="Corcheas (2 golpes por pulso)"
            >
              ♪ Doble (2)
            </button>
            <button
              onClick={() => setClicksPerBeat(3)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                clicksPerBeat === 3
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
              title="Tresillos (3 golpes por pulso)"
            >
              3️⃣ Triple (3)
            </button>
            <button
              onClick={() => setClicksPerBeat(4)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                clicksPerBeat === 4
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
              title="Semicorcheas (4 golpes por pulso)"
            >
              4️⃣ Cuatro (4)
            </button>
            <button
              onClick={() => setClicksPerBeat(6)}
              className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all ${
                clicksPerBeat === 6
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
              }`}
              title="Seisillos (6 golpes por pulso - Fill Imagen 1)"
            >
              6️⃣ Sextu (6)
            </button>
          </div>

          {/* Preset Pattern Selector */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                loadPatternPreset(e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-main)] cursor-pointer focus:outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="" disabled>
              Ritmos & Fills...
            </option>
            <option value="rock_basic">🎸 Rock Beat 4/4</option>
          </select>

          {/* Clear Measure Button */}
          <Button
            size="xs"
            variant="danger"
            onClick={clearCurrentMeasureNotes}
            title="Borrar todas las notas del compás actual"
          >
            🗑️ Limpiar
          </Button>
        </div>
      </div>

      {/* Sequencer Grid Table */}
      <div className="relative w-full overflow-x-auto rounded-xl border border-[var(--color-border)] bg-slate-950/70 p-2 shadow-inner">
        {/* Playhead Vertical Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--color-brand-primary)] pointer-events-none shadow-[0_0_12px_var(--color-brand-primary)] z-10 transition-all duration-75"
          style={{
            left: `calc(130px + ${playheadPos * 100}% * (1 - 130px / 100%))`,
          }}
        />

        <div className="min-w-[640px]">
          {/* Column Header: Beat Subdivisions */}
          <div className="flex items-center pb-1.5 border-b border-[var(--color-border)]/60 text-[10px] font-mono text-[var(--color-text-muted)]">
            <div className="w-[125px] shrink-0 font-bold uppercase tracking-wider pl-2">
              INSTRUMENTO
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}>
              {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                const beatNum = Math.floor(stepIdx / clicksPerBeat) + 1;
                const subIdx = stepIdx % clicksPerBeat;
                const isMainPulse = subIdx === 0;

                return (
                  <div
                    key={stepIdx}
                    className={`text-center font-bold select-none ${
                      isMainPulse
                        ? 'text-amber-400 border-l border-amber-500/40'
                        : 'text-[var(--color-text-muted)] border-l border-white/5'
                    }`}
                  >
                    {isMainPulse ? beatNum : subIdx === 1 ? 'e' : subIdx === 2 ? '+' : 'a'}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8 Instrument Rows */}
          {DRUM_ROW_DEFINITIONS.map((rowDef) => {
            const isMuted = mutedRows.has(rowDef.id);

            return (
              <div
                key={rowDef.id}
                className={`flex items-center py-1 border-b border-white/5 transition-opacity ${
                  isMuted ? 'opacity-40' : ''
                }`}
              >
                {/* Pinned Instrument Label & Mute Button */}
                <div className="w-[125px] shrink-0 flex items-center justify-between pr-2 pl-1 select-none">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: rowDef.color }}
                    />
                    <span className="text-xs font-bold font-mono tracking-wide truncate" style={{ color: rowDef.color }}>
                      {rowDef.name}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleMute(rowDef.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      isMuted
                        ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-white/40'
                    }`}
                    title={isMuted ? 'Desmutear este instrumento' : 'Mutear este instrumento para practicarlo solo'}
                  >
                    M
                  </button>
                </div>

                {/* Step Cells */}
                <div
                  className="flex-1 grid gap-1 px-1"
                  style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: totalSteps }).map((_, stepIdx) => {
                    const stepTick = Math.round(stepIdx * ticksPerStep);
                    const noteAtStep = currentMeasure?.notes.find(
                      (n) => n.row === rowDef.id && Math.abs(n.tick - stepTick) < ticksPerStep * 0.45
                    );
                    const isMainPulse = stepIdx % clicksPerBeat === 0;

                    return (
                      <button
                        key={stepIdx}
                        onClick={() => toggleSequencerNote(currentMeasureIndex, rowDef.id, stepIdx)}
                        className={`h-7 rounded transition-all duration-75 cursor-pointer relative select-none flex items-center justify-center border ${
                          noteAtStep
                            ? 'scale-95 shadow-[0_0_10px_var(--cell-color)] border-white/40'
                            : isMainPulse
                            ? 'bg-slate-900/90 border-slate-700/60 hover:border-[var(--color-brand-primary)]'
                            : 'bg-slate-950/70 border-slate-800/40 hover:border-[var(--color-brand-primary)]'
                        }`}
                        style={
                          {
                            '--cell-color': rowDef.color,
                            backgroundColor: noteAtStep ? rowDef.color : undefined,
                          } as React.CSSProperties
                        }
                        title={`Paso ${stepIdx + 1} (${rowDef.name})`}
                      >
                        {noteAtStep && (
                          <span className="text-[10px] font-mono font-black text-slate-950">
                            {noteAtStep.sticking || '●'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
