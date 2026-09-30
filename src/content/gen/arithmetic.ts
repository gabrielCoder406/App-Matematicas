// Bloque 2: aritmética fundamental.
import { Frac } from '../../math/fraction';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { fr, gcd, n, pn, R } from './util';

/** Expresión con su LaTeX, su texto plano y su valor. */
interface E { t: string; p: string; v: number }
const num = (x: number): E => ({ t: pn(x), p: x < 0 ? `(${x})` : `${x}`, v: x });
const add = (a: E, b: E): E => ({ t: `${a.t} + ${b.t}`, p: `${a.p} + ${b.p}`, v: a.v + b.v });
const sub = (a: E, b: E): E => ({ t: `${a.t} - ${b.t}`, p: `${a.p} - ${b.p}`, v: a.v - b.v });
const mul = (a: E, b: E): E => ({ t: `${a.t} \\cdot ${b.t}`, p: `${a.p}*${b.p}`, v: a.v * b.v });
const dvd = (a: E, b: E): E => ({ t: `${a.t} : ${b.t}`, p: `${a.p} : ${b.p}`, v: a.v / b.v });
const par = (a: E): E => ({ t: R`\left(${a.t}\right)`, p: `(${a.p})`, v: a.v });
const brk = (a: E): E => ({ t: R`\left[${a.t}\right]`, p: `[${a.p}]`, v: a.v });
const powE = (a: E, k: number): E => ({ t: `${a.t}^{${k}}`, p: `${a.p}^${k}`, v: a.v ** k });

// ---------------------------------------------------------------------------

const NUMBER_ITEMS: { make: (rng: Rng) => { tex: string; sets: number[]; why: string } }[] = [
  { make: (rng) => { const k = rng.int(2, 40); return { tex: `${k}`, sets: [0, 1, 2, 3], why: `${k} es natural, y por lo tanto entero, racional y real.` }; } },
  { make: (rng) => { const k = -rng.int(1, 40); return { tex: `${k}`, sets: [1, 2, 3], why: 'Es entero negativo: no es natural, pero sí entero, racional y real.' }; } },
  { make: () => ({ tex: '0', sets: [1, 2, 3], why: R`El 0 es entero (con $\mathbb{N} = \{1, 2, 3, \dots\}$ no es natural).` }) },
  { make: (rng) => { const d = rng.pick([3, 4, 5, 7]); const k = rng.intExcept(1, d * 2, d, 2 * d); return { tex: fr(k, d), sets: [2, 3], why: 'Es una fracción que no da un entero: racional y real.' }; } },
  { make: (rng) => { const k = rng.int(11, 99) / 10 * rng.sign(); return { tex: n(k), sets: [2, 3], why: 'Un decimal finito se puede escribir como fracción: es racional.' }; } },
  { make: () => ({ tex: R`0{,}\overline{3}`, sets: [2, 3], why: R`Un decimal periódico es racional: $0{,}\overline{3} = \frac{1}{3}$.` }) },
  { make: (rng) => { const k = rng.pick([2, 3, 5, 6, 7, 10, 11]); return { tex: R`\sqrt{${k}}`, sets: [3, 4], why: `${k} no es un cuadrado perfecto: su raíz es irracional.` }; } },
  { make: () => ({ tex: R`\pi`, sets: [3, 4], why: R`$\pi$ tiene infinitas cifras decimales no periódicas: es irracional.` }) },
  { make: (rng) => { const k = rng.int(2, 12); return { tex: R`\sqrt{${k * k}}`, sets: [0, 1, 2, 3], why: R`$\sqrt{${k * k}} = ${k}$, que es natural.` }; } },
  { make: (rng) => { const k = rng.int(2, 9); return { tex: R`-\sqrt{${k * k}}`, sets: [1, 2, 3], why: R`$-\sqrt{${k * k}} = -${k}$, entero negativo.` }; } },
  { make: (rng) => { const k = rng.int(2, 8); const d = rng.pick([2, 3, 4]); return { tex: R`\frac{${k * d}}{${d}}`, sets: [0, 1, 2, 3], why: R`$\frac{${k * d}}{${d}} = ${k}$, que es natural.` }; } },
];

const SET_NAMES = [R`$\mathbb{N}$ (naturales)`, R`$\mathbb{Z}$ (enteros)`, R`$\mathbb{Q}$ (racionales)`, R`$\mathbb{R}$ (reales)`, R`$\mathbb{I}$ (irracionales)`];

const numberSets: Generator = {
  id: 'numsets.classify', skillId: 'arith.number-sets', title: 'Clasificar números', levels: [1, 2],
  generate(rng) {
    const item = rng.pick(NUMBER_ITEMS).make(rng);
    return {
      prompt: R`¿A qué conjuntos numéricos pertenece $${item.tex}$? Marca todos los que correspondan. (Consideramos $\mathbb{N} = \{1, 2, 3, \dots\}$.)`,
      answer: { kind: 'multi', options: SET_NAMES, correct: item.sets },
      hints: [
        R`$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$, y los irracionales son los reales que no son racionales.`,
        'Primero simplifica el número si puedes (por ejemplo, calcula la raíz o la fracción).',
        item.why,
      ],
      solution: [{ note: item.why }],
      expectedSeconds: 30,
    };
  },
};

