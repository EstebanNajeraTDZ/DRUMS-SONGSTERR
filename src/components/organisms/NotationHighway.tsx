import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Button } from '../atoms/Button';
import { DrumNote, Measure } from '../../types';

export const NotationHighway: React.FC = () => {
  const {
    song,
    currentMeasureIndex,
    playheadPos,
    scrollMode,
    setScrollMode,
    showSticking,
    setShowSticking,
  } = useStudio();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Highway parameters
  const [targetX, setTargetX] = useState(250);
  const [measureWidth, setMeasureWidth] = useState(560);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const w = Math.max(320, containerRef.current.clientWidth);
      canvasRef.current.width = w;

      if (w < 480) {
        setTargetX(120);
        setMeasureWidth(440);
      } else if (w < 768) {
        setTargetX(160);
        setMeasureWidth(480);
      } else if (w < 1024) {
        setTargetX(200);
        setMeasureWidth(520);
      } else {
        setTargetX(250);
        setMeasureWidth(560);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Stave vertical geometry (5 staff lines)
    const staffTop = 45;
    const lineSpacing = 14;
    const staffBottom = staffTop + lineSpacing * 4; // 5 lines total

    // Draw Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.fillRect(0, 0, width, height);

    if (scrollMode === 'guitar_hero') {
      // --- GUITAR HERO / CONTINUOUS HIGHWAY SCROLL ---
      const globalPos = currentMeasureIndex + (playheadPos || 0);
      const startX = targetX - globalPos * measureWidth;

      // Draw background staff lines spanning visible width
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const y = staffTop + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw fixed strike zone (Hit Line)
      ctx.save();
      ctx.strokeStyle = 'var(--color-brand-primary)';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'var(--color-brand-primary)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(targetX, 15);
      ctx.lineTo(targetX, height - 15);
      ctx.stroke();

      // Hit Target Badge
      ctx.fillStyle = 'var(--color-brand-primary)';
      ctx.fillRect(targetX - 28, 6, 56, 18);
      ctx.fillStyle = '#020617';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🎯 GOLPE', targetX, 19);
      ctx.restore();

      // Render visible measures
      if (song && song.measures.length > 0) {
        song.measures.forEach((meas, mIdx) => {
          const mX = startX + mIdx * measureWidth;
          if (mX + measureWidth >= -50 && mX <= width + 50) {
            renderMeasureNotes(ctx, meas, mX, staffTop, lineSpacing, measureWidth, showSticking);
          }
        });
      }
    } else {
      // --- STATIC SINGLE-MEASURE PAGE VIEW ---
      const meas = song?.measures[currentMeasureIndex];
      const startX = 60;
      const availWidth = width - 120;

      // Draw 5 staff lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const y = staffTop + i * lineSpacing;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + availWidth, y);
        ctx.stroke();
      }

      // Percussion Clef (Two vertical thick bars)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(startX - 28, staffTop + lineSpacing, 4, lineSpacing * 2);
      ctx.fillRect(startX - 20, staffTop + lineSpacing, 4, lineSpacing * 2);

      // Measure boundaries
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, staffTop);
      ctx.lineTo(startX, staffBottom);
      ctx.moveTo(startX + availWidth, staffTop);
      ctx.lineTo(startX + availWidth, staffBottom);
      ctx.stroke();

      if (meas) {
        renderMeasureNotes(ctx, meas, startX, staffTop, lineSpacing, availWidth, showSticking);

        // Sweeping Playhead Cursor
        const cursorX = startX + playheadPos * availWidth;
        ctx.save();
        ctx.strokeStyle = 'var(--color-brand-primary)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'var(--color-brand-primary)';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(cursorX, staffTop - 10);
        ctx.lineTo(cursorX, staffBottom + 35);
        ctx.stroke();
        ctx.restore();
      }
    }
  }, [
    song,
    currentMeasureIndex,
    playheadPos,
    scrollMode,
    targetX,
    measureWidth,
    showSticking,
  ]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl glass-surface border border-[var(--color-border)] p-3 shadow-md overflow-hidden">
      {/* Header with Title & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--color-text-main)]">
            DRUM NOTATION
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--color-brand-primary)]/15 text-[var(--color-brand-primary)] border border-[var(--color-brand-primary)]/30">
            PARTITURA PROFESIONAL
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="xs"
            variant={scrollMode === 'guitar_hero' ? 'primary' : 'subtle'}
            onClick={() => setScrollMode(scrollMode === 'guitar_hero' ? 'page' : 'guitar_hero')}
            title="Alternar entre modo Guitar Hero (Scroll Continuo) y Compás Fijo"
          >
            🎮 {scrollMode === 'guitar_hero' ? 'GUITAR HERO: ON' : 'PÁGINA: FIJA'}
          </Button>

          <Button
            size="xs"
            variant={showSticking ? 'secondary' : 'subtle'}
            onClick={() => setShowSticking(!showSticking)}
            title="Mostrar u ocultar la fila de digitación (R, L, K, F)"
          >
            {showSticking ? 'STICKING: ON' : 'STICKING: OFF'}
          </Button>

          <Button
            size="xs"
            variant="subtle"
            onClick={() => setShowLegend(!showLegend)}
            title="Ver guía visual de notación oficial de Songsterr"
          >
            📋 LEYENDA NOTAS
          </Button>
        </div>
      </div>

      {/* Canvas Highway Container */}
      <div ref={containerRef} className="relative w-full h-[175px] rounded-xl overflow-hidden bg-slate-950/80 border border-[var(--color-border)] shadow-inner">
        <canvas ref={canvasRef} height={175} className="block w-full h-full" />
      </div>

      {/* Legend Guide Drawer if open */}
      {showLegend && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs mt-1 animate-fadeIn">
          <div>
            <span className="font-bold text-amber-400 block mb-1 uppercase text-[10px]">HI-HAT (Charles)</span>
            <div className="text-[11px] text-[var(--color-text-muted)] space-y-0.5">
              <div>× Cerrado (R/L)</div>
              <div>⊘ Semiabierto</div>
              <div>⊗ Abierto</div>
              <div>× De pedal (F)</div>
            </div>
          </div>
          <div>
            <span className="font-bold text-rose-400 block mb-1 uppercase text-[10px]">CAJA (Snare)</span>
            <div className="text-[11px] text-[var(--color-text-muted)] space-y-0.5">
              <div>● Golpe Normal (L/R)</div>
              <div>◇ Cross-Stick / Rim</div>
              <div>&gt; Acento fuerte</div>
            </div>
          </div>
          <div>
            <span className="font-bold text-orange-400 block mb-1 uppercase text-[10px]">BOMBO & PLATOS</span>
            <div className="text-[11px] text-[var(--color-text-muted)] space-y-0.5">
              <div>● Bombo (K) espacio 1</div>
              <div>× Crash línea sup.</div>
              <div>× Ride línea 5</div>
            </div>
          </div>
          <div>
            <span className="font-bold text-emerald-400 block mb-1 uppercase text-[10px]">TOMS (1, 2, 3)</span>
            <div className="text-[11px] text-[var(--color-text-muted)] space-y-0.5">
              <div>● Tom 1 (Agudo)</div>
              <div>● Tom 2 (Medio)</div>
              <div>● Tom 3 (Piso)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper: Renders Notes, Stems, Accents, and Sticking on Canvas
function renderMeasureNotes(
  ctx: CanvasRenderingContext2D,
  measure: Measure,
  mX: number,
  staffTop: number,
  lineSpacing: number,
  mWidth: number,
  showSticking: boolean
) {
  const measTicks = measure.measure_ticks || 1920;
  const staffBottom = staffTop + lineSpacing * 4;

  // Measure bar line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(mX + mWidth, staffTop);
  ctx.lineTo(mX + mWidth, staffBottom);
  ctx.stroke();

  // Measure number badge
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(String(measure.measure_number), mX + 6, staffTop - 12);

  // Measure marker / tuplets (e.g. "Sextuplets (6)")
  if (measure.marker) {
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(measure.marker, mX + 28, staffTop - 12);
  }

  // Row Y positions
  const rowYMap: Record<string, number> = {
    CRASH: staffTop - lineSpacing * 0.7,
    HI_HAT: staffTop - lineSpacing * 0.4,
    RIDE: staffTop + lineSpacing * 0.5,
    TOM_1: staffTop + lineSpacing * 1.0,
    TOM_2: staffTop + lineSpacing * 1.5,
    TOM_3: staffTop + lineSpacing * 2.5,
    SNARE: staffTop + lineSpacing * 2.0,
    KICK: staffTop + lineSpacing * 3.5,
  };

  const rowColors: Record<string, string> = {
    CRASH: '#94a3b8',
    HI_HAT: '#eab308',
    RIDE: '#ec4899',
    TOM_1: '#3b82f6',
    TOM_2: '#22c55e',
    TOM_3: '#a855f7',
    SNARE: '#ef4444',
    KICK: '#f97316',
  };

  measure.notes.forEach((note) => {
    const noteX = mX + (note.tick / measTicks) * mWidth;
    const noteY = rowYMap[note.row] || staffTop + lineSpacing * 2;
    const color = rowColors[note.row] || '#cbd5e1';

    ctx.save();

    // Draw Note Head
    const isXHead = note.row === 'HI_HAT' || note.row === 'CRASH' || note.row === 'RIDE';

    if (isXHead) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      const s = 5;
      ctx.beginPath();
      ctx.moveTo(noteX - s, noteY - s);
      ctx.lineTo(noteX + s, noteY + s);
      ctx.moveTo(noteX + s, noteY - s);
      ctx.lineTo(noteX - s, noteY + s);
      ctx.stroke();

      if (note.articulation === 'open') {
        ctx.beginPath();
        ctx.arc(noteX, noteY, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(noteX, noteY, 5.5, 4, -0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stem
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(noteX + 4.5, noteY);
    ctx.lineTo(noteX + 4.5, noteY - 24);
    ctx.stroke();

    // Accent `>`
    if (note.accent) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(noteX - 4, noteY - 29);
      ctx.lineTo(noteX + 4, noteY - 32);
      ctx.lineTo(noteX - 4, noteY - 35);
      ctx.stroke();
    }

    // Sticking row below staff (R, L, K, F)
    if (showSticking && note.sticking) {
      ctx.fillStyle =
        note.sticking === 'R'
          ? '#38bdf8'
          : note.sticking === 'L'
          ? '#f43f5e'
          : note.sticking === 'K'
          ? '#fb923c'
          : '#a855f7';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(note.sticking, noteX, staffBottom + 26);
    }

    ctx.restore();
  });
}
