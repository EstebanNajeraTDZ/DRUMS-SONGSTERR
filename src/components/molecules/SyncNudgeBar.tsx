import React from 'react';
import { Button } from '../atoms/Button';

export interface SyncNudgeBarProps {
  offsetMs: number;
  onAdjust: (delta: number) => void;
  onReset: () => void;
  onCaptureBeat1: () => void;
  className?: string;
}

export const SyncNudgeBar: React.FC<SyncNudgeBarProps> = ({
  offsetMs,
  onAdjust,
  onReset,
  onCaptureBeat1,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <div className="inline-flex items-center rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] p-0.5 shadow-sm">
        <button
          onClick={() => onAdjust(-500)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Adelantar audio 500ms (-0.5s)"
        >
          -0.5s
        </button>
        <button
          onClick={() => onAdjust(-100)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Adelantar audio 100ms (-0.1s)"
        >
          -0.1s
        </button>
        <button
          onClick={() => onAdjust(-20)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Adelantar audio 20ms"
        >
          -20ms
        </button>

        {/* Current Value Display / Reset Button */}
        <button
          onClick={onReset}
          className="px-2.5 py-1 text-xs font-mono font-bold bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30 rounded mx-0.5 cursor-pointer hover:brightness-125"
          title="Haz clic para reiniciar la sincronización a 0 ms"
        >
          {offsetMs >= 0 ? `+${offsetMs}` : offsetMs} ms
        </button>

        <button
          onClick={() => onAdjust(20)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Atrasar audio 20ms"
        >
          +20ms
        </button>
        <button
          onClick={() => onAdjust(100)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Atrasar audio 100ms (+0.1s)"
        >
          +0.1s
        </button>
        <button
          onClick={() => onAdjust(500)}
          className="px-2 py-1 text-xs font-mono font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-bg-surface)] rounded cursor-pointer"
          title="Atrasar audio 500ms (+0.5s)"
        >
          +0.5s
        </button>
      </div>

      <Button
        size="xs"
        variant="subtle"
        onClick={onCaptureBeat1}
        title="Fijar el segundo actual del video como Beat 1 para alinear intros habladas o videos con silencios"
        className="font-semibold"
      >
        🎯 Fijar Beat 1
      </Button>
    </div>
  );
};