const NUMBER_FACTS: { s: string; v: boolean; why: string }[] = [
  { s: 'Todo número natural es entero.', v: true, why: R`$\mathbb{N}\subset\mathbb{Z}$.` },
  { s: 'Todo número entero es natural.', v: false, why: 'Los enteros negativos no son naturales.' },
  { s: 'Todo número racional es real.', v: true, why: R`$\mathbb{Q}\subset\mathbb{R}$.` },
  { s: R`$\sqrt{2}$ es un número racional.`, v: false, why: R`$\sqrt{2}$ es irracional.` },
  { s: 'Todo decimal periódico es racional.', v: true, why: 'Todo decimal periódico se puede escribir como fracción.' },
  { s: 'La suma de dos irracionales siempre es irracional.', v: false, why: R`Contraejemplo: $\sqrt{2} + (-\sqrt{2}) = 0$.` },
  { s: 'Entre dos números racionales distintos siempre hay otro racional.', v: true, why: 'Por ejemplo, su promedio.' },
  { s: R`$-3$ es un número racional.`, v: true, why: R`$-3 = \frac{-3}{1}$.` },
  { s: 'Existe un número que es racional e irracional a la vez.', v: false, why: 'Los irracionales son justamente los reales que no son racionales.' },
  { s: R`$\frac{22}{7}$ es igual a $\pi$.`, v: false, why: R`$\frac{22}{7}$ es una aproximación racional de $\pi$, que es irracional.` },
];

const numberFacts: Generator = {
  id: 'numsets.facts', skillId: 'arith.number-sets', title: 'Verdadero o falso sobre conjuntos numéricos', levels: [1, 2],
  generate(rng) {
    const f = rng.pick(NUMBER_FACTS);
    return {
      prompt: `¿Verdadero o falso? ${f.s}`,
      answer: { kind: 'truefalse', correct: f.v },
      hints: [R`$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$. Un racional es un cociente de enteros.`, 'Busca un ejemplo o un contraejemplo.', f.why],
      solution: [{ note: f.why }],
      expectedSeconds: 20,
    };
  },
};

// ---------------------------------------------------------------------------

function signsExpr(rng: Rng, level: number): E {
  const r = () => rng.nonZero(12);
  if (level === 1) {
    const a = num(r());
    const b = num(r());
    return rng.bool() ? add(a, b) : sub(a, b);
  }
  if (level === 2) {
    const d = rng.nonZero(6);
    const q = rng.nonZero(6);
    const templates = [
      () => add(mul(num(r()), num(rng.nonZero(6))), dvd(num(d * q), num(d))),
      () => sub(mul(num(rng.nonZero(7)), num(rng.nonZero(7))), mul(num(rng.nonZero(5)), num(rng.nonZero(5)))),
      () => add(num(r()), mul(num(rng.nonZero(6)), num(rng.nonZero(6)))),
      () => sub(dvd(num(d * q), num(d)), num(r())),
    ];
    return rng.pick(templates)();
  }
  const templates = [
    () => add(mul(num(rng.nonZero(4)), brk(sub(num(r()), par(add(num(r()), num(r())))))), powE(num(rng.pick([-2, -3, 2])), rng.pick([2, 3]))),
    () => sub(powE(num(rng.pick([-2, -3, -1])), rng.pick([2, 3])), mul(num(rng.nonZero(5)), par(sub(num(r()), num(r()))))),
    () => add(dvd(par(add(num(r()), num(r()))), num(rng.pick([1, -1]))), mul(num(-2), num(rng.nonZero(9)))),
  ];
  return rng.pick(templates)();
}

const signsCompute: Generator = {
  id: 'signs.compute', skillId: 'arith.signs', title: 'Operaciones combinadas con enteros', levels: [1, 2, 3],
  errorTags: ['sign.term', 'sign.product', 'pow.neg-base', 'sign.distribute-neg'],
  generate(rng, level) {
    let e = signsExpr(rng, level);
    for (let i = 0; i < 20 && (!Number.isInteger(e.v) || Math.abs(e.v) > 200); i++) e = signsExpr(rng, level);
    return {
      prompt: R`Calcula: $${e.t}$`,
      answer: { kind: 'numeric', value: e.v, diagnoseFrom: e.p },
      steps: { start: e.p, mode: 'expression' },
      hints: [
        R`Regla de los signos: $(-)\cdot(-)=+$, $(-)\cdot(+)=-$. Orden: paréntesis, potencias, multiplicaciones y divisiones, sumas y restas.`,
        level === 1 ? 'Restar un número es sumar su opuesto: $a - (-b) = a + b$.' : 'Resuelve primero los paréntesis y las multiplicaciones/divisiones; deja las sumas y restas para el final.',
        R`El resultado es $${n(e.v)}$.`,
      ],
      solution: [{ math: R`${e.t} = ${n(e.v)}` }],
      expectedSeconds: 30 + 25 * level,
    };
  },
};

// ---------------------------------------------------------------------------

const fracSimplify: Generator = {
  id: 'frac.simplify', skillId: 'arith.fractions', title: 'Simplificar fracciones', levels: [1, 2],
  generate(rng, level) {
    const d0 = rng.int(2, level === 1 ? 7 : 12);
    const n0 = rng.intExcept(1, d0 * 2, d0);
    const f = new Frac(n0, d0);
    const k = rng.int(2, level === 1 ? 6 : 12);
    const N = f.n * k, D = f.d * k;
    const g = gcd(N, D);
    return {
      prompt: R`Simplifica la fracción $\frac{${N}}{${D}}$ hasta que sea irreducible.`,
      answer: { kind: 'numeric', value: f.toNumber(), requireReduced: true },
      visual: level === 1 && D <= 24 ? { type: 'fraction-bars', fractions: [[N, D], [f.n, f.d]] } : undefined,
      hints: [
        'Divide numerador y denominador por el mismo número (un divisor común). Es irreducible cuando ya no tienen divisores comunes.',
        `El máximo común divisor de ${N} y ${D} es ${g}.`,
        R`$\frac{${N}}{${D}} = \frac{${N} : ${g}}{${D} : ${g}} = ${fr(N, D)}$.`,
      ],
      solution: [{ math: R`\frac{${N}}{${D}} = ${fr(N, D)}` }],
      expectedSeconds: 30,
    };
  },
};

