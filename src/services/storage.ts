/**
 * Persistent Storage Service using LocalStorage
 */
import { PaletteId, ThemeMode } from '../types/theme';
import { DrumKitId } from '../types/audio';

const STORAGE_KEYS = {
  THEME_PALETTE: 'ded300x_theme_palette',
  THEME_MODE: 'ded300x_theme_mode',
  DRUM_KIT: 'ded300x_drum_kit',
  HANDEDNESS: 'ded300x_handedness',
  AUTO_ADVANCE: 'ded300x_auto_advance',
  GUITAR_HERO_SCROLL: 'ded300x_guitar_hero_scroll',
  STICKING_VISIBLE: 'ded300x_sticking_visible',
  CLICK_ENABLED: 'ded300x_click_enabled',
  VOLUME: 'ded300x_master_volume',
  CUSTOM_MIDI_MAP: 'ded300x_custom_midi_map',
  CALIBRATION_PROFILE: 'ded300x_calibration_profile',
  CUSTOM_SCORES: 'donner_custom_scores_v1',
} as const;

export class StorageService {
  static getPalette(): PaletteId {
    const val = localStorage.getItem(STORAGE_KEYS.THEME_PALETTE) as PaletteId | null;
    return val && ['cyber', 'emerald', 'sunset', 'indigo'].includes(val) ? val : 'cyber';
  }

  static setPalette(palette: PaletteId): void {
    localStorage.setItem(STORAGE_KEYS.THEME_PALETTE, palette);
  }

  static getThemeMode(): ThemeMode {
    const val = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
    if (val === 'dark' || val === 'light') return val;
    // Default to dark mode for studio immersion
    return 'dark';
  }

  static setThemeMode(mode: ThemeMode): void {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }

  static getDrumKit(): DrumKitId {
    const val = localStorage.getItem(STORAGE_KEYS.DRUM_KIT) as DrumKitId | null;
    return val || 'original';
  }

  static setDrumKit(kit: DrumKitId): void {
    localStorage.setItem(STORAGE_KEYS.DRUM_KIT, kit);
  }

  static getHandedness(): 'right' | 'left' {
    const val = localStorage.getItem(STORAGE_KEYS.HANDEDNESS);
    return val === 'left' ? 'left' : 'right';
  }

  static setHandedness(handedness: 'right' | 'left'): void {
    localStorage.setItem(STORAGE_KEYS.HANDEDNESS, handedness);
  }

  static getAutoAdvance(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_ADVANCE);
    return val === null ? true : val === 'true';
  }

  static setAutoAdvance(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.AUTO_ADVANCE, String(enabled));
  }

  static getGuitarHeroScroll(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.GUITAR_HERO_SCROLL);
    return val === null ? true : val === 'true';
  }

  static setGuitarHeroScroll(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.GUITAR_HERO_SCROLL, String(enabled));
  }

  static getStickingVisible(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.STICKING_VISIBLE);
    return val === null ? true : val === 'true';
  }

  static setStickingVisible(visible: boolean): void {
    localStorage.setItem(STORAGE_KEYS.STICKING_VISIBLE, String(visible));
  }

  static getClickEnabled(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.CLICK_ENABLED);
    return val === null ? true : val === 'true';
  }

  static setClickEnabled(enabled: boolean): void {
    localStorage.setItem(STORAGE_KEYS.CLICK_ENABLED, String(enabled));
  }

  static getVolume(): number {
    const val = localStorage.getItem(STORAGE_KEYS.VOLUME);
    return val ? Math.min(200, Math.max(0, Number(val))) : 100;
  }

  static setVolume(volume: number): void {
    localStorage.setItem(STORAGE_KEYS.VOLUME, String(volume));
  }

  static getCustomMidiMap(): Record<number, string> | null {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.CUSTOM_MIDI_MAP);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  static setCustomMidiMap(map: Record<number, string>): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MIDI_MAP, JSON.stringify(map));
  }

  static clearCustomMidiMap(): void {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_MIDI_MAP);
  }

  static getCustomScores(): any[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_SCORES);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  static saveCustomScore(score: any): void {
    try {
      const list = this.getCustomScores();
      const existIdx = list.findIndex((s) => s.song_id === score.song_id);
      if (existIdx !== -1) {
        list[existIdx] = score;
      } else {
        list.unshift(score);
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SCORES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save custom score to localStorage:', e);
    }
  }

  static deleteCustomScore(id: string): void {
    try {
      const list = this.getCustomScores().filter((s) => s.song_id !== id);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_SCORES, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to delete custom score from localStorage:', e);
    }
  }
}
