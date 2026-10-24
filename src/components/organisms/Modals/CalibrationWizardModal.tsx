import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { Button } from '../../atoms/Button';
import { donnerMidi } from '../../../services/midi-service';
import { CalibrationStep } from '../../../types';

export const CalibrationWizardModal: React.FC = () => {
  const { isCalibrationModalOpen, setIsCalibrationModalOpen } = useStudio();

  const steps: CalibrationStep[] = [
    {
      id: 'kick',
      padName: 'Bombo / Kick',
      targetRow: 'KICK',
      targetArticulation: 'normal',
      icon: '🥁',
      instruction: 'Pisa el pedal del Bombo con fuerza media o normal.',
      expectedNoteDefault: 36,
      status: 'pending',
    },
    {
      id: 'snare_center',
      padName: 'Caja / Snare (Centro)',
      targetRow: 'SNARE',
      targetArticulation: 'normal',
      icon: '🔴',
      instruction: 'Golpea el centro del parche de malla de la Caja.',
      expectedNoteDefault: 38,
      status: 'pending',
    },
    {
      id: 'snare_rim',
      padName: 'Caja / Snare (Aro / Rimshot)',
      targetRow: 'SNARE',
      targetArticulation: 'cross_stick',
      icon: '🔴',
      instruction: 'Golpea el aro metálico o borde de la Caja.',
      expectedNoteDefault: 40,
      status: 'pending',
    },
    {
      id: 'hihat_closed',
      padName: 'Charles (Hi-Hat) Cerrado',
      targetRow: 'HI_HAT',
      targetArticulation: 'closed',
      icon: '🟡',
      instruction: 'Pisa el pedal del Hi-Hat y golpea el plato.',
      expectedNoteDefault: 42,
      status: 'pending',
    },
    {
      id: 'hihat_open',
      padName: 'Charles (Hi-Hat) Abierto',
      targetRow: 'HI_HAT',
      targetArticulation: 'open',
      icon: '🟡',
      instruction: 'Suelta el pedal del Hi-Hat y golpea el plato.',
      expectedNoteDefault: 46,
      status: 'pending',
    },
    {
      id: 'hihat_pedal',
      padName: 'Pedal de Charles (Foot Chick)',
      targetRow: 'HI_HAT',
      targetArticulation: 'pedal',
      icon: '🦶',
      instruction: 'Pisa rápidamente el pedal del Hi-Hat con tu pie izquierdo.',
      expectedNoteDefault: 44,
      status: 'pending',
    },
    {
      id: 'tom1',
      padName: 'Tom 1 (Agudo)',
      targetRow: 'TOM_1',
      targetArticulation: 'normal',
      icon: '🔵',
      instruction: 'Golpea el Tom 1 (más pequeño a la izquierda).',
      expectedNoteDefault: 48,
      status: 'pending',
    },
    {
      id: 'tom2',
      padName: 'Tom 2 (Medio)',
      targetRow: 'TOM_2',
      targetArticulation: 'normal',
      icon: '🟢',
      instruction: 'Golpea el Tom 2 (al centro derecha).',
      expectedNoteDefault: 45,
      status: 'pending',
    },
    {
      id: 'tom3',
      padName: 'Tom 3 / Goliat (Piso)',
      targetRow: 'TOM_3',
      targetArticulation: 'normal',
      icon: '🟣',
      instruction: 'Golpea el Tom 3 de piso a tu derecha.',
      expectedNoteDefault: 43,
      status: 'pending',
    },
    {
      id: 'crash',
      padName: 'Plato Crash',
      targetRow: 'CRASH',
      targetArticulation: 'normal',
      icon: '💥',
      instruction: 'Golpea el plato Crash.',
      expectedNoteDefault: 49,
      status: 'pending',
    },
    {
      id: 'ride',
      padName: 'Plato Ride',
      targetRow: 'RIDE',
      targetArticulation: 'normal',
      icon: '✨',
      instruction: 'Golpea el plato Ride en el cuerpo o campana.',
      expectedNoteDefault: 51,
      status: 'pending',
    },
  ];

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [recordedHit, setRecordedHit] = useState<{ note: number; vel: number } | null>(null);

  const step = steps[currentStepIdx];
  const totalSteps = steps.length;
  const progressPct = Math.round(((currentStepIdx + 1) / totalSteps) * 100);

  useEffect(() => {
    if (!isCalibrationModalOpen) {
      donnerMidi.captureHook = null;
      return;
    }

    donnerMidi.captureHook = (note: number, vel: number) => {
      setRecordedHit({ note, vel });
      if (step) {
        donnerMidi.setCustomNote(note, step.targetRow);
      }
      setTimeout(() => {
        if (currentStepIdx < totalSteps - 1) {
          setCurrentStepIdx((prev) => prev + 1);
          setRecordedHit(null);
        } else {
          setIsCalibrationModalOpen(false);
        }
      }, 700);
    };

    return () => {
      donnerMidi.captureHook = null;
    };
  }, [isCalibrationModalOpen, currentStepIdx, step, totalSteps, setIsCalibrationModalOpen]);

  if (!isCalibrationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-xl flex flex-col rounded-2xl glass-surface border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-2">
              <span>🎯</span> Asistente de Calibración Donner DED-300X
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Golpea cada pad de tu batería física para calibrar notas con precisión quirúrgica
            </p>
          </div>
          <button
            onClick={() => setIsCalibrationModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 pt-4">
          <div className="flex justify-between text-xs font-mono font-bold text-[var(--color-text-muted)] mb-1">
            <span>PASO {currentStepIdx + 1} DE {totalSteps}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-[var(--color-border)]">
            <div
              className="h-full bg-[var(--color-brand-primary)] transition-all duration-300 shadow-[0_0_10px_var(--color-brand-primary)]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Current Step Card */}
        <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="text-5xl animate-bounce">{step.icon}</div>
          <div>
            <h4 className="text-xl font-black text-[var(--color-text-main)] uppercase tracking-wide">
              {step.padName}
            </h4>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-md">
              {step.instruction}
            </p>
          </div>

          {/* Feedback Box */}
          <div
            className={`w-full max-w-sm py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
              recordedHit
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 scale-105'
                : 'bg-slate-950 border-[var(--color-border)] text-amber-400'
            }`}
          >
            {recordedHit ? (
              <span>✓ ¡Capturado! Nota: {recordedHit.note} (Velocidad: {recordedHit.vel})</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Esperando golpe en la batería...
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]/40">
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              donnerMidi.resetFactoryMap();
              setIsCalibrationModalOpen(false);
            }}
          >
            ↺ Restaurar Fábrica
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (currentStepIdx < totalSteps - 1) {
                setCurrentStepIdx((prev) => prev + 1);
                setRecordedHit(null);
              } else {
                setIsCalibrationModalOpen(false);
              }
            }}
          >
            Saltar este pad ➔
          </Button>
        </div>
      </div>
    </div>
  );
};
