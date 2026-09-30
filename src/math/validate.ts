// Validación paso a paso: compara cada línea con la anterior y con el enunciado,
// y cuando hay un error intenta explicar exactamente cuál fue.
import type { Node } from './ast';
import { freeVars, isNumeric } from './ast';
import {
  equationsEquivalent, exprEquivalent, inequalitiesEquivalent, logicEquivalent, proportional, setExprEquivalent,
  type EquivResult,
} from './equivalence';
import { mutations, type BugId, type MutationMode } from './mutations';
import { parse, type ParseMode } from './parse';
import { formatNumber } from './print';
import { realSetOf, realSetToLatex, sameRealSet, sameRoots, solveEquation } from './solve';

export type StepMode = MutationMode;

export interface StepOptions {
  mode: StepMode;
  /** Incógnita principal (ecuaciones / inecuaciones). */
  variable?: string;
  parseMode?: ParseMode;
}

export type LineStatus = 'ok' | 'error' | 'carried' | 'parse-error' | 'empty';

export interface LineResult {
  index: number;
  source: string;
  node?: Node;
  status: LineStatus;
  message: string;
  bug?: BugId;
  domainWarning?: boolean;
  /** La línea está en forma final (x = 3, intervalo, etc.). */
  isFinal?: boolean;
}

export function defaultParseMode(mode: StepMode): ParseMode {
  if (mode === 'logic') return 'logic';
  if (mode === 'set') return 'set';
  return 'arith';
}

/** Compara dos líneas con la noción de equivalencia de cada modo. */
export function compareLines(a: Node, b: Node, opts: StepOptions): EquivResult {
  const v = opts.variable ?? 'x';
  switch (opts.mode) {
    case 'expression': return exprEquivalent(a, b);
    case 'equation': return equationsEquivalent(a, b, v);
    case 'inequality': return inequalitiesEquivalent(a, b, v);
    case 'logic': return logicEquivalent(a, b);
    case 'set': return setExprEquivalent(a, b);
  }
}

/** Comparador rápido «¿esta variante con error coincide con lo que escribió?». */
function makeMatcher(curr: Node, opts: StepOptions): (cand: Node) => boolean {
  const v = opts.variable ?? 'x';
  switch (opts.mode) {
    case 'expression':
      return (cand) => exprEquivalent(cand, curr).equivalent;
    case 'logic':
      return (cand) => logicEquivalent(cand, curr).equivalent;
    case 'set':
      return (cand) => setExprEquivalent(cand, curr).equivalent;
    case 'inequality': {
      const target = realSetOf(curr, v);
      return (cand) => {
        if (!target) return false;
        const s = realSetOf(cand, v);
        return !!s && sameRealSet(s, target);
      };
    }
    case 'equation': {
      const vars = [...freeVars(curr)];
      const multi = vars.length > 1;
      const target = multi ? null : solveEquation(curr, v);
      return (cand) => {
        if (proportional(cand, curr, [...new Set([...vars, ...freeVars(cand)])].sort()) === true) return true;
        if (multi) return equationsEquivalent(cand, curr, v).equivalent;
        if (!target || target.kind !== 'finite') return false;
        const s = solveEquation(cand, v, [-60, 60], {}, true);
        return s.kind === 'finite' && sameRoots(s.roots, target.roots);
      };
    }
  }
}

