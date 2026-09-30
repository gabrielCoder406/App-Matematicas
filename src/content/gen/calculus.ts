// Bloque 6: introducción al cálculo.
import { Frac } from '../../math/fraction';
import { parse } from '../../math/parse';
import { toLatex } from '../../math/print';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { choices, fracPolyTex, n, polyTex, polyText, R } from './util';

const xMinus = (a: number) => polyTex([1, -a]);
const lim = (a: string) => R`\lim_{x \to ${a}}`;

// ---------------------------------------------------------------------------
// Límites
// ---------------------------------------------------------------------------

const limitSubst: Generator = {
  id: 'lim.subst', skillId: 'calc.limits', title: 'Límites por sustitución', levels: [1],
  generate(rng) {
    const a = rng.int(-3, 3);
    const cs = [rng.nonZero(3), rng.int(-5, 5), rng.int(-6, 6)];
    const v = cs[0] * a * a + cs[1] * a + cs[2];
    return {
      prompt: R`Calcula $${lim(String(a))} \left(${polyTex(cs)}\right)$.`,
      answer: { kind: 'numeric', value: v },
      hints: [R`Si la función es continua en el punto (como los polinomios), el límite se calcula reemplazando.`, R`Reemplaza $x = ${a}$.`, R`El límite vale $${v}$.`],
      solution: [{ math: R`${lim(String(a))} \left(${polyTex(cs)}\right) = ${v}` }], expectedSeconds: 30,
    };
  },
};

const limitZeroOverZero: Generator = {
  id: 'lim.00', skillId: 'calc.limits', title: 'Indeterminación 0/0', levels: [2, 3],
  generate(rng, level) {
    if (level === 3 && rng.bool()) {
      const k = rng.int(1, 5);
      const v = new Frac(1, 2 * k);
      return {
        prompt: R`Calcula $${lim('0')} \frac{\sqrt{x + ${k * k}} - ${k}}{x}$.`,
        answer: { kind: 'numeric', value: v.toNumber(), requireReduced: true },
        hints: [R`Al sustituir queda $\frac00$. Multiplica y divide por el conjugado $\sqrt{x + ${k * k}} + ${k}$.`, R`$\frac{(x + ${k * k}) - ${k * k}}{x(\sqrt{x + ${k * k}} + ${k})} = \frac{1}{\sqrt{x + ${k * k}} + ${k}}$.`, R`Reemplazando $x = 0$: $\frac{1}{${2 * k}}$.`],
        solution: [{ math: R`\frac{1}{\sqrt{0 + ${k * k}} + ${k}} = ${v.toLatex()}` }], expectedSeconds: 110,
      };
    }
    const r = rng.nonZero(5);
    let s = rng.nonZero(5);
    while (s === r) s = rng.nonZero(5);
    const num = [1, -(r + s), r * s];
    const v = r - s;
    return {
      prompt: R`Calcula $${lim(String(r))} \frac{${polyTex(num)}}{${xMinus(r)}}$.`,
      visual: { type: 'graph', functions: [{ expr: `(${polyText(num)})/(${polyText([1, -r])})` }], points: [{ x: r, y: v, open: true }] },
      answer: { kind: 'numeric', value: v },
      hints: [R`Al sustituir queda $\frac{0}{0}$: factoriza el numerador y simplifica el factor que se anula.`, R`$${polyTex(num)} = (${xMinus(r)})(${xMinus(s)})$.`, R`Queda $${lim(String(r))} (${xMinus(s)}) = ${r} - (${s}) = ${v}$.`],
      solution: [{ math: R`${lim(String(r))} (${xMinus(s)}) = ${v}` }], expectedSeconds: 80,
    };
  },
};

