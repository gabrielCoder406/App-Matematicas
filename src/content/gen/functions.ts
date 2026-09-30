// Bloque 5: funciones y modelado gráfico.
import { Frac } from '../../math/fraction';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { choices, n, polyTex, polyText, R, round } from './util';

const fx = (a: number) => (a < 0 ? `(${a})` : `${a}`);

/** «x − a» en LaTeX. */
const xMinus = (a: number) => polyTex([1, -a]);

// ---------------------------------------------------------------------------
// Dominio, imagen, intersecciones
// ---------------------------------------------------------------------------

const domain: Generator = {
  id: 'fn.domain', skillId: 'fn.basics', title: 'Dominio de una función', levels: [1, 2, 3],
  generate(rng, level) {
    const a = rng.nonZero(6);
    const ab = Math.abs(a) + 1;
    const D = {
      minus: R`\mathbb{R} - \{${a}\}`,
      closedRight: R`[${a},\ +\infty)`,
      openRight: R`(${a},\ +\infty)`,
      closedLeft: R`(-\infty,\ ${a}]`,
      all: R`\mathbb{R}`,
      twoPoints: R`\mathbb{R} - \{-${ab},\ ${ab}\}`,
    };
    type F = { f: string; d: string; why: string };
    const pool: F[][] = [
      [
        { f: R`\frac{1}{${xMinus(a)}}`, d: D.minus, why: `El denominador no puede ser 0: $x \\neq ${a}$.` },
        { f: R`\sqrt{${xMinus(a)}}`, d: D.closedRight, why: `El radicando debe ser $\\ge 0$: $x \\ge ${a}$.` },
        { f: polyTex([1, -a, 3]), d: D.all, why: 'Los polinomios están definidos para todo número real.' },
      ],
      [
        { f: R`\sqrt{${polyTex([-1, a])}}`, d: D.closedLeft, why: `$${a} - x \\ge 0 \\iff x \\le ${a}$.` },
        { f: R`\ln(${xMinus(a)})`, d: D.openRight, why: `El argumento del logaritmo debe ser $> 0$: $x > ${a}$.` },
        { f: R`\frac{x}{x^2 - ${ab * ab}}`, d: D.twoPoints, why: `$x^2 - ${ab * ab} = 0$ para $x = \\pm ${ab}$.` },
      ],
      [
        { f: R`\frac{3}{\sqrt{${xMinus(a)}}}`, d: D.openRight, why: `La raíz debe existir y no anularse: $x - (${a}) > 0$.` },
        { f: R`\frac{\sqrt{${xMinus(a)}}}{2}`, d: D.closedRight, why: 'Solo importa el radicando, que debe ser no negativo.' },
        { f: R`\log\left((${xMinus(a)})^2\right)`, d: D.minus, why: 'El argumento $(x - a)^2$ es positivo salvo cuando vale 0.' },
      ],
    ];
    const it = rng.pick(pool[level - 1]);
    const { options, correct } = choices(rng, `$${it.d}$`, Object.values(D).map((s) => `$${s}$`));
    return {
      prompt: R`¿Cuál es el dominio de $f(x) = ${it.f}$?`,
      answer: { kind: 'choice', options, correct },
      hints: [
        R`Restricciones: no dividir por 0, radicando de índice par $\ge 0$, argumento del logaritmo $> 0$.`,
        'Identifica qué restricción aparece en esta función y plantea la condición.',
        it.why,
      ],
      solution: [{ math: R`\operatorname{Dom} f = ${it.d}` }],
      expectedSeconds: 35 + 10 * level,
    };
  },
};

