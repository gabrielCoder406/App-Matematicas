import { describe, expect, it } from 'vitest';
import { parse } from './parse';
import { diagnose, validateSteps, type StepOptions } from './validate';
import { checkFactored, isExpandedForm, Poly } from './polynomial';
import { toLatex } from './print';

const eq: StepOptions = { mode: 'equation', variable: 'x' };
const ex: StepOptions = { mode: 'expression' };
const ineq: StepOptions = { mode: 'inequality', variable: 'x' };
const lg: StepOptions = { mode: 'logic' };
const st: StepOptions = { mode: 'set' };

function bugOf(prev: string, curr: string, opts: StepOptions): string | undefined {
  const pm = opts.mode === 'logic' ? 'logic' : opts.mode === 'set' ? 'set' : 'arith';
  return diagnose(parse(prev, { mode: pm }), parse(curr, { mode: pm }), opts).bug;
}

describe('diagnóstico de errores en ecuaciones', () => {
  it('trasposición sin cambiar el signo', () => {
    expect(bugOf('3x + 5 = 20', '3x = 25', eq)).toBe('sign.term');
  });
  it('restar el coeficiente en lugar de dividir', () => {
    expect(bugOf('3x = 12', 'x = 9', eq)).toBe('eq.coef-subtract');
  });
  it('signo del coeficiente negativo', () => {
    expect(bugOf('-2x = 8', 'x = 4', eq)).toBe('eq.coef-sign');
  });
  it('dividir en vez de multiplicar', () => {
    expect(bugOf('x/3 = 4', 'x = 4/3', eq)).toBe('eq.div-instead-mul');
  });
  it('distributiva parcial', () => {
    expect(bugOf('3(x + 2) = 12', '3x + 2 = 12', eq)).toBe('distribute.partial');
  });
  it('dividir solo un término', () => {
    expect(bugOf('2x + 4 = 10', 'x + 4 = 5', eq)).toBe('eq.partial-divide');
  });
  it('menos delante de paréntesis', () => {
    expect(bugOf('5 - (x - 3) = 2', '5 - x - 3 = 2', eq)).toBe('sign.distribute-neg');
  });
  it('pérdida de soluciones al sacar raíz', () => {
    const r = diagnose(parse('x^2 = 9'), parse('x = 3'), eq);
    expect(r.message).toContain('perdió');
  });
});

describe('diagnóstico en expresiones', () => {
  it('cuadrado de un binomio', () => {
    expect(bugOf('(x+3)^2', 'x^2 + 9', ex)).toBe('pow.sum');
  });
  it('producto de potencias', () => {
    expect(bugOf('x^3 x^4', 'x^12', ex)).toBe('pow.product-exp');
  });
  it('potencia de potencia', () => {
    expect(bugOf('(x^2)^3', 'x^5', ex)).toBe('pow.power-exp');
  });
  it('base por exponente', () => {
    expect(bugOf('2^3', '6', ex)).toBe('pow.base-times-exp');
  });
  it('menos cuadrado', () => {
    expect(bugOf('-3^2', '9', ex)).toBe('pow.neg-base');
  });
  it('suma de fracciones', () => {
    expect(bugOf('1/2 + 1/3', '2/5', ex)).toBe('frac.add-num-den');
  });
  it('raíz de una suma', () => {
    expect(bugOf('\\sqrt{9+16}', '7', ex)).toBe('root.sum');
  });
  it('contraejemplo genérico', () => {
    const d = diagnose(parse('2x + 3x'), parse('6x'), ex);
    expect(d.message).toContain('x = 2');
  });
});

describe('inecuaciones, lógica y conjuntos', () => {
  it('no invertir la desigualdad', () => {
    expect(bugOf('-2x < 6', 'x < -3', ineq)).toBe('ineq.flip');
  });
  it('De Morgan mal aplicado', () => {
    expect(bugOf('¬(p ∧ q)', '¬p ∧ ¬q', lg)).toBe('logic.demorgan');
  });
  it('negación de la implicación', () => {
    expect(bugOf('¬(p ⇒ q)', '¬p ⇒ ¬q', lg)).toBe('logic.neg-implication');
  });
  it('De Morgan en conjuntos', () => {
    expect(bugOf('(A ∪ B)^c', 'A^c ∪ B^c', st)).toBe('set.demorgan');
  });
});

describe('cadena de pasos', () => {
  it('marca correcto, error y arrastre', () => {
    const res = validateSteps(parse('2x + 3 = 11'), ['2x = 14', 'x = 7', 'x = 4'], eq);
    expect(res.map((r) => r.status)).toEqual(['error', 'carried', 'ok']);
    expect(res[0].bug).toBe('sign.term');
    expect(res[2].isFinal).toBe(true);
  });
  it('acepta pasos correctos en LaTeX', () => {
    const res = validateSteps(parse('\\frac{x}{2}+\\frac{x}{3}=5'), ['3x+2x=30', '5x=30', 'x=6'], eq);
    expect(res.every((r) => r.status === 'ok')).toBe(true);
  });
  it('informa errores de lectura', () => {
    const res = validateSteps(parse('x+1=2'), ['x = (1'], eq);
    expect(res[0].status).toBe('parse-error');
  });
});

describe('polinomios y formas', () => {
  it('desarrolla y ordena', () => {
    const p = Poly.fromNode(parse('(x+1)^2 - 3x'))!;
    expect(toLatex(p.toNode())).toBe('x^{2} - x + 1');
    expect(toLatex(Poly.fromNode(parse('3x + 5y - 2x + 4 - 7y'))!.toNode())).toBe('x - 2y + 4');
  });
  it('detecta forma desarrollada', () => {
    expect(isExpandedForm(parse('x^2 + 2x + 1'))).toBe(true);
    expect(isExpandedForm(parse('(x+1)^2'))).toBe(false);
    expect(isExpandedForm(parse('x^2 + x + x'))).toBe(false);
  });
  it('detecta factorización completa', () => {
    expect(checkFactored(parse('(x-2)(x+2)')).ok).toBe(true);
    expect(checkFactored(parse('3x(2x+3)')).ok).toBe(true);
    expect(checkFactored(parse('(x+3)^2')).ok).toBe(true);
    expect(checkFactored(parse('x(x^2-4)')).reason).toBe('reducible-factor');
    expect(checkFactored(parse('x^2-4')).ok).toBe(false);
    expect(checkFactored(parse('x(2x+4)')).reason).toBe('common-factor');
  });
  it('raíces racionales', () => {
    const p = Poly.fromNode(parse('2x^2 - 3x - 2'))!;
    expect(p.rationalRoots().map((r) => r.toText()).sort()).toEqual(['-1/2', '2']);
  });
});
