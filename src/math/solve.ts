// Resolución numérica: raíces, conjuntos solución de ecuaciones e inecuaciones en una variable.
import type { Node } from './ast';
import { containsType, expandPm, freeVars } from './ast';
import { approxEqual, evalBool, evalNum } from './evaluate';
import { formatNumber } from './print';

export interface Interval {
  lo: number;
  hi: number;
  loClosed: boolean;
  hiClosed: boolean;
}

/** Unión ordenada de intervalos disjuntos (un punto aislado es [a, a]). */
export type RealSet = Interval[];

const EPS = 1e-7;

function uniqSorted(xs: number[], tol = 1e-6): number[] {
  const s = xs.filter(Number.isFinite).sort((a, b) => a - b);
  const out: number[] = [];
  for (const x of s) {
    if (!out.length || Math.abs(x - out[out.length - 1]) > tol * Math.max(1, Math.abs(x))) out.push(x);
  }
  return out;
}

function niceCandidates(lo: number, hi: number, quick = false): number[] {
  const c: number[] = [];
  if (quick) {
    for (let q = 1; q <= 6; q++) {
      for (let p = Math.max(Math.ceil(lo * q), -30 * q); p <= Math.min(Math.floor(hi * q), 30 * q); p++) c.push(p / q);
    }
    return c;
  }
  for (let q = 1; q <= 12; q++) {
    const a = Math.max(Math.ceil(lo * q), -40 * q);
    const b = Math.min(Math.floor(hi * q), 40 * q);
    for (let p = a; p <= b; p++) c.push(p / q);
  }
  for (let k = 2; k <= 60; k++) {
    const r = Math.sqrt(k);
    if (Number.isInteger(r)) continue;
    for (const m of [1, 2, 3, 0.5, 1 / 3]) {
      for (const s of [r * m, -r * m]) if (s >= lo && s <= hi) c.push(s);
    }
    // (a ± √k)/b
    for (let a = -6; a <= 6; a++) {
      for (const b of [1, 2, 3, 4]) {
        for (const s of [(a + r) / b, (a - r) / b]) if (s >= lo && s <= hi) c.push(s);
      }
    }
  }
  for (let k = -48; k <= 48; k++) {
    const v = (k * Math.PI) / 12;
    if (v >= lo && v <= hi) c.push(v);
  }
  for (const e of [Math.E, Math.log(2), Math.log(3), Math.log(5), Math.log(10)]) if (e >= lo && e <= hi) c.push(e);
  return c;
}

/** Raíces reales de f en [lo, hi] (numéricas, con refinamiento). */
export function findRoots(f: (x: number) => number, lo = -60, hi = 60, steps = 6000, quick = false): number[] {
  const roots: number[] = [];
  const scaleAt = (x: number) => Math.max(1, Math.abs(x));

  for (const c of niceCandidates(lo, hi, quick)) {
    const v = f(c);
    if (Number.isFinite(v) && Math.abs(v) < 1e-10 * scaleAt(c)) roots.push(c);
  }

  const h = (hi - lo) / steps;
  let px = lo;
  let pv = f(px);
  let ppv = NaN;
  for (let i = 1; i <= steps; i++) {
    const x = lo + i * h;
    const v = f(x);
    if (Number.isFinite(pv) && Number.isFinite(v)) {
      if (pv === 0) roots.push(px);
      else if ((pv < 0 && v > 0) || (pv > 0 && v < 0)) {
        let a = px, b = x, fa = pv;
        for (let k = 0; k < 80; k++) {
          const m = (a + b) / 2;
          const fm = f(m);
          if (!Number.isFinite(fm)) break;
          if ((fa < 0 && fm > 0) || (fa > 0 && fm < 0)) b = m;
          else { a = m; fa = fm; }
        }
        const r = (a + b) / 2;
        const fr = f(r);
        if (Number.isFinite(fr) && Math.abs(fr) < 1e-6 * Math.max(1, Math.abs(pv), Math.abs(v)) && Math.abs(fr) < 1e-4) roots.push(r);
      }
      // Mínimo local de |f| cercano a cero (raíz doble)
      if (Number.isFinite(ppv) && Math.abs(pv) <= Math.abs(ppv) && Math.abs(pv) <= Math.abs(v) && Math.abs(pv) < 1e-2) {
        let a = px - h, b = x;
        const g = (t: number) => Math.abs(f(t));
        const phi = (Math.sqrt(5) - 1) / 2;
        let c = b - phi * (b - a), d = a + phi * (b - a);
        for (let k = 0; k < 80; k++) {
          if (g(c) < g(d)) b = d; else a = c;
          c = b - phi * (b - a);
          d = a + phi * (b - a);
        }
        const m = (a + b) / 2;
        if (g(m) < 1e-9) roots.push(m);
      }
    }
    ppv = pv;
    px = x;
    pv = v;
  }
  return uniqSorted(roots);
}

