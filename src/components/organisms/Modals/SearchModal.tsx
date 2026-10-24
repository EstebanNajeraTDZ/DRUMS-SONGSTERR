import React, { useState } from 'react';
import { useStudio } from '../../../context/StudioContext';
import { SearchBar } from '../../molecules/SearchBar';
import { SongService } from '../../../services/song-service';
import { SearchResultItem, PresetSong } from '../../../types';

export const SearchModal: React.FC = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, presets, loadSong } = useStudio();
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSearchModalOpen) return null;

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await SongService.searchSongs(query);
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar en Songsterr');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSong = async (id: string | number) => {
    setIsSearchModalOpen(false);
    await loadSong(String(id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-surface border border-[var(--color-border)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h3 className="text-base font-black tracking-wider uppercase text-[var(--color-text-main)]">
              Descargar Partituras de Songsterr
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Busca cualquier canción por nombre, artista o pega directamente el enlace oficial
            </p>
          </div>
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />

          {/* Featured Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              EJERCICIOS & CANCIONES DESTACADAS:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p: PresetSong) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectSong(p.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] text-[var(--color-text-main)] cursor-pointer transition-all duration-100 flex items-center gap-1.5"
                >
                  <span>🥁</span>
                  <span>{p.title}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">({p.bpm} BPM)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Results */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
              RESULTADOS DE SONGSTERR:
            </span>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {results.length === 0 && !isLoading && !error && (
              <p className="text-xs text-[var(--color-text-muted)] py-6 text-center">
                Escribe una canción o selecciona un ejercicio arriba para comenzar.
              </p>
            )}

            <div className="space-y-1.5">
              {results.map((r) => (
                <button
                  key={r.songId}
                  onClick={() => handleSelectSong(r.songId)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-brand-primary)] text-left cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-bold text-[var(--color-text-main)] block truncate">
                      {r.title}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)] truncate block">
                      {r.artist}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {r.hasDrums ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        🥁 Batería
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">
                        Pista General
                      </span>
                    )}
                    <span className="text-xs font-bold text-[var(--color-brand-primary)]">
                      Cargar ➔
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
