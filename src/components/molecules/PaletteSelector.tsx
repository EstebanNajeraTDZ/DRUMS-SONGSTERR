import React from 'react';
import { PaletteId, PALETTES } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../atoms/Button';

export const PaletteSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { palette, mode, setPalette, toggleMode } = useTheme();

  return (
    <div className={`flex flex-col gap-4 w-full ${className}`} style={{ boxSizing: 'border-box' }}>
      {/* Light / Dark Mode Quick Switcher Header */}
      <div
        className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border)] shadow-xs"
        style={{ boxSizing: 'border-box' }}
      >
        <div className="flex flex-col">
          <span className="text-xs font-black text-[var(--color-text-main)] uppercase tracking-wider">
            MODO VISUAL
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-medium">
            {mode === 'dark' ? 'Modo Oscuro (Estudio)' : 'Modo Claro (Luminoso)'}
          </span>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={toggleMode}
          className="font-bold flex items-center gap-1.5 px-3 py-1.5 cursor-pointer shadow-xs"
          title="Alternar entre Modo Oscuro y Modo Claro"
        >
          {mode === 'dark' ? '🌙 Modo Dark' : '☀️ Modo Light'}
        </Button>
      </div>

      {/* 4 Palette Cards */}
      <div className="flex flex-col gap-2.5 w-full" style={{ boxSizing: 'border-box' }}>
        <span className="text-xs font-black text-[var(--color-text-muted)] tracking-wider uppercase px-0.5">
          PALETAS DE COLOR (4 ESTILOS):
        </span>

        <div className="flex flex-col gap-2.5 w-full" style={{ boxSizing: 'border-box' }}>
          {Object.values(PALETTES).map((pal) => {
            const isSelected = palette === pal.id;
            const [c1, c2, c3] = pal.previewColors;

            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => setPalette(pal.id as PaletteId)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer select-none relative overflow-hidden w-full ${
                  isSelected
                    ? 'border-2 border-[var(--color-brand-primary)] bg-[var(--color-bg-surface)] shadow-[0_0_16px_var(--color-glow-primary)]'
                    : 'border border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-brand-primary)]/50'
                }`}
                style={{ boxSizing: 'border-box', width: '100%' }}
              >
                {/* Header: Radio dot + Title + Active Badge */}
                <div className="flex items-center justify-between w-full mb-1.5 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]'
                          : 'border-[var(--color-border)]'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <span className="text-xs font-black text-[var(--color-text-main)] truncate">
                      {pal.name}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--color-brand-primary)] text-slate-950 uppercase shrink-0 shadow-xs">
                      Activo
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2 mb-2.5 leading-relaxed pl-5.5 font-normal">
                  {pal.description}
                </p>

                {/* Swatch Previews */}
                <div className="flex items-center gap-2 pl-5.5 mt-auto">
                  <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mr-1">
                    Tonos:
                  </span>
                  <div
                    className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: c1 }}
                    title="Color Primario"
                  />
                  <div
                    className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: c2 }}
                    title="Color Secundario"
                  />
                  <div
                    className="w-4.5 h-4.5 rounded-full border border-white/20 shadow-xs shrink-0"
                    style={{ backgroundColor: c3 }}
                    title="Fondo Base"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

