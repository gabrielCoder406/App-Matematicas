// Utilidades para construir enunciados y respuestas de los generadores.
import type { Node } from '../../math/ast';
import { Frac, gcd } from '../../math/fraction';
import { parse } from '../../math/parse';
import { formatNumber, toLatex } from '../../math/print';
import type { Rng } from '../rng';

export const R = String.raw;

export { Frac, gcd };

/** Número en LaTeX con coma decimal. */
export const n = (x: number): string => formatNumber(x, true, true);

/** Número entre paréntesis si es negativo: (−3). */
export const pn = (x: number): string => (x < 0 ? `(${n(x)})` : n(x));

/** «+ 3» / «- 3» para continuar una expresión. */
export const sg = (x: number): string => (x < 0 ? ` - ${n(-x)}` : ` + ${n(x)}`);

/** Término a·v con signo: primero sin «+», coeficiente 1 omitido. */
export function term(coef: number, v: string, first = false): string {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const body = v ? (abs === 1 ? v : `${n(abs)}${v}`) : n(abs);
  if (first) return coef < 0 ? `-${body}` : body;
  return coef < 0 ? ` - ${body}` : ` + ${body}`;
}

/** Polinomio en LaTeX a partir de coeficientes del mayor grado al menor. */
export function polyTex(coeffs: number[], v = 'x'): string {
  const deg = coeffs.length - 1;
  let s = '';
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const e = deg - i;
    const lit = e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`;
    const piece = e === 0 ? (s ? (c < 0 ? ` - ${n(-c)}` : ` + ${n(c)}`) : n(c)) : term(c, lit, s === '');
    s += piece;
  });
  return s || '0';
}

/** Polinomio con coeficientes racionales (del mayor grado al menor), en LaTeX. */
export function fracPolyTex(coeffs: Frac[], v = 'x'): string {
  const deg = coeffs.length - 1;
  let s = '';
  coeffs.forEach((c, i) => {
    if (c.isZero()) return;
    const e = deg - i;
    const lit = e === 0 ? '' : e === 1 ? v : `${v}^{${e}}`;
    const abs = c.abs();
    const body = e === 0 ? abs.toLatex() : abs.eq(1) ? lit : `${abs.toLatex()}${lit}`;
    s += s === '' ? (c.sign() < 0 ? `-${body}` : body) : c.sign() < 0 ? ` - ${body}` : ` + ${body}`;
  });
  return s || '0';
}

/** Lo mismo en texto plano para el analizador (ej. «3x^2 - 2x + 1»). */
export function polyText(coeffs: number[], v = 'x'): string {
  const deg = coeffs.length - 1;
  const parts: string[] = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const e = deg - i;
    const lit = e === 0 ? '' : e === 1 ? v : `${v}^${e}`;
    const abs = Math.abs(c);
    const body = e === 0 ? String(abs) : abs === 1 ? lit : `${abs}${lit}`;
    parts.push(parts.length === 0 ? (c < 0 ? `-${body}` : body) : c < 0 ? ` - ${body}` : ` + ${body}`);
  });
  return parts.join('') || '0';
}

/** Fracción reducida en LaTeX. */
export function fr(num: number, den = 1): string {
  return new Frac(num, den).toLatex();
}

/** Fracción reducida en texto plano (ej. «-3/4»). */
export function frt(num: number, den = 1): string {
  return new Frac(num, den).toText();
}

/** LaTeX de un texto plano analizado (normaliza la escritura). */
export function tex(src: string, mode: 'arith' | 'logic' | 'set' | 'bool' = 'arith'): string {
  return toLatex(parse(src, { mode, decimalComma: false }), { boolStyle: mode === 'bool' ? '10' : 'VF' });
}

export function texNode(node: Node, bool = false): string {
  return toLatex(node, { boolStyle: bool ? '10' : 'VF' });
}

/** Mezcla la respuesta correcta con distractores únicos. */
export function choices(rng: Rng, correct: string, distractors: string[], max = 4): { options: string[]; correct: number } {
  const uniq: string[] = [];
  for (const d of distractors) if (d !== correct && !uniq.includes(d)) uniq.push(d);
  const opts = rng.shuffle([correct, ...uniq.slice(0, max - 1)]);
  return { options: opts, correct: opts.indexOf(correct) };
}

/** Distractores numéricos plausibles y distintos. */
export function numericDistractors(rng: Rng, value: number, count = 3, spread = 5): number[] {
  const out = new Set<number>();
  let guard = 0;
  while (out.size < count && guard++ < 100) {
    const d = value + rng.nonZero(spread);
    if (d !== value) out.add(d);
  }
  return [...out];
}

export function divisors(x: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= Math.abs(x); i++) if (x % i === 0) out.push(i);
  return out;
}

export function isPrime(x: number): boolean {
  if (!Number.isInteger(x) || x < 2) return false;
  for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
  return true;
}

export function round(x: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(x * f) / f;
}

/** Suma segura de coeficientes: nunca devuelve −0. */
export const z = (x: number): number => (Object.is(x, -0) ? 0 : x);

export function factorial(k: number): number {
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
}

export function comb(a: number, b: number): number {
  if (b < 0 || b > a) return 0;
  return Math.round(factorial(a) / (factorial(b) * factorial(a - b)));
}

export function perm(a: number, b: number): number {
  return Math.round(factorial(a) / factorial(a - b));
}

/** Pistas por defecto: [concepto, siguiente paso, paso desarrollado]. */
export function hints(concept: string, next: string, worked: string): [string, string, string] {
  return [concept, next, worked];
}
