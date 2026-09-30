import type { BugId } from '../math/mutations';
import type { ParseMode } from '../math/parse';
import type { StepMode } from '../math/validate';
import type { Rng } from './rng';

/** Texto enriquecido: admite $…$ (LaTeX en línea), $$…$$ (bloque), **negrita** y listas con «- ». */
export type Rich = string;

export type BlockId = 'logica' | 'aritmetica' | 'algebra' | 'geometria' | 'funciones' | 'calculo' | 'lineal' | 'estadistica';

export interface Block {
  id: BlockId;
  number: number;
  title: string;
  short: string;
  description: string;
  /** Tono (0-360) del color del bloque. */
  hue: number;
}

export interface Skill {
  id: string;
  block: BlockId;
  title: string;
  summary: string;
  prereqs: string[];
  /** Duración estimada de la microlección (3–7 min). */
  minutes: number;
  /** Recordatorio conceptual breve (pista de nivel 1 por defecto). */
  concept: Rich;
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------

/**
 * Forma exigida a una expresión: desarrollada, factorizada, un solo monomio
 * (potencias simplificadas), radicales simplificados o denominador racionalizado.
 */
export type ExpressionForm = 'any' | 'expanded' | 'factored' | 'monomial' | 'radical' | 'rationalized' | 'simplified' | 'vertex';

export type AnswerSpec =
  | {
      kind: 'numeric';
      value: number;
      /** Tolerancia absoluta (por defecto 1e-6 relativa). */
      tolerance?: number;
      /** Exige fracción irreducible o entero. */
      requireReduced?: boolean;
      unit?: string;
      /** Expresión de partida para diagnosticar errores (ej. «-3^2 + 4»). */
      diagnoseFrom?: string;
      /** Permite dejar funciones sin evaluar (ln 5, sen 20°…) en la respuesta. */
      allowFunctions?: boolean;
    }
  | { kind: 'expression'; target: string; form?: ExpressionForm; upToConstant?: boolean; vars?: string[]; diagnoseFrom?: string }
  | { kind: 'equation'; target: string; variable?: string }
  | { kind: 'solutions'; variable: string; values: number[]; diagnoseFrom?: string }
  | { kind: 'inequality'; variable: string; target: string; diagnoseFrom?: string }
  | { kind: 'choice'; options: Rich[]; correct: number; explanations?: Rich[] }
  | { kind: 'multi'; options: Rich[]; correct: number[] }
  | { kind: 'truefalse'; correct: boolean }
  | { kind: 'truth-table'; formula: string; mode: 'logic' | 'bool'; vars: string[]; columns: string[] }
  | { kind: 'set'; elements: string[] }
  | { kind: 'vector'; values: number[]; labels?: string[]; tolerance?: number }
  | { kind: 'matrix'; rows: number[][]; tolerance?: number }
  | { kind: 'logic-expr'; target: string; constraint?: 'no-neg-parens' | 'no-implication'; diagnoseFrom?: string }
  | { kind: 'set-expr'; target: string }
  | { kind: 'venn'; sets: string[]; target: string }
  | { kind: 'predicate'; check: (value: number) => boolean; describe: Rich };

/** Resolución paso a paso: cada línea se valida contra la anterior y contra el enunciado. */
export interface StepsSpec {
  start: string;
  mode: StepMode;
  variable?: string;
  parseMode?: ParseMode;
}

export type AnswerInput =
  | { kind: 'text'; value: string }
  | { kind: 'choice'; value: number }
  | { kind: 'multi'; value: number[] }
  | { kind: 'bool'; value: boolean }
  | { kind: 'table'; value: (boolean | null)[][] }
  | { kind: 'cells'; value: string[] }
  | { kind: 'grid'; value: string[][] }
  | { kind: 'regions'; value: string[] }
  | { kind: 'none' };

export interface CheckResult {
  correct: boolean;
  /** Equivalente pero no en la forma pedida (sin simplificar, sin factorizar…). */
  partial?: boolean;
  message: Rich;
  bug?: BugId;
  parseError?: boolean;
  /** Para tablas de verdad: celdas incorrectas [fila, columna]. */
  wrongCells?: [number, number][];
}

// ---------------------------------------------------------------------------
// Figuras que acompañan a los enunciados
// ---------------------------------------------------------------------------

export type Visual =
  | { type: 'graph'; functions: { expr: string; color?: string; label?: string; dashed?: boolean }[]; points?: { x: number; y: number; label?: string; open?: boolean }[]; view?: { xmin: number; xmax: number; ymin: number; ymax: number }; shade?: { expr: string; from: number; to: number } }
  | { type: 'right-triangle'; legA: string; legB: string; hyp: string; angle?: string; angleAt?: 'A' | 'B' }
  | { type: 'triangle'; sides: [string, string, string]; angles?: [string, string, string] }
  | { type: 'shape'; shape: 'rectangle' | 'square' | 'circle' | 'triangle' | 'trapezoid' | 'parallelogram' | 'rhombus' | 'L'; labels: Record<string, string> }
  | { type: 'solid'; shape: 'cube' | 'prism' | 'cylinder' | 'cone' | 'sphere' | 'pyramid'; labels: Record<string, string> }
  | { type: 'thales'; a: string; b: string; c: string; d: string }
  | { type: 'venn'; sets: string[]; elements?: Record<string, string[]>; universe?: string[] }
  | { type: 'circuit'; expr: string; inputs?: Record<string, boolean> }
  | { type: 'histogram'; bins: { label: string; value: number }[]; xLabel?: string; yLabel?: string }
  | { type: 'scatter'; points: [number, number][]; xLabel?: string; yLabel?: string }
  | { type: 'unit-circle'; angleDeg: number }
  | { type: 'vectors'; vectors: { x: number; y: number; label: string; from?: [number, number] }[] }
  | { type: 'fraction-bars'; fractions: [number, number][] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'number-line'; points: { x: number; open?: boolean; label?: string }[]; ranges?: { from: number; to: number }[]; min: number; max: number };

export interface SolutionStep {
  /** Línea en LaTeX. */
  math?: string;
  /** Comentario (texto enriquecido). */
  note?: Rich;
}

export interface ExerciseContent {
  prompt: Rich;
  visual?: Visual;
  answer: AnswerSpec;
  /** Si está definido, se ofrece el editor de pasos con validación línea a línea. */
  steps?: StepsSpec;
  /** Pistas: 1 recordatorio conceptual, 2 siguiente paso, 3 paso desarrollado. */
  hints: [Rich, Rich, Rich];
  solution: SolutionStep[];
  expectedSeconds?: number;
  /** Errores frecuentes que este ejercicio permite detectar. */
  errorTags?: BugId[];
}

export interface Exercise extends ExerciseContent {
  id: string;
  skillId: string;
  generatorId: string;
  seed: number;
  difficulty: number;
  expectedSeconds: number;
}

export interface Generator {
  id: string;
  skillId: string;
  title: string;
  /** Niveles de dificultad que admite (1 fácil – 3 difícil). */
  levels: number[];
  errorTags?: BugId[];
  generate(rng: Rng, level: number): ExerciseContent;
}

// ---------------------------------------------------------------------------
// Microlecciones
// ---------------------------------------------------------------------------

export type WidgetId =
  | 'truth-table' | 'prop-tree' | 'venn' | 'circuit' | 'balance' | 'fraction-bars' | 'grapher' | 'unit-circle'
  | 'pythagoras' | 'thales' | 'vectors' | 'histogram' | 'number-line' | 'triangle-solver' | 'riemann' | 'tangent' | 'matrix' | 'dice';

export type LessonSection =
  | { type: 'text'; title?: string; body: Rich }
  | { type: 'example'; title: string; problem: Rich; steps: SolutionStep[] }
  | { type: 'widget'; widget: WidgetId; props?: Record<string, unknown>; caption?: Rich }
  | { type: 'tip'; title?: string; body: Rich }
  | { type: 'check'; generatorId: string; level?: number }
  | { type: 'summary'; points: Rich[] };

export interface Lesson {
  skillId: string;
  intro: Rich;
  sections: LessonSection[];
}
