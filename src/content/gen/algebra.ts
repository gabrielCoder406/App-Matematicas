// Bloque 3: álgebra básica e intermedia.
import { parse } from '../../math/parse';
import { Poly } from '../../math/polynomial';
import { toLatex, toText } from '../../math/print';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { choices, gcd, n, polyTex, polyText, R, tex } from './util';

/** «ax + b» en texto plano con signos correctos. */
function lin(a: number, b: number, v = 'x'): string {
  const first = a === 0 ? '' : a === 1 ? v : a === -1 ? `-${v}` : `${a}${v}`;
  if (b === 0) return first || '0';
  if (!first) return String(b);
  return b < 0 ? `${first} - ${-b}` : `${first} + ${b}`;
}

const L = (plain: string) => tex(plain);

/** Intervalo en LaTeX con notación hispana (punto y coma). */
function ivTex(lo: number, hi: number, loClosed: boolean, hiClosed: boolean): string {
  const f = (v: number) => (v === Infinity ? R`+\infty` : v === -Infinity ? R`-\infty` : n(v));
  return `${loClosed ? '[' : '('}${f(lo)};\\ ${f(hi)}${hiClosed ? ']' : ')'}`;
}

// ---------------------------------------------------------------------------
// Lenguaje algebraico y términos semejantes
// ---------------------------------------------------------------------------

const TRANSLATIONS = (k: number) => [
  { s: `El doble de un número, aumentado en ${k}`, e: `2x + ${k}`, lv: 1 },
  { s: `El triple de un número, disminuido en ${k}`, e: `3x - ${k}`, lv: 1 },
  { s: `La mitad de un número, más ${k}`, e: `x/2 + ${k}`, lv: 1 },
  { s: `El doble de la suma entre un número y ${k}`, e: `2(x + ${k})`, lv: 2 },
  { s: 'El cuadrado de un número, menos su doble', e: 'x^2 - 2x', lv: 2 },
  { s: 'La suma de tres números consecutivos (el menor es el número)', e: 'x + (x + 1) + (x + 2)', lv: 2 },
  { s: `El cuadrado de la suma entre un número y ${k}`, e: `(x + ${k})^2`, lv: 3 },
  { s: `La diferencia entre el cuadrado de un número y ${k}`, e: `x^2 - ${k}`, lv: 3 },
  { s: 'El producto de dos números pares consecutivos (el menor es el número)', e: 'x(x + 2)', lv: 3 },
];

const algTranslate: Generator = {
  id: 'alg.translate', skillId: 'alg.like-terms', title: 'Traducir al lenguaje algebraico', levels: [1, 2, 3],
  generate(rng, level) {
    const k = rng.int(2, 9);
    const t = rng.pick(TRANSLATIONS(k).filter((x) => x.lv === level));
    return {
      prompt: `Escribe en lenguaje algebraico (usa $x$ para el número): «${t.s}».`,
      answer: { kind: 'expression', target: t.e },
      hints: [
        R`«Doble» = $2x$, «triple» = $3x$, «mitad» = $\frac{x}{2}$, «cuadrado» = $x^2$, «consecutivo» = $x+1$. Presta atención a qué afecta cada operación (¿la suma completa o solo el número?).`,
        'Identifica la operación principal de la frase y escríbela en último lugar.',
        R`Una respuesta posible: $${L(t.e)}$.`,
      ],
      solution: [{ math: L(t.e) }],
      expectedSeconds: 40,
    };
  },
};

const algReduce: Generator = {
  id: 'alg.reduce', skillId: 'alg.like-terms', title: 'Reducir términos semejantes', levels: [1, 2, 3],
  errorTags: ['sign.term', 'distribute.partial', 'sign.distribute-neg'],
  generate(rng, level) {
    let plain: string;
    if (level === 1) {
      const t = [`${rng.int(2, 9)}x`, `${rng.nonZero(9)}y`, `${rng.nonZero(9)}x`, `${rng.nonZero(9)}`, `${rng.nonZero(9)}y`];
      plain = rng.shuffle(t).map((s, i) => (i === 0 ? s : s.startsWith('-') ? ` - ${s.slice(1)}` : ` + ${s}`)).join('');
    } else if (level === 2) {
      const t = [`${rng.int(2, 6)}x^2`, `${rng.nonZero(7)}x`, `${rng.nonZero(6)}x^2`, `${rng.nonZero(9)}`, `${rng.nonZero(7)}x`, `${rng.nonZero(5)}`];
      plain = rng.shuffle(t).map((s, i) => (i === 0 ? s : s.startsWith('-') ? ` - ${s.slice(1)}` : ` + ${s}`)).join('');
    } else {
      const a = rng.int(2, 5), b = rng.nonZero(4), c = rng.int(2, 6);
      plain = `${a}(x ${b < 0 ? '-' : '+'} ${Math.abs(b)}y) - (x + ${c}y) + ${rng.int(1, 5)}y`;
    }
    const p = Poly.fromNode(parse(plain))!;
    const target = toText(p.toNode());
    return {
      prompt: R`Reduce los términos semejantes: $${L(plain)}$`,
      answer: { kind: 'expression', target, form: 'expanded', diagnoseFrom: plain },
      steps: { start: plain, mode: 'expression' },
      hints: [
        R`Solo se suman términos con la misma parte literal: $3x + 5x = 8x$, pero $3x + 5y$ no se reduce.`,
        level === 3 ? 'Primero elimina los paréntesis (¡atención al signo menos!) y después agrupa.' : 'Agrupa los términos en $x$, luego los de $y$ (o $x^2$) y por último los números.',
        R`Resultado: $${toLatex(p.toNode())}$.`,
      ],
      solution: [{ math: R`${L(plain)} = ${toLatex(p.toNode())}` }],
      expectedSeconds: 45 + 20 * level,
    };
  },
};

