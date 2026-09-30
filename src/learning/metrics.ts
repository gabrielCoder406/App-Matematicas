// Métricas de estudio: tiempo efectivo, rachas y precisión sin pistas.
import { dayKey } from './engine';
import type { DayStats, ProgressData } from './types';

/** Un día cuenta para la racha si se resolvió al menos un ejercicio o se estudió 3 minutos. */
export function activeDay(d: DayStats | undefined): boolean {
  return !!d && (d.exercises > 0 || d.activeMs >= 3 * 60 * 1000);
}

function shiftDay(t: number, delta: number): number {
  const d = new Date(t);
  d.setDate(d.getDate() + delta);
  return d.getTime();
}

export interface Streak {
  current: number;
  best: number;
  activeToday: boolean;
}

export function streak(data: ProgressData, now = Date.now()): Streak {
  const activeToday = activeDay(data.days[dayKey(now)]);
  let current = 0;
  let t = activeToday ? now : shiftDay(now, -1);
  while (activeDay(data.days[dayKey(t)])) {
    current++;
    t = shiftDay(t, -1);
  }
  const keys = Object.keys(data.days).filter((k) => activeDay(data.days[k])).sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const tt = new Date(y, m - 1, d).getTime();
    if (prev !== null && dayKey(shiftDay(prev, 1)) === k) run++;
    else run = 1;
    best = Math.max(best, run);
    prev = tt;
  }
  return { current, best: Math.max(best, current), activeToday };
}

export interface Totals {
  activeMs: number;
  exercises: number;
  correct: number;
  correctNoHint: number;
  accuracy: number;
  accuracyNoHint: number;
}

export function totals(data: ProgressData, sinceDays?: number, now = Date.now()): Totals {
  let activeMs = 0, exercises = 0, correct = 0, correctNoHint = 0;
  const minKey = sinceDays ? dayKey(shiftDay(now, -(sinceDays - 1))) : '';
  for (const [k, d] of Object.entries(data.days)) {
    if (k < minKey) continue;
    activeMs += d.activeMs;
    exercises += d.exercises;
    correct += d.correct;
    correctNoHint += d.correctNoHint;
  }
  return {
    activeMs, exercises, correct, correctNoHint,
    accuracy: exercises ? correct / exercises : 0,
    accuracyNoHint: exercises ? correctNoHint / exercises : 0,
  };
}

export interface DayPoint {
  key: string;
  label: string;
  minutes: number;
  exercises: number;
  accuracyNoHint: number | null;
}

/** Serie de los últimos `n` días (del más antiguo al más reciente). */
export function daySeries(data: ProgressData, n = 14, now = Date.now()): DayPoint[] {
  const out: DayPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const t = shiftDay(now, -i);
    const key = dayKey(t);
    const d = data.days[key];
    const date = new Date(t);
    out.push({
      key,
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      minutes: d ? d.activeMs / 60000 : 0,
      exercises: d?.exercises ?? 0,
      accuracyNoHint: d && d.exercises ? d.correctNoHint / d.exercises : null,
    });
  }
  return out;
}

export function formatDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
