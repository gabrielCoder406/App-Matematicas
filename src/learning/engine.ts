// Motor de aprendizaje: dominio, desbloqueos, dificultad adaptativa, baches y repasos.
import { ancestors, SKILL_BY_ID, SKILLS, topoOrder } from '../content/curriculum';
import { errorSkill } from '../content/errorCatalog';
import { bktUpdate, BKT, guessFor, MASTERY_MIN_ATTEMPTS, MASTERY_P, type Evidence } from './bkt';
import { isDue, qualityFrom, srsReview, srsStart } from './srs';
import type { Attempt, AttemptReason, DayStats, ErrorEntry, ProgressData, Remediation, SkillProgress, SkillState } from './types';

export const PROGRESS_VERSION = 1;
const MAX_ATTEMPTS = 4000;
const MAX_ERRORS = 1500;
const REMEDIATION_SIZE = 3;

export function emptyProgress(now = Date.now()): ProgressData {
  return {
    version: PROGRESS_VERSION,
    profileName: '',
    onboarded: false,
    diagnosticDone: false,
    createdAt: now,
    skills: {},
    attempts: [],
    errors: [],
    remediation: [],
    days: {},
    settings: { theme: 'system', virtualKeyboard: true, idleSeconds: 25, dailyGoalMinutes: 15 },
  };
}

export function newSkillProgress(): SkillProgress {
  return { pL: BKT.pInit, attempts: 0, correct: 0, correctNoHint: 0, recent: [], speed: 0.7, level: 1, streak: 0, failStreak: 0, activeMs: 0 };
}

