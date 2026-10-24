import React from 'react';

export interface BeatOrbProps {
  beatNumber: number;
  isActive: boolean;
  isAccent?: boolean;
  className?: string;
}

export const BeatOrb: React.FC<BeatOrbProps> = ({
  beatNumber,
  isActive,
  isAccent = false,
  className = '',
}) => {
  let orbStyle = 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]';

  if (isActive) {
    if (isAccent) {
      // Beat 1 Accent: bright radiant orange/gold glow
      orbStyle =
        'border-amber-400 bg-amber-500 text-slate-950 shadow-[0_0_24px_#f59e0b] scale-110 font-black';
    } else {
      // Pulses 2, 3, 4: bright cyan or brand primary glow
      orbStyle =
        'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)] text-slate-950 shadow-[0_0_20px_var(--color-glow-primary)] scale-105 font-bold';
    }
  }

  return (
    <div
      className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-100 select-none ${orbStyle} ${className}`}
    >
      <span className="text-base sm:text-lg font-mono">{beatNumber}</span>
      {isActive && (
        <span className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current pointer-events-none" />
      )}
    </div>
  );
};
