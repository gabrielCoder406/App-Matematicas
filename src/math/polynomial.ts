// Polinomios en varias variables con coeficientes racionales exactos.
import type { Node } from './ast';
import { CONSTANTS } from './ast';
import { Frac, gcd } from './fraction';

export type Monomial = Record<string, number>;

function monoKey(m: Monomial): string {
  return Object.keys(m)
    .filter((v) => m[v] !== 0)
    .sort()
    .map((v) => `${v}^${m[v]}`)
    .join('*');
}

function monoDegree(m: Monomial): number {
  return Object.values(m).reduce((a, b) => a + b, 0);
}

function monoMul(a: Monomial, b: Monomial): Monomial {
  const r: Monomial = { ...a };
  for (const [v, e] of Object.entries(b)) r[v] = (r[v] ?? 0) + e;
  return r;
}

const VAR_ORDER = 'xyzwabcdmnpqrstuvhk';
function varRank(v: string): number {
  const i = VAR_ORDER.indexOf(v[0]);
  return i === -1 ? 100 : i;
}

function compareMonos(a: Monomial, b: Monomial): number {
  const da = monoDegree(a);
  const db = monoDegree(b);
  if (da !== db) return db - da;
  const vars = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort((x, y) => varRank(x) - varRank(y) || x.localeCompare(y));
  for (const v of vars) {
    const ea = a[v] ?? 0;
    const eb = b[v] ?? 0;
    if (ea !== eb) return eb - ea;
  }
  return 0;
}

export class Poly {
  readonly terms: Map<string, { mono: Monomial; coef: Frac }>;

  constructor(terms?: Map<string, { mono: Monomial; coef: Frac }>) {
    this.terms = terms ?? new Map();
  }

  static const(c: number | Frac): Poly {
    const f = Frac.of(c);
    const p = new Poly();
    if (!f.isZero()) p.terms.set('', { mono: {}, coef: f });
    return p;
  }

  static variable(name: string, power = 1): Poly {
    const p = new Poly();
    const mono = { [name]: power };
    p.terms.set(monoKey(mono), { mono, coef: new Frac(1) });
    return p;
  }

  /** Construye un polinomio en `v` a partir de coeficientes [a0, a1, a2…]. */
  static fromCoeffs(coeffs: (number | Frac)[], v = 'x'): Poly {
    let p = new Poly();
    coeffs.forEach((c, i) => {
      p = p.add(Poly.variable(v, i).scale(Frac.of(c)));
    });
    return p;
  }

  add(o: Poly): Poly {
    const r = new Map(this.terms);
    for (const [k, t] of o.terms) {
      const cur = r.get(k);
      const coef = cur ? cur.coef.add(t.coef) : t.coef;
      if (coef.isZero()) r.delete(k);
      else r.set(k, { mono: t.mono, coef });
    }
    return new Poly(r);
  }

  neg(): Poly {
    return this.scale(new Frac(-1));
  }

  sub(o: Poly): Poly {
    return this.add(o.neg());
  }

  scale(c: Frac | number): Poly {
    const f = Frac.of(c);
    const r = new Map<string, { mono: Monomial; coef: Frac }>();
    if (f.isZero()) return new Poly(r);
    for (const [k, t] of this.terms) r.set(k, { mono: t.mono, coef: t.coef.mul(f) });
    return new Poly(r);
  }

  mul(o: Poly): Poly {
    let r = new Poly();
    for (const a of this.terms.values()) {
      for (const b of o.terms.values()) {
        const mono = monoMul(a.mono, b.mono);
        const p = new Poly();
        p.terms.set(monoKey(mono), { mono, coef: a.coef.mul(b.coef) });
        r = r.add(p);
      }
    }
    return r;
  }

  pow(n: number): Poly {
    let r = Poly.const(1);
    for (let i = 0; i < n; i++) r = r.mul(this);
    return r;
  }

  isZero(): boolean {
    return this.terms.size === 0;
  }

  isConstant(): boolean {
    return [...this.terms.keys()].every((k) => k === '');
  }

  constantValue(): Frac {
    return this.terms.get('')?.coef ?? new Frac(0);
  }

  vars(): string[] {
    const s = new Set<string>();
    for (const t of this.terms.values()) Object.keys(t.mono).forEach((v) => s.add(v));
    return [...s].sort();
  }