export function sp(data: ProgressData, id: string): SkillProgress {
  return data.skills[id] ?? newSkillProgress();
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------

export function pendingRemediationFor(data: ProgressData, skillId: string): Remediation[] {
  return data.remediation.filter((r) => r.forSkill === skillId && r.remaining > 0);
}

/** ¿Dominada ahora? (probabilidad alta, suficientes intentos y sin refuerzos pendientes). */
export function isMastered(data: ProgressData, skillId: string): boolean {
  const p = data.skills[skillId];
  if (!p) return false;
  if (pendingRemediationFor(data, skillId).length) return false;
  return !!p.placed || (p.pL >= MASTERY_P && p.attempts >= MASTERY_MIN_ATTEMPTS);
}

/** ¿Se dominó alguna vez? (los desbloqueos no se revierten si el dominio decae). */
export function everMastered(data: ProgressData, skillId: string): boolean {
  const p = data.skills[skillId];
  if (!p) return false;
  if (pendingRemediationFor(data, skillId).length) return false;
  return !!p.placed || p.masteredAt !== undefined || isMastered(data, skillId);
}

export function isUnlocked(data: ProgressData, skillId: string): boolean {
  const skill = SKILL_BY_ID[skillId];
  return !!skill && skill.prereqs.every((p) => everMastered(data, p));
}

export function skillState(data: ProgressData, skillId: string): SkillState {
  if (!isUnlocked(data, skillId)) return 'locked';
  if (isMastered(data, skillId)) return 'mastered';
  const p = data.skills[skillId];
  if (!p || (p.attempts === 0 && !p.lessonDone)) return 'available';
  return 'in-progress';
}

export function allStates(data: ProgressData): Record<string, SkillState> {
  return Object.fromEntries(SKILLS.map((s) => [s.id, skillState(data, s.id)]));
}

/** Prerrequisitos todavía no dominados de una habilidad bloqueada. */
export function missingPrereqs(data: ProgressData, skillId: string): string[] {
  return (SKILL_BY_ID[skillId]?.prereqs ?? []).filter((p) => !everMastered(data, p));
}

export function dueReviews(data: ProgressData, now = Date.now()): string[] {
  return SKILLS.filter((s) => {
    const p = data.skills[s.id];
    return p && (p.masteredAt !== undefined || p.placed) && isDue(p.srs, now);
  }).map((s) => s.id);
}

/** Puntaje de dominio para el mapa de calor (0-1): combina precisión reciente, BKT y rapidez. */
export function masteryScore(p: SkillProgress | undefined): number | null {
  if (!p || (p.attempts === 0 && !p.placed)) return null;
  const acc = p.recent.length ? p.recent.reduce((a, b) => a + b, 0) / p.recent.length : p.pL;
  return Math.max(0, Math.min(1, 0.45 * p.pL + 0.4 * acc + 0.15 * p.speed));
}

export interface Recommendation {
  skillId: string;
  kind: 'remedial' | 'review' | 'continue' | 'new';
  remediation?: Remediation;
}

export function recommendNext(data: ProgressData, now = Date.now()): Recommendation | null {
  const rem = data.remediation.find((r) => r.remaining > 0);
  if (rem) return { skillId: rem.forSkill, kind: 'remedial', remediation: rem };
  const due = dueReviews(data, now);
  if (due.length) return { skillId: due[0], kind: 'review' };
  const states = allStates(data);
  const inProgress = SKILLS.filter((s) => states[s.id] === 'in-progress')
    .sort((a, b) => (data.skills[b.id]?.lastPracticed ?? 0) - (data.skills[a.id]?.lastPracticed ?? 0));
  if (inProgress.length) return { skillId: inProgress[0].id, kind: 'continue' };
  const next = topoOrder().find((s) => states[s.id] === 'available');
  return next ? { skillId: next.id, kind: 'new' } : null;
}

// ---------------------------------------------------------------------------
// Dificultad adaptativa
// ---------------------------------------------------------------------------

export function levelFromP(pL: number): number {
  return pL < 0.35 ? 1 : pL < 0.7 ? 2 : 3;
}

/** Nivel recomendado para el próximo ejercicio de la habilidad. */
export function nextLevel(p: SkillProgress | undefined): number {
  if (!p) return 1;
  const base = levelFromP(p.pL);
  return Math.max(1, Math.min(3, Math.max(base - 1, Math.min(base + 1, p.level))));
}

// ---------------------------------------------------------------------------
// Registro de intentos
// ---------------------------------------------------------------------------

export interface AttemptInput {
  skillId: string;
  generatorId: string;
  seed: number;
  level: number;
  correct: boolean;
  partial?: boolean;
  hintsUsed: number;
  activeMs: number;
  expectedMs: number;
  bug?: string;
  reason: AttemptReason;
  answerKind: string;
  optionsCount?: number;
  remediationId?: string;
  error?: Omit<ErrorEntry, 'id' | 't' | 'skillId' | 'bug'>;
}

export type EngineEvent =
  | { type: 'mastered'; skillId: string }
  | { type: 'unlocked'; skillIds: string[] }
  | { type: 'gap'; remediation: Remediation; cause: 'bug' | 'streak' }
  | { type: 'remediation-progress'; remediation: Remediation }
  | { type: 'remediation-done'; remediation: Remediation }
  | { type: 'level'; level: number; direction: 'up' | 'down' }
  | { type: 'review'; days: number }
  | { type: 'lapse'; skillId: string };

function speedScore(activeMs: number, expectedMs: number): number {
  if (expectedMs <= 0) return 0.7;
  const r = activeMs / expectedMs;
  return Math.max(0, Math.min(1, 1.5 - 0.5 * r));
}

function bumpDay(days: Record<string, DayStats>, key: string, patch: Partial<DayStats>): Record<string, DayStats> {
  const cur = days[key] ?? { activeMs: 0, exercises: 0, correct: 0, correctNoHint: 0 };
  return {
    ...days,
    [key]: {
      activeMs: cur.activeMs + (patch.activeMs ?? 0),
      exercises: cur.exercises + (patch.exercises ?? 0),
      correct: cur.correct + (patch.correct ?? 0),
      correctNoHint: cur.correctNoHint + (patch.correctNoHint ?? 0),
    },
  };
}

/**
 * Aplica un intento al progreso y devuelve el nuevo estado y los eventos (dominio, desbloqueos, baches…).
 * Con `idBase`, los identificadores del intento, del error y del refuerzo se derivan de él: así el
 * mismo intento produce exactamente el mismo resultado en el PC y en el móvil (ver sync/ops.ts).
 */
export function applyAttempt(data: ProgressData, input: AttemptInput, now = Date.now(), idBase?: string): { data: ProgressData; events: EngineEvent[] } {
  const events: EngineEvent[] = [];
  const statesBefore = allStates(data);
  const skills = { ...data.skills };
  const prev = sp(data, input.skillId);
  const evidence: Evidence = input.correct && input.hintsUsed === 0 && !input.partial ? 'correct' : input.correct || input.partial ? 'assisted' : 'incorrect';
  const guess = guessFor(input.answerKind, input.optionsCount);
  const speed = speedScore(input.activeMs, input.expectedMs);
  const score = evidence === 'correct' ? 1 : evidence === 'assisted' ? 0.5 : 0;

  const p: SkillProgress = {
    ...prev,
    pL: bktUpdate(prev.pL, evidence, guess),
    attempts: prev.attempts + 1,
    correct: prev.correct + (input.correct ? 1 : 0),
    correctNoHint: prev.correctNoHint + (evidence === 'correct' ? 1 : 0),
    recent: [...prev.recent, score].slice(-12),
    speed: input.correct ? prev.speed * 0.7 + speed * 0.3 : prev.speed,
    streak: evidence === 'correct' ? prev.streak + 1 : 0,
    failStreak: evidence === 'incorrect' ? prev.failStreak + 1 : 0,
    lastPracticed: now,
    activeMs: prev.activeMs,
  };

  // Dificultad adaptativa (solo en práctica normal)
  if (input.reason === 'practice' || input.reason === 'lesson') {
    let level = prev.level;
    if (evidence === 'correct' && p.streak >= 2 && level < 3) {
      level++;
      p.streak = 0;
      events.push({ type: 'level', level, direction: 'up' });
    } else if (evidence === 'incorrect' && level > 1) {
      level--;
      events.push({ type: 'level', level, direction: 'down' });
    }
    p.level = level;
  }

  // Repaso espaciado
  if (input.reason === 'review' && p.srs) {
    p.srs = srsReview(p.srs, qualityFrom(input.correct, input.hintsUsed, speed), now);
    if (input.correct) events.push({ type: 'review', days: p.srs.interval });
    else events.push({ type: 'lapse', skillId: input.skillId });
  }

  skills[input.skillId] = p;
  let remediation = data.remediation;

  // Progreso de un refuerzo en curso
  if (input.reason === 'remedial' && input.remediationId) {
    remediation = remediation.map((r) => {
      if (r.id !== input.remediationId) return r;
      const updated = { ...r, remaining: input.correct ? Math.max(0, r.remaining - 1) : r.remaining };
      events.push(updated.remaining === 0 ? { type: 'remediation-done', remediation: updated } : { type: 'remediation-progress', remediation: updated });
      return updated;
    });
  }

  // Detección de baches conceptuales
  if (!input.correct && input.reason !== 'diagnostic' && input.reason !== 'remedial') {
    const recentAttempts = [...data.attempts.filter((a) => a.skillId === input.skillId).slice(-7), { bug: input.bug }];
    const baseSkill = input.bug ? errorSkill(input.bug) : undefined;
    let target: string | undefined;
    let cause: 'bug' | 'streak' = 'bug';
    if (baseSkill && baseSkill !== input.skillId && SKILL_BY_ID[baseSkill] && ancestors(input.skillId).has(baseSkill)) {
      const base = sp(data, baseSkill);
      skills[baseSkill] = { ...base, pL: bktUpdate(base.pL, 'incorrect', 0.1) };
      const sameBase = recentAttempts.filter((a) => a.bug && errorSkill(a.bug) === baseSkill).length;
      if (sameBase >= 2 || !everMastered(data, baseSkill)) target = baseSkill;
    } else if (p.failStreak >= 3) {
      const weakest = [...ancestors(input.skillId)]
        .map((id) => ({ id, pL: sp(data, id).pL }))
        .filter((x) => x.pL < 0.75)
        .sort((a, b) => a.pL - b.pL)[0];
      if (weakest) {
        target = weakest.id;
        cause = 'streak';
      }
    }
    if (target && !remediation.some((r) => r.skillId === target && r.forSkill === input.skillId && r.remaining > 0)) {
      const r: Remediation = { id: idBase ? `${idBase}r` : uid(), skillId: target, forSkill: input.skillId, bug: input.bug, remaining: REMEDIATION_SIZE, total: REMEDIATION_SIZE, createdAt: now };
      remediation = [...remediation, r];
      events.push({ type: 'gap', remediation: r, cause });
      if (cause === 'streak') skills[input.skillId] = { ...skills[input.skillId], failStreak: 0 };
    }
  }

  // Registro del intento y del error
  const attempt: Attempt = {
    id: idBase ?? uid(), t: now, skillId: input.skillId, generatorId: input.generatorId, seed: input.seed, level: input.level,
    correct: input.correct, partial: !!input.partial, hintsUsed: input.hintsUsed, activeMs: input.activeMs,
    expectedMs: input.expectedMs, bug: input.bug, reason: input.reason,
  };
  const attempts = [...data.attempts, attempt].slice(-MAX_ATTEMPTS);
  let errors = data.errors;
  if (!input.correct && input.error) {
    errors = [...errors, { ...input.error, id: idBase ? `${idBase}e` : uid(), t: now, skillId: input.skillId, bug: input.bug ?? 'other' }].slice(-MAX_ERRORS);
  }

  const days = bumpDay(data.days, dayKey(now), {
    exercises: 1,
    correct: input.correct ? 1 : 0,
    correctNoHint: evidence === 'correct' ? 1 : 0,
  });

  let next: ProgressData = { ...data, skills, remediation, attempts, errors, days };

  // Dominio alcanzado por primera vez → programar repasos y desbloquear
  const cur = next.skills[input.skillId];
  if (isMastered(next, input.skillId) && cur.masteredAt === undefined) {
    next = { ...next, skills: { ...next.skills, [input.skillId]: { ...cur, masteredAt: now, srs: cur.srs ?? srsStart(now) } } };
    events.push({ type: 'mastered', skillId: input.skillId });
  }
  // Un refuerzo terminado puede completar el dominio de la habilidad que lo originó
  for (const e of events) {
    if (e.type === 'remediation-done') {
      const f = next.skills[e.remediation.forSkill];
      if (f && isMastered(next, e.remediation.forSkill) && f.masteredAt === undefined) {
        next = { ...next, skills: { ...next.skills, [e.remediation.forSkill]: { ...f, masteredAt: now, srs: f.srs ?? srsStart(now) } } };
        events.push({ type: 'mastered', skillId: e.remediation.forSkill });
      }
    }
  }
  next = { ...next, remediation: next.remediation.filter((r) => r.remaining > 0 || now - r.createdAt < 7 * 24 * 3600 * 1000) };

  const statesAfter = allStates(next);
  const unlocked = SKILLS.filter((s) => statesBefore[s.id] === 'locked' && statesAfter[s.id] !== 'locked').map((s) => s.id);
  if (unlocked.length) events.push({ type: 'unlocked', skillIds: unlocked });

  return { data: next, events };
}

/** Suma tiempo efectivo de cálculo al día (`day`, por defecto el de `now`) y (opcionalmente) a la habilidad. */
export function addActiveTime(data: ProgressData, ms: number, skillId?: string, now = Date.now(), day = dayKey(now)): ProgressData {
  if (ms <= 0) return data;
  const days = bumpDay(data.days, day, { activeMs: ms });
  if (!skillId) return { ...data, days };
  const p = sp(data, skillId);
  return { ...data, days, skills: { ...data.skills, [skillId]: { ...p, activeMs: p.activeMs + ms } } };
}

export function completeLesson(data: ProgressData, skillId: string): ProgressData {
  const p = sp(data, skillId);
  return { ...data, skills: { ...data.skills, [skillId]: { ...p, lessonDone: true, pL: Math.max(p.pL, 0.2) } } };
}

/** Resultado del test diagnóstico: las habilidades conocidas se marcan como dominadas. */
export function applyPlacement(data: ProgressData, known: string[], weak: string[], now = Date.now()): ProgressData {
  const skills = { ...data.skills };
  for (const id of known) {
    const p = sp(data, id);
    skills[id] = { ...p, placed: true, pL: Math.max(p.pL, 0.9), level: 3, masteredAt: p.masteredAt ?? now, srs: p.srs ?? { ...srsStart(now), due: now + 3 * 24 * 3600 * 1000, interval: 3 } };
  }
  for (const id of weak) {
    const p = sp(data, id);
    if (!p.placed) skills[id] = { ...p, pL: Math.min(p.pL, 0.25), level: 1 };
  }
  return { ...data, skills, diagnosticDone: true };
}
