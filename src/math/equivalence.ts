// Comprobación de equivalencia entre expresiones, ecuaciones, inecuaciones, proposiciones y conjuntos.
import type { Node } from './ast';
import { freeVars } from './ast';
import { approxEqual, evalBool, evalMembership, evalNum, type NumEnv } from './evaluate';
import { realSetOf, sameRealSet, sameRoots, solveEquation, type RealSet } from './solve';

export interface EquivResult {
  equivalent: boolean;
  reason?: 'different' | 'undetermined' | 'lost-solutions' | 'extra-solutions' | 'different-solutions' | 'not-comparable';
  /** Asignación donde difieren, con los valores de cada lado. */
  counterexample?: { env: Record<string, number | boolean>; a: number | boolean; b: number | boolean };
  /** El dominio de ambas expresiones no coincide (pero sí sus valores donde ambas existen). */
  domainWarning?: boolean;
  rootsA?: number[];
  rootsB?: number[];
  setA?: RealSet;
  setB?: RealSet;
}

const BASE_SAMPLES = [0.37, -1.21, 2.13, -2.71, 1.73, 3.07, -0.53, 0.91, -3.41, 1.19, 2.61, -1.87, 4.3, -4.7, 0.23, 5.11];
const POS_SAMPLES = [0.37, 1.21, 2.13, 2.71, 1.73, 3.07, 0.53, 0.91, 3.41, 1.19, 2.61, 1.87, 4.3, 4.7, 0.23, 5.11];

function sampleEnvs(vars: string[], positive: boolean): NumEnv[] {
  const base = positive ? POS_SAMPLES : BASE_SAMPLES;
  return base.map((_, i) => {
    const env: NumEnv = {};
    vars.forEach((v, k) => {
      env[v] = base[(i + 5 * k) % base.length] * (1 + 0.13 * k);
    });
    return env;
  });
}

/** Busca un contraejemplo «bonito» (valores enteros pequeños) para mostrarlo al estudiante. */
function niceCounterexample(a: Node, b: Node, vars: string[]): EquivResult['counterexample'] | undefined {
  const candidates = [2, 3, 1, -1, 4, -2, 5, -3, 10];
  const combos: NumEnv[] = [];
  if (vars.length === 0) combos.push({});
  else if (vars.length === 1) candidates.forEach((c) => combos.push({ [vars[0]]: c }));
  else {
    for (const c1 of candidates.slice(0, 5)) for (const c2 of candidates.slice(0, 5)) {
      const env: NumEnv = {};
      vars.forEach((v, k) => (env[v] = k === 0 ? c1 : k === 1 ? c2 : candidates[k % candidates.length]));
      combos.push(env);
    }
  }
  for (const env of combos) {
    const va = evalNum(a, env);
    const vb = evalNum(b, env);
    if (Number.isFinite(va) && Number.isFinite(vb) && !approxEqual(va, vb, 1e-9, 1e-9)) return { env, a: va, b: vb };
  }
  return undefined;
}

/** ¿Tienen a y b el mismo valor para todos los valores de sus variables? */
export function exprEquivalent(a: Node, b: Node, extraVars: string[] = []): EquivResult {
  const vars = [...new Set([...freeVars(a), ...freeVars(b), ...extraVars])].sort();
  if (vars.length === 0) {
    const va = evalNum(a);
    const vb = evalNum(b);
    if (!Number.isFinite(va) || !Number.isFinite(vb)) {
      if (Number.isNaN(va) && Number.isNaN(vb)) return { equivalent: false, reason: 'undetermined' };
      if (va === vb) return { equivalent: true };
      return { equivalent: false, reason: 'different', counterexample: { env: {}, a: va, b: vb } };
    }
    return approxEqual(va, vb, 1e-9, 1e-10)
      ? { equivalent: true }
      : { equivalent: false, reason: 'different', counterexample: { env: {}, a: va, b: vb } };
  }

  for (const positive of [false, true]) {
    let comparable = 0;
    let definednessMismatch = 0;
    let mismatch: EquivResult['counterexample'];
    for (const env of sampleEnvs(vars, positive)) {
      const va = evalNum(a, env);
      const vb = evalNum(b, env);
      const fa = Number.isFinite(va);
      const fb = Number.isFinite(vb);
      if (fa && fb) {
        comparable++;
        if (!approxEqual(va, vb, 1e-8, 1e-9)) {
          mismatch = { env, a: va, b: vb };
          break;
        }
      } else if (fa !== fb) definednessMismatch++;
    }
    if (mismatch) {
      return { equivalent: false, reason: 'different', counterexample: niceCounterexample(a, b, vars) ?? mismatch };
    }
    if (comparable >= 5) return { equivalent: true, domainWarning: definednessMismatch > 0 };
  }
  return { equivalent: false, reason: 'undetermined' };
}

function isEquationLike(n: Node): boolean {
  if (n.type === 'rel') return n.op === '=';
  if (n.type === 'logic') return n.op === 'or' && isEquationLike(n.left) && isEquationLike(n.right);
  if (n.type === 'list') return n.items.every((it) => isEquationLike(it) || it.type === 'num' || it.type === 'neg' || it.type === 'div');
  if (n.type === 'set') return true;
  return false;
}

export function isEquation(n: Node): boolean {
  return isEquationLike(n);
}