  degree(v?: string): number {
    let d = 0;
    for (const t of this.terms.values()) d = Math.max(d, v ? t.mono[v] ?? 0 : monoDegree(t.mono));
    return this.isZero() ? -Infinity : d;
  }

  /** Coeficientes [a0, a1, …] como polinomio en una sola variable. */
  coeffs(v = 'x'): Frac[] {
    const out: Frac[] = [];
    const deg = Math.max(0, this.degree(v));
    for (let i = 0; i <= deg; i++) out.push(new Frac(0));
    for (const t of this.terms.values()) {
      const others = Object.keys(t.mono).filter((k) => k !== v && t.mono[k] !== 0);
      if (others.length) throw new Error('No es un polinomio en una sola variable.');
      const e = t.mono[v] ?? 0;
      out[e] = out[e].add(t.coef);
    }
    return out;
  }

  equals(o: Poly): boolean {
    return this.sub(o).isZero();
  }

  evaluate(env: Record<string, number>): number {
    let s = 0;
    for (const t of this.terms.values()) {
      let m = t.coef.toNumber();
      for (const [v, e] of Object.entries(t.mono)) m *= Math.pow(env[v], e);
      s += m;
    }
    return s;
  }

  /** Términos ordenados (grado descendente). */
  sortedTerms(): { mono: Monomial; coef: Frac }[] {
    return [...this.terms.values()].sort((a, b) => compareMonos(a.mono, b.mono));
  }

  toNode(): Node {
    const terms = this.sortedTerms();
    if (!terms.length) return { type: 'num', value: 0 };
    const nodes = terms.map(({ mono, coef }) => {
      const factors: Node[] = [];
      const vars = Object.keys(mono)
        .filter((v) => mono[v] !== 0)
        .sort((x, y) => varRank(x) - varRank(y) || x.localeCompare(y));
      const abs = coef.abs();
      if (!(abs.eq(1) && vars.length)) factors.push(abs.toNode());
      for (const v of vars) {
        const s: Node = { type: 'sym', name: v };
        factors.push(mono[v] === 1 ? s : { type: 'pow', base: s, exp: { type: 'num', value: mono[v] } });
      }
      const body: Node = factors.length === 1 ? factors[0] : { type: 'mul', factors };
      return coef.sign() < 0 ? ({ type: 'neg', arg: body } as Node) : body;
    });
    return nodes.length === 1 ? nodes[0] : { type: 'add', terms: nodes };
  }

  /** MCD de los coeficientes enteros (para detectar factor común). */
  contentGcd(): number {
    let g = 0;
    for (const t of this.terms.values()) {
      if (!t.coef.isInt()) return 1;
      g = gcd(g, t.coef.n);
    }
    return g || 1;
  }

  /** Raíces racionales (teorema de la raíz racional) en una variable. */
  rationalRoots(v = 'x'): Frac[] {
    const cs = this.coeffs(v);
    let lcmDen = 1;
    for (const c of cs) lcmDen = (lcmDen * c.d) / gcd(lcmDen, c.d);
    const ints = cs.map((c) => c.mul(lcmDen).n);
    let low = 0;
    while (low < ints.length && ints[low] === 0) low++;
    const roots: Frac[] = low > 0 ? [new Frac(0)] : [];
    const trimmed = ints.slice(low);
    if (trimmed.length <= 1) return roots;
    const a0 = Math.abs(trimmed[0]);
    const an = Math.abs(trimmed[trimmed.length - 1]);
    const divisors = (n: number) => {
      const d: number[] = [];
      for (let i = 1; i <= Math.min(n, 5000); i++) if (n % i === 0) d.push(i);
      return d;
    };
    const seen = new Set<string>();
    for (const p of divisors(a0)) {
      for (const q of divisors(an)) {
        for (const s of [1, -1]) {
          const r = new Frac(s * p, q);
          const key = r.toText();
          if (seen.has(key)) continue;
          seen.add(key);
          let acc = new Frac(0);
          for (let i = trimmed.length - 1; i >= 0; i--) acc = acc.mul(r).add(trimmed[i]);
          if (acc.isZero()) roots.push(r);
        }
      }
    }
    return roots;
  }