const fracOps: Generator = {
  id: 'frac.ops', skillId: 'arith.fractions', title: 'Operaciones con fracciones', levels: [1, 2, 3],
  errorTags: ['frac.add-num-den', 'frac.div-no-invert', 'frac.mul-cross'],
  generate(rng, level) {
    const mk = () => {
      const d = rng.int(2, level === 1 ? 6 : 10);
      return new Frac(rng.intExcept(1, d * 2 - 1, d) * (level === 3 && rng.bool(0.4) ? -1 : 1), d);
    };
    let a = mk(), b = mk();
    while (a.d === b.d && level > 1) b = mk();
    const ops = level === 1 ? ['+', '-'] : ['+', '-', '*', '/'];
    const op = rng.pick(ops);
    const res = op === '+' ? a.add(b) : op === '-' ? a.sub(b) : op === '*' ? a.mul(b) : a.div(b);
    const ft = (f: Frac) => (f.n < 0 ? R`\left(-\frac{${-f.n}}{${f.d}}\right)` : R`\frac{${f.n}}{${f.d}}`);
    const fp = (f: Frac) => `(${f.n}/${f.d})`;
    const opTex = { '+': '+', '-': '-', '*': R`\cdot`, '/': ':' }[op];
    const lcmD = (a.d * b.d) / gcd(a.d, b.d);
    const step =
      op === '+' || op === '-'
        ? R`Denominador común ${lcmD}: $\frac{${a.n * (lcmD / a.d)}}{${lcmD}} ${op} \frac{${b.n * (lcmD / b.d)}}{${lcmD}} = \frac{${op === '+' ? a.n * (lcmD / a.d) + b.n * (lcmD / b.d) : a.n * (lcmD / a.d) - b.n * (lcmD / b.d)}}{${lcmD}}$`
        : op === '*'
          ? R`$\frac{${a.n}\cdot ${pn(b.n)}}{${a.d}\cdot ${b.d}} = \frac{${a.n * b.n}}{${a.d * b.d}}$`
          : R`$\frac{${a.n}}{${a.d}} \cdot \frac{${b.d}}{${pn(b.n)}} = \frac{${a.n * b.d}}{${a.d * b.n}}$`;
    return {
      prompt: R`Calcula y simplifica: $${ft(a)} ${opTex} ${ft(b)}$`,
      answer: { kind: 'numeric', value: res.toNumber(), requireReduced: true, diagnoseFrom: `${fp(a)} ${op} ${fp(b)}` },
      steps: { start: `${fp(a)} ${op} ${fp(b)}`, mode: 'expression' },
      hints: [
        op === '+' || op === '-' ? 'Para sumar o restar fracciones necesitas un denominador común (el mcm de los denominadores).'
          : op === '*' ? 'Multiplica numerador por numerador y denominador por denominador.'
          : 'Dividir por una fracción es multiplicar por su inversa.',
        step,
        R`Simplificando, el resultado es $${res.toLatex()}$.`,
      ],
      solution: [{ math: R`${ft(a)} ${opTex} ${ft(b)} = ${res.toLatex()}` }],
      expectedSeconds: 45 + 20 * level,
    };
  },
};

const fracCompare: Generator = {
  id: 'frac.compare', skillId: 'arith.fractions', title: 'Comparar fracciones', levels: [1, 2],
  generate(rng) {
    const d1 = rng.int(2, 9), d2 = rng.intExcept(2, 9, d1);
    const a = new Frac(rng.int(1, d1 * 2), d1);
    let b = new Frac(rng.int(1, d2 * 2), d2);
    if (rng.bool(0.15)) b = new Frac(a.n * 2, a.d * 2);
    const bn = b.eq(a) ? a.n * 2 : b.n, bd = b.eq(a) ? a.d * 2 : b.d;
    const cmp = a.lt(b) ? 0 : a.eq(b) ? 2 : 1;
    return {
      prompt: R`Compara: $\frac{${a.n}}{${a.d}} \ \square\ \frac{${bn}}{${bd}}$`,
      visual: { type: 'fraction-bars', fractions: [[a.n, a.d], [bn, bd]] },
      answer: { kind: 'choice', options: ['$<$', '$>$', '$=$'], correct: cmp },
      hints: [
        'Para comparar fracciones, llévalas a un denominador común o multiplica en cruz.',
        R`Multiplica en cruz: $${a.n}\cdot ${bd}$ y $${bn}\cdot ${a.d}$.`,
        R`$${a.n * bd}$ ${cmp === 0 ? '<' : cmp === 1 ? '>' : '='} $${bn * a.d}$, así que la primera es ${cmp === 0 ? 'menor' : cmp === 1 ? 'mayor' : 'igual'}.`,
      ],
      solution: [{ math: R`\frac{${a.n}}{${a.d}} ${['<', '>', '='][cmp]} \frac{${bn}}{${bd}}` }],
      expectedSeconds: 25,
    };
  },
};

// ---------------------------------------------------------------------------

const percentOf: Generator = {
  id: 'pct.of', skillId: 'arith.decimals-percent', title: 'Porcentaje de una cantidad', levels: [1, 2],
  generate(rng, level) {
    const p = rng.pick(level === 1 ? [10, 20, 25, 50, 75] : [5, 12, 15, 30, 35, 40, 60, 80]);
    const N = rng.int(2, 30) * (level === 1 ? 20 : 40);
    const v = (p * N) / 100;
    return {
      prompt: R`¿Cuánto es el $${p}\%$ de $${N}$?`,
      answer: { kind: 'numeric', value: v },
      hints: [
        R`El $p\%$ de $N$ es $\frac{p}{100}\cdot N$.`,
        R`Calcula $\frac{${p}}{100}\cdot ${N}$.`,
        R`$\frac{${p}}{100}\cdot ${N} = ${n(v)}$.`,
      ],
      solution: [{ math: R`\frac{${p}}{100}\cdot ${N} = ${n(v)}` }],
      expectedSeconds: 30,
    };
  },
};

