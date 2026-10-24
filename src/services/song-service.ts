/**
 * Song Service for Songsterr API, Lessons, Presets and Exports
 */
import { SongData, PresetSong, LessonsResponse, SearchResultItem } from '../types/drum';

export class SongService {
  public static async getPresets(): Promise<PresetSong[]> {
    try {
      const res = await fetch('/api/presets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to load presets from server:', err);
      // Fallback default preset
      return [
        {
          id: '2664276',
          artist: 'Songsterr Notation Official',
          title: 'Drum Key (Todas las Notaciones Batería)',
          bpm: 120,
          is_featured: true,
        },
        {
          id: 'exercise-sextuplet-fill',
          artist: 'Técnica & Rudimentos',
          title: 'Fill Séxtuple Tom-Kick (Imagen 1)',
          bpm: 75,
          is_featured: true,
        },
        {
          id: '9374',
          artist: 'Hoobastank',
          title: 'The Reason',
          bpm: 83,
          is_featured: true,
        },
      ];
    }
  }

  public static async getLessons(): Promise<LessonsResponse> {
    try {
      const res = await fetch('/api/lessons');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to load lessons from server:', err);
      return { categories: [], all: [] };
    }
  }

  public static async searchSongs(query: string): Promise<SearchResultItem[]> {
    const encoded = encodeURIComponent(query.trim());
    const res = await fetch(`/api/search?q=${encoded}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  public static async getSong(
    songIdOrUrl: string,
    handedness: 'right' | 'left' = 'right'
  ): Promise<SongData> {
    const encoded = encodeURIComponent(songIdOrUrl);
    const res = await fetch(`/api/song/${encoded}?handedness=${handedness}`);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  }

  public static getMidiExportUrl(songId: string | number): string {
    return `/api/export/midi/${encodeURIComponent(songId)}`;
  }

  public static getGp5ExportUrl(songId: string | number): string {
    return `/api/export/gp5/${encodeURIComponent(songId)}`;
  }

  public static async getCustomSongs(): Promise<any[]> {
    try {
      const res = await fetch('/api/custom-songs');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Failed to fetch custom songs from server:', err);
      return [];
    }
  }

  public static async saveCustomSong(song: SongData): Promise<{ success: boolean; song: SongData }> {
    const res = await fetch('/api/custom-songs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(song),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  public static async deleteCustomSong(songId: string): Promise<boolean> {
    const res = await fetch(`/api/custom-songs/${encodeURIComponent(songId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  }
}