const intercepts: Generator = {
  id: 'fn.intercepts', skillId: 'fn.basics', title: 'Intersecciones con los ejes', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 1) {
      const m = rng.nonZero(5), b = rng.nonZero(8);
      if (rng.bool()) return {
        prompt: R`¿En qué punto corta al eje $y$ la función $f(x) = ${polyTex([m, b])}$? Escribe la ordenada.`,
        visual: { type: 'graph', functions: [{ expr: polyText([m, b]) }] },
        answer: { kind: 'numeric', value: b },
        hints: [R`El corte con el eje $y$ es $f(0)$.`, R`$f(0) = ${m}\cdot 0 ${b < 0 ? '-' : '+'} ${Math.abs(b)}$.`, R`Corta en $(0;\ ${b})$.`],
        solution: [{ math: R`f(0) = ${b}` }], expectedSeconds: 20,
      };
      const root = new Frac(-b, m);
      return {
        prompt: R`¿En qué valor de $x$ corta al eje $x$ la función $f(x) = ${polyTex([m, b])}$?`,
        visual: { type: 'graph', functions: [{ expr: polyText([m, b]) }] },
        answer: { kind: 'solutions', variable: 'x', values: [root.toNumber()] },
        hints: [R`Los cortes con el eje $x$ son las soluciones de $f(x) = 0$.`, R`$${polyTex([m, b])} = 0$.`, R`$x = ${root.toLatex()}$.`],
        solution: [{ math: R`x = ${root.toLatex()}` }], expectedSeconds: 35,
      };
    }
    const r1 = rng.nonZero(5);
    let r2 = rng.nonZero(5);
    while (r2 === r1) r2 = rng.nonZero(5);
    const a = level === 3 ? rng.pick([-1, 2, -2]) : 1;
    const cs = [a, -a * (r1 + r2), a * r1 * r2];
    return {
      prompt: R`Halla los cortes con el eje $x$ de $f(x) = ${polyTex(cs)}$.`,
      visual: { type: 'graph', functions: [{ expr: polyText(cs) }] },
      answer: { kind: 'solutions', variable: 'x', values: [Math.min(r1, r2), Math.max(r1, r2)] },
      hints: [R`Resuelve $f(x) = 0$ (factorizando o con la fórmula resolvente).`, R`$${polyTex(cs)} = ${a === 1 ? '' : a === -1 ? '-' : a}(${xMinus(r1)})(${xMinus(r2)})$.`, R`Corta en $x = ${r1}$ y $x = ${r2}$.`],
      solution: [{ math: R`x_1 = ${r1},\quad x_2 = ${r2}` }], expectedSeconds: 60,
    };
  },
};

const evaluateFn: Generator = {
  id: 'fn.eval', skillId: 'fn.basics', title: 'Evaluar funciones', levels: [1, 2, 3],
  errorTags: ['pow.neg-base'],
  generate(rng, level) {
    if (level === 3) {
      const m = rng.nonZero(3), b = rng.nonZero(4), a = rng.nonZero(3);
      const g = m * a + b;
      const fv = g * g - 1;
      return {
        prompt: R`Sean $f(x) = x^2 - 1$ y $g(x) = ${polyTex([m, b])}$. Calcula $f(g(${a}))$.`,
        answer: { kind: 'numeric', value: fv },
        hints: [R`$f(g(a))$: primero calcula $g(a)$ y el resultado lo reemplazas en $f$.`, R`$g(${a}) = ${g}$.`, R`$f(${g}) = ${fx(g)}^2 - 1 = ${fv}$.`],
        solution: [{ math: R`g(${a}) = ${g},\ f(${g}) = ${fv}` }], expectedSeconds: 60,
      };
    }
    const a = rng.nonZero(4);
    if (level === 1) {
      const cs = [rng.nonZero(3), rng.int(-5, 5), rng.int(-6, 6)];
      const v = cs[0] * a * a + cs[1] * a + cs[2];
      return {
        prompt: R`Si $f(x) = ${polyTex(cs)}$, ¿cuánto vale $f(${a})$?`,
        answer: { kind: 'numeric', value: v, diagnoseFrom: polyText(cs, `(${a})`) },
        hints: [R`Reemplaza $x$ por ${fx(a)} (con paréntesis si es negativo).`, R`$f(${a}) = ${polyTex(cs).replace(/x/g, `(${a})`)}$.`, R`$f(${a}) = ${v}$.`],
        solution: [{ math: R`f(${a}) = ${v}` }], expectedSeconds: 40,
      };
    }
    const c = rng.intExcept(-5, 5, a, 0);
    const v = new Frac(a + 1, a - c);
    return {
      prompt: R`Si $f(x) = \frac{x + 1}{${xMinus(c)}}$, ¿cuánto vale $f(${a})$?`,
      answer: { kind: 'numeric', value: v.toNumber(), requireReduced: !v.isInt() },
      hints: [R`Reemplaza $x$ en el numerador y en el denominador.`, R`$f(${a}) = \frac{${a} + 1}{${a} - (${c})}$.`, R`$f(${a}) = ${v.toLatex()}$.`],
      solution: [{ math: R`f(${a}) = ${v.toLatex()}` }], expectedSeconds: 45,
    };
  },
};