function relFunction(node: Node, variable: string, fixed: Record<string, number> = {}): ((x: number) => number) | null {
  if (node.type !== 'rel') return null;
  const { left, right } = node;
  return (x: number) => evalNum(left, { ...fixed, [variable]: x }) - evalNum(right, { ...fixed, [variable]: x });
}

export type EquationSolution =
  | { kind: 'finite'; roots: number[] }
  | { kind: 'all' }
  | { kind: 'unknown' };

/**
 * Conjunto solución de una ecuación (o de una disyunción / lista de ecuaciones
 * como «x = 2 ∨ x = -3»), también de un conjunto {2, 3} o ∅.
 */
export function solveEquation(node: Node, variable: string, range: [number, number] = [-60, 60], fixed: Record<string, number> = {}, quick = false): EquationSolution {
  if (containsType(node, ['pm'])) {
    let all: number[] = [];
    for (const branch of expandPm(node)) {
      const s = solveEquation(branch, variable, range, fixed, quick);
      if (s.kind !== 'finite') return s;
      all = all.concat(s.roots);
    }
    return { kind: 'finite', roots: uniqSorted(all) };
  }
  if (node.type === 'set') {
    const vals = node.items.map((it) => evalNum(it, fixed));
    if (vals.some((v) => !Number.isFinite(v))) return { kind: 'unknown' };
    return { kind: 'finite', roots: uniqSorted(vals) };
  }
  if ((node.type === 'logic' && node.op === 'or') || node.type === 'list') {
    const parts = node.type === 'list' ? node.items : [node.left, node.right];
    // «x = 2, 3» → el segundo elemento es un valor suelto
    let all: number[] = [];
    for (const part of parts) {
      if (part.type !== 'rel' && part.type !== 'logic' && part.type !== 'list' && part.type !== 'set') {
        const v = evalNum(part, fixed);
        if (!Number.isFinite(v)) return { kind: 'unknown' };
        all.push(v);
        continue;
      }
      const s = solveEquation(part, variable, range, fixed, quick);
      if (s.kind !== 'finite') return s;
      all = all.concat(s.roots);
    }
    return { kind: 'finite', roots: uniqSorted(all) };
  }
  if (node.type !== 'rel' || node.op !== '=') return { kind: 'unknown' };

  // Forma resuelta: x = número
  if (node.left.type === 'sym' && node.left.name === variable && !freeVars(node.right).has(variable)) {
    const v = evalNum(node.right, fixed);
    if (Number.isFinite(v)) return { kind: 'finite', roots: [v] };
  }
  if (node.right.type === 'sym' && node.right.name === variable && !freeVars(node.left).has(variable)) {
    const v = evalNum(node.left, fixed);
    if (Number.isFinite(v)) return { kind: 'finite', roots: [v] };
  }

  const f = relFunction(node, variable, fixed)!;
  // ¿Identidad?
  let finite = 0;
  let zeros = 0;
  for (let i = 0; i < 41; i++) {
    const x = range[0] + ((range[1] - range[0]) * (i + 0.37)) / 41;
    const v = f(x);
    if (Number.isFinite(v)) {
      finite++;
      if (Math.abs(v) < 1e-9) zeros++;
    }
  }
  if (finite > 10 && zeros === finite) return { kind: 'all' };
  return { kind: 'finite', roots: findRoots(f, range[0], range[1], quick ? 2400 : 6000, quick) };
}

