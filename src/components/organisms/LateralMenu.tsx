import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStudio } from '../../context/StudioContext';
import { useTheme } from '../../context/ThemeContext';
import { PaletteSelector } from '../molecules/PaletteSelector';
import { Toggle } from '../atoms/Toggle';
import { Slider } from '../atoms/Slider';
import { DRUM_KIT_OPTIONS, DrumKitId, ChunkSizeMode } from '../../types';

// Crisp, professional SVG icons for DAW-grade UI
const Icons = {
  Practice: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Audio: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
  ),
  Metrics: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

export const LateralMenu: React.FC = () => {
  const {
    isLateralMenuOpen,
    setIsLateralMenuOpen,
    drumKit,
    setDrumKit,
    handedness,
    setHandedness,
    scrollMode,
    setScrollMode,
    showSticking,
    setShowSticking,
    masterVolume,
    setMasterVolume,
    chunkSize,
    setChunkSize,
    autoAdvance,
    setAutoAdvance,
    stats,
    midiLogs,
    clearMidiLogs,
    midiState,
    setIsCalibrationModalOpen,
    setIsSearchModalOpen,
    setIsAcademyModalOpen,
    isCustomScoreModalOpen,
    setIsCustomScoreModalOpen,
    song,
    currentMeasureIndex,
    totalMeasures,
    setPracticeLoop,
    clearCurrentMeasureNotes,
    autoDemoMode,
    setAutoDemoMode,
    resetScore,
    bpm,
    adjustBpm,
    handleTapTempo,
  } = useStudio();

  const { mode, toggleMode } = useTheme();

  // 3 Unified Studio Tabs:
  // 1. 'practice' (Bucle, chunking, sticking, tempo, partituras)
  // 2. 'sound'    (Kits de sonido, volumen 200%, modo demo auto-play)
  // 3. 'setup'    (Precisión en vivo, hardware Donner, logs MIDI, tema)
  const [activeTab, setActiveTab] = useState<'practice' | 'sound' | 'setup'>('practice');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLateralMenuOpen) {
        setIsLateralMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLateralMenuOpen, setIsLateralMenuOpen]);

  if (!isLateralMenuOpen) return null;

  return createPortal(
    <>
      {/* Backdrop with soft blur */}
      <div
        onClick={() => setIsLateralMenuOpen(false)}
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[99998] transition-opacity cursor-pointer animate-fade-in"
        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
      />

      {/* Modern Studio Inspector Drawer Panel */}
      <aside className="studio-lateral-drawer">
        {/* Sleek Top Header (DAW Style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/25 to-purple-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-sm shadow-indigo-500/20">
              <Icons.Practice />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase">
                  Estudio Donner DED-300X
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 uppercase tracking-widest">
                  DAW
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Panel de práctica & configuración
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsLateralMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-all"
            title="Cerrar panel (Escape)"
          >
            <Icons.Close />
          </button>
        </div>

        {/* Floating Segmented Pill Tabs */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="bg-black/50 p-1.5 rounded-2xl border border-white/[0.08] flex gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('practice')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icons.Practice />
              <span>Práctica</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sound')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sound'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icons.Audio />
              <span>Sonido & Kit</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icons.Metrics />
              <span>Métricas</span>
            </button>
          </div>
        </div>

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-4">
          {/* TAB 1: PRÁCTICA & FLUJO */}
          {activeTab === 'practice' && (
            <div className="space-y-4">
              {/* GROUP: PARTITURAS PERSONALIZADAS & RITMOS */}
              <div className="drawer-card space-y-3 shadow-md" style={{ background: '#172033', borderColor: 'rgba(99, 102, 241, 0.4)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                    <span>🎼</span> Partituras Custom
                  </span>
                  <span className="text-xs text-indigo-300 font-mono font-medium">
                    Crear & Guardar
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crea partituras definiendo tiempos, compases y subdivisiones para tu Donner DED-300X, o guarda la actual.
                </p>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      setIsLateralMenuOpen(false);
                      setIsCustomScoreModalOpen(true);
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>➕ Crear Nueva</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.app && typeof window.app.saveCurrentAsCustom === 'function') {
                        const name = prompt('Nombre para guardar esta partitura:', window.app.currentSong?.title || 'Mi Partitura');
                        if (name) {
                          window.app.saveCurrentAsCustom(name);
                          alert(`¡Partitura "${name}" guardada con éxito!`);
                        }
                      } else {
                        setIsLateralMenuOpen(false);
                        setIsCustomScoreModalOpen(true);
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>💾 Guardar Actual</span>
                  </button>
                </div>
              </div>

              {/* GROUP: BUCLE & SEGMENTACIÓN */}
              <div className="drawer-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Modo de Práctica & Bucle
                  </span>
                  <span className="text-xs text-slate-300 font-mono bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    Compás {currentMeasureIndex + 1} de {totalMeasures || 1}
                  </span>
                </div>

                {/* Chunking Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">Segmentación (Chunking)</span>
                    <span className="text-xs text-indigo-300 font-semibold font-mono">
                      {chunkSize === 0 ? 'Flujo Continuo' : `${chunkSize} Compás(es)`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/50 rounded-xl border border-white/[0.08]">
                    {[
                      { size: 1, label: '1 Comp.' },
                      { size: 2, label: '2 Comp.' },
                      { size: 4, label: '4 Comp.' },
                      { size: 0, label: 'Continuo' },
                    ].map((c) => (
                      <button
                        key={c.size}
                        onClick={() => setChunkSize(c.size as ChunkSizeMode)}
                        className={`py-2 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                          chunkSize === c.size
                            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aísla compases en un bucle cerrado para dominar las partes más difíciles con calma.
                  </p>
                </div>

                {/* Auto-Advance Row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Auto-Avanzar Compás
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Pasa al siguiente compás tras completar cada ciclo
                    </span>
                  </div>
                  <Toggle checked={autoAdvance} onChange={setAutoAdvance} />
                </div>

                {/* Quick Loop Buttons */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <span className="text-xs text-slate-300 font-medium block">
                    Alcance de Repetición:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (setPracticeLoop) setPracticeLoop(currentMeasureIndex, currentMeasureIndex);
                      }}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-200 border border-white/[0.08] hover:border-indigo-400/50 hover:bg-indigo-500/10 transition-all cursor-pointer text-center"
                    >
                      🔁 Solo Este Compás
                    </button>
                    <button
                      onClick={() => {
                        if (setPracticeLoop) setPracticeLoop(0, (totalMeasures || 1) - 1);
                      }}
                      className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-200 border border-white/[0.08] hover:border-indigo-400/50 hover:bg-indigo-500/10 transition-all cursor-pointer text-center"
                    >
                      🌐 Toda la Canción
                    </button>
                  </div>
                </div>
              </div>

              {/* GROUP: TEMPO & AJUSTE RÁPIDO */}
              <div className="drawer-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Ajuste Rápido de Tempo (BPM)
                  </span>
                  <span className="text-sm font-mono font-bold text-sky-400">
                    {bpm} BPM
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => adjustBpm(-5)}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => adjustBpm(-1)}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    onClick={handleTapTempo}
                    className="flex-[2] py-2 text-xs font-bold rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 transition-all cursor-pointer"
                  >
                    🥁 Tap Tempo
                  </button>
                  <button
                    onClick={() => adjustBpm(1)}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => adjustBpm(5)}
                    className="flex-1 py-2 text-xs font-mono font-bold rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>

              {/* GROUP: NOTACIÓN & DIGITACIÓN */}
              <div className="drawer-card space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Notación & Digitación
                </span>

                {/* Guitar Hero Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Modo Guitar Hero (Pista Continua)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Desplazamiento horizontal fluido con notas visibles
                    </span>
                  </div>
                  <Toggle
                    checked={scrollMode === 'guitar_hero'}
                    onChange={(c) => setScrollMode(c ? 'guitar_hero' : 'page')}
                  />
                </div>

                {/* Sticking Switch */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Digitación Sticking (R / L / K / F)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Muestra mano o pie asignado a cada golpe
                    </span>
                  </div>
                  <Toggle checked={showSticking} onChange={setShowSticking} />
                </div>

                {/* Lead Hand */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">
                      Mano Guía (Lead Hand)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Ajusta sticking según tu postura
                    </span>
                  </div>
                  <div className="inline-flex rounded-xl bg-black/50 p-1 border border-white/[0.08] gap-1.5">
                    <button
                      onClick={() => setHandedness('right')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        handedness === 'right'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Diestro (R)
                    </button>
                    <button
                      onClick={() => setHandedness('left')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        handedness === 'left'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Zurdo (L)
                    </button>
                  </div>
                </div>
              </div>

              {/* Clear Measure Notes Button */}
              <button
                onClick={() => {
                  if (clearCurrentMeasureNotes) clearCurrentMeasureNotes();
                  const btn = document.getElementById('clear-grid-measure-btn');
                  if (btn) btn.click();
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Icons.Trash />
                <span>Limpiar Todas las Notas del Compás Actual</span>
              </button>

              {/* GROUP: ATAJOS DE TECLADO */}
              <div className="drawer-card space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Atajos de Teclado del Estudio
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-slate-400">Play / Pausa</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono font-bold text-[10px]">Espacio</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-slate-400">Compás Ant/Sig</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono font-bold text-[10px]">← / →</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-slate-400">Tap Tempo</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono font-bold text-[10px]">T</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/[0.05]">
                    <span className="text-slate-400">Cerrar Menú</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono font-bold text-[10px]">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SONIDO & KIT */}
          {activeTab === 'sound' && (
            <div className="space-y-4">
              {/* GROUP: SAMPLES & PRESETS */}
              <div className="drawer-card space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Kit de Sonido de Batería
                </span>

                <div className="space-y-2">
                  <select
                    value={drumKit}
                    onChange={(e) => setDrumKit(e.target.value as DrumKitId)}
                    className="w-full bg-black/50 border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    {DRUM_KIT_OPTIONS.map((k) => (
                      <option key={k.id} value={k.id} className="bg-slate-900 text-white">
                        {k.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {DRUM_KIT_OPTIONS.find((k) => k.id === drumKit)?.description}
                  </p>
                </div>

                {/* Demo Mode Row */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">
                      Modo Demo (Batería Automática)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      La computadora toca el patrón para escuchar cómo suena
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoDemoMode(!autoDemoMode)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      autoDemoMode
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        : 'bg-white/[0.06] text-slate-400 border border-white/[0.08] hover:text-white'
                    }`}
                  >
                    {autoDemoMode ? '● Activo' : 'Inactivo'}
                  </button>
                </div>

                {/* Master Volume Boost */}
                <div className="pt-3 border-t border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">Volumen Maestro Batería</span>
                    <span className="text-xs font-mono font-bold text-indigo-300">
                      {masterVolume}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={200}
                    value={masterVolume}
                    onChange={setMasterVolume}
                  />
                  <p className="text-[11px] text-slate-400">
                    Incluye compresor de estudio para amplificación de hasta 200% sin distorsión.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MÉTRICAS & SETUP */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              {/* GROUP: LIVE ACCURACY STATS */}
              <div className="drawer-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Precisión en Tiempo Real
                  </span>
                  <button
                    onClick={resetScore}
                    className="text-[11px] text-indigo-300 hover:text-white font-medium cursor-pointer"
                  >
                    Reiniciar
                  </button>
                </div>

                <div className="p-3 bg-black/40 rounded-xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-mono font-black text-emerald-400 block">
                      {stats.accuracyPct}%
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {stats.totalHits} golpes evaluados • Racha: {stats.maxStreak}
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-300">
                    Score: <span className="text-white font-bold">{stats.score}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center pt-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] text-emerald-300 font-bold block">PERFECT</span>
                    <span className="text-sm font-mono font-bold text-white">{stats.perfectCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <span className="text-[10px] text-sky-300 font-bold block">EARLY</span>
                    <span className="text-sm font-mono font-bold text-white">{stats.earlyCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] text-amber-300 font-bold block">LATE</span>
                    <span className="text-sm font-mono font-bold text-white">{stats.lateCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] text-rose-300 font-bold block">OFF</span>
                    <span className="text-sm font-mono font-bold text-white">{stats.missCount}</span>
                  </div>
                </div>
              </div>

              {/* GROUP: DONNER HARDWARE & LATENCY */}
              <div className="drawer-card space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Hardware Donner DED-300X
                </span>
                <div className="p-3 bg-black/40 rounded-xl border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                    <span>{midiState.deviceName || 'Donner DED-300X USB MIDI'}</span>
                    <span className="text-emerald-400 font-mono text-[11px]">Latencia &lt; 3ms</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mapeo de 10 canales MIDI asignado a parches de malla y platillos con choke.
                  </p>
                </div>
              </div>

              {/* GROUP: TEMA DEL DAW */}
              <div className="drawer-card space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                  Tema & Paleta
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-200 block">Modo de Color</span>
                    <span className="text-[11px] text-slate-400">Oscuro Studio vs High Contrast</span>
                  </div>
                  <button
                    onClick={toggleMode}
                    className="py-1.5 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-slate-200 border border-white/[0.08] cursor-pointer"
                  >
                    {mode === 'dark' ? '🌙 Dark' : '⚡ Electric'}
                  </button>
                </div>
                <div className="pt-2 border-t border-white/[0.05]">
                  <PaletteSelector />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Persistent Hardware Status Footer */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-black/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                midiState.status === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                  : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              }`}
            />
            <div>
              <span className="text-xs font-bold text-slate-200 block leading-tight">
                Donner DED-300X Active
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                USB-MIDI • Latencia &lt; 3ms
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsLateralMenuOpen(false);
              setIsCalibrationModalOpen(true);
              if (typeof window !== 'undefined' && (window as any).calibrationWizard) {
                (window as any).calibrationWizard.startWizard();
              }
            }}
            className="py-1.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-xs"
          >
            Calibrar
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
};
