/**
 * Scoring, Accuracy Evaluation, and Chunking Modes
 */

export type HitAccuracyRating = 'PERFECT' | 'EARLY' | 'LATE' | 'MISS' | 'OFF_BEAT';

export interface HitEvaluation {
  rating: HitAccuracyRating;
  offsetMs: number;     // negative = early, positive = late
  points: number;
  label: string;
  color: string;
}

export interface ScoreStats {
  score: number;
  totalHits: number;
  perfectCount: number;
  earlyCount: number;
  lateCount: number;
  missCount: number;
  accuracyPct: number;
  streak: number;
  maxStreak: number;
}

export type ChunkSizeMode = 0 | 1 | 2 | 4; // 0 = continuous
