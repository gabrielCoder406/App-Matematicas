// Números racionales exactos para generar y mostrar resultados.
import type { Node } from './ast';

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function lcm(a: number, b: number): number {
  return a && b ? Math.abs(a * b) / gcd(a, b) : 0;
}

export class Frac {
  readonly n: number;
  readonly d: number;

  constructor(n: number, d = 1) {
    if (d === 0) throw new Error('Denominador cero');
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      const f = Frac.fromNumber(n / d);
      this.n = f.n;
      this.d = f.d;
      return;
    }
    const g = gcd(n, d) || 1;
    const s = d < 0 ? -1 : 1;
    this.n = (s * n) / g;
    this.d = (s * d) / g;
  }

  /** Aproximación racional (fracciones continuas) con denominador acotado. */
  static fromNumber(x: number, maxDen = 10000): Frac {
    if (Number.isInteger(x)) return new Frac(x, 1);
    const sign = x < 0 ? -1 : 1;
    let v = Math.abs(x);
    let [h0, h1, k0, k1] = [0, 1, 1, 0];
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(v);
      const h2 = a * h1 + h0;
      const k2 = a * k1 + k0;
      if (k2 > maxDen) break;
      [h0, h1, k0, k1] = [h1, h2, k1, k2];
      const frac = v - a;
      if (frac < 1e-12) break;
      v = 1 / frac;
    }
    return new Frac(sign * h1, k1);
  }

  static of(x: number | Frac): Frac {
    return x instanceof Frac ? x : Frac.fromNumber(x);
  }

  add(o: Frac | number): Frac { const b = Frac.of(o); return new Frac(this.n * b.d + b.n * this.d, this.d * b.d); }
  sub(o: Frac | number): Frac { const b = Frac.of(o); return new Frac(this.n * b.d - b.n * this.d, this.d * b.d); }
  mul(o: Frac | number): Frac { const b = Frac.of(o); return new Frac(this.n * b.n, this.d * b.d); }
  div(o: Frac | number): Frac { const b = Frac.of(o); return new Frac(this.n * b.d, this.d * b.n); }
  neg(): Frac { return new Frac(-this.n, this.d); }
  abs(): Frac { return new Frac(Math.abs(this.n), this.d); }
  inv(): Frac { return new Frac(this.d, this.n); }
  pow(k: number): Frac {
    if (k < 0) return this.inv().pow(-k);
    return new Frac(this.n ** k, this.d ** k);
  }
  isInt(): boolean { return this.d === 1; }
  isZero(): boolean { return this.n === 0; }
  sign(): number { return Math.sign(this.n); }
  eq(o: Frac | number): boolean { const b = Frac.of(o); return this.n === b.n && this.d === b.d; }
  lt(o: Frac | number): boolean { const b = Frac.of(o); return this.n * b.d < b.n * this.d; }
  valueOf(): number { return this.n / this.d; }
  toNumber(): number { return this.n / this.d; }

  toLatex(): string {
    if (this.d === 1) return String(this.n);
    const s = this.n < 0 ? '-' : '';
    return `${s}\\frac{${Math.abs(this.n)}}{${this.d}}`;
  }

  toText(): string {
    return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`;
  }

  toNode(): Node {
    const absNode: Node = this.d === 1 ? { type: 'num', value: Math.abs(this.n) } : { type: 'div', num: { type: 'num', value: Math.abs(this.n) }, den: { type: 'num', value: this.d } };
    return this.n < 0 ? { type: 'neg', arg: absNode } : absNode;
  }
}

export const frac = (n: number, d = 1) => new Frac(n, d);

/** ¿El nodo es una fracción numérica irreducible (o un entero)? */
export function isReducedFraction(node: Node): boolean {
  const unNeg = (n: Node) => (n.type === 'neg' ? n.arg : n);
  const inner = unNeg(node);
  if (inner.type === 'num') return Number.isInteger(inner.value);
  const num = inner.type === 'div' ? unNeg(inner.num) : null;
  const den = inner.type === 'div' ? unNeg(inner.den) : null;
  if (num?.type === 'num' && den?.type === 'num') {
    const a = num.value;
    const b = den.value;
    if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
    return gcd(a, b) === 1 && b !== 1;
  }
  return false;
}