const limitInfinity: Generator = {
  id: 'lim.inf', skillId: 'calc.limits', title: 'Límites en el infinito', levels: [2, 3],
  generate(rng) {
    const kind = rng.int(0, 1);
    const a = rng.nonZero(6), d = rng.nonZero(5);
    if (kind === 0) {
      const v = new Frac(a, d);
      const num = [a, rng.int(-5, 5), rng.int(-5, 5)];
      const den = [d, 0, rng.int(1, 7)];
      return {
        prompt: R`Calcula $${lim(R`+\infty`)} \frac{${polyTex(num)}}{${polyTex(den)}}$.`,
        answer: { kind: 'numeric', value: v.toNumber(), requireReduced: !v.isInt() },
        hints: [R`Con numerador y denominador del mismo grado, el límite es el cociente de los coeficientes principales.`, R`Divide todo por $x^2$: los términos con $\frac{1}{x}$ tienden a 0.`, R`$\frac{${a}}{${d}} = ${v.toLatex()}$.`],
        solution: [{ math: R`\frac{${a}}{${d}} = ${v.toLatex()}` }], expectedSeconds: 50,
      };
    }
    const num = [a, rng.int(-5, 5)];
    const den = [d, 0, rng.int(1, 7)];
    return {
      prompt: R`Calcula $${lim(R`+\infty`)} \frac{${polyTex(num)}}{${polyTex(den)}}$.`,
      answer: { kind: 'numeric', value: 0 },
      hints: ['Compara los grados del numerador y del denominador.', 'El denominador tiene mayor grado: crece mucho más rápido.', 'El límite es 0.'],
      solution: [{ math: '0' }], expectedSeconds: 40,
    };
  },
};

const continuity: Generator = {
  id: 'lim.continuity', skillId: 'calc.limits', title: 'Continuidad de funciones a trozos', levels: [3],
  generate(rng) {
    const c = rng.int(1, 3), p = rng.int(-3, 3), m = rng.nonZero(3);
    const left = c * c + p;
    const k = new Frac(left + m, c);
    return {
      prompt: R`¿Para qué valor de $k$ es continua en $x = ${c}$ la función $f(x) = \begin{cases} x^2 ${p < 0 ? '-' : '+'} ${Math.abs(p)} & \text{si } x < ${c} \\ kx ${m > 0 ? '-' : '+'} ${Math.abs(m)} & \text{si } x \ge ${c} \end{cases}$?`,
      answer: { kind: 'numeric', value: k.toNumber(), requireReduced: !k.isInt() },
      hints: [R`Para que sea continua, los límites laterales deben coincidir con el valor de la función en ${c}.`, R`Por izquierda: $${c}^2 ${p < 0 ? '-' : '+'} ${Math.abs(p)} = ${left}$. Por derecha: $${c}k ${m > 0 ? '-' : '+'} ${Math.abs(m)}$.`, R`$${c}k ${m > 0 ? '-' : '+'} ${Math.abs(m)} = ${left} \Rightarrow k = ${k.toLatex()}$.`],
      solution: [{ math: R`k = ${k.toLatex()}` }], expectedSeconds: 80,
    };
  },
};

// ---------------------------------------------------------------------------
// Derivadas
// ---------------------------------------------------------------------------

interface DerivCase { f: string; ft: string; d: string; how: string }

