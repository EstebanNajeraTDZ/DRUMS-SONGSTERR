import React from 'react';
import { SubdivisionCount, SUBDIVISION_OPTIONS } from '../../types';

export interface SubdivisionPillsProps {
  currentSubdivision: SubdivisionCount;
  onChange: (val: SubdivisionCount) => void;
  beatsPerMeasure: number;
}

export const SubdivisionPills: React.FC<SubdivisionPillsProps> = ({
  currentSubdivision,
  onChange,
  beatsPerMeasure,
}) => {
  const totalClicks = beatsPerMeasure * currentSubdivision;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider uppercase">
          SUBDIVISIÓN:
        </span>
        <span className="text-xs font-mono font-bold text-[var(--color-brand-primary)]">
          ⚡ {beatsPerMeasure} × {currentSubdivision} = {totalClicks} clicks/bar
        </span>
      </div>

      <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
        {SUBDIVISION_OPTIONS.map((opt) => {
          const isActive = currentSubdivision === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              title={`${opt.name}: ${opt.description} (${opt.example})`}
              className={`py-1.5 px-1 rounded-md text-xs font-bold font-mono transition-all duration-150 cursor-pointer select-none text-center ${
                isActive
                  ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-md font-black scale-[1.02]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