export function sameRoots(a: number[], b: number[], tol = 1e-6): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => Math.abs(x - b[i]) <= tol * Math.max(1, Math.abs(x)));
}

// ---------------------------------------------------------------------------
// Inecuaciones y conjuntos de números reales
// ---------------------------------------------------------------------------

function collectRels(node: Node, out: Node[] = []): Node[] {
  if (node.type === 'rel') out.push(node);
  else if (node.type === 'chain') {
    for (let i = 0; i < node.ops.length; i++) out.push({ type: 'rel', op: node.ops[i], left: node.items[i], right: node.items[i + 1] });
  } else if (node.type === 'logic' || node.type === 'not' || node.type === 'list') {
    const kids = node.type === 'logic' ? [node.left, node.right] : node.type === 'not' ? [node.arg] : node.items;
    kids.forEach((k) => collectRels(k, out));
  }
  return out;
}

/** Conjunto de x que satisfacen un predicado, a partir de sus puntos frontera. */
function setFromPredicate(pred: (x: number) => boolean, boundaries: number[], lo: number, hi: number): RealSet {
  const pts = uniqSorted(boundaries.filter((b) => b > lo && b < hi));
  const cuts = [lo, ...pts, hi];
  const pieces: Interval[] = [];
  const push = (iv: Interval) => {
    const last = pieces[pieces.length - 1];
    if (last && approxEqual(last.hi, iv.lo, 1e-9, 1e-9) && (last.hiClosed || iv.loClosed)) {
      last.hi = iv.hi;
      last.hiClosed = iv.hiClosed;
    } else pieces.push({ ...iv });
  };
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i];
    const b = cuts[i + 1];
    if (i > 0 && pred(a)) push({ lo: a, hi: a, loClosed: true, hiClosed: true });
    const mid = (a + b) / 2;
    if (pred(mid)) push({ lo: a, hi: b, loClosed: false, hiClosed: false });
  }
  // Extremos del rango de búsqueda → ±∞
  for (const iv of pieces) {
    if (iv.lo === lo) { iv.lo = -Infinity; iv.loClosed = false; }
    if (iv.hi === hi) { iv.hi = Infinity; iv.hiClosed = false; }
  }
  return pieces;
}

function domainEdges(f: (x: number) => number, lo: number, hi: number, steps = 4000): number[] {
  const edges: number[] = [];
  const h = (hi - lo) / steps;
  let prevOk = Number.isFinite(f(lo));
  for (let i = 1; i <= steps; i++) {
    const x = lo + i * h;
    const ok = Number.isFinite(f(x));
    if (ok !== prevOk) {
      let a = x - h, b = x;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2;
        if (Number.isFinite(f(m)) === prevOk) a = m; else b = m;
      }
      const cand = [(a + b) / 2, Math.round((a + b) / 2)].find((c) => Math.abs(c - (a + b) / 2) < 1e-6);
      edges.push(cand ?? (a + b) / 2);
    }
    prevOk = ok;
  }
  return edges;
}

/**
 * Conjunto solución (en la recta real) de una inecuación, sistema de
 * inecuaciones, ecuación, intervalo o unión de intervalos en `variable`.
 */
