import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { DrumPadCard } from '../molecules/DrumPadCard';
import { SensorGauge } from '../molecules/SensorGauge';
import { NeedleMeter } from '../atoms/NeedleMeter';
import { StatPill } from '../atoms/StatPill';
import { Button } from '../atoms/Button';
import { DRUM_KIT_OPTIONS, DrumKitId, DrumRowId } from '../../types';

export const DonnerKitVisualizer: React.FC = () => {
  const {
    triggerPadSound,
    lastHitPad,
    hiHatPedalPos,
    lastVelocity,
    setManualPedal,
    drumKit,
    setDrumKit,
    stats,
    timingOffsetMs,
    setIsCalibrationModalOpen,
  } = useStudio();

  // Pads configuration
  const pads: Array<{ row: DrumRowId; name: string; noteNumber: string; color: string }> = [
    { row: 'CRASH', name: 'CRASH', noteNumber: '49', color: '#94a3b8' },
    { row: 'HI_HAT', name: 'HI-HAT', noteNumber: '42/46', color: '#eab308' },
    { row: 'RIDE', name: 'RIDE', noteNumber: '51', color: '#ec4899' },
    { row: 'TOM_1', name: 'TOM 1', noteNumber: '48', color: '#3b82f6' },
    { row: 'TOM_2', name: 'TOM 2', noteNumber: '45', color: '#22c55e' },
    { row: 'TOM_3', name: 'TOM 3', noteNumber: '43', color: '#a855f7' },
    { row: 'SNARE', name: 'SNARE', noteNumber: '38/40', color: '#ef4444' },
    { row: 'KICK', name: 'BOMBO / KICK', noteNumber: '36', color: '#f97316' },
  ];

  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-2xl glass-surface border border-[var(--color-border)] shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2.5">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-1.5">
            ⚡ DONNER DED-300X PADS & EVALUACIÓN
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Haz clic en los pads o tócalos en tu batería física con detección en tiempo real
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="subtle"
            onClick={() => setIsCalibrationModalOpen(true)}
            title="Iniciar asistente guiado para calibrar cada parche y aro"
          >
            🎯 Calibrar Batería
          </Button>

          {/* Kit Selector */}
          <select
            value={drumKit}
            onChange={(e) => setDrumKit(e.target.value as DrumKitId)}
            className="px-2 py-1 text-xs font-semibold rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-main)] cursor-pointer focus:outline-none focus:border-[var(--color-brand-primary)]"
            title="Seleccionar preset de sonido de la batería"
          >
            {DRUM_KIT_OPTIONS.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.icon} {kit.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visual Kit Layout */}
      <div className="flex flex-col gap-2 p-2 rounded-xl bg-slate-950/60 border border-[var(--color-border)]">
        {/* Cymbals Row */}
        <div className="flex justify-around items-center px-4">
          <DrumPadCard
            {...pads[0]} // Crash
            isHit={lastHitPad === 'CRASH'}
            onClick={() => triggerPadSound('CRASH', 105)}
          />
          <DrumPadCard
            {...pads[1]} // Hi-Hat
            isHit={lastHitPad === 'HI_HAT'}
            onClick={() => triggerPadSound('HI_HAT', 105)}
          />
          <DrumPadCard
            {...pads[2]} // Ride
            isHit={lastHitPad === 'RIDE'}
            onClick={() => triggerPadSound('RIDE', 105)}
          />
        </div>

        {/* Toms Row */}
        <div className="flex justify-center items-center gap-8">
          <DrumPadCard
            {...pads[3]} // Tom 1
            isHit={lastHitPad === 'TOM_1'}
            onClick={() => triggerPadSound('TOM_1', 105)}
            className="w-28"
          />
          <DrumPadCard
            {...pads[4]} // Tom 2
            isHit={lastHitPad === 'TOM_2'}
            onClick={() => triggerPadSound('TOM_2', 105)}
            className="w-28"
          />
        </div>

        {/* Snare, Kick & Floor Tom Row */}
        <div className="grid grid-cols-3 gap-3 items-center">
          <DrumPadCard
            {...pads[6]} // Snare
            isHit={lastHitPad === 'SNARE'}
            onClick={() => triggerPadSound('SNARE', 115)}
          />
          <DrumPadCard
            {...pads[7]} // Kick
            isHit={lastHitPad === 'KICK'}
            onClick={() => triggerPadSound('KICK', 120)}
          />
          <DrumPadCard
            {...pads[5]} // Tom 3
            isHit={lastHitPad === 'TOM_3'}
            onClick={() => triggerPadSound('TOM_3', 105)}
          />
        </div>
      </div>

      {/* Donner Real-Time Sensors Monitor (Hi-Hat Pedal CC4 & Strike Velocity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <SensorGauge
          title="🦶 PEDAL HI-HAT"
          value={hiHatPedalPos}
          label={`${Math.round((hiHatPedalPos / 127) * 100)}% (${
            hiHatPedalPos > 90 ? 'Cerrado' : hiHatPedalPos > 30 ? 'Semi' : 'Abierto'
          })`}
          color="#eab308"
          onClick={() => setManualPedal(hiHatPedalPos > 60 ? 0 : 127)}
          clickableHint="Haz clic para abrir o cerrar el pedal manualmente y probar el sensor"
        />

        <SensorGauge
          title="⚡ DINÁMICA DE GOLPE"
          value={lastVelocity}
          label={`Vel: ${lastVelocity} (${
            lastVelocity > 110 ? 'ff' : lastVelocity > 80 ? 'f' : lastVelocity > 40 ? 'mf' : 'p'
          })`}
          color="var(--color-brand-primary)"
        />
      </div>

      {/* Precision Groove Pocket Needle */}
      <NeedleMeter offsetMs={timingOffsetMs} />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
        <StatPill label="PRECISIÓN" value={`${stats.accuracyPct}%`} color="accent" />
        <StatPill label="PERFECTO" value={stats.perfectCount} color="perfect" />
        <StatPill label="EARLY" value={stats.earlyCount} color="early" />
        <StatPill label="LATE" value={stats.lateCount} color="late" />
        <StatPill label="OFF" value={stats.missCount} color="miss" />
        <StatPill label="PUNTOS" value={stats.score} color="accent" />
      </div>
    </div>
  );
};