function derivCase(rng: Rng, level: number): DerivCase {
  if (level === 1) {
    const cs = [rng.nonZero(5), rng.int(-6, 6), rng.int(-9, 9), rng.int(-9, 9)];
    const d = [3 * cs[0], 2 * cs[1], cs[2]];
    return { f: polyText(cs), ft: polyTex(cs), d: polyText(d), how: R`Regla de la potencia término a término: $(ax^n)' = a\,n\,x^{n-1}$.` };
  }
  if (level === 2) {
    const a = rng.nonZero(4), b = rng.int(1, 6), c = rng.int(1, 4) * 2;
    return {
      f: `${a}x^4 - ${b}/x + ${c}sqrt(x)`,
      ft: R`${a}x^{4} - \frac{${b}}{x} + ${c}\sqrt{x}`,
      d: `${4 * a}x^3 + ${b}/x^2 + ${c / 2}/sqrt(x)`,
      how: R`Escribe $\frac{1}{x} = x^{-1}$ y $\sqrt{x} = x^{1/2}$ y aplica la regla de la potencia.`,
    };
  }
  const k = rng.int(2, 5), a = rng.int(1, 5), b = rng.nonZero(4), c = rng.nonZero(3);
  const xb = polyText([1, -b]);
  const xc = polyText([1, -c]);
  const ab = polyText([a, b]);
  const bank: DerivCase[] = [
    { f: `(x^2 + ${a})(${xb})`, ft: R`(x^2 + ${a})(${xMinus(b)})`, d: `2x(${xb}) + x^2 + ${a}`, how: R`Regla del producto: $(fg)' = f'g + fg'$.` },
    { f: `(${ab})/(${xc})`, ft: R`\frac{${polyTex([a, b])}}{${xMinus(c)}}`, d: `(${a}(${xc}) - (${ab}))/(${xc})^2`, how: R`Regla del cociente: $\left(\frac fg\right)' = \frac{f'g - fg'}{g^2}$.` },
    { f: `(x^2 - ${a})^${k}`, ft: R`(x^2 - ${a})^{${k}}`, d: `${k}(x^2 - ${a})^${k - 1}*2x`, how: R`Regla de la cadena: $[u^n]' = n\,u^{n-1}\cdot u'$.` },
    { f: `e^(${k}x)`, ft: R`e^{${k}x}`, d: `${k}e^(${k}x)`, how: R`$(e^{u})' = e^{u}\cdot u'$.` },
    { f: `sin(${k}x)`, ft: R`\operatorname{sen}(${k}x)`, d: `${k}cos(${k}x)`, how: R`$(\operatorname{sen} u)' = \cos u \cdot u'$.` },
    { f: `ln(x^2 + ${a})`, ft: R`\ln(x^2 + ${a})`, d: `2x/(x^2 + ${a})`, how: R`$(\ln u)' = \frac{u'}{u}$.` },
    { f: 'x*e^x', ft: R`x\,e^{x}`, d: 'e^x + x*e^x', how: 'Regla del producto con $(e^x)\' = e^x$.' },
  ];
  return rng.pick(bank);
}

const derivatives: Generator = {
  id: 'der.rules', skillId: 'calc.derivatives', title: 'Reglas de derivación', levels: [1, 2, 3],
  generate(rng, level) {
    const c = derivCase(rng, level);
    const dt = toLatex(parse(c.d));
    return {
      prompt: R`Deriva: $f(x) = ${c.ft}$`,
      answer: { kind: 'expression', target: c.d },
      hints: [R`$(x^n)' = n\,x^{n-1}$, $(k)' = 0$, $(fg)' = f'g + fg'$, $\left(\frac fg\right)' = \frac{f'g - fg'}{g^2}$, $(f(g(x)))' = f'(g(x))\,g'(x)$.`, c.how, R`$f'(x) = ${dt}$.`],
      solution: [{ math: R`f'(x) = ${dt}` }],
      expectedSeconds: 50 + 30 * level,
    };
  },
};

const derivativeAtPoint: Generator = {
  id: 'der.at-point', skillId: 'calc.derivatives', title: 'Derivada en un punto y velocidad', levels: [1, 2, 3],
  generate(rng, level) {
    if (level >= 2 && rng.bool()) {
      const a = rng.int(1, 3), b = rng.int(0, 10), t = rng.int(1, 6);
      const v = 3 * a * t * t + b;
      return {
        prompt: R`La posición de un móvil (en metros) es $s(t) = ${polyTex([a, 0, b, 0])}$, con $t$ en segundos. ¿Cuál es su velocidad en $t = ${t}$ s?`,
        answer: { kind: 'numeric', value: v, unit: 'm/s' },
        hints: [R`La velocidad es la derivada de la posición: $v(t) = s'(t)$.`, R`$s'(t) = ${polyTex([3 * a, 0, b], 't')}$.`, R`$v(${t}) = ${v}$ m/s.`],
        solution: [{ math: R`v(${t}) = ${v}\ \text{m/s}` }], expectedSeconds: 55,
      };
    }
    const cs = [rng.nonZero(3), rng.int(-5, 5), rng.int(-6, 6), rng.int(-5, 5)];
    const a = rng.int(-3, 3);
    const d = 3 * cs[0] * a * a + 2 * cs[1] * a + cs[2];
    return {
      prompt: R`Si $f(x) = ${polyTex(cs)}$, calcula $f'(${a})$.`,
      answer: { kind: 'numeric', value: d },
      hints: [R`Primero deriva y después reemplaza.`, R`$f'(x) = ${polyTex([3 * cs[0], 2 * cs[1], cs[2]])}$.`, R`$f'(${a}) = ${d}$.`],
      solution: [{ math: R`f'(${a}) = ${d}` }], expectedSeconds: 50,
    };
  },
};

