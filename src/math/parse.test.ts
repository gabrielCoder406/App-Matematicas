import { describe, expect, it } from 'vitest';
import { parse, splitLines } from './parse';
import { toLatex, toText } from './print';
import { evalBool, evalNum, evalMembership } from './evaluate';
import { equationsEquivalent, exprEquivalent, inequalitiesEquivalent, logicEquivalent, setExprEquivalent } from './equivalence';
import { realSetOf, realSetToLatex, solveEquation } from './solve';

const val = (s: string, env: Record<string, number> = {}) => evalNum(parse(s), env);

describe('parser aritmético', () => {
  it('respeta la precedencia y la multiplicación implícita', () => {
    expect(val('2+3*4')).toBe(14);
    expect(val('2x^2', { x: 3 })).toBe(18);
    expect(val('-3^2')).toBe(-9);
    expect(val('(-3)^2')).toBe(9);
    expect(val('2(x+1)', { x: 4 })).toBe(10);
    expect(val('(x+1)(x-1)', { x: 3 })).toBe(8);
    expect(val('1/2x', { x: 4 })).toBe(2);
    expect(val('2/3 ÷ 3/4')).toBeCloseTo(8 / 9);
    expect(val('2^3^2')).toBe(512);
    expect(val('x^-2', { x: 2 })).toBe(0.25);
    expect(val('3x^2y', { x: 2, y: 5 })).toBe(60);
    expect(val('15%')).toBeCloseTo(0.15);
    expect(val('5!')).toBe(120);
    expect(val('10 : 4')).toBe(2.5);
  });

  it('acepta coma decimal y superíndices', () => {
    expect(val('3,5 + 1')).toBe(4.5);
    expect(val('x²+1', { x: 3 })).toBe(10);
    expect(val('2·3')).toBe(6);
    expect(val('7 − 2')).toBe(5);
  });

  it('entiende LaTeX de MathLive', () => {
    expect(val('\\frac{1}{2}+\\frac{1}{3}')).toBeCloseTo(5 / 6);
    expect(val('\\sqrt{16}')).toBe(4);
    expect(val('\\sqrt[3]{-8}')).toBe(-2);
    expect(val('\\left(x+1\\right)^{2}', { x: 2 })).toBe(9);
    expect(val('2\\cdot3')).toBe(6);
    expect(val('2{,}5\\times 2')).toBe(5);
    expect(val('\\frac12')).toBe(0.5);
    expect(val('\\operatorname{sen}\\left(\\frac{\\pi}{2}\\right)')).toBeCloseTo(1);
    expect(val('\\sin^{2}x+\\cos^{2}x', { x: 0.7 })).toBeCloseTo(1);
    expect(val('\\log_{2}8')).toBeCloseTo(3);
    expect(val('\\ln e^{3}')).toBeCloseTo(3);
    expect(val('\\left|-5\\right|')).toBe(5);
    expect(val('|x-3|', { x: 1 })).toBe(2);
    expect(val('30^{\\circ}')).toBeCloseTo(Math.PI / 6);
    expect(val('sen 30°')).toBeCloseTo(0.5);
    expect(val('√(9+16)')).toBe(5);
    expect(val('2\\sqrt{3}\\cdot\\sqrt{3}')).toBeCloseTo(6);
  });

  it('analiza ecuaciones, inecuaciones y soluciones', () => {
    const e = parse('2x + 3 = 7');
    expect(e.type).toBe('rel');
    const c = parse('2 < x \\le 5');
    expect(c.type).toBe('chain');
    const s = parse('x = 2 ∨ x = -3');
    expect(s.type).toBe('logic');
    const l = parse('x_{1}=2,\\ x_{2}=3');
    expect(l.type).toBe('list');
    const pm = parse('x=\\frac{5\\pm\\sqrt{1}}{2}');
    expect(solveEquation(pm, 'x')).toEqual({ kind: 'finite', roots: [2, 3] });
  });

  it('imprime LaTeX legible', () => {
    expect(toLatex(parse('2x^2 - 3x + 1'))).toBe('2x^{2} - 3x + 1');
    expect(toLatex(parse('x - (y + 2)'))).toBe('x - \\left(y + 2\\right)');
    expect(toLatex(parse('3,5'))).toBe('3{,}5');
    expect(toLatex(parse('2*3'))).toBe('2 \\cdot 3');
    expect(toLatex(parse('\\frac{x}{2}+1'))).toBe('\\frac{x}{2} + 1');
    expect(toLatex(parse('-x^2'))).toBe('-x^{2}');
    expect(toLatex(parse('sen(x)^2'))).toBe('\\operatorname{sen}^{2} x');
    expect(toText(parse('2x - 3'))).toBe('2*x - 3');
  });

  it('divide entradas multilínea', () => {
    expect(splitLines('\\begin{aligned}2x&=6\\\\x&=3\\end{aligned}')).toEqual(['2x=6', 'x=3']);
    expect(splitLines('a\nb')).toEqual(['a', 'b']);
  });
});