// ---------------------------------------------------------------------------
// Polinomios
// ---------------------------------------------------------------------------

function randomPoly(rng: Rng, deg: number, m = 6): number[] {
  const cs = [rng.intExcept(-m, m, 0)];
  for (let i = 0; i < deg; i++) cs.push(rng.int(-m, m));
  return cs;
}

const polyEval: Generator = {
  id: 'poly.eval', skillId: 'alg.polynomials', title: 'Valor numérico de un polinomio', levels: [1, 2, 3],
  errorTags: ['pow.neg-base', 'sign.product'],
  generate(rng, level) {
    const cs = randomPoly(rng, level === 1 ? 2 : 3, level === 3 ? 5 : 4);
    const a = level === 1 ? rng.int(1, 4) : rng.nonZero(3);
    const P = Poly.fromCoeffs([...cs].reverse());
    const v = P.evaluate({ x: a });
    const subst = polyText(cs, `(${a})`);
    return {
      prompt: R`Sea $P(x) = ${polyTex(cs)}$. Calcula $P(${a})$.`,
      answer: { kind: 'numeric', value: v, diagnoseFrom: subst },
      steps: { start: subst, mode: 'expression' },
      hints: [
        R`Reemplaza cada $x$ por el valor (entre paréntesis si es negativo) y respeta el orden de las operaciones.`,
        R`$P(${a}) = ${L(subst)}$.`,
        R`$P(${a}) = ${n(v)}$.`,
      ],
      solution: [{ math: R`P(${a}) = ${L(subst)} = ${n(v)}` }],
      expectedSeconds: 40 + 15 * level,
    };
  },
};

const polyOps: Generator = {
  id: 'poly.ops', skillId: 'alg.polynomials', title: 'Operaciones con polinomios', levels: [1, 2, 3],
  errorTags: ['sign.distribute-neg', 'distribute.partial', 'pow.product-exp'],
  generate(rng, level) {
    let plain: string;
    let desc: string;
    if (level === 1) {
      const A = randomPoly(rng, 2), B = randomPoly(rng, 2);
      const op = rng.pick(['+', '-']);
      plain = `(${polyText(A)}) ${op} (${polyText(B)})`;
      desc = op === '+' ? 'Suma los coeficientes de los términos semejantes.' : 'Restar un polinomio es sumar su opuesto: cambia el signo de todos sus términos.';
    } else if (level === 2) {
      const k = rng.nonZero(4), e = rng.int(1, 2);
      const A = randomPoly(rng, 2);
      plain = `${k}x^${e}(${polyText(A)})`;
      desc = 'Multiplica el monomio por cada término: se multiplican los coeficientes y se suman los exponentes.';
    } else {
      const A = [1, rng.nonZero(5)], B = randomPoly(rng, 2, 4);
      plain = `(${polyText(A)})(${polyText(B)})`;
      desc = 'Multiplica cada término del primero por cada término del segundo y luego reduce.';
    }
    const p = Poly.fromNode(parse(plain))!;
    return {
      prompt: R`Calcula y reduce: $${L(plain)}$`,
      answer: { kind: 'expression', target: toText(p.toNode()), form: 'expanded', diagnoseFrom: plain },
      steps: { start: plain, mode: 'expression' },
      hints: [
        R`Términos semejantes: misma parte literal. Producto: $ax^m\cdot bx^n = ab\,x^{m+n}$.`,
        desc,
        R`Resultado: $${toLatex(p.toNode())}$.`,
      ],
      solution: [{ math: R`${L(plain)} = ${toLatex(p.toNode())}` }],
      expectedSeconds: 50 + 25 * level,
    };
  },
};

const polyRemainder: Generator = {
  id: 'poly.remainder', skillId: 'alg.polynomials', title: 'Teorema del resto', levels: [2, 3],
  generate(rng) {
    const cs = randomPoly(rng, 3, 4);
    const a = rng.nonZero(3);
    const P = Poly.fromCoeffs([...cs].reverse());
    const r = P.evaluate({ x: a });
    const divisor = lin(1, -a);
    return {
      prompt: R`¿Cuál es el resto de dividir $P(x) = ${polyTex(cs)}$ por $(${L(divisor)})$?`,
      answer: { kind: 'numeric', value: r },
      hints: [
        R`Teorema del resto: el resto de dividir $P(x)$ por $(x - a)$ es $P(a)$.`,
        R`Aquí $a = ${a}$: calcula $P(${a})$.`,
        R`$P(${a}) = ${n(r)}$.`,
      ],
      solution: [{ math: R`R = P(${a}) = ${n(r)}` }],
      expectedSeconds: 60,
    };
  },
};

// ---------------------------------------------------------------------------
// Productos notables y factoreo
// ---------------------------------------------------------------------------