// ---------------------------------------------------------------------------
// Lineales
// ---------------------------------------------------------------------------

function lineEq(m: Frac, b: Frac): string {
  return `y = (${m.toText()})*x + (${b.toText()})`;
}

function lineTex(m: Frac, b: Frac): string {
  const mt = m.eq(1) ? '' : m.eq(-1) ? '-' : m.toLatex();
  const bt = b.isZero() ? '' : b.sign() < 0 ? ` - ${b.neg().toLatex()}` : ` + ${b.toLatex()}`;
  return m.isZero() ? `y = ${b.toLatex()}` : `y = ${mt}x${bt}`;
}

const slope: Generator = {
  id: 'lin.slope', skillId: 'fn.linear', title: 'Pendiente entre dos puntos', levels: [1, 2],
  generate(rng) {
    const x1 = rng.int(-6, 6), y1 = rng.int(-6, 6);
    let x2 = rng.int(-6, 6);
    while (x2 === x1) x2 = rng.int(-6, 6);
    const y2 = rng.int(-6, 6);
    const m = new Frac(y2 - y1, x2 - x1);
    return {
      prompt: R`Calcula la pendiente de la recta que pasa por $A = (${x1};\ ${y1})$ y $B = (${x2};\ ${y2})$.`,
      answer: { kind: 'numeric', value: m.toNumber(), requireReduced: !m.isInt() },
      hints: [R`$m = \frac{y_2 - y_1}{x_2 - x_1}$ (cambio en $y$ sobre cambio en $x$).`, R`$m = \frac{${y2} - ${fx(y1)}}{${x2} - ${fx(x1)}}$.`, R`$m = \frac{${y2 - y1}}{${x2 - x1}} = ${m.toLatex()}$.`],
      solution: [{ math: R`m = \frac{${y2 - y1}}{${x2 - x1}} = ${m.toLatex()}` }], expectedSeconds: 40,
    };
  },
};

const lineEquation: Generator = {
  id: 'lin.equation', skillId: 'fn.linear', title: 'Ecuación de una recta', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 1) {
      const m = new Frac(rng.nonZero(4)), x0 = rng.int(-4, 4), y0 = rng.int(-6, 6);
      const b = new Frac(y0).sub(m.mul(x0));
      return {
        prompt: R`Escribe la ecuación de la recta de pendiente $${m.toLatex()}$ que pasa por $(${x0};\ ${y0})$ en la forma $y = mx + b$.`,
        answer: { kind: 'equation', target: lineEq(m, b), variable: 'y' },
        hints: [R`Usa $y - y_0 = m(x - x_0)$ y despeja $y$.`, R`$y - ${fx(y0)} = ${m.toLatex()}(x - ${fx(x0)})$.`, R`$${lineTex(m, b)}$.`],
        solution: [{ math: lineTex(m, b) }], expectedSeconds: 50,
      };
    }
    if (level === 2) {
      const x1 = rng.int(-5, 5);
      let x2 = rng.int(-5, 5);
      while (x2 === x1) x2 = rng.int(-5, 5);
      const y1 = rng.int(-6, 6), y2 = rng.int(-6, 6);
      const m = new Frac(y2 - y1, x2 - x1);
      const b = new Frac(y1).sub(m.mul(x1));
      return {
        prompt: R`Halla la ecuación de la recta que pasa por $(${x1};\ ${y1})$ y $(${x2};\ ${y2})$.`,
        answer: { kind: 'equation', target: lineEq(m, b), variable: 'y' },
        hints: [R`Primero calcula la pendiente $m = \frac{y_2 - y_1}{x_2 - x_1}$ y luego usa uno de los puntos.`, R`$m = ${m.toLatex()}$.`, R`$${lineTex(m, b)}$.`],
        solution: [{ math: lineTex(m, b) }], expectedSeconds: 70,
      };
    }
    const m0 = new Frac(rng.nonZero(3), rng.pick([1, 2, 3]));
    const perp = rng.bool();
    const m = perp ? new Frac(-1).div(m0) : m0;
    const x0 = rng.int(-4, 4), y0 = rng.int(-5, 5);
    const b = new Frac(y0).sub(m.mul(x0));
    return {
      prompt: R`Halla la recta ${perp ? 'perpendicular' : 'paralela'} a $${lineTex(m0, new Frac(rng.nonZero(5)))}$ que pasa por $(${x0};\ ${y0})$.`,
      answer: { kind: 'equation', target: lineEq(m, b), variable: 'y' },
      hints: [R`Paralelas: misma pendiente. Perpendiculares: $m_2 = -\frac{1}{m_1}$.`, R`La pendiente buscada es $m = ${m.toLatex()}$.`, R`$${lineTex(m, b)}$.`],
      solution: [{ math: lineTex(m, b) }], expectedSeconds: 80,
    };
  },
};

