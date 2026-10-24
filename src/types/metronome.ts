/**
 * Metronome and Rhythm Subdivision Types
 */

export type SubdivisionCount = 1 | 2 | 3 | 4 | 6;

export interface MetronomeSubdivisionOption {
  value: SubdivisionCount;
  label: string;
  name: string;
  description: string;
  example: string;
}

export const SUBDIVISION_OPTIONS: MetronomeSubdivisionOption[] = [
  { value: 1, label: '1 (♩)', name: 'Negras', description: '1 click por pulso', example: '1, 2, 3, 4' },
  { value: 2, label: '2 (♪♪)', name: 'Corcheas', description: '2 clicks por pulso', example: '1-y, 2-y, 3-y, 4-y' },
  { value: 3, label: '3 (3️⃣)', name: 'Tresillos', description: '3 clicks por pulso', example: '1-trip-let, 2-trip-let' },
  { value: 4, label: '4 (16th)', name: 'Semicorcheas', description: '4 clicks por pulso', example: '1-e-and-a, 2-e-and-a' },
  { value: 6, label: '6 (6️⃣)', name: 'Seisillos / Sextuplets', description: '6 clicks por pulso (Fill Imagen 1)', example: '1-trip-let-and-trip-let' },
];

export interface TimeSignatureOption {
  numerator: number;
  denominator: number;
  label: string;
}

export const COMMON_TIME_SIGNATURES: TimeSignatureOption[] = [
  { numerator: 4, denominator: 4, label: '4/4 (4 pulsos)' },
  { numerator: 3, denominator: 4, label: '3/4 (3 pulsos - Vals)' },
  { numerator: 6, denominator: 8, label: '6/8 (2 pulsos compuestos)' },
  { numerator: 2, denominator: 4, label: '2/4 (2 pulsos - Marcha)' },
  { numerator: 5, denominator: 4, label: '5/4 (5 pulsos - Dave Brubeck)' },
  { numerator: 7, denominator: 8, label: '7/8 (7 pulsos - Progresivo)' },
  { numerator: 12, denominator: 8, label: '12/8 (4 pulsos compuestos - Blues)' },
];

export function getTempoTerm(bpm: number): string {
  if (bpm < 40) return 'Grave';
  if (bpm < 60) return 'Largo';
  if (bpm < 66) return 'Larghetto';
  if (bpm < 76) return 'Adagio';
  if (bpm < 108) return 'Andante';
  if (bpm < 120) return 'Moderato';
  if (bpm < 156) return 'Allegro';
  if (bpm < 176) return 'Vivace';
  if (bpm < 200) return 'Presto';
  return 'Prestissimo';
}