  /** Convierte un árbol en polinomio (null si no lo es: raíces, funciones, divisiones por variables…). */
  static fromNode(node: Node): Poly | null {
    switch (node.type) {
      case 'num':
        return Poly.const(Frac.fromNumber(node.value));
      case 'sym':
        if (CONSTANTS.has(node.name)) return null;
        return Poly.variable(node.name);
      case 'neg': {
        const p = Poly.fromNode(node.arg);
        return p ? p.neg() : null;
      }
      case 'add': {
        let r = new Poly();
        for (const t of node.terms) {
          const p = Poly.fromNode(t);
          if (!p) return null;
          r = r.add(p);
        }
        return r;
      }
      case 'mul': {
        let r = Poly.const(1);
        for (const f of node.factors) {
          const p = Poly.fromNode(f);
          if (!p) return null;
          r = r.mul(p);
        }
        return r;
      }
      case 'div': {
        const n = Poly.fromNode(node.num);
        const d = Poly.fromNode(node.den);
        if (!n || !d || !d.isConstant() || d.isZero()) return null;
        return n.scale(new Frac(1).div(d.constantValue()));
      }
      case 'pow': {
        const b = Poly.fromNode(node.base);
        const e = Poly.fromNode(node.exp);
        if (!b || !e || !e.isConstant()) return null;
        const k = e.constantValue();
        if (!k.isInt() || k.n < 0 || k.n > 12) return null;
        return b.pow(k.n);
      }
      default:
        return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Chequeos de forma
// ---------------------------------------------------------------------------

/** ¿Es un monomio escrito como producto de número y potencias de variables? */
function isMonomialNode(n: Node): boolean {
  if (n.type === 'neg') return isMonomialNode(n.arg);
  if (n.type === 'num') return true;
  if (n.type === 'sym') return !CONSTANTS.has(n.name);
  if (n.type === 'pow') return n.base.type === 'sym' && n.exp.type === 'num';
  if (n.type === 'div') return isMonomialNode(n.num) && n.den.type === 'num';
  if (n.type === 'mul') return n.factors.every((f, i) => isMonomialNode(f) && (f.type !== 'neg' || i === 0));
  return false;
}

/** Forma desarrollada y reducida: suma de monomios sin términos semejantes repetidos. */
export function isExpandedForm(node: Node): boolean {
  const terms = node.type === 'add' ? node.terms : [node];
  if (!terms.every(isMonomialNode)) return false;
  const keys = new Set<string>();
  for (const t of terms) {
    const p = Poly.fromNode(t);
    if (!p) return false;
    if (p.isZero()) return terms.length === 1;
    const [only] = p.sortedTerms();
    const k = monoKey(only.mono);
    if (keys.has(k)) return false;
    keys.add(k);
  }
  return true;
}

function factorList(node: Node): Node[] {
  if (node.type === 'neg') return factorList(node.arg);
  if (node.type === 'mul') return node.factors.flatMap(factorList);
  return [node];
}

export interface FactoredCheck {
  ok: boolean;
  reason?: 'not-product' | 'reducible-factor' | 'common-factor';
  factor?: Node;
}

/**
 * ¿Está completamente factorizado sobre los racionales? Producto de factores
 * de grado ≤ 1 en la variable o cuadráticos sin raíces racionales.
 */
export function checkFactored(node: Node, v = 'x'): FactoredCheck {
  const factors = factorList(node);
  const nonConst = factors.filter((f) => {
    const p = Poly.fromNode(f.type === 'pow' ? f.base : f);
    return !p || !p.isConstant();
  });
  const isPowOfPoly = factors.length === 1 && factors[0].type === 'pow' && factors[0].base.type === 'add';
  if (nonConst.length < 2 && !isPowOfPoly) {
    const only = nonConst[0];
    const p = only ? Poly.fromNode(only) : null;
    if (!p || p.degree(v) <= 1) {
      // Un único factor lineal (ej. 3(x+2)) cuenta como factorizado si hay constante sacada
      if (factors.length >= 2) return { ok: true };
    }
    return { ok: false, reason: 'not-product' };
  }
  for (const f of factors) {
    const base = f.type === 'pow' ? f.base : f;
    const p = Poly.fromNode(base);
    if (!p || p.isConstant()) continue;
    let deg: number;
    try {
      deg = p.degree(v);
      p.coeffs(v);
    } catch {
      continue;
    }
    if (deg >= 2 && p.rationalRoots(v).length > 0) return { ok: false, reason: 'reducible-factor', factor: base };
    if (base.type === 'add' && p.contentGcd() > 1 && deg >= 1) return { ok: false, reason: 'common-factor', factor: base };
  }
  return { ok: true };
}