const readLine: Generator = {
  id: 'lin.read-graph', skillId: 'fn.linear', title: 'Leer pendiente y ordenada en un gráfico', levels: [1, 2],
  generate(rng) {
    const m = rng.nonZero(3), b = rng.int(-4, 4);
    return {
      prompt: R`Observa el gráfico de la recta. ¿Cuáles son su pendiente $m$ y su ordenada al origen $b$?`,
      visual: { type: 'graph', functions: [{ expr: polyText([m, b]) }], view: { xmin: -6, xmax: 6, ymin: -8, ymax: 8 } },
      answer: { kind: 'vector', values: [m, b], labels: ['m', 'b'] },
      hints: ['La ordenada al origen es donde la recta corta al eje y. La pendiente: cuánto sube (o baja) al avanzar 1 en x.', R`Mira el punto $(0;\ b)$ y luego avanza una unidad hacia la derecha.`, R`$m = ${m}$, $b = ${b}$.`],
      solution: [{ math: R`y = ${polyTex([m, b])}` }], expectedSeconds: 40,
    };
  },
};

// ---------------------------------------------------------------------------
// Cuadráticas
// ---------------------------------------------------------------------------

function vertexParams(rng: Rng) {
  const a = rng.pick([1, -1, 2, -2]);
  const h = rng.int(-4, 4), k = rng.int(-6, 6);
  const cs = [a, -2 * a * h, a * h * h + k];
  return { a, h, k, cs };
}

const quadVertex: Generator = {
  id: 'quadf.vertex', skillId: 'fn.quadratic', title: 'Vértice de una parábola', levels: [1, 2],
  generate(rng) {
    const { a, h, k, cs } = vertexParams(rng);
    return {
      prompt: R`Halla el vértice de $f(x) = ${polyTex(cs)}$.`,
      visual: { type: 'graph', functions: [{ expr: polyText(cs) }] },
      answer: { kind: 'vector', values: [h, k], labels: [R`x_v`, R`y_v`] },
      hints: [R`$x_v = -\frac{b}{2a}$ e $y_v = f(x_v)$.`, R`$x_v = -\frac{${cs[1]}}{2\cdot ${fx(a)}} = ${h}$.`, R`$y_v = f(${h}) = ${k}$. Vértice: $(${h};\ ${k})$.`],
      solution: [{ math: R`V = (${h};\ ${k})` }], expectedSeconds: 60,
    };
  },
};

const quadCanonical: Generator = {
  id: 'quadf.canonical', skillId: 'fn.quadratic', title: 'Forma canónica', levels: [2, 3],
  generate(rng) {
    const { a, h, k, cs } = vertexParams(rng);
    const target = `${a}(x - ${fx(h)})^2 + ${fx(k)}`;
    const tt = `${a === 1 ? '' : a === -1 ? '-' : a}(${xMinus(h)})^2${k === 0 ? '' : k < 0 ? ` - ${-k}` : ` + ${k}`}`;
    return {
      prompt: R`Escribe $f(x) = ${polyTex(cs)}$ en forma canónica $a(x - x_v)^2 + y_v$.`,
      answer: { kind: 'expression', target, form: 'vertex' },
      hints: [R`Calcula el vértice ($x_v = -\frac{b}{2a}$, $y_v = f(x_v)$); $a$ es el mismo coeficiente principal.`, R`El vértice es $(${h};\ ${k})$ y $a = ${a}$.`, R`$f(x) = ${tt}$.`],
      solution: [{ math: R`f(x) = ${tt}` }], expectedSeconds: 80,
    };
  },
};