describe('lógica y conjuntos', () => {
  it('evalúa conectores', () => {
    const f = parse('p ⇒ q', { mode: 'logic' });
    expect(evalBool(f, { p: true, q: false })).toBe(false);
    expect(evalBool(f, { p: false, q: false })).toBe(true);
    expect(evalBool(parse('¬p ∨ q', { mode: 'logic' }), { p: true, q: false })).toBe(false);
    expect(evalBool(parse('p v q', { mode: 'logic' }), { p: false, q: true })).toBe(true);
    expect(evalBool(parse('~(p ∧ q)', { mode: 'logic' }), { p: true, q: true })).toBe(false);
    expect(evalBool(parse('\\neg p \\Rightarrow q', { mode: 'logic' }), { p: false, q: false })).toBe(false);
    expect(evalBool(parse('V ∧ F', { mode: 'logic' }))).toBe(false);
  });

  it('reconoce equivalencias lógicas', () => {
    const lg = (s: string) => parse(s, { mode: 'logic' });
    expect(logicEquivalent(lg('¬(p ∧ q)'), lg('¬p ∨ ¬q')).equivalent).toBe(true);
    expect(logicEquivalent(lg('¬(p ∧ q)'), lg('¬p ∧ ¬q')).equivalent).toBe(false);
    expect(logicEquivalent(lg('p ⇒ q'), lg('¬q ⇒ ¬p')).equivalent).toBe(true);
    expect(logicEquivalent(lg('p ⇒ q'), lg('q ⇒ p')).equivalent).toBe(false);
  });

  it('álgebra de Boole', () => {
    const b = parse("A·B + A'·C", { mode: 'bool' });
    expect(evalBool(b, { A: false, B: false, C: true })).toBe(true);
    expect(evalBool(parse('\\overline{A+B}', { mode: 'bool' }), { A: false, B: false })).toBe(true);
    expect(evalBool(parse('AB + C', { mode: 'bool' }), { A: true, B: true, C: false })).toBe(true);
  });

  it('conjuntos y regiones de Venn', () => {
    const st = (s: string) => parse(s, { mode: 'set' });
    expect(evalMembership(st('A ∪ B'), { A: false, B: true })).toBe(true);
    expect(evalMembership(st('A - B'), { A: true, B: true })).toBe(false);
    expect(evalMembership(st('(A ∪ B)^c'), { A: false, B: false })).toBe(true);
    expect(evalMembership(st("A'"), { A: false })).toBe(true);
    expect(setExprEquivalent(st('(A ∪ B)^c'), st('A^c ∩ B^c')).equivalent).toBe(true);
    expect(setExprEquivalent(st('(A ∪ B)^c'), st('A^c ∪ B^c')).equivalent).toBe(false);
    expect(parse('\\{1,2,3\\}', { mode: 'set' }).type).toBe('set');
    expect(parse('{-1, 0, 1}', { mode: 'set' }).type).toBe('set');
  });
});

describe('equivalencias algebraicas', () => {
  it('expresiones', () => {
    expect(exprEquivalent(parse('(x+1)^2'), parse('x^2+2x+1')).equivalent).toBe(true);
    const r = exprEquivalent(parse('(x+3)^2'), parse('x^2+9'));
    expect(r.equivalent).toBe(false);
    expect(r.counterexample?.env).toEqual({ x: 2 });
    expect(exprEquivalent(parse('\\sin^2 x + \\cos^2 x'), parse('1')).equivalent).toBe(true);
    expect(exprEquivalent(parse('\\ln(x^2)'), parse('2\\ln x')).equivalent).toBe(true);
    expect(exprEquivalent(parse('\\frac{1}{2}+\\frac{1}{3}'), parse('5/6')).equivalent).toBe(true);
  });

  it('ecuaciones', () => {
    expect(equationsEquivalent(parse('2x + 3 = 7'), parse('x = 2')).equivalent).toBe(true);
    expect(equationsEquivalent(parse('2x + 3 = 7'), parse('2x = 10')).equivalent).toBe(false);
    expect(equationsEquivalent(parse('x^2 = 9'), parse('x = 3 ∨ x = -3')).equivalent).toBe(true);
    const lost = equationsEquivalent(parse('x^2 = 9'), parse('x = 3'));
    expect(lost.reason).toBe('lost-solutions');
    expect(equationsEquivalent(parse('x^2 - 5x + 6 = 0'), parse('(x-2)(x-3)=0')).equivalent).toBe(true);
    expect(equationsEquivalent(parse('x^2-5x+6=0'), parse('x_1 = 2, x_2 = 3'.replace(/x_\d/g, 'x'))).equivalent).toBe(true);
    expect(equationsEquivalent(parse('\\sqrt{x} = 3'), parse('x = 9')).equivalent).toBe(true);
    expect(equationsEquivalent(parse('y = 2x + 3'), parse('2x - y + 3 = 0')).equivalent).toBe(true);
    expect(equationsEquivalent(parse('x^2 = 2x'), parse('x = 2')).reason).toBe('lost-solutions');
    expect(equationsEquivalent(parse('x^2 = -1'), parse('\\emptyset')).equivalent).toBe(true);
  });

  it('inecuaciones', () => {
    expect(inequalitiesEquivalent(parse('-2x < 6'), parse('x > -3')).equivalent).toBe(true);
    expect(inequalitiesEquivalent(parse('-2x < 6'), parse('x < -3')).equivalent).toBe(false);
    expect(inequalitiesEquivalent(parse('x^2 - 4 < 0'), parse('(-2, 2)')).equivalent).toBe(true);
    expect(inequalitiesEquivalent(parse('x^2 - 4 \\ge 0'), parse('(-\\infty, -2] \\cup [2, +\\infty)', { decimalComma: false })).equivalent).toBe(true);
    expect(inequalitiesEquivalent(parse('3 \\le 2x + 1 < 9'), parse('[1, 4)', { decimalComma: false })).equivalent).toBe(true);
    const s = realSetOf(parse('x \\ge 2'), 'x')!;
    expect(realSetToLatex(s)).toBe('[2;\\ +\\infty)');
  });
});
