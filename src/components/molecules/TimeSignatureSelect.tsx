import React from 'react';
import { COMMON_TIME_SIGNATURES } from '../../types';

export interface TimeSignatureSelectProps {
  beats: number;
  onChange: (beats: number) => void;
  className?: string;
}

export const TimeSignatureSelect: React.FC<TimeSignatureSelectProps> = ({
  beats,
  onChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-bold text-[var(--color-text-muted)] tracking-wider uppercase">
        COMPÁS:
      </span>
      <select
        value={beats}
        onChange={(e) => onChange(Number(e.target.value))}
        className="px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-main)] text-xs font-semibold focus:outline-none focus:border-[var(--color-brand-primary)] cursor-pointer"
      >
        {COMMON_TIME_SIGNATURES.map((sig) => (
          <option key={`${sig.numerator}/${sig.denominator}`} value={sig.numerator}>
            {sig.label}
          </option>
        ))}
      </select>
    </div>
  );
};