const percentChange: Generator = {
  id: 'pct.change', skillId: 'arith.decimals-percent', title: 'Aumentos, descuentos y porcentajes', levels: [1, 2, 3],
  generate(rng, level) {
    const kind = rng.int(0, level >= 2 ? 2 : 1);
    if (kind <= 1) {
      const up = kind === 0;
      const p = rng.pick([10, 15, 20, 25, 30, 40]);
      const price = rng.int(4, 40) * 100;
      const v = price * (1 + (up ? p : -p) / 100);
      return {
        prompt: up
          ? `Un producto cuesta \\$${price} y aumenta un ${p}%. ¿Cuál es el nuevo precio?`
          : `Una campera cuesta \\$${price} y tiene un descuento del ${p}%. ¿Cuánto se paga?`,
        answer: { kind: 'numeric', value: v, unit: '$' },
        hints: [
          R`Un ${up ? 'aumento' : 'descuento'} del $p\%$ equivale a multiplicar por $1 ${up ? '+' : '-'} \frac{p}{100}$.`,
          R`Multiplica ${price} por $${n(1 + (up ? p : -p) / 100)}$.`,
          R`$${price}\cdot ${n(1 + (up ? p : -p) / 100)} = ${n(v)}$.`,
        ],
        solution: [{ math: R`${price}\cdot ${n(1 + (up ? p : -p) / 100)} = ${n(v)}` }],
        expectedSeconds: 45,
      };
    }
    const total = rng.pick([20, 25, 40, 50, 80, 200, 400]);
    const p = rng.pick([5, 10, 15, 20, 25, 30, 45, 60, 75]);
    const part = (total * p) / 100;
    return {
      prompt: `En un curso de ${total} estudiantes, ${n(part)} usan anteojos. ¿Qué porcentaje del curso usa anteojos?`,
      answer: { kind: 'numeric', value: p, unit: '%' },
      hints: [
        R`Porcentaje $= \frac{\text{parte}}{\text{total}}\cdot 100$.`,
        R`Calcula $\frac{${n(part)}}{${total}}\cdot 100$.`,
        R`$\frac{${n(part)}}{${total}}\cdot 100 = ${p}\%$.`,
      ],
      solution: [{ math: R`\frac{${n(part)}}{${total}}\cdot 100 = ${p}\%` }],
      expectedSeconds: 40,
    };
  },
};

const decimalToFraction: Generator = {
  id: 'dec.to-frac', skillId: 'arith.decimals-percent', title: 'De decimal a fracción', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 3) {
      const cases = [
        { t: R`0{,}\overline{3}`, f: new Frac(1, 3), how: R`$x = 0{,}333\ldots \Rightarrow 10x - x = 3 \Rightarrow x = \frac{3}{9} = \frac13$` },
        { t: R`0{,}\overline{6}`, f: new Frac(2, 3), how: R`$10x - x = 6 \Rightarrow x = \frac{6}{9} = \frac23$` },
        { t: R`0{,}\overline{45}`, f: new Frac(5, 11), how: R`$100x - x = 45 \Rightarrow x = \frac{45}{99} = \frac{5}{11}$` },
        { t: R`1{,}\overline{2}`, f: new Frac(11, 9), how: R`$10x - x = 12{,}\overline{2} - 1{,}\overline{2} = 11 \Rightarrow x = \frac{11}{9}$` },
        { t: R`0{,}1\overline{6}`, f: new Frac(1, 6), how: R`$100x - 10x = 16{,}\overline{6} - 1{,}\overline{6} = 15 \Rightarrow x = \frac{15}{90} = \frac16$` },
      ];
      const c = rng.pick(cases);
      return {
        prompt: R`Escribe $${c.t}$ como fracción irreducible.`,
        answer: { kind: 'numeric', value: c.f.toNumber(), requireReduced: true },
        hints: [
          'Un decimal periódico se convierte en fracción multiplicando por potencias de 10 para cancelar la parte periódica.',
          R`Llama $x$ al número y multiplica por 10 (o 100) para que el período quede alineado.`,
          c.how,
        ],
        solution: [{ note: c.how }],
        expectedSeconds: 70,
      };
    }
    const den = rng.pick(level === 1 ? [2, 4, 5, 10, 20] : [8, 25, 40, 50, 125]);
    const f = new Frac(rng.intExcept(1, den * (level === 1 ? 1 : 3), den, 2 * den, 3 * den), den);
    const dec = f.toNumber();
    const digits = String(dec).split('.')[1]?.length ?? 0;
    const pow10 = 10 ** digits;
    return {
      prompt: R`Escribe $${n(dec)}$ como fracción irreducible.`,
      answer: { kind: 'numeric', value: dec, requireReduced: true },
      hints: [
        'Un decimal finito es una fracción con denominador 10, 100, 1000… Después simplifica.',
        R`$${n(dec)} = \frac{${Math.round(dec * pow10)}}{${pow10}}$.`,
        R`$\frac{${Math.round(dec * pow10)}}{${pow10}} = ${f.toLatex()}$.`,
      ],
      solution: [{ math: R`${n(dec)} = \frac{${Math.round(dec * pow10)}}{${pow10}} = ${f.toLatex()}` }],
      expectedSeconds: 35,
    };
  },
};

// ---------------------------------------------------------------------------

const DIRECT_CONTEXTS = [
  (a: number, b: number, c: number) => ({ q: `Si ${a} cuadernos cuestan \\$${b}, ¿cuánto cuestan ${c} cuadernos?` }),
  (a: number, b: number, c: number) => ({ q: `Un auto recorre ${b} km con ${a} litros de nafta. ¿Cuántos km recorre con ${c} litros?` }),
  (a: number, b: number, c: number) => ({ q: `Una impresora imprime ${b} páginas en ${a} minutos. ¿Cuántas páginas imprime en ${c} minutos?` }),
  (a: number, b: number, c: number) => ({ q: `Para ${a} personas se necesitan ${b} gramos de harina. ¿Cuántos gramos se necesitan para ${c} personas?` }),
];

const INVERSE_CONTEXTS = [
  (a: number, b: number, c: number) => `${a} obreros construyen un muro en ${b} días. ¿Cuántos días tardarían ${c} obreros?`,
  (a: number, b: number, c: number) => `A ${a * 10} km/h un viaje dura ${b} horas. ¿Cuántas horas dura a ${c * 10} km/h?`,
  (a: number, b: number, c: number) => `${a} canillas llenan un tanque en ${b} horas. ¿Cuánto tardan ${c} canillas?`,
];