const notableExpand: Generator = {
  id: 'notable.expand', skillId: 'alg.notable-products', title: 'Desarrollar productos notables', levels: [1, 2, 3],
  errorTags: ['pow.sum', 'pow.partial-product'],
  generate(rng, level) {
    const a = rng.int(1, level === 1 ? 1 : 3);
    const b = rng.int(1, 7) * rng.sign();
    const inner = lin(a, b);
    const forms =
      level === 1 ? [`(${inner})^2`, `(x + ${Math.abs(b)})(x - ${Math.abs(b)})`]
      : level === 2 ? [`(${inner})^2`, `(${lin(a, Math.abs(b))})(${lin(a, -Math.abs(b))})`]
      : [`(x ${b < 0 ? '-' : '+'} ${Math.min(Math.abs(b), 4)})^3`, `(${inner})^2 - (${lin(1, b)})(${lin(1, -b)})`];
    const plain = rng.pick(forms);
    const p = Poly.fromNode(parse(plain))!;
    const rule = plain.includes('^3')
      ? R`$(a+b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$`
      : plain.includes('^2') ? R`$(a\pm b)^2 = a^2 \pm 2ab + b^2$` : R`$(a+b)(a-b) = a^2 - b^2$`;
    return {
      prompt: R`Desarrolla: $${L(plain)}$`,
      answer: { kind: 'expression', target: toText(p.toNode()), form: 'expanded', diagnoseFrom: plain },
      steps: { start: plain, mode: 'expression' },
      hints: [
        R`Productos notables: $(a+b)^2 = a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, $(a+b)(a-b)=a^2-b^2$.`,
        `Usa ${rule}. ¡No olvides el doble producto!`,
        R`Resultado: $${toLatex(p.toNode())}$.`,
      ],
      solution: [{ math: R`${L(plain)} = ${toLatex(p.toNode())}` }],
      expectedSeconds: 40 + 20 * level,
    };
  },
};

const notableMiddle: Generator = {
  id: 'notable.middle', skillId: 'alg.notable-products', title: 'El doble producto', levels: [1, 2],
  errorTags: ['pow.sum'],
  generate(rng, level) {
    const a = level === 1 ? 1 : rng.int(2, 4);
    const b = rng.int(2, 9) * rng.sign();
    const middle = 2 * a * b;
    const sq = `${a === 1 ? '' : a * a}x^{2}`;
    return {
      prompt: R`Completa el desarrollo: $(${polyTex([a, b])})^2 = ${sq} + \square\, x + ${b * b}$. ¿Qué número va en el recuadro?`,
      answer: { kind: 'numeric', value: middle },
      hints: [
        R`El término del medio es el doble producto: $2\cdot a\cdot b$.`,
        R`Aquí el doble producto es $2\cdot ${a === 1 ? 'x' : `${a}x`}\cdot (${b})$.`,
        R`$2\cdot ${a}\cdot (${b}) = ${middle}$.`,
      ],
      solution: [{ math: R`(${polyTex([a, b])})^2 = ${polyTex([a * a, middle, b * b])}` }],
      expectedSeconds: 30,
    };
  },
};

const factorCommon: Generator = {
  id: 'factor.common', skillId: 'alg.factoring', title: 'Factor común', levels: [1, 2],
  errorTags: ['frac.cancel-terms'],
  generate(rng, level) {
    const g = rng.int(2, 6);
    const e = level === 1 ? 1 : rng.int(1, 2);
    let a = rng.nonZero(5), b = rng.nonZero(7);
    while (gcd(a, b) !== 1) b = rng.nonZero(7);
    if (a < 0) { a = -a; b = -b; }
    const factoredPlain = `${g}x${e === 1 ? '' : `^${e}`}(${lin(a, b)})`;
    const P = Poly.fromNode(parse(factoredPlain))!;
    return {
      prompt: R`Factoriza sacando factor común: $${toLatex(P.toNode())}$`,
      answer: { kind: 'expression', target: factoredPlain, form: 'factored' },
      hints: [
        'Busca el mayor número que divide a todos los coeficientes y la menor potencia de x que aparece en todos los términos.',
        R`El factor común es $${g}${e === 1 ? 'x' : `x^{${e}}`}$.`,
        R`$${toLatex(P.toNode())} = ${L(factoredPlain)}$.`,
      ],
      solution: [{ math: R`${toLatex(P.toNode())} = ${L(factoredPlain)}` }],
      expectedSeconds: 45,
    };
  },
};

const factorSpecial: Generator = {
  id: 'factor.special', skillId: 'alg.factoring', title: 'Diferencia de cuadrados y trinomio cuadrado perfecto', levels: [1, 2, 3],
  generate(rng, level) {
    const a = level === 1 ? 1 : rng.int(1, 3);
    let b = rng.int(1, 9);
    while (gcd(a, b) !== 1) b = rng.int(1, 9);
    let factored: string;
    let hint: string;
    if (rng.bool()) {
      factored = `(${lin(a, b)})(${lin(a, -b)})`;
      hint = R`Es una diferencia de cuadrados: $A^2 - B^2 = (A + B)(A - B)$.`;
    } else {
      const s = rng.sign();
      factored = `(${lin(a, s * b)})^2`;
      hint = R`Es un trinomio cuadrado perfecto: $A^2 \pm 2AB + B^2 = (A \pm B)^2$.`;
    }
    if (level === 3) {
      const k = rng.int(2, 4);
      factored = `${k}x${factored}`;
      hint = 'Primero saca factor común y después reconoce el caso que queda.';
    }
    const P = Poly.fromNode(parse(factored))!;
    return {
      prompt: R`Factoriza completamente: $${toLatex(P.toNode())}$`,
      answer: { kind: 'expression', target: factored, form: 'factored' },
      hints: [
        R`Diferencia de cuadrados: $A^2 - B^2 = (A+B)(A-B)$. Trinomio cuadrado perfecto: $A^2 + 2AB + B^2 = (A+B)^2$.`,
        hint,
        R`$${toLatex(P.toNode())} = ${L(factored)}$.`,
      ],
      solution: [{ math: R`${toLatex(P.toNode())} = ${L(factored)}` }],
      expectedSeconds: 50 + 15 * level,
    };
  },
};

