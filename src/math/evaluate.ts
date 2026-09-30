// Evaluación numérica, lógica y de conjuntos.
import type { Node } from './ast';

export type NumEnv = Record<string, number>;
export type BoolEnv = Record<string, boolean>;

const FACT_CACHE: number[] = [1];
export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 170) return NaN;
  for (let i = FACT_CACHE.length; i <= n; i++) FACT_CACHE[i] = FACT_CACHE[i - 1] * i;
  return FACT_CACHE[n];
}

/** Potencia real: admite raíces impares de negativos, p. ej. (-8)^(1/3) = -2. */
export function realPow(base: number, exp: number): number {
  if (base >= 0 || Number.isInteger(exp)) return Math.pow(base, exp);
  for (let q = 3; q <= 15; q += 2) {
    const p = exp * q;
    if (Math.abs(p - Math.round(p)) < 1e-9) {
      const r = Math.pow(-base, exp);
      return Math.round(p) % 2 === 0 ? r : -r;
    }
  }
  return NaN;
}

function nthRoot(x: number, n: number): number {
  if (!Number.isFinite(n) || n === 0) return NaN;
  if (x >= 0) return Math.pow(x, 1 / n);
  if (Number.isInteger(n) && Math.abs(n) % 2 === 1) return -Math.pow(-x, 1 / n);
  return NaN;
}

function applyFn(name: string, a: number, b?: number): number {
  switch (name) {
    case 'sin': return Math.sin(a);
    case 'cos': return Math.cos(a);
    case 'tan': return Math.abs(Math.cos(a)) < 1e-12 ? NaN : Math.tan(a);
    case 'sec': return 1 / Math.cos(a);
    case 'csc': return 1 / Math.sin(a);
    case 'cot': return Math.cos(a) / Math.sin(a);
    case 'asin': return Math.asin(a);
    case 'acos': return Math.acos(a);
    case 'atan': return Math.atan(a);
    case 'ln': return a > 0 ? Math.log(a) : NaN;
    case 'log':
      if (a <= 0) return NaN;
      if (b === undefined) return Math.log10(a);
      return b > 0 && b !== 1 ? Math.log(a) / Math.log(b) : NaN;
    case 'exp': return Math.exp(a);
    case 'sqrt': return a >= 0 ? Math.sqrt(a) : a > -1e-12 ? 0 : NaN;
    case 'root': return nthRoot(a, b ?? 2);
    case 'abs': return Math.abs(a);
    default: return NaN;
  }
}

/** Valor numérico de la expresión (NaN si no está definida o no es numérica). */
export function evalNum(node: Node, env: NumEnv = {}): number {
  switch (node.type) {
    case 'num': return node.value;
    case 'sym':
      if (node.name in env) return env[node.name];
      if (node.name === 'pi') return Math.PI;
      if (node.name === 'e') return Math.E;
      if (node.name === 'infinity') return Infinity;
      return NaN;
    case 'add': {
      let s = 0;
      for (const t of node.terms) s += evalNum(t, env);
      return s;
    }
    case 'neg': return -evalNum(node.arg, env);
    case 'mul': {
      let s = 1;
      for (const f of node.factors) s *= evalNum(f, env);
      return s;
    }
    case 'div': {
      const d = evalNum(node.den, env);
      if (d === 0 || Math.abs(d) < 1e-300) return NaN;
      return evalNum(node.num, env) / d;
    }
    case 'pow': {
      const b = evalNum(node.base, env);
      const e = evalNum(node.exp, env);
      if (b === 0 && e < 0) return NaN;
      if (b === 0 && e === 0) return NaN;
      return realPow(b, e);
    }
    case 'fn': {
      const a = evalNum(node.args[0], env);
      const b = node.args[1] ? evalNum(node.args[1], env) : undefined;
      return applyFn(node.name, a, b);
    }
    case 'fact': return factorial(evalNum(node.arg, env));
    case 'deg': return (evalNum(node.arg, env) * Math.PI) / 180;
    default: return NaN;
  }
}

/** Compila la expresión a una función rápida (para graficar). */
export function compileNum(node: Node): (env: NumEnv) => number {
  switch (node.type) {
    case 'num': { const v = node.value; return () => v; }
    case 'sym': {
      const name = node.name;
      const fallback = name === 'pi' ? Math.PI : name === 'e' ? Math.E : name === 'infinity' ? Infinity : NaN;
      return (env) => (name in env ? env[name] : fallback);
    }
    case 'add': {
      const fs = node.terms.map(compileNum);
      return (env) => { let s = 0; for (const f of fs) s += f(env); return s; };
    }
    case 'neg': { const f = compileNum(node.arg); return (env) => -f(env); }
    case 'mul': {
      const fs = node.factors.map(compileNum);
      return (env) => { let s = 1; for (const f of fs) s *= f(env); return s; };
    }
    case 'div': {
      const n = compileNum(node.num);
      const d = compileNum(node.den);
      return (env) => { const dv = d(env); return dv === 0 ? NaN : n(env) / dv; };
    }
    case 'pow': {
      const b = compileNum(node.base);
      const e = compileNum(node.exp);
      return (env) => {
        const bv = b(env);
        const ev = e(env);
        if (bv === 0 && ev <= 0) return NaN;
        return realPow(bv, ev);
      };
    }
    case 'fn': {
      const a = compileNum(node.args[0]);
      const b = node.args[1] ? compileNum(node.args[1]) : null;
      const name = node.name;
      return (env) => applyFn(name, a(env), b ? b(env) : undefined);
    }
    case 'fact': { const f = compileNum(node.arg); return (env) => factorial(f(env)); }
    case 'deg': { const f = compileNum(node.arg); return (env) => (f(env) * Math.PI) / 180; }
    default: return () => NaN;
  }
}