const MEANINGS = [
  { q: R`$d(t)$ es la distancia recorrida (en km) a las $t$ horas y $d'(2) = 60$.`, a: 'A las 2 horas la velocidad es de 60 km/h.', w: ['En 2 horas recorrió 60 km.', 'La distancia a las 60 horas es 2 km.', 'La velocidad media en las primeras 2 horas fue 60 km/h.'] },
  { q: R`$C(x)$ es el costo (en pesos) de producir $x$ unidades y $C'(100) = 25$.`, a: 'Producir una unidad más, a partir de 100, cuesta aproximadamente 25 pesos.', w: ['Producir 100 unidades cuesta 25 pesos.', 'Cada unidad cuesta 100 pesos.', 'El costo total es 2500 pesos.'] },
  { q: R`$T(t)$ es la temperatura (°C) a los $t$ minutos y $T'(5) = -2$.`, a: 'A los 5 minutos la temperatura baja a razón de 2 °C por minuto.', w: ['A los 5 minutos la temperatura es −2 °C.', 'La temperatura bajó 5 °C en 2 minutos.', 'La temperatura sube 2 °C por minuto.'] },
];

const derivativeMeaning: Generator = {
  id: 'der.meaning', skillId: 'calc.derivatives', title: 'La derivada como tasa de cambio', levels: [1, 2],
  generate(rng) {
    const m = rng.pick(MEANINGS);
    const { options, correct } = choices(rng, m.a, m.w);
    return {
      prompt: `${m.q} ¿Qué significa?`,
      answer: { kind: 'choice', options, correct },
      hints: ['La derivada mide la tasa de cambio instantánea: cuánto cambia la función por cada unidad que cambia la variable, en ese instante.', 'Fíjate en las unidades: (unidades de la función) por (unidad de la variable).', m.a],
      solution: [{ note: m.a }], expectedSeconds: 30,
    };
  },
};

// ---------------------------------------------------------------------------
// Recta tangente
// ---------------------------------------------------------------------------

const tangentLine: Generator = {
  id: 'tan.line', skillId: 'calc.tangent', title: 'Ecuación de la recta tangente', levels: [1, 2, 3],
  generate(rng, level) {
    const cs = level === 3 ? [rng.nonZero(2), rng.int(-3, 3), rng.int(-4, 4), rng.int(-5, 5)] : [0, rng.nonZero(3), rng.int(-5, 5), rng.int(-6, 6)];
    const a = rng.int(-2, 2);
    const f = cs[0] * a ** 3 + cs[1] * a * a + cs[2] * a + cs[3];
    const m = 3 * cs[0] * a * a + 2 * cs[1] * a + cs[2];
    const b = f - m * a;
    const fcs = cs[0] === 0 ? cs.slice(1) : cs;
    if (level === 1) return {
      prompt: R`¿Cuál es la pendiente de la recta tangente a $f(x) = ${polyTex(fcs)}$ en $x = ${a}$?`,
      answer: { kind: 'numeric', value: m },
      hints: [R`La pendiente de la tangente en $x = a$ es $f'(a)$.`, R`$f'(x) = ${polyTex([3 * cs[0], 2 * cs[1], cs[2]].slice(cs[0] === 0 ? 1 : 0))}$.`, R`$f'(${a}) = ${m}$.`],
      solution: [{ math: R`m = f'(${a}) = ${m}` }], expectedSeconds: 45,
    };
    return {
      prompt: R`Halla la ecuación de la recta tangente a $f(x) = ${polyTex(fcs)}$ en $x = ${a}$.`,
      visual: { type: 'graph', functions: [{ expr: polyText(fcs) }, { expr: polyText([m, b]), dashed: true, label: 'tangente' }], points: [{ x: a, y: f }] },
      answer: { kind: 'equation', target: `y = ${m}*x + (${b})`, variable: 'y' },
      hints: [R`Tangente: $y = f'(a)\,(x - a) + f(a)$.`, R`$f(${a}) = ${f}$ y $f'(${a}) = ${m}$.`, R`$y = ${polyTex([m, b])}$.`],
      solution: [{ math: R`y = ${m}(x - ${a < 0 ? `(${a})` : a}) + ${f < 0 ? `(${f})` : f} = ${polyTex([m, b])}` }], expectedSeconds: 80,
    };
  },
};

