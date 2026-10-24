import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { StatusDot } from '../../atoms/StatusDot';
import { Button } from '../../atoms/Button';
import { donnerMidi } from '../../../services/midi-service';
import { MidiDeviceInput, MidiLogItem } from '../../../types';

export const MidiDiagnosticModal: React.FC = () => {
  const { isMidiModalOpen, setIsMidiModalOpen, midiState, midiLogs, clearMidiLogs, rescanMidi } = useStudio();
  const [inputs, setInputs] = useState<MidiDeviceInput[]>([]);
  const [selectedId, setSelectedId] = useState<string>('all');

  useEffect(() => {
    if (isMidiModalOpen) {
      setInputs(donnerMidi.getAvailableInputs());
    }
  }, [isMidiModalOpen]);

  if (!isMidiModalOpen) return null;

  const handleDeviceChange = (id: string) => {
    setSelectedId(id);
    donnerMidi.selectInput(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-surface border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-black tracking-wider uppercase text-[var(--color-text-main)] flex items-center gap-2">
              <span>🎹</span> Diagnóstico y Conexión MIDI USB
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Conexión directa, monitor en tiempo real y detección para tu Donner DED-300X
            </p>
          </div>
          <button
            onClick={() => setIsMidiModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <StatusDot
                status={
                  midiState.status === 'connected'
                    ? 'online'
                    : midiState.status === 'connecting'
                    ? 'connecting'
                    : 'offline'
                }
              />
              <span className="text-xs font-bold text-[var(--color-text-main)]">
                {midiState.deviceName || midiState.message}
              </span>
            </div>

            <Button size="xs" variant="primary" onClick={rescanMidi}>
              🔄 Re-escanear
            </Button>
          </div>

          {/* Port Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              ENTRADA MIDI SELECCIONADA:
            </label>
            <select
              value={selectedId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-text-main)] cursor-pointer"
            >
              <option value="all">Escuchar todas las entradas (Recomendado)</option>
              {inputs.map((inp) => (
                <option key={inp.id} value={inp.id}>
                  {inp.name} ({inp.manufacturer || 'USB MIDI'})
                </option>
              ))}
            </select>
          </div>

          {/* Live Monitor Console */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                📡 MONITOR DE GOLPES EN TIEMPO REAL:
              </span>
              <button
                onClick={clearMidiLogs}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
              >
                Limpiar
              </button>
            </div>

            <div className="h-44 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-[var(--color-border)] font-mono text-[11px] space-y-1">
              {midiLogs.length === 0 ? (
                <div className="text-center text-[var(--color-text-muted)] py-12">
                  Esperando golpes en los pads o pedales de tu Donner...
                </div>
              ) : (
                midiLogs.map((l: MidiLogItem) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white/5 border-b border-white/5"
                  >
                    <span className="text-slate-400">{l.time}</span>
                    <span className="font-bold text-[var(--color-brand-primary)]">{l.row}</span>
                    <span className="text-amber-400">Nota: {l.note}</span>
                    <span className="text-emerald-400">Vel: {l.velocity}</span>
                    <span className="text-cyan-400">{l.rawType}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Standard Donner Map Reference */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--color-border)]">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              MAPEO ESTÁNDAR DONNER DED-300X:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { name: 'Bombo (Kick)', note: 'Nota 36' },
                { name: 'Caja (Snare)', note: 'Nota 38 / 40' },
                { name: 'Hi-Hat Cerrado', note: 'Nota 42' },
                { name: 'Hi-Hat Pedal', note: 'Nota 44' },
                { name: 'Hi-Hat Abierto', note: 'Nota 46' },
                { name: 'Tom 1 (Agudo)', note: 'Nota 48' },
                { name: 'Tom 2 (Medio)', note: 'Nota 45' },
                { name: 'Tom 3 (Piso)', note: 'Nota 43 / 41' },
                { name: 'Crash', note: 'Nota 49 / 57' },
                { name: 'Ride', note: 'Nota 51 / 53' },
              ].map((m) => (
                <div
                  key={m.name}
                  className="p-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-[var(--color-text-main)]">{m.name}</span>
                  <span className="font-mono text-[10px] font-bold text-amber-400">{m.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