export function approxEqual(a: number, b: number, rel = 1e-9, abs = 1e-9): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return a === b;
  return Math.abs(a - b) <= Math.max(abs, rel * Math.max(Math.abs(a), Math.abs(b)));
}

function compare(op: string, a: number, b: number): boolean {
  if (Number.isNaN(a) || Number.isNaN(b)) return false;
  const eq = approxEqual(a, b, 1e-9, 1e-9);
  switch (op) {
    case '=': return eq;
    case '!=': return !eq;
    case '<': return a < b && !eq;
    case '>': return a > b && !eq;
    case '<=': return a < b || eq;
    case '>=': return a > b || eq;
    default: return false;
  }
}

/**
 * Valor de verdad. En modo lógico los símbolos son proposiciones; también
 * evalúa relaciones numéricas (x > 3) usando `nums`.
 */
export function evalBool(node: Node, env: BoolEnv = {}, nums: NumEnv = {}): boolean {
  switch (node.type) {
    case 'bool': return node.value;
    case 'sym':
      if (node.name in env) return env[node.name];
      throw new Error(`Proposición sin valor: ${node.name}`);
    case 'num': return node.value !== 0;
    case 'not': return !evalBool(node.arg, env, nums);
    case 'logic': {
      const a = evalBool(node.left, env, nums);
      const b = evalBool(node.right, env, nums);
      switch (node.op) {
        case 'and': return a && b;
        case 'or': return a || b;
        case 'xor': return a !== b;
        case 'implies': return !a || b;
        case 'iff': return a === b;
      }
      break;
    }
    case 'rel':
      return compare(node.op, evalNum(node.left, nums), evalNum(node.right, nums));
    case 'chain': {
      for (let i = 0; i < node.ops.length; i++) {
        if (!compare(node.ops[i], evalNum(node.items[i], nums), evalNum(node.items[i + 1], nums))) return false;
      }
      return true;
    }
    case 'list':
      return node.items.some((it) => evalBool(it, env, nums));
    default:
      throw new Error('La expresión no es una proposición.');
  }
  return false;
}

// ---------------------------------------------------------------------------
// Conjuntos
// ---------------------------------------------------------------------------

export type Elem = string;

export function elemKey(node: Node): Elem {
  if (node.type === 'num') return String(node.value);
  if (node.type === 'neg' && node.arg.type === 'num') return String(-node.arg.value);
  if (node.type === 'sym') return node.name;
  const v = evalNum(node);
  if (Number.isFinite(v)) return String(Math.round(v * 1e9) / 1e9);
  return JSON.stringify(node);
}

/** Evalúa una expresión de conjuntos con conjuntos concretos. */
export function evalSet(node: Node, sets: Record<string, Set<Elem>>, universe?: Set<Elem>): Set<Elem> {
  switch (node.type) {
    case 'sym': {
      if (node.name in sets) return new Set(sets[node.name]);
      if ((node.name === 'U' || node.name === 'E') && universe) return new Set(universe);
      throw new Error(`Conjunto desconocido: ${node.name}`);
    }
    case 'set':
      return new Set(node.items.map(elemKey));
    case 'setop': {
      const a = evalSet(node.left, sets, universe);
      const b = evalSet(node.right, sets, universe);
      switch (node.op) {
        case 'union': return new Set([...a, ...b]);
        case 'inter': return new Set([...a].filter((x) => b.has(x)));
        case 'diff': return new Set([...a].filter((x) => !b.has(x)));
        case 'symdiff': return new Set([...[...a].filter((x) => !b.has(x)), ...[...b].filter((x) => !a.has(x))]);
      }
      break;
    }
    case 'compl': {
      if (!universe) throw new Error('Falta el conjunto universal para calcular el complemento.');
      const a = evalSet(node.arg, sets, universe);
      return new Set([...universe].filter((x) => !a.has(x)));
    }
    case 'add':
      // A - B leído en modo aritmético
      if (node.terms.length === 2 && node.terms[1].type === 'neg') {
        const a = evalSet(node.terms[0], sets, universe);
        const b = evalSet(node.terms[1].arg, sets, universe);
        return new Set([...a].filter((x) => !b.has(x)));
      }
      break;
    default:
      break;
  }
  throw new Error('No es una expresión de conjuntos válida.');
}

/**
 * Pertenencia a una región del diagrama de Venn: `member[A]` indica si el
 * elemento está en A. Devuelve si pertenece a la expresión.
 */
export function evalMembership(node: Node, member: Record<string, boolean>): boolean {
  switch (node.type) {
    case 'sym':
      if (node.name in member) return member[node.name];
      if (node.name === 'U' || node.name === 'E') return true;
      throw new Error(`Conjunto desconocido: ${node.name}`);
    case 'set':
      if (node.items.length === 0) return false;
      throw new Error('No se puede ubicar un conjunto por extensión en el diagrama.');
    case 'setop': {
      const a = evalMembership(node.left, member);
      const b = evalMembership(node.right, member);
      switch (node.op) {
        case 'union': return a || b;
        case 'inter': return a && b;
        case 'diff': return a && !b;
        case 'symdiff': return a !== b;
      }
      break;
    }
    case 'compl':
      return !evalMembership(node.arg, member);
    case 'add':
      if (node.terms.length === 2 && node.terms[1].type === 'neg') {
        return evalMembership(node.terms[0], member) && !evalMembership(node.terms[1].arg, member);
      }
      break;
    default:
      break;
  }
  throw new Error('No es una expresión de conjuntos válida.');
}