const factorTrinomial: Generator = {
  id: 'factor.trinomial', skillId: 'alg.factoring', title: 'Factorizar trinomios de segundo grado', levels: [1, 2, 3],
  generate(rng, level) {
    const a = level < 3 ? 1 : rng.pick([2, 3]);
    let r1 = rng.nonZero(7);
    while (gcd(a, r1) !== 1) r1 = rng.nonZero(7);
    let r2 = rng.nonZero(7);
    while (r2 === r1 || r2 === -r1 || r2 * a === r1) r2 = rng.nonZero(7);
    const factored = `(${lin(a, -r1)})(${lin(1, -r2)})`;
    const P = Poly.fromNode(parse(factored))!;
    const roots = [r1 / a, r2];
    return {
      prompt: R`Factoriza: $${toLatex(P.toNode())}$`,
      answer: { kind: 'expression', target: factored, form: 'factored' },
      hints: [
        R`Si $x_1$ y $x_2$ son las raíces de $ax^2 + bx + c$, entonces $ax^2+bx+c = a(x - x_1)(x - x_2)$. Con $a = 1$ busca dos números que sumen $-b$ y multipliquen $c$.`,
        R`Las raíces son $x_1 = ${n(Math.round(roots[0] * 1000) / 1000)}$ y $x_2 = ${roots[1]}$ (puedes usar la fórmula resolvente).`,
        R`$${toLatex(P.toNode())} = ${L(factored)}$.`,
      ],
      solution: [{ math: R`${toLatex(P.toNode())} = ${L(factored)}` }],
      expectedSeconds: 60 + 20 * level,
    };
  },
};

// ---------------------------------------------------------------------------
// Ecuaciones lineales
// ---------------------------------------------------------------------------

function linearEquation(rng: Rng, level: number): { plain: string; x: number } {
  const x = rng.nonZero(level === 1 ? 10 : 8);
  if (level === 1) {
    const a = rng.int(2, 9) * (rng.bool(0.25) ? -1 : 1);
    const b = rng.nonZero(15);
    return { plain: `${lin(a, b)} = ${a * x + b}`, x };
  }
  if (level === 2) {
    const kind = rng.int(0, 2);
    if (kind === 0) {
      const a = rng.int(2, 5), b = rng.nonZero(6), c = rng.intExcept(-4, 6, a, 0);
      const d = a * (x + b) - c * x;
      return { plain: `${a}(${lin(1, b)}) = ${lin(c, d)}`, x };
    }
    if (kind === 1) {
      const a = rng.nonZero(9), c = rng.intExcept(-9, 9, a, 0), b = rng.nonZero(12);
      const d = (a - c) * x + b;
      return { plain: `${lin(a, b)} = ${lin(c, d)}`, x };
    }
    const a = rng.int(5, 20), b = rng.int(2, 5), c = rng.nonZero(6);
    const d = a - (b * x + c);
    return { plain: `${a} - (${lin(b, c)}) = ${d}`, x };
  }
  const kind = rng.int(0, 2);
  if (kind === 0) {
    const [p, q] = rng.pick([[2, 3], [3, 4], [2, 5], [4, 6], [3, 6]]);
    const l = (p * q) / gcd(p, q);
    const xx = l * rng.nonZero(3);
    return { plain: `x/${p} + x/${q} = ${xx / p + xx / q}`, x: xx };
  }
  if (kind === 1) {
    const [b, d] = rng.pick([[2, 3], [3, 2], [4, 3], [2, 5], [5, 3]]);
    const m = rng.nonZero(4);
    const a = b * m - x;
    const c = x - d * m;
    return { plain: `(${lin(1, a)})/${b} = (${lin(1, -c)})/${d}`, x };
  }
  const r = rng.pick([2, 3, 4]), u = rng.pick([2, 3, 5].filter((t) => t !== r));
  const p = rng.int(1, 3);
  let s = rng.int(1, 3);
  while (p * u === s * r) s = rng.int(1, 3);
  const k1 = rng.nonZero(4), k2 = rng.nonZero(4);
  const q = r * k1 - p * x, t = u * k2 - s * x;
  return { plain: `(${lin(p, q)})/${r} - (${lin(s, t)})/${u} = ${k1 - k2}`, x };
}

const linearSolve: Generator = {
  id: 'lineq.solve', skillId: 'alg.linear-equations', title: 'Resolver ecuaciones lineales', levels: [1, 2, 3],
  errorTags: ['sign.term', 'eq.coef-subtract', 'eq.coef-sign', 'eq.div-instead-mul', 'eq.partial-divide', 'distribute.partial', 'sign.distribute-neg', 'frac.add-num-den'],
  generate(rng, level) {
    const { plain, x } = linearEquation(rng, level);
    const eq = parse(plain);
    const nextStep =
      level === 1 ? 'Primero deja el término con $x$ solo en un miembro (pasa el número sumando/restando al otro lado) y después divide por el coeficiente.'
      : level === 2 ? 'Elimina los paréntesis (distributiva), agrupa los términos con $x$ en un miembro y los números en el otro.'
      : 'Multiplica ambos miembros por el mínimo común múltiplo de los denominadores para eliminar las fracciones.';
    return {
      prompt: R`Resuelve la ecuación: $${toLatex(eq)}$`,
      answer: { kind: 'solutions', variable: 'x', values: [x], diagnoseFrom: plain },
      steps: { start: plain, mode: 'equation', variable: 'x' },
      hints: [
        R`Lo que hagas en un miembro hazlo en el otro. Un término que suma pasa restando (y viceversa); un factor que multiplica pasa dividiendo.`,
        nextStep,
        R`La solución es $x = ${n(x)}$. Compruébala reemplazando en la ecuación original.`,
      ],
      solution: [{ math: toLatex(eq) }, { math: R`x = ${n(x)}` }],
      expectedSeconds: 50 + 35 * level,
    };
  },
};

