import React from 'react';

export interface NeedleMeterProps {
  offsetMs: number; // -150ms to +150ms
  className?: string;
}

export const NeedleMeter: React.FC<NeedleMeterProps> = ({ offsetMs, className = '' }) => {
  // Clamp between -120ms and +120ms and convert to 0% - 100%
  const clamped = Math.max(-120, Math.min(120, offsetMs));
  const percent = 50 + (clamped / 120) * 50;

  let pocketColor = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
  let ratingLabel = 'PERFECT';

  if (clamped < -40) {
    pocketColor = 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
    ratingLabel = 'EARLY';
  } else if (clamped > 40) {
    pocketColor = 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    ratingLabel = 'LATE';
  }

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[var(--color-text-muted)] tracking-wider">🎯 PRECISIÓN & GROOVE:</span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${pocketColor}`}>
          {clamped >= 0 ? `+${clamped}` : clamped} ms ({ratingLabel})
        </span>
      </div>

      <div className="relative w-full h-4 bg-slate-950 rounded-full border border-[var(--color-border)] overflow-hidden shadow-inner">
        {/* Track Zones */}
        <div className="absolute inset-0 flex">
          <div className="w-[35%] h-full bg-cyan-500/15 border-r border-cyan-500/30 flex items-center justify-start pl-2">
            <span className="text-[9px] font-mono text-cyan-400 select-none">◀ EARLY</span>
          </div>
          <div className="w-[30%] h-full bg-emerald-500/25 flex items-center justify-center">
            <span className="text-[9px] font-mono font-bold text-emerald-400 select-none">POCKET</span>
          </div>
          <div className="w-[35%] h-full bg-amber-500/15 border-l border-amber-500/30 flex items-center justify-end pr-2">
            <span className="text-[9px] font-mono text-amber-400 select-none">LATE ▶</span>
          </div>
        </div>

        {/* Center Notch */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-400 shadow-[0_0_6px_#34d399]" />

        {/* Dynamic Needle */}
        <div
          className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] transition-all duration-75 -translate-x-1/2"
          style={{ left: `${percent}%` }}
        />
      </div>
    </div>
  );
};