const quadFeatures: Generator = {
  id: 'quadf.features', skillId: 'fn.quadratic', title: 'Características de la parábola', levels: [1, 2, 3],
  generate(rng, level) {
    const { a, h, k, cs } = vertexParams(rng);
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(1, 2) : rng.int(2, 3);
    if (kind === 0) return {
      prompt: R`La parábola $f(x) = ${polyTex(cs)}$, ¿abre hacia arriba o hacia abajo?`,
      answer: { kind: 'choice', options: ['Hacia arriba (tiene un mínimo)', 'Hacia abajo (tiene un máximo)'], correct: a > 0 ? 0 : 1 },
      hints: [R`Depende del signo de $a$, el coeficiente de $x^2$.`, R`Aquí $a = ${a}$.`, a > 0 ? 'Como a > 0, abre hacia arriba.' : 'Como a < 0, abre hacia abajo.'],
      solution: [{ note: a > 0 ? 'a > 0: hacia arriba.' : 'a < 0: hacia abajo.' }], expectedSeconds: 15,
    };
    if (kind === 1) return {
      prompt: R`¿Cuál es el eje de simetría de $f(x) = ${polyTex(cs)}$? Escribe el valor de $x$.`,
      answer: { kind: 'numeric', value: h },
      hints: [R`El eje de simetría es la recta vertical $x = x_v = -\frac{b}{2a}$.`, R`$x_v = -\frac{${cs[1]}}{${2 * a}}$.`, R`Eje: $x = ${h}$.`],
      solution: [{ math: R`x = ${h}` }], expectedSeconds: 35,
    };
    if (kind === 2) return {
      prompt: R`¿Cuál es el ${a > 0 ? 'valor mínimo' : 'valor máximo'} de $f(x) = ${polyTex(cs)}$?`,
      answer: { kind: 'numeric', value: k },
      hints: [R`El extremo de la parábola está en el vértice; su valor es $y_v = f(x_v)$.`, R`$x_v = ${h}$.`, R`$f(${h}) = ${k}$.`],
      solution: [{ math: R`y_v = ${k}` }], expectedSeconds: 50,
    };
    const correct = a > 0 ? R`[${k},\ +\infty)` : R`(-\infty,\ ${k}]`;
    const { options, correct: ci } = choices(rng, `$${correct}$`, [R`[${k},\ +\infty)`, R`(-\infty,\ ${k}]`, R`\mathbb{R}`, R`[${h},\ +\infty)`].map((s) => `$${s}$`));
    return {
      prompt: R`¿Cuál es la imagen de $f(x) = ${polyTex(cs)}$?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: [R`La imagen de una cuadrática va desde $y_v$ hacia arriba (si $a > 0$) o hacia abajo (si $a < 0$).`, R`El vértice es $(${h};\ ${k})$ y $a = ${a}$.`, `Imagen: $${correct}$.`],
      solution: [{ math: R`\operatorname{Im} f = ${correct}` }], expectedSeconds: 60,
    };
  },
};

// ---------------------------------------------------------------------------
// Polinómicas, racionales, irracionales
// ---------------------------------------------------------------------------

const asymptotes: Generator = {
  id: 'rat.asymptotes', skillId: 'fn.poly-rational', title: 'Asíntotas de funciones racionales', levels: [1, 2, 3],
  generate(rng, level) {
    const c = rng.nonZero(5), a = rng.nonZero(4);
    let b = rng.nonZero(6);
    while (a * c + b === 0) b = rng.nonZero(6);
    const k = level === 3 ? rng.pick([2, 3]) : 1;
    const HA = new Frac(a, k);
    const num = polyTex([a, b]);
    const den = k === 1 ? xMinus(c) : polyTex([k, -k * c]);
    return {
      prompt: R`Halla las asíntotas vertical y horizontal de $f(x) = \frac{${num}}{${den}}$.`,
      visual: level === 1 ? { type: 'graph', functions: [{ expr: `(${polyText([a, b])})/(${polyText([k, -k * c])})` }] } : undefined,
      answer: { kind: 'vector', values: [c, HA.toNumber()], labels: ['Asíntota vertical: x =', 'Asíntota horizontal: y ='] },
      hints: [R`Vertical: donde se anula el denominador (y no el numerador). Horizontal: con grados iguales, es el cociente de los coeficientes principales.`, R`$${den} = 0 \iff x = ${c}$; coeficientes principales: ${a} y ${k}.`, R`AV: $x = ${c}$. AH: $y = ${HA.toLatex()}$.`],
      solution: [{ math: R`x = ${c},\quad y = ${HA.toLatex()}` }], expectedSeconds: 60,
    };
  },
};

const polyRoots: Generator = {
  id: 'poly.roots', skillId: 'fn.poly-rational', title: 'Raíces de funciones polinómicas', levels: [1, 2, 3],
  generate(rng, level) {
    const rs = rng.sample([-4, -3, -2, -1, 1, 2, 3, 4], 3).sort((p, q) => p - q);
    if (level === 1) {
      const f = rs.map((r) => `(${xMinus(r)})`).join('');
      return {
        prompt: R`¿Cuáles son las raíces de $P(x) = ${f}$?`,
        answer: { kind: 'solutions', variable: 'x', values: rs },
        hints: ['Un producto es cero si y solo si alguno de sus factores es cero.', 'Iguala cada factor a cero.', R`Raíces: $x = ${rs.join(',\\ ')}$.`],
        solution: [{ math: R`x \in \{${rs.join(',\\ ')}\}` }], expectedSeconds: 30,
      };
    }
    const cs = [1, -(rs[0] + rs[1] + rs[2]), rs[0] * rs[1] + rs[0] * rs[2] + rs[1] * rs[2], -(rs[0] * rs[1] * rs[2])];
    const known = rs[level === 2 ? 0 : 1];
    const others = rs.filter((r) => r !== known);
    return {
      prompt: R`Sabiendo que $x = ${known}$ es raíz de $P(x) = ${polyTex(cs)}$, halla todas sus raíces.`,
      answer: { kind: 'solutions', variable: 'x', values: rs },
      hints: [R`Si $a$ es raíz, $P(x) = (x - a)\cdot Q(x)$. Divide por Ruffini y resuelve la cuadrática $Q(x) = 0$.`, R`Al dividir por $(${xMinus(known)})$ queda $Q(x) = ${polyTex([1, -(others[0] + others[1]), others[0] * others[1]])}$.`, R`Raíces: $x = ${rs.join(',\\ ')}$.`],
      solution: [{ math: R`P(x) = (${xMinus(rs[0])})(${xMinus(rs[1])})(${xMinus(rs[2])})` }], expectedSeconds: 110,
    };
  },
};

const irrationalDomain: Generator = {
  id: 'irr.domain', skillId: 'fn.poly-rational', title: 'Dominio de funciones irracionales', levels: [2, 3],
  generate(rng) {
    const a = rng.nonZero(4), x0 = rng.int(-5, 5);
    const b = -a * x0;
    const op = a > 0 ? '>=' : '<=';
    return {
      prompt: R`Halla el dominio de $f(x) = \sqrt{${polyTex([a, b])}}$ (escribe una desigualdad o un intervalo).`,
      answer: { kind: 'inequality', variable: 'x', target: `x ${op} ${x0}` },
      hints: [R`El radicando de una raíz cuadrada debe ser $\ge 0$.`, R`Resuelve $${polyTex([a, b])} \ge 0$${a < 0 ? ' (¡al dividir por un negativo, la desigualdad cambia!)' : ''}.`, R`$x ${a > 0 ? R`\ge` : R`\le`} ${x0}$.`],
      solution: [{ math: R`x ${a > 0 ? R`\ge` : R`\le`} ${x0}` }], expectedSeconds: 50,
    };
  },
};

// ---------------------------------------------------------------------------
// Exponenciales y logaritmos
// ---------------------------------------------------------------------------

const logEval: Generator = {
  id: 'log.eval', skillId: 'fn.exp-log', title: 'Calcular logaritmos', levels: [1, 2, 3],
  generate(rng, level) {
    const b = rng.pick([2, 3, 5, 10]);
    const k = level === 1 ? rng.int(1, 4) : rng.int(-3, 4);
    type C = { t: string; v: Frac; how: string };
    const cases: C[] = [];
    if (level === 1) cases.push({ t: b === 10 ? R`\log ${b ** k}` : R`\log_{${b}} ${b ** k}`, v: new Frac(k), how: R`$${b}^{${k}} = ${b ** k}$` });
    if (level >= 2) {
      cases.push({ t: R`\log_{${b}} ${k >= 0 ? b ** k : R`\frac{1}{${b ** -k}}`}`, v: new Frac(k), how: R`$${b}^{${k}} = ${k >= 0 ? b ** k : R`\frac{1}{${b ** -k}}`}$` });
      cases.push({ t: R`\ln e^{${k}}`, v: new Frac(k), how: R`$\ln e^{k} = k$` });
    }
    if (level === 3) {
      cases.push({ t: R`\log_{${b}} \sqrt{${b}}`, v: new Frac(1, 2), how: R`$\sqrt{${b}} = ${b}^{\frac12}$` });
      cases.push({ t: R`\log_{${b * b}} ${b}`, v: new Frac(1, 2), how: R`$(${b * b})^{\frac12} = ${b}$` });
    }
    const c = rng.pick(cases);
    return {
      prompt: R`Calcula: $${c.t}$`,
      answer: { kind: 'numeric', value: c.v.toNumber(), requireReduced: !c.v.isInt() },
      hints: [R`$\log_a b = c \iff a^c = b$. Pregúntate: ¿a qué exponente hay que elevar la base para obtener el número?`, 'Escribe el número como potencia de la base.', c.how + R`, así que el resultado es $${c.v.toLatex()}$.`],
      solution: [{ math: R`${c.t} = ${c.v.toLatex()}` }], expectedSeconds: 35 + 10 * level,
    };
  },
};

const logProps: Generator = {
  id: 'log.props', skillId: 'fn.exp-log', title: 'Propiedades de los logaritmos', levels: [2, 3],
  generate(rng) {
    const b = rng.pick([2, 3]);
    const k = rng.int(2, 4);
    const m = rng.int(2, 7);
    const kind = rng.int(0, 2);
    if (kind === 0) {
      const x = b ** k * m;
      return {
        prompt: R`Calcula usando propiedades: $\log_{${b}} ${x} - \log_{${b}} ${m}$`,
        answer: { kind: 'numeric', value: k },
        hints: [R`$\log x - \log y = \log\frac{x}{y}$.`, R`$\log_{${b}} \frac{${x}}{${m}} = \log_{${b}} ${b ** k}$.`, R`$= ${k}$.`],
        solution: [{ math: R`\log_{${b}}\frac{${x}}{${m}} = \log_{${b}} ${b ** k} = ${k}` }], expectedSeconds: 50,
      };
    }
    if (kind === 1) {
      const p = rng.int(1, k - 1);
      return {
        prompt: R`Calcula: $\log_{${b}} ${b ** p} + \log_{${b}} ${b ** (k - p)}$`,
        answer: { kind: 'numeric', value: k },
        hints: [R`$\log x + \log y = \log(x\cdot y)$.`, R`$\log_{${b}}(${b ** p}\cdot ${b ** (k - p)}) = \log_{${b}} ${b ** k}$.`, R`$= ${k}$.`],
        solution: [{ math: R`\log_{${b}} ${b ** k} = ${k}` }], expectedSeconds: 45,
      };
    }
    return {
      prompt: R`Calcula: $${m}\log_{${b}} ${b} + \log_{${b}} 1$`,
      answer: { kind: 'numeric', value: m },
      hints: [R`$\log_a a = 1$ y $\log_a 1 = 0$.`, R`$${m}\cdot 1 + 0$.`, R`$= ${m}$.`],
      solution: [{ math: R`${m}\cdot 1 + 0 = ${m}` }], expectedSeconds: 30,
    };
  },
};

const expEquation: Generator = {
  id: 'exp.equation', skillId: 'fn.exp-log', title: 'Ecuaciones exponenciales', levels: [1, 2, 3],
  generate(rng, level) {
    const b = rng.pick([2, 3, 5]);
    if (level === 3) {
      const c = rng.pick([3, 5, 7, 10]);
      return {
        prompt: R`Resuelve: $e^{x} = ${c}$ (puedes dejar el resultado con $\ln$).`,
        answer: { kind: 'solutions', variable: 'x', values: [Math.log(c)] },
        hints: [R`Aplica logaritmo natural a ambos miembros: $\ln e^x = x$.`, R`$x = \ln ${c}$.`, R`$x = \ln ${c} \approx ${n(round(Math.log(c), 4))}$.`],
        solution: [{ math: R`x = \ln ${c}` }], expectedSeconds: 50,
      };
    }
    const x = rng.int(-2, 4);
    const p = level === 1 ? 1 : rng.pick([2, 3]);
    const q = rng.int(-2, 3);
    const exp = p * x + q;
    const rhs = exp >= 0 ? `${b ** exp}` : R`\frac{1}{${b ** -exp}}`;
    const lhsExp = polyTex([p, q]);
    return {
      prompt: R`Resuelve: $${b}^{${lhsExp}} = ${rhs}$`,
      answer: { kind: 'solutions', variable: 'x', values: [x] },
      steps: { start: `${b}^(${polyText([p, q])}) = ${exp >= 0 ? b ** exp : `1/${b ** -exp}`}`, mode: 'equation', variable: 'x' },
      hints: [R`Escribe ambos miembros como potencias de la misma base e iguala los exponentes.`, R`$${rhs} = ${b}^{${exp}}$, así que $${lhsExp} = ${exp}$.`, R`$x = ${x}$.`],
      solution: [{ math: R`${lhsExp} = ${exp} \Rightarrow x = ${x}` }], expectedSeconds: 50 + 15 * level,
    };
  },
};

const expModel: Generator = {
  id: 'exp.model', skillId: 'fn.exp-log', title: 'Crecimiento y decrecimiento exponencial', levels: [2, 3],
  generate(rng) {
    if (rng.bool()) {
      const P0 = rng.pick([50, 100, 200, 500]), t = rng.int(2, 6);
      return {
        prompt: `Un cultivo tiene ${P0} bacterias y la población se duplica cada hora. ¿Cuántas habrá dentro de ${t} horas?`,
        answer: { kind: 'numeric', value: P0 * 2 ** t },
        hints: [R`Modelo: $P(t) = P_0\cdot 2^{t}$.`, R`$P(${t}) = ${P0}\cdot 2^{${t}}$.`, R`$= ${P0 * 2 ** t}$.`],
        solution: [{ math: R`P(${t}) = ${P0}\cdot 2^{${t}} = ${P0 * 2 ** t}` }], expectedSeconds: 45,
      };
    }
    const m0 = rng.pick([80, 160, 320, 640]), T = rng.pick([5, 10, 20]), k = rng.int(1, 4);
    return {
      prompt: `Una sustancia radiactiva tiene una vida media de ${T} años. Si hoy hay ${m0} g, ¿cuántos gramos quedarán dentro de ${T * k} años?`,
      answer: { kind: 'numeric', value: m0 / 2 ** k, unit: 'g' },
      hints: [R`Cada vida media la cantidad se reduce a la mitad: $m(t) = m_0\left(\frac12\right)^{t/T}$.`, R`Pasan $\frac{${T * k}}{${T}} = ${k}$ vidas medias.`, R`$m = ${m0}\cdot\left(\frac12\right)^{${k}} = ${n(m0 / 2 ** k)}$ g.`],
      solution: [{ math: R`${m0}\cdot\left(\frac12\right)^{${k}} = ${n(m0 / 2 ** k)}` }], expectedSeconds: 60,
    };
  },
};

export const FUNCTION_GENERATORS: Generator[] = [
  domain, intercepts, evaluateFn,
  slope, lineEquation, readLine,
  quadVertex, quadCanonical, quadFeatures,
  asymptotes, polyRoots, irrationalDomain,
  logEval, logProps, expEquation, expModel,
];