const linearWord: Generator = {
  id: 'lineq.word', skillId: 'alg.linear-equations', title: 'Problemas con ecuaciones', levels: [2, 3],
  generate(rng) {
    const kind = rng.int(0, 3);
    if (kind === 0) {
      const x = rng.int(5, 40);
      return {
        prompt: `La suma de tres números consecutivos es ${3 * x + 3}. ¿Cuál es el menor?`,
        answer: { kind: 'numeric', value: x },
        hints: [R`Si el menor es $x$, los otros son $x+1$ y $x+2$.`, R`Plantea $x + (x+1) + (x+2) = ${3 * x + 3}$.`, R`$3x + 3 = ${3 * x + 3} \Rightarrow x = ${x}$.`],
        solution: [{ math: R`3x + 3 = ${3 * x + 3} \Rightarrow x = ${x}` }],
        expectedSeconds: 70,
      };
    }
    if (kind === 1) {
      const x = rng.int(2, 20), a = rng.int(2, 6), b = rng.int(1, 15);
      return {
        prompt: `Pienso un número, lo multiplico por ${a} y le sumo ${b}. Obtengo ${a * x + b}. ¿Qué número pensé?`,
        answer: { kind: 'numeric', value: x },
        hints: ['Llama $x$ al número y traduce cada operación.', R`$${a}x + ${b} = ${a * x + b}$.`, R`$${a}x = ${a * x} \Rightarrow x = ${x}$.`],
        solution: [{ math: R`${a}x + ${b} = ${a * x + b} \Rightarrow x = ${x}` }],
        expectedSeconds: 60,
      };
    }
    if (kind === 2) {
      const w = rng.int(3, 15);
      const k = rng.pick([2, 3]);
      const P = 2 * (w + k * w);
      return {
        prompt: `El perímetro de un rectángulo es ${P} cm y el largo es ${k === 2 ? 'el doble' : 'el triple'} del ancho. ¿Cuánto mide el ancho?`,
        answer: { kind: 'numeric', value: w, unit: 'cm' },
        hints: [R`Perímetro $= 2\cdot(\text{largo} + \text{ancho})$.`, R`Si el ancho es $x$, el largo es $${k}x$: $2(x + ${k}x) = ${P}$.`, R`$${2 * (1 + k)}x = ${P} \Rightarrow x = ${w}$.`],
        solution: [{ math: R`2(x + ${k}x) = ${P} \Rightarrow x = ${w}` }],
        expectedSeconds: 80,
      };
    }
    // padre = m·hijo ; dentro de t años: m·h + t = 2(h + t) → t = (m − 2)·h
    const son = rng.int(4, 15);
    const m = rng.pick([3, 4]);
    const years = son * (m - 2);
    return {
      prompt: `Un padre tiene ${m} veces la edad de su hijo. Dentro de ${years} años tendrá el doble. ¿Qué edad tiene hoy el hijo?`,
      answer: { kind: 'numeric', value: son },
      hints: [R`Si el hijo tiene $x$ años, el padre tiene $${m}x$. Dentro de ${years} años: $${m}x + ${years}$ y $x + ${years}$.`, R`Plantea $${m}x + ${years} = 2(x + ${years})$.`, R`$${m - 2}x = ${years} \Rightarrow x = ${son}$.`],
      solution: [{ math: R`${m}x + ${years} = 2(x + ${years}) \Rightarrow x = ${son}` }],
      expectedSeconds: 100,
    };
  },
};

// ---------------------------------------------------------------------------
// Inecuaciones
// ---------------------------------------------------------------------------

const FLIP: Record<string, string> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
const OPTEX: Record<string, string> = { '<': '<', '>': '>', '<=': R`\le`, '>=': R`\ge` };

const inequalitySolve: Generator = {
  id: 'ineq.solve', skillId: 'alg.linear-inequalities', title: 'Resolver inecuaciones lineales', levels: [1, 2, 3],
  errorTags: ['ineq.flip', 'sign.term', 'eq.coef-subtract'],
  generate(rng, level) {
    if (level === 3) {
      const a = rng.int(2, 5), b = rng.nonZero(8);
      const lo = rng.int(-6, 2), hi = lo + rng.int(2, 7);
      const [o1, o2] = [rng.pick(['<', '<=']), rng.pick(['<', '<='])];
      const plain = `${a * lo + b} ${o1} ${lin(a, b)} ${o2} ${a * hi + b}`;
      const target = `${o1 === '<' ? '(' : '['}${lo}, ${hi}${o2 === '<' ? ')' : ']'}`;
      return {
        prompt: R`Resuelve y expresa la solución como intervalo: $${tex(plain)}$`,
        answer: { kind: 'inequality', variable: 'x', target, diagnoseFrom: plain },
        hints: [
          'En una doble desigualdad, lo que hagas debe hacerse en las tres partes a la vez.',
          R`Resta ${b} en las tres partes y luego divide por ${a}.`,
          R`Se obtiene $${lo} ${OPTEX[o1]} x ${OPTEX[o2]} ${hi}$, es decir $x \in ${ivTex(lo, hi, o1 === '<=', o2 === '<=')}$.`,
        ],
        solution: [{ math: R`${lo} ${OPTEX[o1]} x ${OPTEX[o2]} ${hi}` }],
        expectedSeconds: 110,
      };
    }
    const x0 = rng.nonZero(8);
    const a = level === 1 ? rng.int(2, 7) : rng.intExcept(-7, -2, 0);
    const b = rng.nonZero(12);
    const op = rng.pick(['<', '>', '<=', '>=']);
    const plain = `${lin(a, b)} ${op} ${a * x0 + b}`;
    const sol = a > 0 ? op : FLIP[op];
    const target = `x ${sol} ${x0}`;
    return {
      prompt: R`Resuelve la inecuación: $${tex(plain)}$`,
      answer: { kind: 'inequality', variable: 'x', target, diagnoseFrom: plain },
      steps: { start: plain, mode: 'inequality', variable: 'x' },
      hints: [
        R`Se resuelve como una ecuación, pero si multiplicas o divides por un número **negativo**, la desigualdad cambia de sentido.`,
        R`Pasa el ${b} al otro miembro y después divide por ${a}${a < 0 ? ' (¡negativo!)' : ''}.`,
        R`La solución es $x ${OPTEX[sol]} ${x0}$.`,
      ],
      solution: [{ math: R`${tex(plain)}` }, { math: R`x ${OPTEX[sol]} ${x0}` }],
      expectedSeconds: 60 + 20 * level,
    };
  },
};

