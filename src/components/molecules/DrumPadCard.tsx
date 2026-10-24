import React from 'react';
import { DrumRowId } from '../../types';

export interface DrumPadCardProps {
  row: DrumRowId;
  name: string;
  noteNumber: string;
  color: string;
  isHit: boolean;
  onClick: () => void;
  className?: string;
}

export const DrumPadCard: React.FC<DrumPadCardProps> = ({
  row,
  name,
  noteNumber,
  color,
  isHit,
  onClick,
  className = '',
}) => {
  const isCymbal = row === 'CRASH' || row === 'HI_HAT' || row === 'RIDE';
  const isKick = row === 'KICK';

  const shapeClasses = isCymbal
    ? 'rounded-full aspect-square max-w-[90px] sm:max-w-[100px]'
    : isKick
    ? 'rounded-2xl w-full h-[64px]'
    : 'rounded-xl h-[68px]';

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-2 border-2 transition-all duration-75 select-none cursor-pointer overflow-hidden group active:scale-95 ${shapeClasses} ${
        isHit
          ? 'scale-105 brightness-125 shadow-[0_0_25px_var(--pad-color)]'
          : 'hover:border-[var(--pad-color)]/60 bg-[var(--color-bg-elevated)]/80 hover:bg-[var(--color-bg-elevated)]'
      } ${className}`}
      style={
        {
          '--pad-color': color,
          borderColor: isHit ? color : 'var(--color-border)',
        } as React.CSSProperties
      }
    >
      {/* Dynamic Hit Ripple Flash */}
      {isHit && (
        <span
          className="absolute inset-0 opacity-40 animate-ping pointer-events-none"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Mesh Head Texture Line */}
      <div className="absolute inset-1 rounded-lg border border-white/5 pointer-events-none" />

      <span
        className="text-[11px] sm:text-xs font-black tracking-wider uppercase drop-shadow-sm"
        style={{ color: isHit ? '#ffffff' : color }}
      >
        {name}
      </span>
      <span className="text-[10px] font-mono text-[var(--color-text-muted)] mt-0.5">
        #{noteNumber}
      </span>
    </button>
  );
};
