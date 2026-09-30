// Repetición espaciada (variante de SM-2) aplicada a habilidades dominadas.
import type { SrsState } from './types';

export const DAY = 24 * 60 * 60 * 1000;

export function srsStart(now: number): SrsState {
  return { due: now + DAY, interval: 1, ease: 2.5, reps: 0, lapses: 0 };
}

/**
 * Calidad de la respuesta (0-5): 5 perfecta y rápida, 4 correcta, 3 con ayuda,
 * 2 correcta pero muy lenta, 0-1 incorrecta.
 */
export function srsReview(s: SrsState, quality: number, now: number): SrsState {
  const q = Math.max(0, Math.min(5, quality));
  if (q < 3) {
    return { due: now + DAY, interval: 1, ease: Math.max(1.3, s.ease - 0.2), reps: 0, lapses: s.lapses + 1 };
  }
  const ease = Math.max(1.3, s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  const reps = s.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(s.interval * ease);
  return { due: now + interval * DAY, interval, ease, reps, lapses: s.lapses };
}

export function isDue(s: SrsState | undefined, now: number): boolean {
  return !!s && s.due <= now;
}

export function qualityFrom(correct: boolean, hintsUsed: number, speed: number): number {
  if (!correct) return 1;
  if (hintsUsed > 0) return 3;
  return speed >= 0.8 ? 5 : speed >= 0.4 ? 4 : 3;
}
