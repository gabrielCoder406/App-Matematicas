// Operaciones sobre el progreso. Cada cambio (un ejercicio resuelto, tiempo de estudio, una
// lección, el diagnóstico…) se registra como una operación con un id único. Aplicarla es
// determinista: con la misma operación, el PC y el móvil llegan exactamente al mismo estado
// (dominio, desbloqueos, refuerzos, repasos espaciados, banco de errores y estadísticas).
import {
  addActiveTime, applyAttempt, applyPlacement, completeLesson, emptyProgress, PROGRESS_VERSION,
  type AttemptInput, type EngineEvent,
} from '../learning/engine';
import type { AttemptReason, ProgressData, Settings } from '../learning/types';

/** Ajustes de cada dispositivo: no se sincronizan (el PC y el móvil tienen su propio tema y teclado). */
export const LOCAL_SETTINGS = ['theme', 'virtualKeyboard'] as const;
type LocalKey = (typeof LOCAL_SETTINGS)[number];
export type SyncedSettings = Omit<Settings, LocalKey>;

export type ProgressOp =
  | { k: 'attempt'; input: AttemptInput }
  /** Tiempo efectivo de estudio; `day` es el día local de quien lo midió. */
  | { k: 'time'; ms: number; day: string; skill?: string }
  | { k: 'lesson'; skill: string }
  | { k: 'placement'; known: string[]; weak: string[] }
  | { k: 'settings'; patch: Partial<SyncedSettings> }
  | { k: 'profile'; name: string }
  | { k: 'onboarded'; value: boolean }
  | { k: 'error-reviewed'; id: string }
  | { k: 'remediation-dismissed'; id: string }
  | { k: 'reset' }
  /** Reemplaza todo el progreso (importar una copia, o elegir el del móvil al vincularlo). */
  | { k: 'import'; data: ProgressData };

export interface OpEnvelope {
  /** Único; de él salen los ids del intento, del error y del refuerzo que genere. */
  id: string;
  /** Dispositivo que la creó y su número de orden en ese dispositivo (1, 2, 3…). */
  dev: string;
  seq: number;
  /** Cuándo se hizo (ms desde epoch, reloj del dispositivo que la creó). */
  t: number;
  op: ProgressOp;
}

export interface Applied {
  data: ProgressData;
  events: EngineEvent[];
}

const NUMERIC_SETTINGS: Record<keyof SyncedSettings, [number, number]> = {
  idleSeconds: [5, 600],
  dailyGoalMinutes: [1, 600],
};

/** Separa un cambio de ajustes en la parte de este dispositivo y la que se sincroniza. */
export function splitSettings(patch: Partial<Settings>): { local: Partial<Settings>; synced: Partial<SyncedSettings> } {
  const local: Partial<Settings> = {};
  const synced: Partial<SyncedSettings> = {};
  for (const [k, v] of Object.entries(patch) as [keyof Settings, unknown][]) {
    if (v === undefined) continue;
    if ((LOCAL_SETTINGS as readonly string[]).includes(k)) (local as Record<string, unknown>)[k] = v;
    else (synced as Record<string, unknown>)[k] = v;
  }
  return { local, synced };
}

function cleanSynced(patch: Partial<SyncedSettings>): Partial<SyncedSettings> {
  const out: Partial<SyncedSettings> = {};
  for (const [k, [min, max]] of Object.entries(NUMERIC_SETTINGS) as [keyof SyncedSettings, [number, number]][]) {
    const v = patch[k];
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = Math.min(max, Math.max(min, v));
  }
  return out;
}

/** Conserva los ajustes propios del dispositivo (`from`) sobre un progreso que llega de otro. */
export function withLocalSettings(data: ProgressData, from: Settings): ProgressData {
  if (LOCAL_SETTINGS.every((k) => data.settings[k] === from[k])) return data;
  const settings = { ...data.settings };
  for (const k of LOCAL_SETTINGS) (settings as Record<string, unknown>)[k] = from[k];
  return { ...data, settings };
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Progreso completo a partir de datos externos (archivo importado u otro dispositivo). */
export function normalizeProgress(raw: unknown, now = Date.now()): ProgressData {
  const base = emptyProgress(now);
  if (!isObj(raw)) return base;
  return {
    version: PROGRESS_VERSION,
    profileName: typeof raw.profileName === 'string' ? raw.profileName.slice(0, 40) : base.profileName,
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : base.onboarded,
    diagnosticDone: typeof raw.diagnosticDone === 'boolean' ? raw.diagnosticDone : base.diagnosticDone,
    createdAt: typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt) ? raw.createdAt : base.createdAt,
    skills: (isObj(raw.skills) ? raw.skills : base.skills) as ProgressData['skills'],
    attempts: (Array.isArray(raw.attempts) ? raw.attempts : base.attempts) as ProgressData['attempts'],
    errors: (Array.isArray(raw.errors) ? raw.errors : base.errors) as ProgressData['errors'],
    remediation: (Array.isArray(raw.remediation) ? raw.remediation : base.remediation) as ProgressData['remediation'],
    days: (isObj(raw.days) ? raw.days : base.days) as ProgressData['days'],
    settings: { ...base.settings, ...(isObj(raw.settings) ? raw.settings : {}) } as Settings,
  };
}