// ---------------------------------------------------------------------------
// Optimización
// ---------------------------------------------------------------------------

const criticalPoints: Generator = {
  id: 'opt.critical', skillId: 'calc.optimization', title: 'Puntos críticos y extremos', levels: [1, 2, 3],
  generate(rng, level) {
    const p = rng.int(-3, 1);
    const q = p + rng.int(1, 4);
    // f'(x) = 6(x - p)(x - q)  →  f(x) = 2x³ − 3(p+q)x² + 6pq·x
    const cs = [2, -3 * (p + q), 6 * p * q, rng.int(-5, 5)];
    if (level === 3) {
      const which = rng.pick([p, q]);
      const isMax = which === p;
      return {
        prompt: R`La función $f(x) = ${polyTex(cs)}$ tiene un punto crítico en $x = ${which}$. ¿Es un máximo o un mínimo relativo?`,
        answer: { kind: 'choice', options: ['Máximo relativo', 'Mínimo relativo'], correct: isMax ? 0 : 1 },
        hints: [R`Criterio de la derivada segunda: si $f''(a) < 0$ hay máximo; si $f''(a) > 0$, mínimo.`, R`$f''(x) = ${polyTex([12, -6 * (p + q)])}$.`, R`$f''(${which}) = ${12 * which - 6 * (p + q)}$, por lo tanto es un ${isMax ? 'máximo' : 'mínimo'}.`],
        solution: [{ math: R`f''(${which}) = ${12 * which - 6 * (p + q)}` }], expectedSeconds: 80,
      };
    }
    return {
      prompt: R`Halla los puntos críticos (donde $f'(x) = 0$) de $f(x) = ${polyTex(cs)}$.`,
      answer: { kind: 'solutions', variable: 'x', values: [p, q] },
      hints: [R`Deriva, iguala a cero y resuelve.`, R`$f'(x) = ${polyTex([6, -6 * (p + q), 6 * p * q])} = 6(${xMinus(p)})(${xMinus(q)})$.`, R`$x = ${p}$ y $x = ${q}$.`],
      solution: [{ math: R`x_1 = ${p},\quad x_2 = ${q}` }], expectedSeconds: 70,
    };
  },
};

const optimizationWord: Generator = {
  id: 'opt.word', skillId: 'calc.optimization', title: 'Problemas de optimización', levels: [2, 3],
  generate(rng, level) {
    const kind = level === 2 ? rng.int(0, 1) : rng.int(1, 2);
    if (kind === 0) {
      const P = 4 * rng.int(5, 30);
      const s = P / 4;
      return {
        prompt: `Con ${P} m de alambre se quiere cercar un terreno rectangular de área máxima. ¿Cuál es esa área máxima (en m²)?`,
        answer: { kind: 'numeric', value: s * s, unit: 'm' },
        hints: [R`Si un lado mide $x$, el otro mide $\frac{${P}}{2} - x$ y el área es $A(x) = x\left(${P / 2} - x\right)$.`, R`$A'(x) = ${P / 2} - 2x = 0 \Rightarrow x = ${s}$.`, R`El rectángulo óptimo es un cuadrado de lado ${s}: $A = ${s * s}$ m².`],
        solution: [{ math: R`A_{max} = ${s}^2 = ${s * s}` }], expectedSeconds: 110,
      };
    }
    if (kind === 1) {
      const S = 2 * rng.int(5, 30);
      return {
        prompt: `Dos números positivos suman ${S}. ¿Cuál es el máximo valor posible de su producto?`,
        answer: { kind: 'numeric', value: (S / 2) ** 2 },
        hints: [R`Si uno es $x$, el otro es $${S} - x$: $P(x) = x(${S} - x)$.`, R`$P'(x) = ${S} - 2x = 0 \Rightarrow x = ${S / 2}$.`, R`$P = ${S / 2}\cdot ${S / 2} = ${(S / 2) ** 2}$.`],
        solution: [{ math: R`P_{max} = ${(S / 2) ** 2}` }], expectedSeconds: 90,
      };
    }
    const L = 6 * rng.int(2, 8);
    const x = L / 6;
    const V = x * (L - 2 * x) ** 2;
    return {
      prompt: `De una lámina cuadrada de ${L} cm de lado se recortan cuadrados iguales en las esquinas para armar una caja sin tapa. ¿Cuánto debe medir el lado del cuadrado recortado para que el volumen sea máximo (en cm)?`,
      answer: { kind: 'numeric', value: x, unit: 'cm' },
      hints: [R`Si se recorta $x$, la caja mide $(${L} - 2x)\times(${L} - 2x)\times x$: $V(x) = x(${L} - 2x)^2$.`, R`$V'(x) = (${L} - 2x)(${L} - 6x) = 0$.`, R`La solución válida es $x = \frac{${L}}{6} = ${x}$ cm (volumen ${n(V)} cm³).`],
      solution: [{ math: R`x = ${x}` }], expectedSeconds: 150,
    };
  },
};

