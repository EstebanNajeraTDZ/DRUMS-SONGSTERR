import React, { useState, useEffect } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { SongService } from '../../../services/song-service';
import { StorageService } from '../../../services/storage';
import { SongData } from '../../../types';

export interface CustomScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomScoreModal: React.FC<CustomScoreModalProps> = ({ isOpen, onClose }) => {
  const { song, loadSong } = useStudio();

  const [activeTab, setActiveTab] = useState<'create' | 'saved'>('create');

  // Creation form state
  const [title, setTitle] = useState('Mi Ritmo Personalizado');
  const [artist, setArtist] = useState('Custom / Mi Estudio');
  const [bpm, setBpm] = useState(85);
  const [beats, setBeats] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [subdivisionsPerBeat, setSubdivisionsPerBeat] = useState(4);
  const [measuresCount, setMeasuresCount] = useState(2);
  const [startingPreset, setStartingPreset] = useState<'blank' | 'rock' | 'shuffle' | 'funk' | 'ballad' | 'sextuplet'>('blank');

  // Saved scores list state
  const [savedScores, setSavedScores] = useState<any[]>([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load saved scores when opening or switching to saved tab
  const refreshSavedScores = async () => {
    // 1. LocalStorage
    const local = StorageService.getCustomScores();
    // 2. Server API
    try {
      const serverList = await SongService.getCustomSongs();
      // Merge unique by song_id
      const map = new Map<string, any>();
      local.forEach((s) => map.set(s.song_id, s));
      serverList.forEach((s) => map.set(s.song_id, { ...map.get(s.song_id), ...s }));
      setSavedScores(Array.from(map.values()));
    } catch {
      setSavedScores(local);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSavedScores();
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Preset Time Signature buttons
  const handleSelectTimeSig = (b: number, d: number) => {
    setBeats(b);
    setDenominator(d);
    if (d === 8 && subdivisionsPerBeat === 4) {
      setSubdivisionsPerBeat(2);
    }
  };

  // Build and load a new custom score
  const handleCreateScore = async () => {
    const totalTicks = 1920;
    const totalSubdivs = beats * subdivisionsPerBeat;
    const stepTicks = totalTicks / totalSubdivs;
    const songId = `custom-${Date.now()}`;

    const measures = [];
    for (let mIdx = 0; mIdx < measuresCount; mIdx++) {
      const notes: any[] = [];
      if (startingPreset === 'rock' && mIdx === 0) {
        for (let i = 0; i < totalSubdivs; i += (subdivisionsPerBeat >= 4 ? 2 : 1)) {
          notes.push({
            row: 'HI_HAT',
            tick: Math.round(i * stepTicks),
            duration: [1, totalSubdivs],
            beat_ticks: stepTicks,
            velocity: 'f',
            accent: i === 0,
            sticking: 'R',
            sub_type: 'closed',
            symbol: '×',
            head_type: 'x',
          });
        }
        notes.push({
          row: 'KICK',
          tick: 0,
          duration: [1, totalSubdivs],
          beat_ticks: stepTicks,
          velocity: 'f',
          accent: true,
          sticking: 'K',
          sub_type: 'normal',
          symbol: '●',
        });
        if (beats >= 3) {
          notes.push({
            row: 'KICK',
            tick: Math.round(2 * subdivisionsPerBeat * stepTicks),
            duration: [1, totalSubdivs],
            beat_ticks: stepTicks,
            velocity: 'f',
            accent: false,
            sticking: 'K',
            sub_type: 'normal',
            symbol: '●',
          });
        }
        if (beats >= 2) {
          notes.push({
            row: 'SNARE',
            tick: Math.round(1 * subdivisionsPerBeat * stepTicks),
            duration: [1, totalSubdivs],
            beat_ticks: stepTicks,
            velocity: 'f',
            accent: true,
            sticking: 'L',
            sub_type: 'normal',
            symbol: '●',
          });
        }
        if (beats >= 4) {
          notes.push({
            row: 'SNARE',
            tick: Math.round(3 * subdivisionsPerBeat * stepTicks),
            duration: [1, totalSubdivs],
            beat_ticks: stepTicks,
            velocity: 'f',
            accent: true,
            sticking: 'L',
            sub_type: 'normal',
            symbol: '●',
          });
        }
      } else if (startingPreset === 'sextuplet' && mIdx === 0) {
        for (let i = 0; i < Math.min(24, totalSubdivs); i++) {
          const row =
            i < 4
              ? 'TOM_2'
              : i < 8
              ? 'TOM_3'
              : i < 12
              ? 'KICK'
              : i < 16
              ? 'TOM_2'
              : i < 20
              ? 'TOM_3'
              : 'SNARE';
          notes.push({
            row,
            tick: Math.round(i * stepTicks),
            duration: [1, totalSubdivs],
            beat_ticks: stepTicks,
            velocity: 'f',
            accent: i === 23,
            sticking: row === 'KICK' ? 'K' : i % 2 === 0 ? 'R' : 'L',
            sub_type: 'normal',
            symbol: '●',
          });
        }
      }

      measures.push({
        measure_index: mIdx,
        measure_number: mIdx + 1,
        signature: [beats, denominator] as [number, number],
        bpm: bpm,
        measure_ticks: totalTicks,
        subdivision_count: totalSubdivs,
        subdivisions_per_beat: subdivisionsPerBeat,
        notes: notes,
      });
    }

    const newSong: SongData = {
      song_id: songId,
      artist: artist.trim() || 'Custom / Mi Estudio',
      title: title.trim() || 'Mi Ritmo Custom',
      default_bpm: bpm,
      total_measures: measuresCount,
      signature: [beats, denominator] as [number, number],
      is_custom: true,
      created_at: new Date().toISOString(),
      sections: [{ name: 'Compás 1', measure_index: 0, measure_number: 1 }],
      measures: measures,
    };

    // Save to storage
    StorageService.saveCustomScore(newSong);
    try {
      await SongService.saveCustomSong(newSong);
    } catch {
      // offline fallback
    }

    // Load into studio
    if (window.app && typeof window.app.loadSong === 'function') {
      await window.app.loadSong(newSong);
    } else {
      await loadSong(newSong as any);
    }

    onClose();
  };

  // Save current studio song as a custom score
  const handleSaveCurrentStudioSong = async () => {
    let currentData = null;
    if (window.app && window.app.currentSong) {
      currentData = JSON.parse(JSON.stringify(window.app.currentSong));
    } else if (song) {
      currentData = JSON.parse(JSON.stringify(song));
    }

    if (!currentData) {
      alert('No hay ninguna partitura cargada en el estudio para guardar.');
      return;
    }

    const saveTitle = prompt('Nombre para esta partitura guardada:', currentData.title || 'Mi Partitura Guardada');
    if (!saveTitle) return;

    currentData.title = saveTitle;
    if (!currentData.song_id || !String(currentData.song_id).startsWith('custom-')) {
      currentData.song_id = `custom-${Date.now()}`;
    }
    currentData.is_custom = true;
    currentData.updated_at = new Date().toISOString();

    StorageService.saveCustomScore(currentData);
    try {
      await SongService.saveCustomSong(currentData);
    } catch {
      // offline fallback
    }

    setSaveSuccessMsg(`¡"${saveTitle}" guardada con éxito!`);
    await refreshSavedScores();
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Load a saved custom score
  const handleLoadSavedScore = async (saved: any) => {
    if (window.app && typeof window.app.loadSong === 'function') {
      await window.app.loadSong(saved);
    } else {
      await loadSong(saved);
    }
    onClose();
  };

  // Delete a saved custom score
  const handleDeleteScore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar esta partitura personalizada?')) return;

    StorageService.deleteCustomScore(id);
    try {
      await SongService.deleteCustomSong(id);
    } catch {
      // ignore
    }
    await refreshSavedScores();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="custom-score-modal-dialog">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.1] bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">🎼</span>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-wide text-white uppercase">
                Creador de Partituras & Ritmos Custom
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Define tiempos, compás y subdivisiones para tu Donner DED-300X
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer border border-white/[0.08]"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/[0.1] bg-slate-950/60 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'create'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>➕ Nueva Partitura</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-b-2 flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'border-indigo-500 text-indigo-400 bg-slate-900/90'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💾 Mis Partituras Guardadas ({savedScores.length})</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {saveSuccessMsg && (
          <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between">
            <span>✅ {saveSuccessMsg}</span>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-300 hover:text-white cursor-pointer font-bold">
              ✕
            </button>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Row 1: Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Título de la Partitura / Ejercicio
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej: Fill Sincopado 16ths"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900/80 border border-white/[0.12] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Categoría / Artista
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ej: Custom / Mi Estudio"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900/80 border border-white/[0.12] text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Tempo (BPM) */}
              <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <span>⏱️</span>
                    <span>Tempo de Práctica (BPM):</span>
                    <span className="text-sky-400 font-mono text-sm font-bold bg-sky-500/15 px-2 py-0.5 rounded-lg border border-sky-500/30">
                      {bpm} BPM
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBpm((p) => Math.max(30, p - 5))}
                      className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setBpm((p) => Math.max(30, p - 1))}
                      className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      min="30"
                      max="300"
                      value={bpm}
                      onChange={(e) => setBpm(Math.max(30, Math.min(300, Number(e.target.value) || 80)))}
                      className="w-16 px-2 py-1 text-center font-mono text-xs font-bold rounded-lg bg-slate-900 border border-white/[0.15] text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setBpm((p) => Math.min(300, p + 1))}
                      className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setBpm((p) => Math.min(300, p + 5))}
                      className="px-2 py-1 text-xs font-mono font-bold rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 transition-colors cursor-pointer"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="260"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-2 accent-indigo-500 cursor-pointer bg-slate-800 rounded-lg"
                />
              </div>

              {/* Row 3: Compás & Pulsos de Tiempo */}
              <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>🎼 Compás & Pulsos de Tiempo:</span>
                  <span className="text-indigo-400 font-mono font-bold">
                    {beats}/{denominator} ({beats} pulsos por compás)
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { b: 4, d: 4, label: '4/4', sub: 'Estándar Pop/Rock' },
                    { b: 3, d: 4, label: '3/4', sub: 'Vals / Balada' },
                    { b: 6, d: 8, label: '6/8', sub: 'Balada / Shuffle' },
                    { b: 2, d: 4, label: '2/4', sub: 'Marcha / Rápido' },
                    { b: 5, d: 4, label: '5/4', sub: 'Métrica Impar' },
                    { b: 7, d: 8, label: '7/8', sub: 'Progresivo' },
                    { b: 12, d: 8, label: '12/8', sub: 'Blues Lento' },
                  ].map((sig) => (
                    <button
                      key={`${sig.b}/${sig.d}`}
                      type="button"
                      onClick={() => handleSelectTimeSig(sig.b, sig.d)}
                      className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer ${
                        beats === sig.b && denominator === sig.d
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900/70 text-slate-300 border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs">{sig.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{sig.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Subdivisiones por Pulso */}
              <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  🎛️ Subdivisiones de Tiempo por Pulso:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { val: 2, name: '♪ Corcheas (2)', desc: '2 notas por tiempo (1, &)' },
                    { val: 3, name: '3️⃣ Tresillos (3)', desc: '3 notas por tiempo (1-trip-let)' },
                    { val: 4, name: '4️⃣ Semicorcheas (4)', desc: '4 notas por tiempo (1-e-&-a)' },
                    { val: 6, name: '6️⃣ Seisillos (6)', desc: '6 notas por tiempo (Fill Imagen 1)' },
                  ].map((sub) => (
                    <button
                      key={sub.val}
                      type="button"
                      onClick={() => setSubdivisionsPerBeat(sub.val)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        subdivisionsPerBeat === sub.val
                          ? 'bg-indigo-600/20 border-indigo-400 text-indigo-300 shadow-sm'
                          : 'bg-slate-900/70 border-white/[0.08] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="font-bold text-xs">{sub.name}</div>
                      <div className="text-[10px] opacity-80 mt-1">{sub.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Número de Compases & Plantilla */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Cantidad de Compases:
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 4, 8].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setMeasuresCount(c)}
                        className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition-all cursor-pointer ${
                          measuresCount === c
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                            : 'bg-slate-900/70 text-slate-300 border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        {c} {c === 1 ? 'Compás' : 'Compases'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                    Plantilla Inicial:
                  </label>
                  <select
                    value={startingPreset}
                    onChange={(e) => setStartingPreset(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 border border-white/[0.12] text-white cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="blank">⚪ En blanco (Comenzar desde cero)</option>
                    <option value="rock">🎸 Rock Básico 4/4 (Hi-Hat, Kick & Snare)</option>
                    <option value="sextuplet">💥 Fill Séxtuplo Tom-Kick (Ejercicio Imagen 1)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold rounded-xl border border-white/[0.12] text-slate-300 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCreateScore}
                  className="px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>🚀 Crear & Empezar a Escribir Notas</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Save Current Studio Score Bar */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-white">
                    ¿Deseas guardar la partitura que estás editando ahora?
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Guarda todas las notas, articulaciones y compases actuales para volver a practicarlos después
                  </div>
                </div>
                <button
                  onClick={handleSaveCurrentStudioSong}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer whitespace-nowrap flex items-center gap-2"
                >
                  <span>💾 Guardar Actual</span>
                </button>
              </div>

              {/* Saved Scores Cards List */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Tus Partituras & Ritmos Guardados ({savedScores.length}):
                </div>

                {savedScores.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl border border-dashed border-white/[0.1] text-slate-400 text-xs">
                    No tienes partituras guardadas aún.
                    <br />
                    ¡Crea una en la pestaña "Nueva Partitura" o guarda la que estés practicando!
                  </div>
                ) : (
                  savedScores.map((item) => (
                    <div
                      key={item.song_id}
                      onClick={() => handleLoadSavedScore(item)}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-white/[0.08] hover:border-indigo-500/50 hover:bg-slate-900 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
                          {item.title || 'Sin Título'}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span>{item.artist || 'Custom'}</span>
                          <span>•</span>
                          <span className="font-mono text-amber-400 font-bold">{item.default_bpm || 80} BPM</span>
                          <span>•</span>
                          <span className="font-mono">
                            {Array.isArray(item.signature) ? `${item.signature[0]}/${item.signature[1]}` : '4/4'}
                          </span>
                          <span>•</span>
                          <span>{item.total_measures || (item.measures ? item.measures.length : 1)} compás(es)</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleLoadSavedScore(item)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm cursor-pointer"
                          title="Cargar esta partitura en el practicador"
                        >
                          ▶ Cargar
                        </button>
                        <a
                          href={`/api/export/midi/${encodeURIComponent(item.song_id)}`}
                          download
                          className="px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-white/[0.06] border border-white/[0.1] text-slate-300 hover:text-white"
                          title="Descargar archivo MIDI"
                        >
                          ⬇ MIDI
                        </a>
                        <button
                          onClick={(e) => handleDeleteScore(item.song_id, e)}
                          className="w-8 h-8 rounded-lg text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 border border-transparent hover:border-rose-500/30 flex items-center justify-center cursor-pointer"
                          title="Eliminar partitura guardada"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
