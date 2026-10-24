/**
 * Theme & Color Palette Types
 */

export type PaletteId = 'cyber' | 'emerald' | 'sunset' | 'indigo';
export type ThemeMode = 'dark' | 'light';

export interface PaletteDefinition {
  id: PaletteId;
  name: string;
  description: string;
  previewColors: [string, string, string]; // [primary, secondary, bg]
  dark: {
    bgBase: string;
    bgSurface: string;
    bgElevated: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    text: string;
    textMuted: string;
  };
  light: {
    bgBase: string;
    bgSurface: string;
    bgElevated: string;
    border: string;
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    text: string;
    textMuted: string;
  };
}

export const PALETTES: Record<PaletteId, PaletteDefinition> = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Donner (Neon Pulse)',
    description: 'Estética futurista de estudio cyberpunk con acentos cian y ámbar eléctrico.',
    previewColors: ['#06b6d4', '#f59e0b', '#090d16'],
    dark: {
      bgBase: '#090d16',
      bgSurface: '#0f172a',
      bgElevated: '#1e293b',
      border: '#334155',
      primary: '#06b6d4',
      secondary: '#f59e0b',
      accent: '#3b82f6',
      glow: 'rgba(6, 182, 212, 0.4)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    light: {
      bgBase: '#f1f5f9',
      bgSurface: '#ffffff',
      bgElevated: '#e2e8f0',
      border: '#cbd5e1',
      primary: '#0891b2',
      secondary: '#d97706',
      accent: '#2563eb',
      glow: 'rgba(8, 145, 178, 0.25)',
      text: '#0f172a',
      textMuted: '#64748b',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Studio Emerald (Pro Gold)',
    description: 'Hardware de grabación analógica de alta gama con tonos esmeralda y oro cálido.',
    previewColors: ['#10b981', '#eab308', '#051610'],
    dark: {
      bgBase: '#04130e',
      bgSurface: '#08231a',
      bgElevated: '#0f382a',
      border: '#1b4d3a',
      primary: '#10b981',
      secondary: '#eab308',
      accent: '#14b8a6',
      glow: 'rgba(16, 185, 129, 0.4)',
      text: '#f0fdf4',
      textMuted: '#86efac',
    },
    light: {
      bgBase: '#f0fdf4',
      bgSurface: '#ffffff',
      bgElevated: '#dcfce7',
      border: '#bbf7d0',
      primary: '#059669',
      secondary: '#ca8a04',
      accent: '#0d9488',
      glow: 'rgba(5, 150, 105, 0.25)',
      text: '#064e3b',
      textMuted: '#15803d',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Groove (Tangerine Flame)',
    description: 'Energía viva de concierto en vivo con gradientes de mandarina, coral y violeta.',
    previewColors: ['#f97316', '#ec4899', '#140c1c'],
    dark: {
      bgBase: '#120a17',
      bgSurface: '#1f1027',
      bgElevated: '#2d1838',
      border: '#452256',
      primary: '#f97316',
      secondary: '#ec4899',
      accent: '#e11d48',
      glow: 'rgba(249, 115, 22, 0.4)',
      text: '#fff1f2',
      textMuted: '#fda4af',
    },
    light: {
      bgBase: '#fff7ed',
      bgSurface: '#ffffff',
      bgElevated: '#ffedd5',
      border: '#fed7aa',
      primary: '#ea580c',
      secondary: '#db2777',
      accent: '#be123c',
      glow: 'rgba(234, 88, 12, 0.25)',
      text: '#431407',
      textMuted: '#9a3412',
    },
  },
  indigo: {
    id: 'indigo',
    name: 'Electric Indigo (Synthwave)',
    description: 'Estética retrofuturista synthwave con púrpura electrizante e índigo ultra-definido.',
    previewColors: ['#6366f1', '#a855f7', '#0a0a1a'],
    dark: {
      bgBase: '#090918',
      bgSurface: '#12122b',
      bgElevated: '#1e1e42',
      border: '#313163',
      primary: '#6366f1',
      secondary: '#a855f7',
      accent: '#8b5cf6',
      glow: 'rgba(99, 102, 241, 0.4)',
      text: '#e0e7ff',
      textMuted: '#a5b4fc',
    },
    light: {
      bgBase: '#eef2ff',
      bgSurface: '#ffffff',
      bgElevated: '#e0e7ff',
      border: '#c7d2fe',
      primary: '#4f46e5',
      secondary: '#9333ea',
      accent: '#7c3aed',
      glow: 'rgba(79, 70, 229, 0.25)',
      text: '#1e1b4b',
      textMuted: '#4338ca',
    },
  },
};