// ---------------------------------------------------------------------------
// Integrales
// ---------------------------------------------------------------------------

const antiderivative: Generator = {
  id: 'int.basic', skillId: 'calc.integrals', title: 'Integrales inmediatas', levels: [1, 2, 3],
  generate(rng, level) {
    let ft: string, F: string, how: string;
    if (level === 1) {
      const a = 3 * rng.nonZero(3), b = 2 * rng.int(-4, 4), c = rng.int(-6, 6);
      ft = polyTex([a, b, c]);
      F = `${a / 3}x^3 + ${b / 2}x^2 + ${c}x`;
      how = R`$\int x^n\,dx = \frac{x^{n+1}}{n+1}$: $\int ${a}x^2\,dx = ${a / 3}x^3$, etc.`;
    } else if (level === 2) {
      const a = rng.int(1, 6), b = rng.int(1, 4), c = 3 * rng.int(1, 3);
      ft = R`\frac{${a}}{x} + \frac{${b}}{x^2} + ${c}\sqrt{x}`;
      F = `${a}ln(abs(x)) - ${b}/x + ${(2 * c) / 3}x^(3/2)`;
      how = R`$\int\frac{1}{x}dx = \ln|x|$, $\int x^{-2}dx = -x^{-1}$, $\int x^{1/2}dx = \frac{2}{3}x^{3/2}$.`;
    } else {
      const k = rng.int(2, 4), a = rng.int(1, 5);
      const bank = [
        { ft: R`${a}e^{x} + \cos x`, F: `${a}e^x + sin(x)`, how: R`$\int e^x dx = e^x$ y $\int\cos x\,dx = \operatorname{sen}x$.` },
        { ft: R`e^{${k}x}`, F: `e^(${k}x)/${k}`, how: R`$\int e^{kx}dx = \frac{e^{kx}}{k}$.` },
        { ft: R`${a}\operatorname{sen} x`, F: `-${a}cos(x)`, how: R`$\int\operatorname{sen}x\,dx = -\cos x$.` },
        { ft: R`(x + ${a})^2`, F: `(x + ${a})^3/3`, how: 'Desarrolla el cuadrado o usa $\\int u^2\\,du = \\frac{u^3}{3}$.' },
      ];
      const b = rng.pick(bank);
      ft = b.ft; F = b.F; how = b.how;
    }
    const Ft = toLatex(parse(F));
    return {
      prompt: R`Calcula $\int \left(${ft}\right) dx$ (puedes omitir la constante $C$).`,
      answer: { kind: 'expression', target: F, upToConstant: true },
      hints: [R`Integral de una suma = suma de integrales. $\int x^n dx = \frac{x^{n+1}}{n+1} + C$ ($n\neq -1$). Comprueba derivando.`, how, R`Una primitiva es $${Ft} + C$.`],
      solution: [{ math: R`\int \left(${ft}\right) dx = ${Ft} + C` }], expectedSeconds: 50 + 30 * level,
    };
  },
};