const intervalNotation: Generator = {
  id: 'ineq.interval', skillId: 'alg.linear-inequalities', title: 'Notación de intervalos', levels: [1],
  generate(rng) {
    const a = rng.int(-9, 9);
    const op = rng.pick(['<', '>', '<=', '>=']);
    const ivs: Record<string, string> = {
      '<': R`(-\infty,\ ${a})`, '<=': R`(-\infty,\ ${a}]`, '>': R`(${a},\ +\infty)`, '>=': R`[${a},\ +\infty)`,
    };
    const correct = `$${ivs[op]}$`;
    const { options, correct: ci } = choices(rng, correct, Object.values(ivs).map((s) => `$${s}$`));
    return {
      prompt: R`¿Qué intervalo representa $x ${OPTEX[op]} ${a}$?`,
      visual: { type: 'number-line', points: [{ x: a, open: op === '<' || op === '>' }], ranges: [{ from: op.startsWith('<') ? -Infinity : a, to: op.startsWith('<') ? a : Infinity }], min: a - 6, max: a + 6 },
      answer: { kind: 'choice', options, correct: ci },
      hints: [
        'Corchete [ ] si el extremo está incluido (≤, ≥); paréntesis ( ) si no lo está (<, >). En ±∞ siempre va paréntesis.',
        op.startsWith('<') ? 'Son los números menores: el intervalo empieza en −∞.' : 'Son los números mayores: el intervalo termina en +∞.',
        `Es ${correct}.`,
      ],
      solution: [{ math: R`x ${OPTEX[op]} ${a} \iff x \in ${ivs[op]}` }],
      expectedSeconds: 20,
    };
  },
};

// ---------------------------------------------------------------------------
// Cuadráticas
// ---------------------------------------------------------------------------

const quadraticSolve: Generator = {
  id: 'quad.solve', skillId: 'alg.quadratic', title: 'Resolver ecuaciones cuadráticas', levels: [1, 2, 3],
  errorTags: ['sign.term', 'eq.coef-subtract'],
  generate(rng, level) {
    let plain: string;
    let roots: number[];
    let how: string;
    if (level === 1) {
      const kind = rng.int(0, 2);
      if (kind === 0) {
        const k = rng.int(2, 12);
        plain = `x^2 = ${k * k}`;
        roots = [-k, k];
        how = R`$x = \pm\sqrt{${k * k}} = \pm ${k}$ (¡dos soluciones!).`;
      } else if (kind === 1) {
        const a = rng.int(2, 5), k = rng.int(1, 6);
        plain = `${a}x^2 - ${a * k * k} = 0`;
        roots = [-k, k];
        how = R`$${a}x^2 = ${a * k * k} \Rightarrow x^2 = ${k * k} \Rightarrow x = \pm ${k}$.`;
      } else {
        const a = rng.int(1, 3), k = rng.nonZero(8);
        plain = `${a === 1 ? '' : a}x^2 ${-a * k < 0 ? '-' : '+'} ${Math.abs(a * k)}x = 0`;
        roots = [0, k].sort((p, q) => p - q);
        how = R`Factor común: $${a === 1 ? '' : a}x(x ${-k < 0 ? '-' : '+'} ${Math.abs(k)}) = 0 \Rightarrow x = 0$ o $x = ${k}$.`;
      }
    } else if (level === 2) {
      const a = rng.pick([1, 1, 2]);
      const r1 = rng.nonZero(7);
      let r2 = rng.nonZero(7);
      if (r2 === r1 && rng.bool(0.7)) r2 = -r1 || 1;
      const P = Poly.fromNode(parse(`${a}(${lin(1, -r1)})(${lin(1, -r2)})`))!;
      plain = `${toText(P.toNode())} = 0`;
      roots = [...new Set([r1, r2])].sort((p, q) => p - q);
      const cs = P.coeffs('x').map((c) => c.toNumber());
      const disc = cs[1] ** 2 - 4 * cs[2] * cs[0];
      how = R`Fórmula resolvente con $a = ${cs[2]}$, $b = ${cs[1]}$, $c = ${cs[0]}$: $\Delta = ${disc}$, $x = \frac{${-cs[1]} \pm ${Math.sqrt(disc)}}{${2 * cs[2]}}$.`;
    } else {
      const noReal = rng.bool(0.3);
      const b = rng.nonZero(6);
      let c: number;
      if (noReal) c = Math.floor((b * b) / 4) + rng.int(1, 6);
      else {
        do c = rng.int(-10, Math.floor((b * b) / 4) - 1);
        while (Number.isInteger(Math.sqrt(b * b - 4 * c)));
      }
      plain = `x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)} = 0`;
      const disc = b * b - 4 * c;
      roots = disc < 0 ? [] : [(-b - Math.sqrt(disc)) / 2, (-b + Math.sqrt(disc)) / 2];
      how = disc < 0
        ? R`$\Delta = ${b}^2 - 4\cdot ${c} = ${disc} < 0$: no tiene soluciones reales.`
        : R`$\Delta = ${disc}$, $x = \frac{${-b} \pm \sqrt{${disc}}}{2}$.`;
    }
    return {
      prompt: R`Resuelve: $${tex(plain)}$${level === 3 ? ' (si no tiene soluciones reales, indícalo)' : ''}`,
      answer: { kind: 'solutions', variable: 'x', values: roots, diagnoseFrom: plain },
      steps: { start: plain, mode: 'equation', variable: 'x' },
      hints: [
        R`Incompletas: $x^2 = k \Rightarrow x = \pm\sqrt{k}$; $ax^2 + bx = 0 \Rightarrow x(ax + b) = 0$. Completas: $x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}$.`,
        level === 1 ? 'No olvides que una ecuación de segundo grado puede tener dos soluciones.' : R`Calcula primero el discriminante $\Delta = b^2 - 4ac$.`,
        how,
      ],
      solution: [{ math: tex(plain) }, { note: how }],
      expectedSeconds: 60 + 30 * level,
    };
  },
};

