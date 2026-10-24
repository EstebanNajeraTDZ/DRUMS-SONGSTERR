import React from 'react';
import { Button } from '../atoms/Button';
import { Slider } from '../atoms/Slider';
import { getTempoTerm } from '../../types';

export interface TempoControlProps {
  bpm: number;
  defaultBpm: number;
  onBpmChange: (bpm: number) => void;
  onAdjustBpm: (delta: number) => void;
  onResetBpm: () => void;
  onTapTempo: () => void;
}

export const TempoControl: React.FC<TempoControlProps> = ({
  bpm,
  defaultBpm,
  onBpmChange,
  onAdjustBpm,
  onResetBpm,
  onTapTempo,
}) => {
  const term = getTempoTerm(bpm);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 3-Column Grid matching Images 2 & 3: [-1, -5] | [Big BPM & Term] | [+1, +5] */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
        {/* Left Delta Column */}
        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAdjustBpm(-1)}
            title="Disminuir 1 BPM"
            className="w-11 sm:w-12 h-9 font-mono font-bold"
          >
            -1
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAdjustBpm(-5)}
            title="Disminuir 5 BPM"
            className="w-11 sm:w-12 h-9 font-mono font-bold text-amber-400"
          >
            -5
          </Button>
        </div>

        {/* Center Readout */}
        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-inner">
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-[var(--color-brand-primary)] leading-none select-none">
            {bpm}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-[var(--color-text-muted)] tracking-wider uppercase mt-1">
            {term}
          </div>
        </div>

        {/* Right Delta Column */}
        <div className="flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAdjustBpm(1)}
            title="Aumentar 1 BPM"
            className="w-11 sm:w-12 h-9 font-mono font-bold"
          >
            +1
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAdjustBpm(5)}
            title="Aumentar 5 BPM"
            className="w-11 sm:w-12 h-9 font-mono font-bold text-amber-400"
          >
            +5
          </Button>
        </div>
      </div>

      {/* Continuous Slider (30 to 300 BPM) */}
      <div className="px-1">
        <Slider min={30} max={300} value={bpm} onChange={onBpmChange} />
        <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-muted)] mt-1 px-0.5">
          <span>30</span>
          <span>120</span>
          <span>200</span>
          <span>300</span>
        </div>
      </div>

      {/* Footer Quick Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          size="sm"
          variant="subtle"
          onClick={onResetBpm}
          title={`Restablecer a tempo original: ${defaultBpm} BPM`}
          className="text-xs"
        >
          ↺ Original ({defaultBpm})
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={onTapTempo}
          title="Toca rítmicamente para calcular el tempo deseado"
          className="text-xs font-bold text-amber-400"
        >
          🥁 Tap Tempo
        </Button>
      </div>
    </div>
  );
};