function polyIntegral(cs: number[], a: number, b: number): Frac {
  // cs de mayor a menor grado
  const deg = cs.length - 1;
  let total = new Frac(0);
  cs.forEach((c, i) => {
    const e = deg - i + 1;
    total = total.add(new Frac(c * (b ** e - a ** e), e));
  });
  return total;
}

const barrow: Generator = {
  id: 'def.barrow', skillId: 'calc.definite', title: 'Regla de Barrow', levels: [1, 2, 3],
  generate(rng, level) {
    const cs = level === 1 ? [rng.nonZero(4), rng.int(-5, 5)] : [rng.nonZero(3), rng.int(-4, 4), rng.int(-5, 5)];
    const a = rng.int(-2, 1), b = a + rng.int(1, 3);
    const v = polyIntegral(cs, a, b);
    return {
      prompt: R`Calcula $\int_{${a}}^{${b}} \left(${polyTex(cs)}\right) dx$.`,
      answer: { kind: 'numeric', value: v.toNumber() },
      hints: [R`Regla de Barrow: $\int_a^b f(x)\,dx = F(b) - F(a)$, con $F$ una primitiva de $f$.`, R`Una primitiva es $F(x) = ${fracPolyTex([...cs.map((c, i) => new Frac(c, cs.length - i)), new Frac(0)])}$.`, R`$F(${b}) - F(${a}) = ${v.toLatex()}$.`],
      solution: [{ math: R`\int_{${a}}^{${b}} \left(${polyTex(cs)}\right) dx = ${v.toLatex()}` }], expectedSeconds: 70 + 20 * level,
    };
  },
};

const area: Generator = {
  id: 'def.area', skillId: 'calc.definite', title: 'Área bajo la curva', levels: [2, 3],
  generate(rng, level) {
    if (level === 2) {
      const r1 = rng.int(-3, 1), r2 = r1 + rng.int(2, 4);
      const cs = [-1, r1 + r2, -r1 * r2];
      const v = new Frac((r2 - r1) ** 3, 6);
      return {
        prompt: R`Calcula el área de la región encerrada entre la curva $f(x) = ${polyTex(cs)}$ y el eje $x$.`,
        visual: { type: 'graph', functions: [{ expr: polyText(cs) }], shade: { expr: polyText(cs), from: r1, to: r2 } },
        answer: { kind: 'numeric', value: v.toNumber() },
        hints: [R`Halla los cortes con el eje $x$ (serán los límites de integración) e integra entre ellos.`, R`La parábola corta al eje en $x = ${r1}$ y $x = ${r2}$ y es positiva entre ellos.`, R`$A = \int_{${r1}}^{${r2}} f(x)\,dx = ${v.toLatex()}$.`],
        solution: [{ math: R`A = ${v.toLatex()}` }], expectedSeconds: 120,
      };
    }
    const s = rng.int(1, 3);
    const b = s + rng.int(1, 2);
    const F = (x: number) => new Frac(x ** 3, 3).sub(s * s * x);
    const A = F(s).sub(F(0)).abs().add(F(b).sub(F(s)).abs());
    return {
      prompt: R`Calcula el área entre $f(x) = x^2 - ${s * s}$ y el eje $x$, para $0 \le x \le ${b}$.`,
      visual: { type: 'graph', functions: [{ expr: `x^2 - ${s * s}` }], shade: { expr: `x^2 - ${s * s}`, from: 0, to: b } },
      answer: { kind: 'numeric', value: A.toNumber() },
      hints: [R`La función cambia de signo en $x = ${s}$: la parte debajo del eje se cuenta en valor absoluto.`, R`$A = \left|\int_0^{${s}} f\right| + \int_{${s}}^{${b}} f$.`, R`$A = ${F(s).sub(F(0)).abs().toLatex()} + ${F(b).sub(F(s)).abs().toLatex()} = ${A.toLatex()}$.`],
      solution: [{ math: R`A = ${A.toLatex()}` }], expectedSeconds: 150,
    };
  },
};

export const CALCULUS_GENERATORS: Generator[] = [
  limitSubst, limitZeroOverZero, limitInfinity, continuity,
  derivatives, derivativeAtPoint, derivativeMeaning,
  tangentLine,
  criticalPoints, optimizationWord,
  antiderivative,
  barrow, area,
];