const quadraticDiscriminant: Generator = {
  id: 'quad.discriminant', skillId: 'alg.quadratic', title: 'Discriminante y cantidad de soluciones', levels: [1, 2],
  generate(rng) {
    const kind = rng.int(0, 2);
    const a = rng.int(1, 3);
    let b: number, c: number;
    if (kind === 1) { const r = rng.nonZero(5); b = -2 * a * r; c = a * r * r; }
    else {
      b = rng.nonZero(8);
      if (kind === 0) c = rng.int(-10, Math.floor((b * b) / (4 * a)) - 1);
      else c = Math.floor((b * b) / (4 * a)) + rng.int(1, 5);
    }
    const disc = b * b - 4 * a * c;
    const correct = disc > 0 ? 0 : disc === 0 ? 1 : 2;
    return {
      prompt: R`¿Cuántas soluciones reales tiene $${polyTex([a, b, c])} = 0$?`,
      answer: { kind: 'choice', options: ['Dos soluciones distintas', 'Una solución (doble)', 'Ninguna solución real'], correct },
      hints: [R`El discriminante $\Delta = b^2 - 4ac$ decide: $\Delta > 0$ dos, $\Delta = 0$ una, $\Delta < 0$ ninguna.`, R`Aquí $a = ${a}$, $b = ${b}$, $c = ${c}$.`, R`$\Delta = ${b * b} - ${4 * a * c} = ${disc}$.`],
      solution: [{ math: R`\Delta = ${pnum(b)}^2 - 4\cdot ${a}\cdot ${pnum(c)} = ${disc}` }],
      expectedSeconds: 35,
    };
  },
};

function pnum(v: number): string {
  return v < 0 ? `(${v})` : String(v);
}

const quadraticInequality: Generator = {
  id: 'quad.inequality', skillId: 'alg.quadratic', title: 'Inecuaciones cuadráticas', levels: [3],
  generate(rng) {
    const r1 = rng.int(-6, 3), r2 = r1 + rng.int(1, 6);
    const P = Poly.fromNode(parse(`(${lin(1, -r1)})(${lin(1, -r2)})`))!;
    const op = rng.pick(['<', '<=', '>', '>=']);
    const plain = `${toText(P.toNode())} ${op} 0`;
    const inside = op.startsWith('<');
    const closed = op.endsWith('=');
    const target = inside
      ? `${closed ? '[' : '('}${r1}, ${r2}${closed ? ']' : ')'}`
      : `(-infinity, ${r1}${closed ? ']' : ')'} ∪ ${closed ? '[' : '('}${r2}, infinity)`;
    return {
      prompt: R`Resuelve: $${tex(plain)}$ y expresa la solución con intervalos.`,
      answer: { kind: 'inequality', variable: 'x', target },
      hints: [
        'Halla las raíces de la cuadrática: dividen la recta en intervalos donde el signo no cambia.',
        R`Las raíces son $x = ${r1}$ y $x = ${r2}$. Como $a > 0$, la parábola es negativa entre las raíces y positiva afuera.`,
        R`Solución: $${inside ? ivTex(r1, r2, closed, closed) : `${ivTex(-Infinity, r1, false, closed)} \\cup ${ivTex(r2, Infinity, closed, false)}`}$.`,
      ],
      solution: [{ note: `Raíces ${r1} y ${r2}; la parábola abre hacia arriba.` }],
      expectedSeconds: 120,
    };
  },
};

// ---------------------------------------------------------------------------
// Sistemas
// ---------------------------------------------------------------------------

function eq2(a: number, b: number, c: number): string {
  const first = a === 0 ? '' : lin(a, 0, 'x');
  const second = b === 0 ? '' : first ? (b < 0 ? ` - ${Math.abs(b) === 1 ? '' : Math.abs(b)}y` : ` + ${b === 1 ? '' : b}y`) : lin(b, 0, 'y');
  return `${first}${second} = ${c}`;
}