const ruleOfThree: Generator = {
  id: 'prop.rule3', skillId: 'arith.proportion', title: 'Regla de tres simple', levels: [1, 2],
  generate(rng, level) {
    const inverse = level === 2 && rng.bool(0.6);
    if (!inverse) {
      const a = rng.int(2, 9);
      const unit = rng.int(2, 30) * (rng.bool() ? 5 : 1);
      const b = a * unit;
      const c = rng.intExcept(2, 15, a);
      const x = c * unit;
      const ctx = rng.pick(DIRECT_CONTEXTS)(a, b, c);
      return {
        prompt: ctx.q,
        answer: { kind: 'numeric', value: x },
        hints: [
          R`Es proporcionalidad **directa**: si una magnitud aumenta, la otra aumenta en la misma proporción. $\frac{${a}}{${b}} = \frac{${c}}{x}$.`,
          R`$x = \frac{${b}\cdot ${c}}{${a}}$.`,
          R`$x = \frac{${b}\cdot ${c}}{${a}} = ${x}$ (o bien: 1 unidad corresponde a ${unit}).`,
        ],
        solution: [{ math: R`x = \frac{${b}\cdot ${c}}{${a}} = ${x}` }],
        expectedSeconds: 50,
      };
    }
    const W = rng.pick([12, 24, 36, 48, 60, 72]);
    const divs = [2, 3, 4, 6, 8, 12].filter((d) => W % d === 0 && W / d <= 40);
    const a = rng.pick(divs);
    const c = rng.pick(divs.filter((d) => d !== a));
    const b = W / a;
    const x = W / c;
    const q = rng.pick(INVERSE_CONTEXTS)(a, b, c);
    return {
      prompt: q,
      answer: { kind: 'numeric', value: x },
      hints: [
        R`Es proporcionalidad **inversa**: si una magnitud aumenta, la otra disminuye. El producto se mantiene constante: $${a}\cdot ${b} = ${c}\cdot x$.`,
        R`$x = \frac{${a}\cdot ${b}}{${c}}$.`,
        R`$x = \frac{${a}\cdot ${b}}{${c}} = ${x}$.`,
      ],
      solution: [{ math: R`x = \frac{${a}\cdot ${b}}{${c}} = ${x}` }],
      expectedSeconds: 60,
    };
  },
};

const ruleOfThreeCompound: Generator = {
  id: 'prop.compound', skillId: 'arith.proportion', title: 'Regla de tres compuesta', levels: [3],
  generate(rng) {
    if (rng.bool()) {
      // obreros (inversa), horas diarias (inversa) → días
      const a = rng.pick([4, 6, 8, 10, 12]);
      const h = rng.pick([6, 8, 10]);
      const d = rng.pick([10, 12, 15, 18, 20]);
      const total = a * h * d;
      const combos: [number, number][] = [];
      for (const a2 of [2, 3, 4, 5, 6, 8, 10, 12, 15, 16]) for (const h2 of [4, 5, 6, 8, 10, 12]) if (total % (a2 * h2) === 0 && (a2 !== a || h2 !== h)) combos.push([a2, h2]);
      const [a2, h2] = rng.pick(combos);
      const x = total / (a2 * h2);
      return {
        prompt: `${a} obreros, trabajando ${h} horas por día, terminan una obra en ${d} días. ¿Cuántos días tardarán ${a2} obreros trabajando ${h2} horas por día?`,
        answer: { kind: 'numeric', value: x },
        hints: [
          'Compara cada magnitud con la incógnita (días) por separado: más obreros → menos días (inversa); más horas por día → menos días (inversa).',
          R`La cantidad total de trabajo (obreros × horas × días) es constante: $${a}\cdot ${h}\cdot ${d} = ${a2}\cdot ${h2}\cdot x$.`,
          R`$x = \frac{${a}\cdot ${h}\cdot ${d}}{${a2}\cdot ${h2}} = ${x}$.`,
        ],
        solution: [{ math: R`x = \frac{${a}\cdot ${h}\cdot ${d}}{${a2}\cdot ${h2}} = ${x}` }],
        expectedSeconds: 120,
      };
    }
    const m = rng.pick([2, 3, 4, 5]);
    const t = rng.pick([2, 3, 4, 6]);
    const rate = rng.pick([5, 10, 12, 15, 20]);
    const p = m * t * rate;
    const m2 = rng.intExcept(2, 8, m);
    const t2 = rng.intExcept(2, 8, t);
    const x = m2 * t2 * rate;
    return {
      prompt: `${m} máquinas iguales producen ${p} piezas en ${t} horas. ¿Cuántas piezas producirán ${m2} máquinas en ${t2} horas?`,
      answer: { kind: 'numeric', value: x },
      hints: [
        'Más máquinas → más piezas (directa); más horas → más piezas (directa).',
        R`Una máquina produce $\frac{${p}}{${m}\cdot ${t}} = ${rate}$ piezas por hora.`,
        R`$x = ${rate}\cdot ${m2}\cdot ${t2} = ${x}$.`,
      ],
      solution: [{ math: R`x = ${p}\cdot\frac{${m2}}{${m}}\cdot\frac{${t2}}{${t}} = ${x}` }],
      expectedSeconds: 100,
    };
  },
};

const PROPORTION_TYPES: { a: string; b: string; t: 0 | 1 | 2 }[] = [
  { a: 'kilos de pan comprados', b: 'precio a pagar', t: 0 },
  { a: 'velocidad de un auto', b: 'tiempo que tarda en un recorrido', t: 1 },
  { a: 'cantidad de obreros', b: 'días que tardan en una obra', t: 1 },
  { a: 'horas trabajadas', b: 'sueldo (pago por hora)', t: 0 },
  { a: 'cantidad de canillas abiertas', b: 'tiempo de llenado de un tanque', t: 1 },
  { a: 'litros de pintura', b: 'metros cuadrados pintados', t: 0 },
  { a: 'edad de una persona', b: 'su altura', t: 2 },
  { a: 'lado de un cuadrado', b: 'su área', t: 2 },
];

