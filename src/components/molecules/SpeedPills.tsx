import React from 'react';

export interface SpeedPillsProps {
  speed: number;
  onChange: (s: number) => void;
  className?: string;
}

export const SpeedPills: React.FC<SpeedPillsProps> = ({ speed, onChange, className = '' }) => {
  const speeds = [
    { val: 0.5, label: '50%' },
    { val: 0.75, label: '75%' },
    { val: 1.0, label: '100%' },
    { val: 1.25, label: '125%' },
  ];

  return (
    <div className={`inline-flex items-center gap-1 p-0.5 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] ${className}`}>
      <span className="text-xs px-1.5 select-none" title="Velocidad de reproducción">
        🏃
      </span>
      {speeds.map((s) => {
        const isActive = Math.abs(speed - s.val) < 0.01;
        return (
          <button
            key={s.val}
            onClick={() => onChange(s.val)}
            className={`px-2 py-1 text-xs font-mono font-bold rounded cursor-pointer transition-all duration-150 select-none ${
              isActive
                ? 'bg-[var(--color-brand-primary)] text-slate-950 shadow-sm font-black'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)]'
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
};