/** Proporcionalidad: (La - Ra) = k·(Lb - Rb) con k constante no nula ⇒ misma solución. */
export function proportional(a: Node, b: Node, vars: string[]): boolean | null {
  if (a.type !== 'rel' || b.type !== 'rel') return null;
  const ga = (env: NumEnv) => evalNum(a.left, env) - evalNum(a.right, env);
  const gb = (env: NumEnv) => evalNum(b.left, env) - evalNum(b.right, env);
  let ratio: number | null = null;
  let checked = 0;
  let zerosA = 0;
  let zerosB = 0;
  for (const positive of [false, true]) {
    for (const env of sampleEnvs(vars, positive)) {
      const va = ga(env);
      const vb = gb(env);
      if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
      const za = Math.abs(va) < 1e-10;
      const zb = Math.abs(vb) < 1e-10;
      if (za) zerosA++;
      if (zb) zerosB++;
      if (za && zb) { checked++; continue; }
      if (za !== zb) return false;
      const r = vb / va;
      if (ratio === null) ratio = r;
      else if (!approxEqual(r, ratio, 1e-7, 1e-10)) return false;
      checked++;
    }
    if (checked >= 6) break;
  }
  if (checked < 6) return null;
  if (ratio === null) return zerosA > 0 && zerosB > 0; // ambas identidades
  return true;
}

/** ¿Tienen las dos ecuaciones el mismo conjunto solución (en `variable`)? */
export function equationsEquivalent(a: Node, b: Node, variable?: string): EquivResult {
  const vars = [...new Set([...freeVars(a), ...freeVars(b)])].sort();
  if (vars.length === 0) {
    return { equivalent: false, reason: 'not-comparable' };
  }
  const prop = proportional(a, b, vars);
  if (prop === true) return { equivalent: true };

  const main = variable && vars.includes(variable) ? variable : vars.includes('x') ? 'x' : vars[0];
  const others = vars.filter((v) => v !== main);
  const trials: Record<string, number>[] = others.length === 0 ? [{}] : [0, 1, 2].map((t) => Object.fromEntries(others.map((o, k) => [o, BASE_SAMPLES[(t * 3 + k) % BASE_SAMPLES.length] + 0.5])));

  let firstA: number[] | undefined;
  let firstB: number[] | undefined;
  for (const fixed of trials) {
    const sa = solveEquation(a, main, [-60, 60], fixed);
    const sb = solveEquation(b, main, [-60, 60], fixed);
    if (sa.kind === 'unknown' || sb.kind === 'unknown') return { equivalent: false, reason: 'undetermined' };
    if (sa.kind === 'all' || sb.kind === 'all') {
      if (sa.kind === sb.kind) continue;
      return { equivalent: false, reason: 'different-solutions' };
    }
    if (!firstA) { firstA = sa.roots; firstB = sb.roots; }
    if (!sameRoots(sa.roots, sb.roots)) {
      const missing = sa.roots.filter((r) => !sb.roots.some((s) => Math.abs(s - r) < 1e-6 * Math.max(1, Math.abs(r))));
      const extra = sb.roots.filter((r) => !sa.roots.some((s) => Math.abs(s - r) < 1e-6 * Math.max(1, Math.abs(r))));
      const reason = missing.length && !extra.length ? 'lost-solutions' : extra.length && !missing.length ? 'extra-solutions' : 'different-solutions';
      return { equivalent: false, reason, rootsA: sa.roots, rootsB: sb.roots };
    }
  }
  return { equivalent: true, rootsA: firstA, rootsB: firstB };
}

/** ¿Tienen las dos inecuaciones (o intervalos) el mismo conjunto solución? */
export function inequalitiesEquivalent(a: Node, b: Node, variable = 'x'): EquivResult {
  const sa = realSetOf(a, variable);
  const sb = realSetOf(b, variable);
  if (!sa || !sb) return { equivalent: false, reason: 'undetermined' };
  return sameRealSet(sa, sb) ? { equivalent: true, setA: sa, setB: sb } : { equivalent: false, reason: 'different-solutions', setA: sa, setB: sb };
}

export function propVars(...nodes: Node[]): string[] {
  const s = new Set<string>();
  nodes.forEach((n) => freeVars(n, s));
  return [...s].sort();
}

/** Todas las asignaciones de verdad para las variables (en orden de tabla: V primero). */
export function assignments(vars: string[]): Record<string, boolean>[] {
  const rows: Record<string, boolean>[] = [];
  const n = vars.length;
  for (let i = 0; i < 1 << n; i++) {
    const row: Record<string, boolean> = {};
    vars.forEach((v, k) => {
      row[v] = ((i >> (n - 1 - k)) & 1) === 0;
    });
    rows.push(row);
  }
  return rows;
}

export function logicEquivalent(a: Node, b: Node): EquivResult {
  const vars = propVars(a, b);
  if (vars.length > 8) return { equivalent: false, reason: 'undetermined' };
  for (const row of assignments(vars)) {
    let va: boolean, vb: boolean;
    try {
      va = evalBool(a, row);
      vb = evalBool(b, row);
    } catch {
      return { equivalent: false, reason: 'undetermined' };
    }
    if (va !== vb) return { equivalent: false, reason: 'different', counterexample: { env: row, a: va, b: vb } };
  }
  return { equivalent: true };
}

/** Equivalencia de expresiones de conjuntos por regiones del diagrama de Venn. */
export function setExprEquivalent(a: Node, b: Node): EquivResult {
  const names = propVars(a, b).filter((n) => n !== 'U' && n !== 'E');
  if (names.length > 6) return { equivalent: false, reason: 'undetermined' };
  for (const row of assignments(names)) {
    let va: boolean, vb: boolean;
    try {
      va = evalMembership(a, row);
      vb = evalMembership(b, row);
    } catch {
      return { equivalent: false, reason: 'undetermined' };
    }
    if (va !== vb) return { equivalent: false, reason: 'different', counterexample: { env: row, a: va, b: vb } };
  }
  return { equivalent: true };
}