export function realSetOf(node: Node, variable: string, range: [number, number] = [-200, 200]): RealSet | null {
  const [lo, hi] = range;
  switch (node.type) {
    case 'tuple': {
      if (node.items.length !== 2) return null;
      const a = evalNum(node.items[0]);
      const b = evalNum(node.items[1]);
      if (Number.isNaN(a) || Number.isNaN(b) || a > b) return null;
      return [{ lo: a, hi: b, loClosed: node.open === '[' && Number.isFinite(a), hiClosed: node.close === ']' && Number.isFinite(b) }];
    }
    case 'set': {
      const vals = uniqSorted(node.items.map((it) => evalNum(it)));
      if (vals.length !== node.items.length) return null;
      return vals.map((v) => ({ lo: v, hi: v, loClosed: true, hiClosed: true }));
    }
    case 'sym':
      if (node.name === 'R') return [{ lo: -Infinity, hi: Infinity, loClosed: false, hiClosed: false }];
      return null;
    case 'setop': {
      const a = realSetOf(node.left, variable, range);
      const b = realSetOf(node.right, variable, range);
      if (!a || !b) return null;
      if (node.op === 'union') return unionSets(a, b);
      if (node.op === 'inter') return intersectSets(a, b);
      if (node.op === 'diff') return intersectSets(a, complementSet(b));
      return null;
    }
    case 'list': {
      let acc: RealSet = [];
      for (const it of node.items) {
        const s = realSetOf(it, variable, range);
        if (!s) return null;
        acc = unionSets(acc, s);
      }
      return acc;
    }
    default:
      break;
  }
  const rels = collectRels(node);
  if (!rels.length) return null;
  const boundaries: number[] = [];
  for (const r of rels) {
    const f = relFunction(r, variable);
    if (!f) continue;
    boundaries.push(...findRoots(f, lo, hi, 8000));
    boundaries.push(...domainEdges(f, lo, hi));
  }
  const pred = (x: number) => {
    try {
      return evalBool(node, {}, { [variable]: x });
    } catch {
      return false;
    }
  };
  return setFromPredicate(pred, boundaries, lo, hi);
}

export function complementSet(s: RealSet): RealSet {
  const pts = uniqSorted(s.flatMap((iv) => [iv.lo, iv.hi]).filter(Number.isFinite), 1e-12);
  return setFromPredicate((x) => !contains(s, x), pts, -1e12, 1e12);
}

function contains(s: RealSet, x: number): boolean {
  return s.some((iv) => (x > iv.lo || (x === iv.lo && iv.loClosed)) && (x < iv.hi || (x === iv.hi && iv.hiClosed)));
}

function combine(a: RealSet, b: RealSet, op: (x: boolean, y: boolean) => boolean): RealSet {
  const pts = uniqSorted([...a, ...b].flatMap((iv) => [iv.lo, iv.hi]).filter(Number.isFinite), 1e-12);
  const lo = -1e12, hi = 1e12;
  const pred = (x: number) => op(contains(a, x), contains(b, x));
  return setFromPredicate(pred, pts, lo, hi);
}

export function unionSets(a: RealSet, b: RealSet): RealSet {
  return combine(a, b, (x, y) => x || y);
}

export function intersectSets(a: RealSet, b: RealSet): RealSet {
  return combine(a, b, (x, y) => x && y);
}

export function sameRealSet(a: RealSet, b: RealSet, tol = 1e-6): boolean {
  if (a.length !== b.length) return false;
  const close = (x: number, y: number) => (x === y) || (Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= tol * Math.max(1, Math.abs(x)));
  return a.every((iv, i) => {
    const jv = b[i];
    return close(iv.lo, jv.lo) && close(iv.hi, jv.hi) && iv.loClosed === jv.loClosed && iv.hiClosed === jv.hiClosed;
  });
}

/** Representación en notación de intervalos, en LaTeX. */
export function realSetToLatex(s: RealSet, decimalComma = true): string {
  if (!s.length) return '\\emptyset';
  const f = (x: number) => (x === Infinity ? '+\\infty' : x === -Infinity ? '-\\infty' : formatNumber(x, decimalComma));
  const sep = decimalComma ? ';\\ ' : ',\\ ';
  return s
    .map((iv) => {
      if (iv.lo === iv.hi) return `\\{${f(iv.lo)}\\}`;
      return `${iv.loClosed ? '[' : '('}${f(iv.lo)}${sep}${f(iv.hi)}${iv.hiClosed ? ']' : ')'}`;
    })
    .join(' \\cup ');
}

export { EPS };