const proportionType: Generator = {
  id: 'prop.type', skillId: 'arith.proportion', title: '¿Directa o inversa?', levels: [1],
  generate(rng) {
    const p = rng.pick(PROPORTION_TYPES);
    const why = ['Si una se duplica, la otra también: directa.', 'Si una se duplica, la otra se reduce a la mitad: inversa.', 'No se cumple ninguna de las dos relaciones de forma exacta: no es proporcional.'][p.t];
    return {
      prompt: `¿Qué relación hay entre «${p.a}» y «${p.b}»?`,
      answer: { kind: 'choice', options: ['Proporcionalidad directa', 'Proporcionalidad inversa', 'No son proporcionales'], correct: p.t },
      hints: ['Pregúntate: si una magnitud se duplica, ¿qué pasa con la otra?', 'Directa: el cociente es constante. Inversa: el producto es constante.', why],
      solution: [{ note: why }],
      expectedSeconds: 20,
    };
  },
};

// ---------------------------------------------------------------------------

const powerEval: Generator = {
  id: 'pow.eval', skillId: 'arith.powers', title: 'Calcular potencias', levels: [1, 2, 3],
  errorTags: ['pow.neg-base', 'pow.neg-exp', 'pow.base-times-exp'],
  generate(rng, level) {
    type C = { t: string; p: string; v: Frac };
    const b = rng.int(2, 5);
    const pool: C[][] = [
      [
        { t: R`(-${b})^{3}`, p: `(-${b})^3`, v: new Frac((-b) ** 3) },
        { t: R`${b}^{4}`, p: `${b}^4`, v: new Frac(b ** 4) },
        { t: R`(-${b})^{2}`, p: `(-${b})^2`, v: new Frac(b ** 2) },
        { t: R`${b + 3}^{0}`, p: `${b + 3}^0`, v: new Frac(1) },
      ],
      [
        { t: R`-${b}^{2}`, p: `-${b}^2`, v: new Frac(-(b ** 2)) },
        { t: R`${b}^{-2}`, p: `${b}^(-2)`, v: new Frac(1, b ** 2) },
        { t: R`\left(\frac{1}{${b}}\right)^{3}`, p: `(1/${b})^3`, v: new Frac(1, b ** 3) },
        { t: R`(-1)^{${rng.int(11, 40)}}`, p: '', v: new Frac(1) },
      ],
      [
        { t: R`\left(\frac{2}{${b + 1}}\right)^{-2}`, p: `(2/${b + 1})^(-2)`, v: new Frac((b + 1) ** 2, 4) },
        { t: R`\left(-\frac{1}{2}\right)^{-3}`, p: `(-1/2)^(-3)`, v: new Frac(-8) },
        { t: R`-${b}^{-2}`, p: `-${b}^(-2)`, v: new Frac(-1, b * b) },
        { t: R`${b}^{2}\cdot ${b}^{-3}`, p: `${b}^2*${b}^(-3)`, v: new Frac(1, b) },
      ],
    ];
    const c = rng.pick(pool[level - 1]);
    if (!c.p) {
      const e = Number(c.t.match(/\{(\d+)\}/)?.[1] ?? 2);
      c.v = new Frac(e % 2 === 0 ? 1 : -1);
      c.p = `(-1)^${e}`;
    }
    return {
      prompt: R`Calcula: $${c.t}$`,
      answer: { kind: 'numeric', value: c.v.toNumber(), requireReduced: !c.v.isInt(), diagnoseFrom: c.p },
      hints: [
        R`Cuidado: $-a^n$ es el opuesto de $a^n$, pero en $(-a)^n$ la base es negativa. Además $a^0 = 1$ y $a^{-n} = \frac{1}{a^n}$.`,
        'Identifica cuál es la base (¿incluye el signo?) y si el exponente es negativo.',
        R`$${c.t} = ${c.v.toLatex()}$.`,
      ],
      solution: [{ math: R`${c.t} = ${c.v.toLatex()}` }],
      expectedSeconds: 30 + 10 * level,
    };
  },
};