const systemSolve: Generator = {
  id: 'sys.solve', skillId: 'alg.systems', title: 'Resolver sistemas 2×2', levels: [1, 2, 3],
  generate(rng, level) {
    const x0 = rng.nonZero(level === 3 ? 4 : 6) * (level === 3 ? 2 : 1);
    const y0 = rng.nonZero(level === 3 ? 3 : 6) * (level === 3 ? 3 : 1);
    let e1: string, e2: string, method: string;
    if (level === 1) {
      const m = rng.nonZero(4), q = y0 - m * x0;
      e1 = `y = ${lin(m, q)}`;
      const a = rng.nonZero(5), b = rng.nonZero(4);
      e2 = eq2(a, b, a * x0 + b * y0);
      method = R`Sustitución: reemplaza $y$ por $${tex(lin(m, q))}$ en la segunda ecuación.`;
    } else if (level === 2) {
      let a1 = rng.nonZero(5), b1 = rng.nonZero(5), a2 = rng.nonZero(5), b2 = rng.nonZero(5);
      while (a1 * b2 - a2 * b1 === 0) b2 = rng.nonZero(5);
      e1 = eq2(a1, b1, a1 * x0 + b1 * y0);
      e2 = eq2(a2, b2, a2 * x0 + b2 * y0);
      method = 'Reducción: multiplica las ecuaciones para que una incógnita tenga coeficientes opuestos y súmalas.';
    } else {
      e1 = `x/2 + y/3 = ${x0 / 2 + y0 / 3}`;
      const a = rng.nonZero(3), b = rng.nonZero(3);
      e2 = eq2(a, b, a * x0 + b * y0);
      method = 'Multiplica la primera ecuación por 6 para quitar denominadores y luego usa sustitución o reducción.';
    }
    return {
      prompt: R`Resuelve el sistema: $\begin{cases} ${tex(e1)} \\ ${tex(e2)} \end{cases}$`,
      answer: { kind: 'vector', values: [x0, y0], labels: ['x', 'y'] },
      hints: [
        'Métodos: sustitución (despejar y reemplazar), igualación o reducción (sumar ecuaciones para eliminar una incógnita).',
        method,
        R`La solución es $x = ${x0}$, $y = ${y0}$. Verifícala en ambas ecuaciones.`,
      ],
      solution: [{ math: R`x = ${x0},\quad y = ${y0}` }],
      expectedSeconds: 90 + 30 * level,
    };
  },
};

const systemClassify: Generator = {
  id: 'sys.classify', skillId: 'alg.systems', title: 'Clasificar sistemas', levels: [2, 3],
  generate(rng) {
    const kind = rng.int(0, 2);
    const a = rng.nonZero(4), b = rng.intExcept(1, 4, 0), c = rng.nonZero(8);
    const k = rng.pick([2, 3, -2]);
    let e2: [number, number, number];
    if (kind === 0) { let a2 = rng.nonZero(4); while (a2 * b === a * b) a2 = rng.nonZero(4); e2 = [a2, b, rng.nonZero(8)]; }
    else if (kind === 1) e2 = [a * k, b * k, c * k];
    else e2 = [a * k, b * k, c * k + rng.nonZero(3)];
    const labels = ['Compatible determinado (una solución)', 'Compatible indeterminado (infinitas soluciones)', 'Incompatible (sin solución)'];
    const why = ['Las rectas tienen distinta pendiente: se cortan en un punto.', 'Una ecuación es múltiplo de la otra: son la misma recta.', 'Las rectas son paralelas (misma pendiente, distinta ordenada): no se cortan.'][kind];
    const f1 = `(${c} - ${a}*x)/${b}`;
    const f2 = `(${e2[2]} - ${e2[0]}*x)/${e2[1]}`;
    return {
      prompt: R`Clasifica el sistema: $\begin{cases} ${tex(eq2(a, b, c))} \\ ${tex(eq2(...e2))} \end{cases}$`,
      answer: { kind: 'choice', options: labels, correct: kind },
      hints: [
        'Compara las pendientes de las rectas (o los cocientes entre coeficientes).',
        R`Mira si $\frac{a_1}{a_2} = \frac{b_1}{b_2}$ y si ese cociente coincide con $\frac{c_1}{c_2}$.`,
        why,
      ],
      solution: [{ note: why }],
      visual: { type: 'graph', functions: [{ expr: f1, label: '1' }, { expr: f2, label: '2', dashed: kind === 1 }] },
      expectedSeconds: 60,
    };
  },
};

const systemGraph: Generator = {
  id: 'sys.graph', skillId: 'alg.systems', title: 'Solución gráfica de un sistema', levels: [1, 2],
  generate(rng) {
    const x0 = rng.int(-4, 4), y0 = rng.int(-4, 4);
    const m1 = rng.nonZero(3);
    let m2 = rng.nonZero(3);
    while (m2 === m1) m2 = rng.nonZero(3);
    const q1 = y0 - m1 * x0, q2 = y0 - m2 * x0;
    return {
      prompt: R`Observa el gráfico de las rectas $y = ${tex(lin(m1, q1))}$ e $y = ${tex(lin(m2, q2))}$. ¿Cuál es la solución del sistema?`,
      visual: { type: 'graph', functions: [{ expr: lin(m1, q1) }, { expr: lin(m2, q2) }], view: { xmin: -8, xmax: 8, ymin: -8, ymax: 8 } },
      answer: { kind: 'vector', values: [x0, y0], labels: ['x', 'y'] },
      hints: ['La solución de un sistema es el punto donde se cortan las dos rectas.', 'Lee las coordenadas del punto de corte y compruébalas en ambas ecuaciones.', R`Se cortan en $(${x0};\ ${y0})$.`],
      solution: [{ math: R`(x;\ y) = (${x0};\ ${y0})` }],
      expectedSeconds: 40,
    };
  },
};

export const ALGEBRA_GENERATORS: Generator[] = [
  algTranslate, algReduce,
  polyEval, polyOps, polyRemainder,
  notableExpand, notableMiddle,
  factorCommon, factorSpecial, factorTrinomial,
  linearSolve, linearWord,
  inequalitySolve, intervalNotation,
  quadraticSolve, quadraticDiscriminant, quadraticInequality,
  systemSolve, systemClassify, systemGraph,
];
