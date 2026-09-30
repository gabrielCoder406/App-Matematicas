// Tipos del progreso del estudiante (persistidos en el navegador).

export type AttemptReason = 'practice' | 'remedial' | 'review' | 'diagnostic' | 'error-review' | 'lesson';

export interface SrsState {
  /** Próxima revisión (ms desde epoch). */
  due: number;
  /** Intervalo actual en días. */
  interval: number;
  ease: number;
  reps: number;
  lapses: number;
}

export interface SkillProgress {
  /** Probabilidad de dominio (Bayesian Knowledge Tracing). */
  pL: number;
  attempts: number;
  correct: number;
  correctNoHint: number;
  /** Últimos resultados: 1 correcto, 0.5 con ayuda, 0 incorrecto. */
  recent: number[];
  /** Rapidez (EWMA, 0-1): 1 = dentro del tiempo esperado. */
  speed: number;
  /** Nivel de dificultad actual (1-3, adaptativo). */
  level: number;
  /** Aciertos consecutivos. */
  streak: number;
  /** Fallos consecutivos. */
  failStreak: number;
  placed?: boolean;
  masteredAt?: number;
  lastPracticed?: number;
  activeMs: number;
  lessonDone?: boolean;
  srs?: SrsState;
}

export interface Attempt {
  id: string;
  t: number;
  skillId: string;
  generatorId: string;
  seed: number;
  level: number;
  correct: boolean;
  partial: boolean;
  hintsUsed: number;
  activeMs: number;
  expectedMs: number;
  bug?: string;
  reason: AttemptReason;
}

export interface ErrorEntry {
  id: string;
  t: number;
  skillId: string;
  exerciseId: string;
  bug: string;
  prompt: string;
  student: string;
  message: string;
  /** Línea del desarrollo donde ocurrió (paso a paso). */
  line?: number;
  reviewed?: boolean;
}

export interface Remediation {
  id: string;
  /** Habilidad base a reforzar. */
  skillId: string;
  /** Habilidad en la que se detectó el bache. */
  forSkill: string;
  bug?: string;
  remaining: number;
  total: number;
  createdAt: number;
}

export interface DayStats {
  activeMs: number;
  exercises: number;
  correct: number;
  correctNoHint: number;
}

export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  theme: Theme;
  /** Muestra el teclado matemático virtual en pantallas táctiles. */
  virtualKeyboard: boolean;
  /** Minutos de inactividad antes de dejar de contar el tiempo efectivo. */
  idleSeconds: number;
  dailyGoalMinutes: number;
}

export interface ProgressData {
  version: number;
  profileName: string;
  onboarded: boolean;
  diagnosticDone: boolean;
  createdAt: number;
  skills: Record<string, SkillProgress>;
  attempts: Attempt[];
  errors: ErrorEntry[];
  remediation: Remediation[];
  days: Record<string, DayStats>;
  settings: Settings;
}

export type SkillState = 'locked' | 'available' | 'in-progress' | 'mastered';