const powerProps: Generator = {
  id: 'pow.props', skillId: 'arith.powers', title: 'Propiedades de las potencias', levels: [1, 2, 3],
  errorTags: ['pow.product-exp', 'pow.power-exp', 'pow.quotient-exp', 'pow.partial-product'],
  generate(rng, level) {
    const a = rng.int(2, 7), b = rng.int(2, 6), c = rng.int(2, 4);
    type C = { t: string; p: string; target: string; tt: string; rule: string };
    const k = rng.int(2, 3);
    const pool: C[][] = [
      [
        { t: R`x^{${a}}\cdot x^{${b}}`, p: `x^${a}*x^${b}`, target: `x^${a + b}`, tt: R`x^{${a + b}}`, rule: 'Producto de potencias de igual base: se suman los exponentes.' },
        { t: R`\frac{x^{${a + b}}}{x^{${b}}}`, p: `x^${a + b}/x^${b}`, target: `x^${a}`, tt: R`x^{${a}}`, rule: 'Cociente de potencias de igual base: se restan los exponentes.' },
      ],
      [
        { t: R`\left(x^{${a}}\right)^{${c}}`, p: `(x^${a})^${c}`, target: `x^${a * c}`, tt: R`x^{${a * c}}`, rule: 'Potencia de una potencia: se multiplican los exponentes.' },
        { t: R`\left(${k}x^{${a}}\right)^{${c}}`, p: `(${k}x^${a})^${c}`, target: `${k ** c}x^${a * c}`, tt: R`${k ** c}x^{${a * c}}`, rule: 'Potencia de un producto: el exponente afecta a cada factor.' },
        { t: R`\frac{x^{${a}}\cdot x^{${b}}}{x^{${c}}}`, p: `x^${a}*x^${b}/x^${c}`, target: `x^${a + b - c}`, tt: R`x^{${a + b - c}}`, rule: 'Suma los exponentes del numerador y resta el del denominador.' },
      ],
      [
        { t: R`\frac{\left(x^{${a}}y\right)^{${c}}}{x^{${a}}y^{${c}}}`, p: `(x^${a}*y)^${c}/(x^${a}*y^${c})`, target: `x^${a * c - a}`, tt: R`x^{${a * c - a}}`, rule: 'Primero la potencia del producto; después simplifica cada base.' },
        { t: R`\frac{${k}x^{${a + 2}}\cdot x^{${b}}}{\left(x^{2}\right)^{${c}}}`, p: `${k}x^${a + 2}*x^${b}/(x^2)^${c}`, target: `${k}x^${a + 2 + b - 2 * c}`, tt: R`${k}x^{${a + 2 + b - 2 * c}}`, rule: 'Combina las tres propiedades: producto, cociente y potencia de potencia.' },
      ],
    ];
    const ex = rng.pick(pool[level - 1]);
    return {
      prompt: R`Simplifica usando las propiedades de las potencias: $${ex.t}$`,
      answer: { kind: 'expression', target: ex.target, form: 'monomial', diagnoseFrom: ex.p },
      steps: { start: ex.p, mode: 'expression' },
      hints: [
        R`$a^m\cdot a^n=a^{m+n}$, $\frac{a^m}{a^n}=a^{m-n}$, $(a^m)^n=a^{m\cdot n}$, $(ab)^n = a^n b^n$.`,
        ex.rule,
        R`Resultado: $${ex.tt}$.`,
      ],
      solution: [{ math: R`${ex.t} = ${ex.tt}`, note: ex.rule }],
      expectedSeconds: 40 + 15 * level,
    };
  },
};

// ---------------------------------------------------------------------------

const rootsEval: Generator = {
  id: 'roots.eval', skillId: 'arith.roots', title: 'Calcular raíces', levels: [1, 2, 3],
  errorTags: ['root.sum'],
  generate(rng, level) {
    const k = rng.int(2, 12);
    type C = { t: string; v: Frac; how: string };
    const pool: C[][] = [
      [
        { t: R`\sqrt{${k * k}}`, v: new Frac(k), how: R`$${k}^2 = ${k * k}$` },
        { t: R`\sqrt[3]{${-(((k % 5) + 2) ** 3)}}`, v: new Frac(-((k % 5) + 2)), how: R`$(${-((k % 5) + 2)})^3 = ${-(((k % 5) + 2) ** 3)}$` },
      ],
      [
        { t: R`\sqrt{\frac{${(k % 7 + 2) ** 2}}{${(k % 5 + 3) ** 2}}}`, v: new Frac(k % 7 + 2, k % 5 + 3), how: 'La raíz de un cociente es el cociente de las raíces.' },
        { t: R`\sqrt[4]{${(k % 4 + 2) ** 4}}`, v: new Frac(k % 4 + 2), how: R`$${k % 4 + 2}^4 = ${(k % 4 + 2) ** 4}$` },
        { t: R`\sqrt{${(k % 4 + 3) ** 2 - 16} + 16}`, v: new Frac(k % 4 + 3), how: R`Primero se suma dentro de la raíz: $\sqrt{${(k % 4 + 3) ** 2}} = ${k % 4 + 3}$ (¡no se separa la raíz de una suma!).` },
      ],
      [
        { t: R`8^{\frac{2}{3}}`, v: new Frac(4), how: R`$8^{\frac23} = \left(\sqrt[3]{8}\right)^2 = 2^2 = 4$` },
        { t: R`27^{-\frac{1}{3}}`, v: new Frac(1, 3), how: R`$27^{-\frac13} = \frac{1}{\sqrt[3]{27}} = \frac13$` },
        { t: R`16^{\frac{3}{4}}`, v: new Frac(8), how: R`$\left(\sqrt[4]{16}\right)^3 = 2^3 = 8$` },
        { t: R`\left(\frac{4}{9}\right)^{-\frac{1}{2}}`, v: new Frac(3, 2), how: R`$\left(\frac49\right)^{-\frac12} = \left(\frac94\right)^{\frac12} = \frac32$` },
      ],
    ];
    const c = rng.pick(pool[level - 1]);
    return {
      prompt: R`Calcula: $${c.t}$`,
      answer: { kind: 'numeric', value: c.v.toNumber(), requireReduced: !c.v.isInt() },
      hints: [
        R`$\sqrt[n]{a} = b \iff b^n = a$. Además $a^{\frac{m}{n}} = \sqrt[n]{a^m}$ y $a^{-\frac mn} = \frac{1}{a^{\frac mn}}$.`,
        'Busca qué número elevado al índice da el radicando.',
        c.how + R`. Resultado: $${c.v.toLatex()}$.`,
      ],
      solution: [{ math: R`${c.t} = ${c.v.toLatex()}`, note: c.how }],
      expectedSeconds: 30 + 15 * level,
    };
  },
};

const SQUAREFREE = [2, 3, 5, 6, 7, 10];

