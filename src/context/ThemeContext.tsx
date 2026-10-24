/**
 * Theme Context with 4 Curated Palettes + Light & Dark Modes
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PaletteId, ThemeMode, PALETTES, PaletteDefinition } from '../types/theme';
import { StorageService } from '../services/storage';

interface ThemeContextValue {
  palette: PaletteId;
  mode: ThemeMode;
  currentPalette: PaletteDefinition;
  setPalette: (p: PaletteId) => void;
  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPaletteState] = useState<PaletteId>(() => StorageService.getPalette());
  const [mode, setModeState] = useState<ThemeMode>(() => StorageService.getThemeMode());

  const currentPalette = PALETTES[palette] || PALETTES.cyber;

  const setPalette = (p: PaletteId) => {
    setPaletteState(p);
    StorageService.setPalette(p);
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    StorageService.setThemeMode(m);
  };

  const toggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', palette);
    root.setAttribute('data-mode', mode);

    if (mode === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    } else {
      root.classList.add('theme-dark');
      root.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    }

    const themeColors = currentPalette[mode];

    // Modern Design Tokens
    root.style.setProperty('--color-bg-base', themeColors.bgBase);
    root.style.setProperty('--color-bg-surface', themeColors.bgSurface);
    root.style.setProperty('--color-bg-elevated', themeColors.bgElevated);
    root.style.setProperty('--color-border', themeColors.border);
    root.style.setProperty('--color-brand-primary', themeColors.primary);
    root.style.setProperty('--color-brand-secondary', themeColors.secondary);
    root.style.setProperty('--color-brand-accent', themeColors.accent);
    root.style.setProperty('--color-glow-primary', themeColors.glow);
    root.style.setProperty('--color-text-main', themeColors.text);
    root.style.setProperty('--color-text-muted', themeColors.textMuted);

    // Legacy CSS aliases used throughout legacy-style.css & engines
    root.style.setProperty('--bg-main', themeColors.bgBase);
    root.style.setProperty('--theme-bg-main', themeColors.bgBase);
    root.style.setProperty('--bg-surface', themeColors.bgSurface);
    root.style.setProperty('--theme-bg-surface', themeColors.bgSurface);
    root.style.setProperty('--bg-surface-elevated', themeColors.bgElevated);
    root.style.setProperty('--theme-bg-surface-elevated', themeColors.bgElevated);
    root.style.setProperty('--bg-card', themeColors.bgSurface);
    root.style.setProperty('--theme-bg-card', themeColors.bgSurface);
    root.style.setProperty('--border-subtle', themeColors.border);
    root.style.setProperty('--theme-border-subtle', themeColors.border);
    root.style.setProperty('--border-hover', themeColors.primary);
    root.style.setProperty('--theme-border-hover', themeColors.primary);
    root.style.setProperty('--text-primary', themeColors.text);
    root.style.setProperty('--theme-text-primary', themeColors.text);
    root.style.setProperty('--text-secondary', themeColors.textMuted);
    root.style.setProperty('--theme-text-secondary', themeColors.textMuted);
    root.style.setProperty('--text-muted', themeColors.textMuted);
    root.style.setProperty('--theme-text-muted', themeColors.textMuted);
    root.style.setProperty('--accent-orange', themeColors.primary);
    root.style.setProperty('--theme-accent', themeColors.primary);
    root.style.setProperty('--accent-orange-glow', themeColors.glow);
    root.style.setProperty('--theme-accent-glow', themeColors.glow);

    // Sync body styles
    document.body.style.backgroundColor = themeColors.bgBase;
    document.body.style.color = themeColors.text;

    // Trigger canvas redraw if canvas engine exists
    if ((window as any).drumNotation && typeof (window as any).drumNotation.render === 'function') {
      (window as any).drumNotation.render();
    }
  }, [palette, mode, currentPalette]);

  return (
    <ThemeContext.Provider
      value={{
        palette,
        mode,
        currentPalette,
        setPalette,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
