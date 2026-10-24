import React from 'react';
import { Slider } from '../atoms/Slider';

export interface MeasureStepperProps {
  currentMeasure: number; // 0-based
  totalMeasures: number;
  onMeasureChange: (idx: number) => void;
  className?: string;
}

export const MeasureStepper: React.FC<MeasureStepperProps> = ({
  currentMeasure,
  totalMeasures,
  onMeasureChange,
  className = '',
}) => {
  const maxIdx = Math.max(0, totalMeasures - 1);
  const displayNum = Math.min(totalMeasures, currentMeasure + 1);

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 w-full ${className}`}>
      {/* Stepper Buttons & Readout */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onMeasureChange(Math.max(0, currentMeasure - 1))}
          disabled={currentMeasure <= 0}
          className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm flex items-center justify-center text-[var(--color-text-main)] hover:border-[var(--color-brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Compás Anterior (Flecha Izquierda)"
        >
          ◀
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] min-w-[120px] justify-center select-none shadow-inner">
          <span className="text-[10px] font-bold text-[var(--color-text-muted)] tracking-wider uppercase">
            COMPÁS
          </span>
          <span className="text-base font-mono font-black text-[var(--color-brand-primary)]">
            {displayNum}
          </span>
          <span className="text-xs font-mono text-[var(--color-text-muted)]">/</span>
          <span className="text-xs font-mono text-[var(--color-text-muted)] font-semibold">
            {totalMeasures}
          </span>
        </div>

        <button
          onClick={() => onMeasureChange(Math.min(maxIdx, currentMeasure + 1))}
          disabled={currentMeasure >= maxIdx}
          className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm flex items-center justify-center text-[var(--color-text-main)] hover:border-[var(--color-brand-primary)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          title="Compás Siguiente (Flecha Derecha)"
        >
          ▶
        </button>
      </div>

      {/* Full-width Scrubber */}
      <div className="flex-1 w-full px-1">
        <Slider
          min={0}
          max={maxIdx}
          value={currentMeasure}
          onChange={onMeasureChange}
          title="Desliza para moverte a cualquier compás de la canción"
        />
      </div>
    </div>
  );
};