const rootsSimplify: Generator = {
  id: 'roots.simplify', skillId: 'arith.roots', title: 'Simplificar radicales', levels: [1, 2, 3],
  errorTags: ['root.sum'],
  generate(rng, level) {
    const b = rng.pick(SQUAREFREE);
    const a1 = rng.int(2, 5);
    const a2 = rng.intExcept(2, 5, a1);
    if (level === 1) {
      return {
        prompt: R`Simplifica: $\sqrt{${a1 * a1 * b}}$`,
        answer: { kind: 'expression', target: `${a1}sqrt(${b})`, form: 'radical' },
        hints: [
          R`$\sqrt{a^2\cdot b} = a\sqrt{b}$: busca el mayor cuadrado perfecto que divide al radicando.`,
          R`$${a1 * a1 * b} = ${a1 * a1}\cdot ${b}$.`,
          R`$\sqrt{${a1 * a1 * b}} = \sqrt{${a1 * a1}}\cdot\sqrt{${b}} = ${a1}\sqrt{${b}}$.`,
        ],
        solution: [{ math: R`\sqrt{${a1 * a1 * b}} = ${a1}\sqrt{${b}}` }],
        expectedSeconds: 40,
      };
    }
    const sgn = level === 3 && rng.bool() ? -1 : 1;
    const coef = a1 + sgn * a2;
    const t = R`\sqrt{${a1 * a1 * b}} ${sgn > 0 ? '+' : '-'} \sqrt{${a2 * a2 * b}}`;
    const target = coef === 1 ? `sqrt(${b})` : coef === -1 ? `-sqrt(${b})` : `${coef}sqrt(${b})`;
    const tt = coef === 1 ? R`\sqrt{${b}}` : coef === -1 ? R`-\sqrt{${b}}` : R`${coef}\sqrt{${b}}`;
    return {
      prompt: R`Simplifica: $${t}$`,
      answer: { kind: 'expression', target, form: 'radical', diagnoseFrom: `sqrt(${a1 * a1 * b}) ${sgn > 0 ? '+' : '-'} sqrt(${a2 * a2 * b})` },
      hints: [
        R`Solo se pueden sumar radicales semejantes (mismo índice y mismo radicando): $3\sqrt2 + 5\sqrt2 = 8\sqrt2$. ¡No sumes los radicandos!`,
        R`Extrae factores: $\sqrt{${a1 * a1 * b}} = ${a1}\sqrt{${b}}$ y $\sqrt{${a2 * a2 * b}} = ${a2}\sqrt{${b}}$.`,
        R`$${a1}\sqrt{${b}} ${sgn > 0 ? '+' : '-'} ${a2}\sqrt{${b}} = ${tt}$.`,
      ],
      solution: [{ math: R`${t} = ${a1}\sqrt{${b}} ${sgn > 0 ? '+' : '-'} ${a2}\sqrt{${b}} = ${tt}` }],
      expectedSeconds: 60,
    };
  },
};

const rationalize: Generator = {
  id: 'roots.rationalize', skillId: 'arith.roots', title: 'Racionalizar denominadores', levels: [1, 2, 3],
  generate(rng, level) {
    const b = rng.pick([2, 3, 5, 6, 7]);
    if (level <= 2) {
      const m = rng.int(1, 5);
      const kNum = level === 1 ? b * m : rng.intExcept(1, 9, b, 2 * b);
      const f = new Frac(kNum, b);
      const coefTex = f.isInt() ? (f.n === 1 ? '' : `${f.n}`) : '';
      const tt = f.isInt() ? R`${coefTex}\sqrt{${b}}` : R`\frac{${f.n === 1 ? '' : f.n}\sqrt{${b}}}{${f.d}}`;
      const target = f.isInt() ? `${f.n}sqrt(${b})` : `${f.n}sqrt(${b})/${f.d}`;
      return {
        prompt: R`Racionaliza el denominador: $\frac{${kNum}}{\sqrt{${b}}}$`,
        answer: { kind: 'expression', target, form: 'rationalized' },
        hints: [
          R`Multiplica numerador y denominador por la raíz del denominador: $\frac{a}{\sqrt b} = \frac{a\sqrt b}{b}$.`,
          R`$\frac{${kNum}}{\sqrt{${b}}}\cdot\frac{\sqrt{${b}}}{\sqrt{${b}}} = \frac{${kNum}\sqrt{${b}}}{${b}}$.`,
          R`Simplificando: $${tt}$.`,
        ],
        solution: [{ math: R`\frac{${kNum}}{\sqrt{${b}}} = \frac{${kNum}\sqrt{${b}}}{${b}} = ${tt}` }],
        expectedSeconds: 50,
      };
    }
    // conjugado: c / (√b - a) con b - a² = d
    const cases = [
      { b: 3, a: 1 }, { b: 5, a: 1 }, { b: 5, a: 2 }, { b: 7, a: 2 }, { b: 6, a: 2 }, { b: 2, a: 1 }, { b: 10, a: 3 },
    ];
    const cs = rng.pick(cases);
    const d = cs.b - cs.a * cs.a;
    const m = rng.int(1, 3);
    const c = d * m;
    const target = m === 1 ? `sqrt(${cs.b}) + ${cs.a}` : `${m}(sqrt(${cs.b}) + ${cs.a})`;
    const tt = m === 1 ? R`\sqrt{${cs.b}} + ${cs.a}` : R`${m}\left(\sqrt{${cs.b}} + ${cs.a}\right)`;
    return {
      prompt: R`Racionaliza el denominador: $\frac{${c}}{\sqrt{${cs.b}} - ${cs.a}}$`,
      answer: { kind: 'expression', target, form: 'rationalized' },
      hints: [
        R`Multiplica por el conjugado del denominador: $(\sqrt b - a)(\sqrt b + a) = b - a^2$.`,
        R`$(\sqrt{${cs.b}} - ${cs.a})(\sqrt{${cs.b}} + ${cs.a}) = ${cs.b} - ${cs.a * cs.a} = ${d}$.`,
        R`$\frac{${c}(\sqrt{${cs.b}} + ${cs.a})}{${d}} = ${tt}$.`,
      ],
      solution: [{ math: R`\frac{${c}}{\sqrt{${cs.b}} - ${cs.a}}\cdot\frac{\sqrt{${cs.b}} + ${cs.a}}{\sqrt{${cs.b}} + ${cs.a}} = ${tt}` }],
      expectedSeconds: 80,
    };
  },
};

export const ARITHMETIC_GENERATORS: Generator[] = [
  numberSets, numberFacts,
  signsCompute,
  fracSimplify, fracOps, fracCompare,
  percentOf, percentChange, decimalToFraction,
  ruleOfThree, ruleOfThreeCompound, proportionType,
  powerEval, powerProps,
  rootsEval, rootsSimplify, rationalize,
];
