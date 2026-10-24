import React from 'react';

export interface StatPillProps {
  label: string;
  value: string | number;
  color?: 'default' | 'perfect' | 'early' | 'late' | 'miss' | 'accent';
  className?: string;
}

export const StatPill: React.FC<StatPillProps> = ({
  label,
  value,
  color = 'default',
  className = '',
}) => {
  const colorStyles = {
    default: 'text-[var(--color-text-main)]',
    perfect: 'text-emerald-400',
    early: 'text-cyan-400',
    late: 'text-amber-400',
    miss: 'text-rose-400',
    accent: 'text-[var(--color-brand-primary)]',
  }[color];

  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] min-w-[64px] ${className}`}
    >
      <span className={`text-base sm:text-lg font-mono font-bold leading-tight ${colorStyles}`}>
        {value}
      </span>
      <span className="text-[10px] font-semibold text-[var(--color-text-muted)] tracking-wider uppercase">
        {label}
      </span>
    </div>
  );
};
