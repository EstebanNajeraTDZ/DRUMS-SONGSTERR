import React from 'react';

export interface SensorGaugeProps {
  title: string;
  value: number; // 0 - 127
  label: string;
  color?: string;
  onClick?: () => void;
  clickableHint?: string;
}

export const SensorGauge: React.FC<SensorGaugeProps> = ({
  title,
  value,
  label,
  color = 'var(--color-brand-primary)',
  onClick,
  clickableHint,
}) => {
  const percentage = Math.max(0, Math.min(100, Math.round((value / 127) * 100)));

  return (
    <div
      onClick={onClick}
      title={clickableHint}
      className={`flex flex-col gap-1.5 p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] w-full ${
        onClick ? 'cursor-pointer hover:border-[var(--color-brand-primary)]' : ''
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--color-text-muted)] tracking-wider uppercase text-[11px]">
          {title}
        </span>
        <span className="font-mono text-xs font-bold text-[var(--color-text-main)]">{label}</span>
      </div>

      <div className="relative w-full h-2.5 bg-slate-950 rounded-full border border-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  );
};
