import React from 'react';
import { useStudio } from '../../context/StudioContext';

export const FullScoreDrawer: React.FC = () => {
  const {
    isFullScoreOpen,
    setIsFullScoreOpen,
    song,
    currentMeasureIndex,
    setMeasure,
    setPracticeLoop,
  } = useStudio();

  if (!isFullScoreOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsFullScoreOpen(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
      />

      {/* Drawer */}
      <aside className="fixed top-0 bottom-0 right-0 w-full sm:w-[480px] max-w-[95vw] glass-surface border-l border-[var(--color-border)] z-50 flex flex-col shadow-2xl animate-slideLeft">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-[var(--color-text-main)]">
                PARTITURA COMPLETA
              </h2>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[280px]">
                {song ? `${song.title} - ${song.artist}` : 'Sin canción cargada'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsFullScoreOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] text-sm flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sections Pills */}
        {song && song.sections && song.sections.length > 0 && (
          <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40 overflow-x-auto flex gap-1.5">
            {song.sections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const nextSec = song.sections[idx + 1];
                  const endM = nextSec ? nextSec.measure_index - 1 : song.measures.length - 1;
                  setPracticeLoop(sec.measure_index, endM);
                  setIsFullScoreOpen(false);
                }}
                className="px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:border-[var(--color-brand-primary)] whitespace-nowrap cursor-pointer transition-colors"
                title={`Saltar a sección ${sec.name} (Compás ${sec.measure_number})`}
              >
                {sec.name}
              </button>
            ))}
          </div>
        )}

        {/* Measure Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {song?.measures.map((meas, idx) => {
            const isCurrent = idx === currentMeasureIndex;
            const noteCount = meas.notes.length;

            return (
              <button
                key={idx}
                onClick={() => {
                  setMeasure(idx);
                  setIsFullScoreOpen(false);
                }}
                className={`flex flex-col p-2.5 rounded-xl border text-left transition-all duration-100 cursor-pointer select-none ${
                  isCurrent
                    ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/15 shadow-[0_0_15px_var(--color-glow-primary)] scale-[1.02]'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-primary)]/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-mono font-black text-[var(--color-text-main)]">
                    C. {meas.measure_number}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                    {meas.signature ? `${meas.signature[0]}/${meas.signature[1]}` : '4/4'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] mt-2">
                  <span>{noteCount} notas</span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-[var(--color-brand-primary)]">
                      ▶ TOCANDO
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