/** ¿Hay algo que conservar? (ejercicios, lecciones o diagnóstico; el nombre o el tiempo suelto no cuentan). */
export function hasProgress(data: ProgressData): boolean {
  return data.attempts.length > 0 || data.diagnosticDone || Object.values(data.skills).some((p) => p.attempts > 0 || p.lessonDone || p.placed);
}

/** Aplica una operación. Determinista: no usa la hora actual ni números al azar. */
export function applyOp(data: ProgressData, e: OpEnvelope): Applied {
  const op = e.op;
  const same = (d: ProgressData): Applied => ({ data: d, events: [] });
  switch (op.k) {
    case 'attempt':
      return applyAttempt(data, op.input, e.t, e.id);
    case 'time':
      return same(addActiveTime(data, op.ms, op.skill, e.t, op.day));
    case 'lesson':
      return same(completeLesson(data, op.skill));
    case 'placement':
      return same(applyPlacement(data, op.known, op.weak, e.t));
    case 'settings':
      return same({ ...data, settings: { ...data.settings, ...cleanSynced(op.patch) } });
    case 'profile':
      return same({ ...data, profileName: op.name.slice(0, 40) });
    case 'onboarded':
      return same({ ...data, onboarded: op.value });
    case 'error-reviewed':
      return same({ ...data, errors: data.errors.map((x) => (x.id === op.id && !x.reviewed ? { ...x, reviewed: true } : x)) });
    case 'remediation-dismissed':
      return same({ ...data, remediation: data.remediation.map((r) => (r.id === op.id ? { ...r, remaining: 0 } : r)) });
    case 'reset':
      return same({ ...emptyProgress(e.t), settings: data.settings });
    case 'import':
      return same(withLocalSettings(normalizeProgress(op.data, e.t), data.settings));
    default:
      return same(data);
  }
}

// ---------------------------------------------------------------------------- validación
// El PC aplica operaciones que llegan por la red: se comprueba la forma antes de aplicarlas.

const REASONS: AttemptReason[] = ['practice', 'remedial', 'review', 'diagnostic', 'error-review', 'lesson'];
const str = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const num = (v: unknown, min = -Infinity, max = Infinity): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const opt = (v: unknown, check: (x: unknown) => boolean) => v === undefined || check(v);

function validInput(v: unknown): v is AttemptInput {
  if (!isObj(v)) return false;
  const ok = str(v.skillId, 100) && str(v.generatorId) && num(v.seed) && num(v.level, 0, 9) && typeof v.correct === 'boolean'
    && opt(v.partial, (x) => typeof x === 'boolean') && num(v.hintsUsed, 0, 50) && num(v.activeMs, 0, 864e5) && num(v.expectedMs, 0, 864e5)
    && opt(v.bug, (x) => str(x, 100)) && REASONS.includes(v.reason as AttemptReason) && str(v.answerKind, 40)
    && opt(v.optionsCount, (x) => num(x, 0, 1000)) && opt(v.remediationId, (x) => str(x, 120));
  if (!ok) return false;
  return opt(v.error, (e) => isObj(e) && str(e.exerciseId, 300) && str(e.prompt, 10_000) && str(e.student, 10_000) && str(e.message, 10_000) && opt(e.line, (x) => num(x, 0, 10_000)));
}

function validOp(v: unknown): v is ProgressOp {
  if (!isObj(v)) return false;
  switch (v.k) {
    case 'attempt':
      return validInput(v.input);
    case 'time':
      return num(v.ms, 0, 864e5) && typeof v.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && opt(v.skill, (x) => str(x, 100));
    case 'lesson':
      return str(v.skill, 100);
    case 'placement':
      return Array.isArray(v.known) && Array.isArray(v.weak) && v.known.length + v.weak.length <= 2000 && [...v.known, ...v.weak].every((x) => str(x, 100));
    case 'settings':
      return isObj(v.patch);
    case 'profile':
      return str(v.name, 200);
    case 'onboarded':
      return typeof v.value === 'boolean';
    case 'error-reviewed':
    case 'remediation-dismissed':
      return str(v.id, 200);
    case 'reset':
      return true;
    case 'import':
      return isObj(v.data) && isObj(v.data.skills) && Array.isArray(v.data.attempts);
    default:
      return false;
  }
}

export function validEnvelope(v: unknown): v is OpEnvelope {
  return isObj(v) && str(v.id, 120) && str(v.dev, 80) && num(v.seq, 1) && Number.isInteger(v.seq) && num(v.t, 0) && validOp(v.op);
}