function fmtEnv(env: Record<string, number | boolean>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k} = ${typeof v === 'boolean' ? (v ? '\\mathrm{V}' : '\\mathrm{F}') : formatNumber(v)}`)
    .join(',\\ ');
}

function fmtVal(v: number | boolean): string {
  return typeof v === 'boolean' ? (v ? '\\mathrm{V}' : '\\mathrm{F}') : formatNumber(v);
}

function rootsLatex(roots: number[], v: string): string {
  if (!roots.length) return 'no tiene solución';
  return roots.map((r) => `$${v} = ${formatNumber(r)}$`).join(' y ');
}

/** Explicación genérica cuando ninguna regla de error conocida encaja. */
function genericMessage(eq: EquivResult, opts: StepOptions): string {
  const v = opts.variable ?? 'x';
  switch (opts.mode) {
    case 'expression': {
      const c = eq.counterexample;
      if (c && Object.keys(c.env).length) {
        return `Este paso no es equivalente al anterior: con $${fmtEnv(c.env)}$ la línea anterior vale $${fmtVal(c.a)}$ y la tuya $${fmtVal(c.b)}$.`;
      }
      if (c) return `El resultado no coincide: la línea anterior vale $${fmtVal(c.a)}$ y la tuya $${fmtVal(c.b)}$. Revisa las cuentas.`;
      return 'Este paso no es equivalente al anterior.';
    }
    case 'equation': {
      if (eq.reason === 'lost-solutions' && eq.rootsA && eq.rootsB) {
        const lost = eq.rootsA.filter((r) => !eq.rootsB!.some((s) => Math.abs(s - r) < 1e-6));
        return `En este paso se perdió ${lost.length > 1 ? 'soluciones' : 'una solución'}: ${rootsLatex(lost, v)}. ¿Dividiste por una expresión que puede valer 0 u olvidaste la raíz negativa?`;
      }
      if (eq.reason === 'extra-solutions' && eq.rootsA && eq.rootsB) {
        const extra = eq.rootsB.filter((r) => !eq.rootsA!.some((s) => Math.abs(s - r) < 1e-6));
        return `Este paso agrega ${extra.length > 1 ? 'soluciones' : 'una solución'} que la ecuación anterior no tenía: ${rootsLatex(extra, v)}.`;
      }
      if (eq.rootsA && eq.rootsB) {
        return `La ecuación cambió: antes ${rootsLatex(eq.rootsA, v)}, y con tu paso ${rootsLatex(eq.rootsB, v)}. Revisa las operaciones.`;
      }
      return 'Este paso cambia el conjunto solución de la ecuación.';
    }
    case 'inequality': {
      if (eq.setA && eq.setB) {
        return `El conjunto solución cambió: antes era $${realSetToLatex(eq.setA)}$ y ahora $${realSetToLatex(eq.setB)}$.`;
      }
      return 'Este paso cambia el conjunto solución de la inecuación.';
    }
    case 'logic': {
      const c = eq.counterexample;
      if (c) return `No es equivalente: con $${fmtEnv(c.env)}$ la línea anterior es $${fmtVal(c.a)}$ y la tuya $${fmtVal(c.b)}$.`;
      return 'Esta proposición no es equivalente a la anterior.';
    }
    case 'set': {
      const c = eq.counterexample;
      if (c) {
        const region = Object.entries(c.env).map(([k, val]) => (val ? `en $${k}$` : `fuera de $${k}$`)).join(', ');
        return `No es equivalente: un elemento ${region} ${c.a ? 'pertenece' : 'no pertenece'} a la expresión anterior, pero ${c.b ? 'sí' : 'no'} a la tuya.`;
      }
      return 'Esta expresión de conjuntos no es equivalente a la anterior.';
    }
  }
}

export interface Diagnosis {
  bug?: BugId;
  message: string;
}

/** Explica por qué `curr` no es un paso válido desde `prev`. */
export function diagnose(prev: Node, curr: Node, opts: StepOptions, eq?: EquivResult): Diagnosis {
  const matches = makeMatcher(curr, opts);
  const started = Date.now();
  for (const m of mutations(prev, opts.mode)) {
    if (Date.now() - started > 1500) break;
    try {
      if (matches(m.mutated)) return { bug: m.bug, message: m.message };
    } catch {
      /* variante no evaluable */
    }
  }
  const result = eq ?? compareLines(prev, curr, opts);
  return { message: genericMessage(result, opts) };
}

/** ¿La línea ya expresa la respuesta (x = 3, x = 2 ∨ x = -1, x > 4, [1, 3)…)? */
export function isFinalForm(node: Node, opts: StepOptions): boolean {
  const v = opts.variable ?? 'x';
  const isVar = (n: Node) => n.type === 'sym' && (n.name === v || n.name.startsWith(`${v}_`));
  switch (opts.mode) {
    case 'equation': {
      if (node.type === 'set') return node.items.every(isNumeric);
      if (node.type === 'rel' && node.op === '=') return (isVar(node.left) && isNumeric(node.right)) || (isVar(node.right) && isNumeric(node.left));
      if (node.type === 'logic' && node.op === 'or') return isFinalForm(node.left, opts) && isFinalForm(node.right, opts);
      if (node.type === 'list') return node.items.every((it) => isFinalForm(it, opts) || isNumeric(it));
      return false;
    }
    case 'inequality': {
      if (node.type === 'rel') return (isVar(node.left) && isNumeric(node.right)) || (isVar(node.right) && isNumeric(node.left));
      if (node.type === 'chain') return node.items.length === 3 && isVar(node.items[1]) && isNumeric(node.items[0]) && isNumeric(node.items[2]);
      if (node.type === 'tuple' || node.type === 'setop' || node.type === 'set') return realSetOf(node, v) !== null;
      if (node.type === 'logic' && node.op === 'or') return isFinalForm(node.left, opts) && isFinalForm(node.right, opts);
      if (node.type === 'sym') return node.name === 'R';
      return false;
    }
    default:
      return true;
  }
}

/**
 * Valida una cadena de pasos a partir del enunciado `start`. Cada línea se
 * compara con la anterior (validez local) y con el enunciado (arrastre de errores).
 */
export function validateSteps(start: Node, lines: string[], opts: StepOptions): LineResult[] {
  const parseMode = opts.parseMode ?? defaultParseMode(opts.mode);
  const results: LineResult[] = [];
  let prev: Node = start;
  let prevWasWrong = false;
  let firstErrorLine = -1;

  lines.forEach((source, index) => {
    if (!source.trim()) {
      results.push({ index, source, status: 'empty', message: '' });
      return;
    }
    let node: Node;
    try {
      node = parse(source, { mode: parseMode });
    } catch (e) {
      results.push({ index, source, status: 'parse-error', message: e instanceof Error ? e.message : 'No se pudo leer la línea.' });
      return;
    }
    const global = compareLines(start, node, opts);
    const isFinal = isFinalForm(node, opts);
    if (global.equivalent) {
      results.push({ index, source, node, status: 'ok', message: isFinal ? '¡Correcto!' : 'Paso correcto.', domainWarning: global.domainWarning, isFinal });
      prev = node;
      prevWasWrong = false;
      return;
    }
    if (prevWasWrong) {
      const local = compareLines(prev, node, opts);
      if (local.equivalent) {
        results.push({
          index, source, node, status: 'carried', isFinal,
          message: `El paso es coherente con la línea anterior, pero arrastra el error de la línea ${firstErrorLine + 1}.`,
        });
        prev = node;
        return;
      }
    }
    const d = diagnose(prev, node, opts);
    results.push({ index, source, node, status: 'error', message: d.message, bug: d.bug, isFinal });
    if (!prevWasWrong) firstErrorLine = index;
    prevWasWrong = true;
    prev = node;
  });
  return results;
}

/** Texto LaTeX de una solución numérica de ecuación. */
export function solutionsLatex(roots: number[], v = 'x'): string {
  if (!roots.length) return '\\emptyset';
  if (roots.length === 1) return `${v} = ${formatNumber(roots[0])}`;
  return roots.map((r, i) => `${v}_{${i + 1}} = ${formatNumber(r)}`).join(',\\quad ');
}
