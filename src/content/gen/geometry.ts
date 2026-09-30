// Bloque 4: geometría y trigonometría.
import { Frac } from '../../math/fraction';
import type { Rng } from '../rng';
import type { ExerciseContent, Generator } from '../types';
import { n, R, round } from './util';

type SolidVis = { shape: 'cube' | 'prism' | 'cylinder' | 'cone' | 'sphere' | 'pyramid'; labels: Record<string, string> };

const DEG = Math.PI / 180;
const sen = R`\operatorname{sen}`;
/** Tolerancia para respuestas con π o decimales redondeados. */
const piTol = (v: number) => Math.max(0.011, Math.abs(v) * 5e-4);
const TRIPLES: [number, number, number][] = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [12, 16, 20], [20, 21, 29]];

// ---------------------------------------------------------------------------
// Perímetros y áreas
// ---------------------------------------------------------------------------

const planeArea: Generator = {
  id: 'geo.area', skillId: 'geo.plane', title: 'Áreas y perímetros de figuras planas', levels: [1, 2, 3],
  generate(rng, level): ExerciseContent {
    const pool = level === 1 ? ['rect', 'tri', 'square-per'] : level === 2 ? ['circle', 'trap', 'rhombus', 'circle-per'] : ['paral', 'trap', 'circle', 'rect-per'];
    const kind = rng.pick(pool);
    const a = rng.int(2, 15), b = rng.int(2, 15), h = rng.int(2, 12);
    switch (kind) {
      case 'rect': return {
        prompt: `Calcula el área de un rectángulo de base ${a} cm y altura ${b} cm (en cm²).`,
        visual: { type: 'shape', shape: 'rectangle', labels: { b: `${a} cm`, h: `${b} cm` } },
        answer: { kind: 'numeric', value: a * b, unit: 'cm' },
        hints: [R`Área del rectángulo: $A = b\cdot h$.`, R`$A = ${a}\cdot ${b}$.`, R`$A = ${a * b}\ \text{cm}^2$.`],
        solution: [{ math: R`A = ${a}\cdot ${b} = ${a * b}\ \text{cm}^2` }], expectedSeconds: 25,
      };
      case 'tri': {
        const base = 2 * a;
        return {
          prompt: `Calcula el área de un triángulo de base ${base} cm y altura ${b} cm (en cm²).`,
          visual: { type: 'shape', shape: 'triangle', labels: { b: `${base} cm`, h: `${b} cm` } },
          answer: { kind: 'numeric', value: (base * b) / 2, unit: 'cm' },
          hints: [R`Área del triángulo: $A = \frac{b\cdot h}{2}$.`, R`$A = \frac{${base}\cdot ${b}}{2}$.`, R`$A = ${(base * b) / 2}\ \text{cm}^2$.`],
          solution: [{ math: R`A = \frac{${base}\cdot ${b}}{2} = ${(base * b) / 2}\ \text{cm}^2` }], expectedSeconds: 30,
        };
      }
      case 'square-per': return {
        prompt: `Un cuadrado tiene ${a} cm de lado. ¿Cuál es su perímetro (en cm)?`,
        visual: { type: 'shape', shape: 'square', labels: { l: `${a} cm` } },
        answer: { kind: 'numeric', value: 4 * a, unit: 'cm' },
        hints: ['El perímetro es la suma de todos los lados.', R`El cuadrado tiene 4 lados iguales: $P = 4\cdot ${a}$.`, R`$P = ${4 * a}$ cm.`],
        solution: [{ math: R`P = 4\cdot ${a} = ${4 * a}\ \text{cm}` }], expectedSeconds: 20,
      };
      case 'circle': {
        const r = rng.int(2, 10);
        const v = Math.PI * r * r;
        return {
          prompt: R`Calcula el área de un círculo de radio ${r} cm. Puedes dar el resultado exacto (con $\pi$) o redondeado a dos decimales.`,
          visual: { type: 'shape', shape: 'circle', labels: { r: `${r} cm` } },
          answer: { kind: 'numeric', value: v, tolerance: piTol(v), unit: 'cm' },
          hints: [R`Área del círculo: $A = \pi r^2$.`, R`$A = \pi\cdot ${r}^2$.`, R`$A = ${r * r}\pi \approx ${n(round(v))}\ \text{cm}^2$.`],
          solution: [{ math: R`A = \pi\cdot ${r}^2 = ${r * r}\pi \approx ${n(round(v))}\ \text{cm}^2` }], expectedSeconds: 35,
        };
      }
      case 'circle-per': {
        const r = rng.int(2, 10);
        const v = 2 * Math.PI * r;
        return {
          prompt: R`¿Cuál es la longitud de una circunferencia de radio ${r} cm? (Exacto con $\pi$ o con dos decimales.)`,
          visual: { type: 'shape', shape: 'circle', labels: { r: `${r} cm` } },
          answer: { kind: 'numeric', value: v, tolerance: piTol(v), unit: 'cm' },
          hints: [R`Longitud de la circunferencia: $L = 2\pi r$.`, R`$L = 2\pi\cdot ${r}$.`, R`$L = ${2 * r}\pi \approx ${n(round(v))}$ cm.`],
          solution: [{ math: R`L = 2\pi\cdot ${r} = ${2 * r}\pi` }], expectedSeconds: 30,
        };
      }
      case 'trap': {
        const B = Math.max(a, b) + 2, bb = Math.min(a, b);
        const v = ((B + bb) * h) / 2;
        return {
          prompt: `Calcula el área de un trapecio de bases ${B} cm y ${bb} cm, y altura ${h} cm (en cm²).`,
          visual: { type: 'shape', shape: 'trapezoid', labels: { B: `${B} cm`, b: `${bb} cm`, h: `${h} cm` } },
          answer: { kind: 'numeric', value: v, unit: 'cm' },
          hints: [R`Área del trapecio: $A = \frac{(B + b)\cdot h}{2}$.`, R`$A = \frac{(${B} + ${bb})\cdot ${h}}{2}$.`, R`$A = ${n(v)}\ \text{cm}^2$.`],
          solution: [{ math: R`A = \frac{(${B} + ${bb})\cdot ${h}}{2} = ${n(v)}\ \text{cm}^2` }], expectedSeconds: 40,
        };
      }
      case 'rhombus': {
        const D = 2 * a, d = 2 * rng.int(1, 6);
        return {
          prompt: `Las diagonales de un rombo miden ${D} cm y ${d} cm. ¿Cuál es su área (en cm²)?`,
          visual: { type: 'shape', shape: 'rhombus', labels: { D: `${D} cm`, d: `${d} cm` } },
          answer: { kind: 'numeric', value: (D * d) / 2, unit: 'cm' },
          hints: [R`Área del rombo: $A = \frac{D\cdot d}{2}$.`, R`$A = \frac{${D}\cdot ${d}}{2}$.`, R`$A = ${(D * d) / 2}\ \text{cm}^2$.`],
          solution: [{ math: R`A = \frac{${D}\cdot ${d}}{2} = ${(D * d) / 2}` }], expectedSeconds: 30,
        };
      }
      case 'paral': return {
        prompt: `Un paralelogramo tiene base ${a} cm y altura ${h} cm. ¿Cuál es su área (en cm²)?`,
        visual: { type: 'shape', shape: 'parallelogram', labels: { b: `${a} cm`, h: `${h} cm` } },
        answer: { kind: 'numeric', value: a * h, unit: 'cm' },
        hints: [R`Área del paralelogramo: $A = b\cdot h$ (la altura es perpendicular a la base, no el lado inclinado).`, R`$A = ${a}\cdot ${h}$.`, R`$A = ${a * h}\ \text{cm}^2$.`],
        solution: [{ math: R`A = ${a}\cdot ${h} = ${a * h}` }], expectedSeconds: 25,
      };
      default: {
        const area = a * b;
        return {
          prompt: `Un rectángulo tiene un área de ${area} cm² y su base mide ${a} cm. ¿Cuál es su perímetro (en cm)?`,
          visual: { type: 'shape', shape: 'rectangle', labels: { b: `${a} cm`, h: '?' } },
          answer: { kind: 'numeric', value: 2 * (a + b), unit: 'cm' },
          hints: [R`Primero halla la altura con $A = b\cdot h$; después $P = 2(b + h)$.`, R`$h = \frac{${area}}{${a}} = ${b}$ cm.`, R`$P = 2(${a} + ${b}) = ${2 * (a + b)}$ cm.`],
          solution: [{ math: R`h = ${b},\ P = ${2 * (a + b)}` }], expectedSeconds: 50,
        };
      }
    }
  },
};

const compositeArea: Generator = {
  id: 'geo.composite', skillId: 'geo.plane', title: 'Figuras compuestas', levels: [2, 3],
  generate(rng, level) {
    if (level === 2) {
      const W = rng.int(6, 14), H = rng.int(6, 14);
      const w = rng.int(2, W - 3), h = rng.int(2, H - 3);
      const v = W * H - w * h;
      return {
        prompt: `Una figura en forma de L se obtiene quitando a un rectángulo de ${W} × ${H} cm un rectángulo de ${w} × ${h} cm en una esquina. ¿Cuál es su área (en cm²)?`,
        visual: { type: 'shape', shape: 'L', labels: { W: `${W}`, H: `${H}`, w: `${w}`, h: `${h}` } },
        answer: { kind: 'numeric', value: v, unit: 'cm' },
        hints: ['Descompón la figura: área del rectángulo grande menos el rectángulo que falta.', R`$A = ${W}\cdot ${H} - ${w}\cdot ${h}$.`, R`$A = ${W * H} - ${w * h} = ${v}\ \text{cm}^2$.`],
        solution: [{ math: R`A = ${W}\cdot ${H} - ${w}\cdot ${h} = ${v}` }], expectedSeconds: 60,
      };
    }
    const d = 2 * rng.int(2, 6), L = rng.int(6, 15);
    const v = d * L + (Math.PI * (d / 2) ** 2) / 2;
    return {
      prompt: R`Una ventana está formada por un rectángulo de ${d} m de ancho y ${L} m de alto, con un semicírculo apoyado sobre el lado superior (de diámetro ${d} m). ¿Cuál es su área? (Exacto o con dos decimales.)`,
      answer: { kind: 'numeric', value: v, tolerance: piTol(v), unit: 'm' },
      hints: [R`Área total = rectángulo + medio círculo: $A = b\cdot h + \frac{\pi r^2}{2}$.`, R`El radio del semicírculo es $r = ${d / 2}$ m.`, R`$A = ${d * L} + \frac{\pi\cdot ${(d / 2) ** 2}}{2} \approx ${n(round(v))}\ \text{m}^2$.`],
      solution: [{ math: R`A = ${d}\cdot ${L} + \frac{\pi\cdot ${d / 2}^2}{2} \approx ${n(round(v))}` }], expectedSeconds: 90,
    };
  },
};

// ---------------------------------------------------------------------------
// Pitágoras
// ---------------------------------------------------------------------------

const pythagoras: Generator = {
  id: 'pyth.side', skillId: 'geo.pythagoras', title: 'Calcular un lado con Pitágoras', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 1) {
      const [a, b, c] = rng.pick(TRIPLES);
      return {
        prompt: `Los catetos de un triángulo rectángulo miden ${a} cm y ${b} cm. ¿Cuánto mide la hipotenusa?`,
        visual: { type: 'right-triangle', legA: `${a}`, legB: `${b}`, hyp: '?' },
        answer: { kind: 'numeric', value: c, unit: 'cm' },
        hints: [R`Teorema de Pitágoras: $c^2 = a^2 + b^2$ (la hipotenusa es el lado opuesto al ángulo recto).`, R`$c^2 = ${a}^2 + ${b}^2 = ${a * a + b * b}$.`, R`$c = \sqrt{${a * a + b * b}} = ${c}$ cm.`],
        solution: [{ math: R`c = \sqrt{${a}^2 + ${b}^2} = \sqrt{${a * a + b * b}} = ${c}` }], expectedSeconds: 40,
      };
    }
    if (level === 2) {
      const a = rng.int(1, 9), b = rng.int(2, 9);
      const s = a * a + b * b;
      const c = Math.sqrt(s);
      return {
        prompt: R`Los catetos de un triángulo rectángulo miden ${a} y ${b}. Calcula la hipotenusa (exacta, como $\sqrt{\ }$, o con dos decimales).`,
        visual: { type: 'right-triangle', legA: `${a}`, legB: `${b}`, hyp: '?' },
        answer: { kind: 'numeric', value: c, tolerance: Number.isInteger(c) ? undefined : 0.006 },
        hints: [R`$c = \sqrt{a^2 + b^2}$.`, R`$c = \sqrt{${a * a} + ${b * b}} = \sqrt{${s}}$.`, R`$c = \sqrt{${s}} \approx ${n(round(c))}$.`],
        solution: [{ math: R`c = \sqrt{${s}} \approx ${n(round(c))}` }], expectedSeconds: 50,
      };
    }
    const [a, b, c] = rng.pick(TRIPLES);
    return {
      prompt: `La hipotenusa de un triángulo rectángulo mide ${c} cm y uno de los catetos ${a} cm. ¿Cuánto mide el otro cateto?`,
      visual: { type: 'right-triangle', legA: `${a}`, legB: '?', hyp: `${c}` },
      answer: { kind: 'numeric', value: b, unit: 'cm' },
      hints: [R`Despeja de $a^2 + b^2 = c^2$: $b = \sqrt{c^2 - a^2}$. ¡Se resta, porque la hipotenusa es el lado mayor!`, R`$b = \sqrt{${c}^2 - ${a}^2} = \sqrt{${c * c - a * a}}$.`, R`$b = ${b}$ cm.`],
      solution: [{ math: R`b = \sqrt{${c}^2 - ${a}^2} = ${b}` }], expectedSeconds: 50,
    };
  },
};

const pythagorasWord: Generator = {
  id: 'pyth.word', skillId: 'geo.pythagoras', title: 'Problemas con Pitágoras', levels: [2, 3],
  generate(rng): ExerciseContent {
    const [a, b, c] = rng.pick(TRIPLES);
    const kind = rng.int(0, 2);
    if (kind === 0) return {
      prompt: `Una escalera de ${c} m está apoyada en una pared. Su pie está a ${a} m de la base de la pared. ¿A qué altura toca la pared?`,
      visual: { type: 'right-triangle', legA: `${a} m`, legB: 'h', hyp: `${c} m` },
      answer: { kind: 'numeric', value: b, unit: 'm' },
      hints: ['La escalera es la hipotenusa; la distancia al pie y la altura son los catetos.', R`$h = \sqrt{${c}^2 - ${a}^2}$.`, R`$h = \sqrt{${c * c - a * a}} = ${b}$ m.`],
      solution: [{ math: R`h = \sqrt{${c}^2 - ${a}^2} = ${b}` }], expectedSeconds: 60,
    };
    if (kind === 1) return {
      prompt: `Un terreno rectangular mide ${a * 10} m por ${b * 10} m. ¿Cuánto mide su diagonal?`,
      visual: { type: 'shape', shape: 'rectangle', labels: { b: `${a * 10} m`, h: `${b * 10} m`, d: '?' } },
      answer: { kind: 'numeric', value: c * 10, unit: 'm' },
      hints: ['La diagonal divide al rectángulo en dos triángulos rectángulos.', R`$d = \sqrt{${a * 10}^2 + ${b * 10}^2}$.`, R`$d = ${c * 10}$ m.`],
      solution: [{ math: R`d = \sqrt{${a * 10}^2 + ${b * 10}^2} = ${c * 10}` }], expectedSeconds: 60,
    };
    const s = rng.int(2, 10);
    const d = s * Math.SQRT2;
    return {
      prompt: `¿Cuánto mide la diagonal de un cuadrado de ${s} cm de lado? (Exacta o con dos decimales.)`,
      visual: { type: 'shape', shape: 'square', labels: { l: `${s} cm`, d: '?' } },
      answer: { kind: 'numeric', value: d, tolerance: 0.006, unit: 'cm' },
      hints: [R`La diagonal es la hipotenusa de un triángulo rectángulo con catetos iguales al lado.`, R`$d = \sqrt{${s}^2 + ${s}^2} = \sqrt{${2 * s * s}}$.`, R`$d = ${s}\sqrt{2} \approx ${n(round(d))}$ cm.`],
      solution: [{ math: R`d = ${s}\sqrt{2} \approx ${n(round(d))}` }], expectedSeconds: 50,
    };
  },
};

const isRightTriangle: Generator = {
  id: 'pyth.is-right', skillId: 'geo.pythagoras', title: '¿Es un triángulo rectángulo?', levels: [1, 2],
  generate(rng) {
    let [a, b, c] = rng.pick(TRIPLES);
    const right = rng.bool();
    if (!right) c += rng.pick([-1, 1]);
    return {
      prompt: `¿Es rectángulo un triángulo cuyos lados miden ${a}, ${b} y ${c}?`,
      answer: { kind: 'truefalse', correct: right },
      hints: [R`Es rectángulo si y solo si el cuadrado del lado mayor es igual a la suma de los cuadrados de los otros dos (recíproco de Pitágoras).`, R`Compara $${c}^2$ con $${a}^2 + ${b}^2$.`, R`$${c}^2 = ${c * c}$ y $${a}^2 + ${b}^2 = ${a * a + b * b}$: ${right ? 'son iguales, sí es rectángulo' : 'no son iguales, no es rectángulo'}.`],
      solution: [{ math: R`${c * c} ${right ? '=' : R`\neq`} ${a * a + b * b}` }], expectedSeconds: 35,
    };
  },
};

// ---------------------------------------------------------------------------
// Tales y semejanza
// ---------------------------------------------------------------------------

const thales: Generator = {
  id: 'thales.segments', skillId: 'geo.thales', title: 'Teorema de Tales', levels: [1, 2],
  generate(rng) {
    const a = rng.int(2, 9), k = rng.int(2, 4);
    const b = rng.int(2, 9);
    const c = a * k;
    const x = b * k;
    return {
      prompt: R`Tres rectas paralelas cortan a dos transversales. En la primera determinan segmentos de ${a} cm y ${b} cm; en la segunda, el segmento correspondiente al de ${a} cm mide ${c} cm. ¿Cuánto mide el segmento $x$ correspondiente al de ${b} cm?`,
      visual: { type: 'thales', a: `${a}`, b: `${b}`, c: `${c}`, d: 'x' },
      answer: { kind: 'numeric', value: x, unit: 'cm' },
      hints: [R`Teorema de Tales: $\frac{a}{b} = \frac{c}{d}$ (los segmentos son proporcionales).`, R`$\frac{${a}}{${b}} = \frac{${c}}{x}$.`, R`$x = \frac{${b}\cdot ${c}}{${a}} = ${x}$ cm.`],
      solution: [{ math: R`x = \frac{${b}\cdot ${c}}{${a}} = ${x}` }], expectedSeconds: 50,
    };
  },
};

const shadow: Generator = {
  id: 'thales.shadow', skillId: 'geo.thales', title: 'Problemas de sombras', levels: [2, 3],
  generate(rng) {
    const h1 = rng.pick([1, 1.5, 2]);
    const s1 = rng.pick([0.5, 1, 2, 3]);
    const k = rng.int(3, 12);
    const s2 = s1 * k;
    const h2 = h1 * k;
    return {
      prompt: `Un palo de ${n(h1)} m proyecta una sombra de ${n(s1)} m. A la misma hora, un árbol proyecta una sombra de ${n(s2)} m. ¿Qué altura tiene el árbol?`,
      answer: { kind: 'numeric', value: h2, unit: 'm' },
      hints: ['Los rayos del sol son paralelos: el palo con su sombra y el árbol con la suya forman triángulos semejantes.', R`$\frac{${n(h1)}}{${n(s1)}} = \frac{h}{${n(s2)}}$.`, R`$h = \frac{${n(h1)}\cdot ${n(s2)}}{${n(s1)}} = ${n(h2)}$ m.`],
      solution: [{ math: R`h = \frac{${n(h1)}\cdot ${n(s2)}}{${n(s1)}} = ${n(h2)}` }], expectedSeconds: 60,
    };
  },
};

const similar: Generator = {
  id: 'thales.similar', skillId: 'geo.thales', title: 'Triángulos semejantes', levels: [2, 3],
  generate(rng, level) {
    const [a, b, c] = rng.pick(TRIPLES.slice(0, 4));
    const k = rng.pick([2, 3, 4, 1.5]);
    if (level === 3) {
      const A1 = (a * b) / 2;
      return {
        prompt: `Dos triángulos son semejantes con razón de semejanza ${n(k)}. Si el área del menor es ${A1} cm², ¿cuál es el área del mayor?`,
        answer: { kind: 'numeric', value: A1 * k * k, unit: 'cm' },
        hints: [R`Si los lados están en razón $k$, las áreas están en razón $k^2$.`, R`$A' = ${A1}\cdot ${n(k)}^2$.`, R`$A' = ${n(A1 * k * k)}\ \text{cm}^2$.`],
        solution: [{ math: R`A' = ${A1}\cdot ${n(k * k)} = ${n(A1 * k * k)}` }], expectedSeconds: 50,
      };
    }
    return {
      prompt: `Un triángulo tiene lados ${a}, ${b} y ${c} cm. Otro triángulo semejante tiene su lado menor de ${n(a * k)} cm. ¿Cuánto mide su lado mayor?`,
      answer: { kind: 'numeric', value: c * k, unit: 'cm' },
      hints: ['En triángulos semejantes, los lados correspondientes son proporcionales.', R`La razón de semejanza es $\frac{${n(a * k)}}{${a}} = ${n(k)}$.`, R`Lado mayor: $${c}\cdot ${n(k)} = ${n(c * k)}$ cm.`],
      solution: [{ math: R`${c}\cdot ${n(k)} = ${n(c * k)}` }], expectedSeconds: 45,
    };
  },
};

// ---------------------------------------------------------------------------
// Cuerpos
// ---------------------------------------------------------------------------

const solids: Generator = {
  id: 'solids.volume', skillId: 'geo.solids', title: 'Volumen y área de cuerpos', levels: [1, 2, 3],
  generate(rng, level) {
    const r = rng.int(1, 6), h = rng.int(2, 12), a = rng.int(2, 9);
    const b = rng.int(2, 9), c = rng.int(2, 9);
    const pool = level === 1 ? ['cube', 'prism', 'cube-area'] : level === 2 ? ['cyl', 'cone', 'pyr', 'prism-area'] : ['sphere', 'sphere-area', 'cyl-area', 'cone'];
    const kind = rng.pick(pool);
    type Out = { q: string; v: number; f: string; calc: string; pi: boolean; vis: SolidVis };
    const vis = (x: SolidVis) => ({ type: 'solid' as const, ...x });
    const outs: Record<string, () => Out> = {
      cube: () => ({ q: `el volumen de un cubo de arista ${a} cm (en cm³)`, v: a ** 3, f: R`V = a^3`, calc: R`${a}^3 = ${a ** 3}`, pi: false, vis: { shape: 'cube', labels: { a: `${a}` } } }),
      'cube-area': () => ({ q: `el área total de un cubo de arista ${a} cm (en cm²)`, v: 6 * a * a, f: R`A = 6a^2`, calc: R`6\cdot ${a}^2 = ${6 * a * a}`, pi: false, vis: { shape: 'cube', labels: { a: `${a}` } } }),
      prism: () => ({ q: `el volumen de un prisma rectangular de ${a} × ${b} × ${c} cm (en cm³)`, v: a * b * c, f: R`V = a\cdot b\cdot c`, calc: R`${a}\cdot ${b}\cdot ${c} = ${a * b * c}`, pi: false, vis: { shape: 'prism', labels: { a: `${a}`, b: `${b}`, c: `${c}` } } }),
      'prism-area': () => ({ q: `el área total de un prisma rectangular de ${a} × ${b} × ${c} cm (en cm²)`, v: 2 * (a * b + a * c + b * c), f: R`A = 2(ab + ac + bc)`, calc: R`2(${a * b} + ${a * c} + ${b * c}) = ${2 * (a * b + a * c + b * c)}`, pi: false, vis: { shape: 'prism', labels: { a: `${a}`, b: `${b}`, c: `${c}` } } }),
      cyl: () => ({ q: `el volumen de un cilindro de radio ${r} cm y altura ${h} cm (en cm³)`, v: Math.PI * r * r * h, f: R`V = \pi r^2 h`, calc: R`\pi\cdot ${r}^2\cdot ${h} = ${r * r * h}\pi`, pi: true, vis: { shape: 'cylinder', labels: { r: `${r}`, h: `${h}` } } }),
      'cyl-area': () => ({ q: `el área total de un cilindro de radio ${r} cm y altura ${h} cm (en cm²)`, v: 2 * Math.PI * r * r + 2 * Math.PI * r * h, f: R`A = 2\pi r^2 + 2\pi r h`, calc: R`2\pi\cdot ${r}^2 + 2\pi\cdot ${r}\cdot ${h} = ${2 * r * r + 2 * r * h}\pi`, pi: true, vis: { shape: 'cylinder', labels: { r: `${r}`, h: `${h}` } } }),
      cone: () => ({ q: `el volumen de un cono de radio ${r} cm y altura ${3 * h} cm (en cm³)`, v: (Math.PI * r * r * 3 * h) / 3, f: R`V = \frac{\pi r^2 h}{3}`, calc: R`\frac{\pi\cdot ${r}^2\cdot ${3 * h}}{3} = ${r * r * h}\pi`, pi: true, vis: { shape: 'cone', labels: { r: `${r}`, h: `${3 * h}` } } }),
      pyr: () => ({ q: `el volumen de una pirámide de base cuadrada de lado ${a} cm y altura ${3 * h} cm (en cm³)`, v: a * a * h, f: R`V = \frac{A_{base}\cdot h}{3}`, calc: R`\frac{${a}^2\cdot ${3 * h}}{3} = ${a * a * h}`, pi: false, vis: { shape: 'pyramid', labels: { l: `${a}`, h: `${3 * h}` } } }),
      sphere: () => ({ q: `el volumen de una esfera de radio ${3 * r} cm (en cm³)`, v: (4 / 3) * Math.PI * (3 * r) ** 3, f: R`V = \frac{4}{3}\pi r^3`, calc: R`\frac43\pi\cdot ${3 * r}^3 = ${36 * r ** 3}\pi`, pi: true, vis: { shape: 'sphere', labels: { r: `${3 * r}` } } }),
      'sphere-area': () => ({ q: `el área de una esfera de radio ${r} cm (en cm²)`, v: 4 * Math.PI * r * r, f: R`A = 4\pi r^2`, calc: R`4\pi\cdot ${r}^2 = ${4 * r * r}\pi`, pi: true, vis: { shape: 'sphere', labels: { r: `${r}` } } }),
    };
    const o = outs[kind]();
    return {
      prompt: `Calcula ${o.q}.${o.pi ? ' Puedes dar el resultado exacto con π o con dos decimales.' : ''}`,
      visual: vis(o.vis),
      answer: { kind: 'numeric', value: o.v, tolerance: o.pi ? piTol(o.v) : undefined, unit: 'cm' },
      hints: [
        R`Prisma y cilindro: $V = A_{base}\cdot h$. Pirámide y cono: $V = \frac{A_{base}\cdot h}{3}$. Esfera: $V = \frac43\pi r^3$, $A = 4\pi r^2$.`,
        `Usa $${o.f}$.`,
        R`$${o.calc}${o.pi ? R` \approx ${n(round(o.v))}` : ''}$.`,
      ],
      solution: [{ math: R`${o.f},\quad ${o.calc}` }],
      expectedSeconds: 40 + 15 * level,
    };
  },
};

// ---------------------------------------------------------------------------
// Trigonometría
// ---------------------------------------------------------------------------

const ratiosFromSides: Generator = {
  id: 'trig.ratios-sides', skillId: 'trig.ratios', title: 'Razones a partir de los lados', levels: [1, 2],
  generate(rng) {
    const [a, b, c] = rng.pick(TRIPLES);
    const fnName = rng.pick(['sen', 'cos', 'tan'] as const);
    // α opuesto al cateto a
    const val = fnName === 'sen' ? new Frac(a, c) : fnName === 'cos' ? new Frac(b, c) : new Frac(a, b);
    const def = fnName === 'sen' ? R`\frac{\text{opuesto}}{\text{hipotenusa}}` : fnName === 'cos' ? R`\frac{\text{adyacente}}{\text{hipotenusa}}` : R`\frac{\text{opuesto}}{\text{adyacente}}`;
    const texFn = fnName === 'sen' ? sen : fnName === 'cos' ? R`\cos` : R`\tan`;
    return {
      prompt: R`En un triángulo rectángulo, el cateto opuesto al ángulo $\alpha$ mide ${a}, el cateto adyacente ${b} y la hipotenusa ${c}. Calcula $${texFn}\,\alpha$ (como fracción irreducible).`,
      visual: { type: 'right-triangle', legA: `${a}`, legB: `${b}`, hyp: `${c}`, angle: 'α', angleAt: 'B' },
      answer: { kind: 'numeric', value: val.toNumber(), requireReduced: true },
      hints: [R`$${sen}\alpha = \frac{\text{op}}{\text{hip}}$, $\cos\alpha = \frac{\text{ady}}{\text{hip}}$, $\tan\alpha = \frac{\text{op}}{\text{ady}}$.`, R`$${texFn}\,\alpha = ${def}$.`, R`$${texFn}\,\alpha = ${val.toLatex()}$.`],
      solution: [{ math: R`${texFn}\,\alpha = ${val.toLatex()}` }], expectedSeconds: 35,
    };
  },
};

const findSide: Generator = {
  id: 'trig.find-side', skillId: 'trig.ratios', title: 'Calcular lados con trigonometría', levels: [2, 3],
  generate(rng) {
    const ang = rng.pick([20, 25, 30, 35, 40, 50, 55, 60, 65, 70]);
    const hyp = rng.int(5, 30);
    const want = rng.pick(['op', 'ady'] as const);
    const v = want === 'op' ? hyp * Math.sin(ang * DEG) : hyp * Math.cos(ang * DEG);
    const fnTex = want === 'op' ? sen : R`\cos`;
    return {
      prompt: R`En un triángulo rectángulo, la hipotenusa mide ${hyp} cm y uno de los ángulos agudos mide $${ang}^\circ$. Calcula el cateto ${want === 'op' ? 'opuesto' : 'adyacente'} a ese ángulo (con dos decimales).`,
      visual: { type: 'right-triangle', legA: want === 'op' ? 'x' : '', legB: want === 'ady' ? 'x' : '', hyp: `${hyp}`, angle: `${ang}°`, angleAt: 'B' },
      answer: { kind: 'numeric', value: v, tolerance: 0.011, unit: 'cm' },
      hints: [R`Elige la razón que relaciona el dato con la incógnita: con hipotenusa y cateto ${want === 'op' ? 'opuesto usa el seno' : 'adyacente usa el coseno'}.`, R`$x = ${hyp}\cdot ${fnTex}\,${ang}^\circ$.`, R`$x \approx ${n(round(v))}$ cm (calculadora en modo grados).`],
      solution: [{ math: R`x = ${hyp}\cdot ${fnTex}\,${ang}^\circ \approx ${n(round(v))}` }], expectedSeconds: 60,
    };
  },
};

const findAngle: Generator = {
  id: 'trig.find-angle', skillId: 'trig.ratios', title: 'Calcular ángulos', levels: [3],
  generate(rng) {
    const op = rng.int(2, 15), ady = rng.int(2, 15);
    const ang = Math.atan(op / ady) / DEG;
    return {
      prompt: R`Los catetos de un triángulo rectángulo miden ${op} cm (opuesto a $\alpha$) y ${ady} cm (adyacente). ¿Cuánto mide $\alpha$ en grados? (Con un decimal.)`,
      visual: { type: 'right-triangle', legA: `${op}`, legB: `${ady}`, hyp: '', angle: 'α', angleAt: 'B' },
      answer: { kind: 'numeric', value: ang, tolerance: 0.06, unit: '°' },
      hints: [R`Con opuesto y adyacente se usa la tangente: $\tan\alpha = \frac{op}{ady}$, y luego la función inversa.`, R`$\alpha = \arctan\frac{${op}}{${ady}}$.`, R`$\alpha \approx ${n(round(ang, 1))}^\circ$.`],
      solution: [{ math: R`\alpha = \arctan\frac{${op}}{${ady}} \approx ${n(round(ang, 1))}^\circ` }], expectedSeconds: 60,
    };
  },
};

const SPECIAL: { deg: number; sin: string; cos: string; tan: string | null; sv: number; cv: number }[] = [];
{
  const base: Record<number, [string, string, number, number]> = {
    0: ['0', '1', 0, 1], 30: [R`\frac{1}{2}`, R`\frac{\sqrt{3}}{2}`, 0.5, Math.sqrt(3) / 2],
    45: [R`\frac{\sqrt{2}}{2}`, R`\frac{\sqrt{2}}{2}`, Math.SQRT2 / 2, Math.SQRT2 / 2],
    60: [R`\frac{\sqrt{3}}{2}`, R`\frac{1}{2}`, Math.sqrt(3) / 2, 0.5], 90: ['1', '0', 1, 0],
  };
  for (const deg of [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]) {
    const ref = deg % 90 === 0 ? deg % 180 === 0 ? 0 : 90 : [30, 45, 60].find((r) => [r, 180 - r, 180 + r, 360 - r].includes(deg))!;
    const sv = Math.round(Math.sin(deg * DEG) * 1e12) / 1e12;
    const cv = Math.round(Math.cos(deg * DEG) * 1e12) / 1e12;
    const [st, ct] = base[ref];
    const sgn = (v: number, t: string) => (v < 0 ? `-${t}` : v === 0 ? '0' : t);
    SPECIAL.push({ deg, sin: sgn(sv, st), cos: sgn(cv, ct), tan: Math.abs(cv) < 1e-9 ? null : '', sv, cv });
  }
}

const unitExact: Generator = {
  id: 'unit.exact', skillId: 'trig.unit-circle', title: 'Valores exactos en el círculo unitario', levels: [1, 2, 3],
  generate(rng, level) {
    const pool = SPECIAL.filter((s) => (level === 1 ? s.deg <= 90 : level === 2 ? s.deg <= 180 : true));
    const s = rng.pick(pool);
    const f = rng.pick(level === 1 ? (['sin', 'cos'] as const) : s.tan === null ? (['sin', 'cos'] as const) : (['sin', 'cos', 'tan'] as const));
    const v = f === 'sin' ? s.sv : f === 'cos' ? s.cv : s.sv / s.cv;
    const texFn = f === 'sin' ? sen : f === 'cos' ? R`\cos` : R`\tan`;
    const useRad = level === 3 && rng.bool();
    const radTex = (() => {
      const fr2 = new Frac(s.deg, 180);
      if (fr2.n === 0) return '0';
      return fr2.d === 1 ? `${fr2.n === 1 ? '' : fr2.n}\\pi` : R`\frac{${fr2.n === 1 ? '' : fr2.n}\pi}{${fr2.d}}`;
    })();
    const argTex = useRad ? radTex : `${s.deg}^\\circ`;
    const exact = f === 'sin' ? s.sin : f === 'cos' ? s.cos : '';
    return {
      prompt: R`Calcula el valor exacto de $${texFn}\left(${argTex}\right)$.`,
      visual: { type: 'unit-circle', angleDeg: s.deg },
      answer: { kind: 'numeric', value: v },
      hints: [
        R`En el círculo unitario, el punto del ángulo es $(\cos\alpha, ${sen}\alpha)$. Valores para 30°, 45°, 60°: $\frac12$, $\frac{\sqrt2}2$, $\frac{\sqrt3}2$. El signo depende del cuadrante.`,
        s.deg > 90 ? `Usa el ángulo de referencia y el signo del cuadrante (${s.deg} está en el ${quadrant(s.deg)}).` : 'Es uno de los ángulos notables del primer cuadrante.',
        f === 'tan' ? R`$\tan = \frac{${sen}}{\cos} = ${n(round(v, 4))}$ (exactamente: $\frac{${s.sin}}{${s.cos}}$).` : R`$${texFn}\left(${argTex}\right) = ${exact}$.`,
      ],
      solution: [{ math: f === 'tan' ? R`\tan\left(${argTex}\right) = \frac{${s.sin}}{${s.cos}}` : R`${texFn}\left(${argTex}\right) = ${exact}` }],
      expectedSeconds: 35 + 10 * level,
    };
  },
};

function quadrant(deg: number): string {
  const d = ((deg % 360) + 360) % 360;
  if (d === 0 || d === 90 || d === 180 || d === 270) return 'eje';
  return d < 90 ? 'primer cuadrante' : d < 180 ? 'segundo cuadrante' : d < 270 ? 'tercer cuadrante' : 'cuarto cuadrante';
}

const radians: Generator = {
  id: 'unit.radians', skillId: 'trig.unit-circle', title: 'Grados y radianes', levels: [1, 2],
  generate(rng) {
    const deg = rng.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
    const fr2 = new Frac(deg, 180);
    const radTex = fr2.d === 1 ? `${fr2.n === 1 ? '' : fr2.n}\\pi` : R`\frac{${fr2.n === 1 ? '' : fr2.n}\pi}{${fr2.d}}`;
    if (rng.bool()) return {
      prompt: R`Expresa $${deg}^\circ$ en radianes.`,
      answer: { kind: 'numeric', value: deg * DEG },
      hints: [R`$180^\circ = \pi$ rad, así que se multiplica por $\frac{\pi}{180}$.`, R`$${deg}\cdot\frac{\pi}{180}$.`, R`$${deg}^\circ = ${radTex}$ rad.`],
      solution: [{ math: R`${deg}^\circ = ${radTex}` }], expectedSeconds: 30,
    };
    return {
      prompt: R`¿Cuántos grados son $${radTex}$ radianes?`,
      answer: { kind: 'numeric', value: deg, unit: '°' },
      hints: [R`$\pi$ rad $= 180^\circ$: se multiplica por $\frac{180}{\pi}$.`, R`$${radTex}\cdot\frac{180}{\pi}$.`, R`Son $${deg}^\circ$.`],
      solution: [{ math: R`${radTex} = ${deg}^\circ` }], expectedSeconds: 30,
    };
  },
};

const quadrantSigns: Generator = {
  id: 'unit.signs', skillId: 'trig.unit-circle', title: 'Signos por cuadrante', levels: [1, 2],
  generate(rng) {
    const q = rng.int(1, 4);
    const deg = [0, 35, 125, 215, 305][q] + rng.int(0, 40);
    const f = rng.pick(['sen', 'cos', 'tan'] as const);
    const positive = f === 'sen' ? q <= 2 : f === 'cos' ? q === 1 || q === 4 : q === 1 || q === 3;
    const texFn = f === 'sen' ? sen : f === 'cos' ? R`\cos` : R`\tan`;
    return {
      prompt: R`¿Qué signo tiene $${texFn}\,${deg}^\circ$?`,
      visual: { type: 'unit-circle', angleDeg: deg },
      answer: { kind: 'choice', options: ['Positivo', 'Negativo'], correct: positive ? 0 : 1 },
      hints: [R`El seno es la coordenada $y$, el coseno la coordenada $x$ y la tangente su cociente.`, `${deg}° está en el ${quadrant(deg)}.`, `En ese cuadrante, ${f === 'sen' ? 'y' : f === 'cos' ? 'x' : 'y/x'} es ${positive ? 'positivo' : 'negativo'}.`],
      solution: [{ note: `${positive ? 'Positivo' : 'Negativo'} (${quadrant(deg)}).` }], expectedSeconds: 25,
    };
  },
};

const IDENTITIES: { from: string; to: string; ft: string; tt: string; lv: number; how: string }[] = [
  { from: 'sin(x)^2 + cos(x)^2', to: '1', ft: R`${sen}^2 x + \cos^2 x`, tt: '1', lv: 1, how: 'Es la identidad pitagórica.' },
  { from: '1 - cos(x)^2', to: 'sin(x)^2', ft: R`1 - \cos^2 x`, tt: R`${sen}^2 x`, lv: 1, how: R`De $${sen}^2x + \cos^2x = 1$ se despeja $${sen}^2 x = 1 - \cos^2 x$.` },
  { from: 'tan(x)*cos(x)', to: 'sin(x)', ft: R`\tan x\cdot\cos x`, tt: R`${sen}\,x`, lv: 1, how: R`$\tan x = \frac{${sen} x}{\cos x}$, y se simplifica $\cos x$.` },
  { from: '(1 - sin(x)^2)/cos(x)', to: 'cos(x)', ft: R`\frac{1 - ${sen}^2 x}{\cos x}`, tt: R`\cos x`, lv: 2, how: R`$1 - ${sen}^2x = \cos^2x$ y $\frac{\cos^2 x}{\cos x} = \cos x$.` },
  { from: 'sin(x)/tan(x)', to: 'cos(x)', ft: R`\frac{${sen}\,x}{\tan x}`, tt: R`\cos x`, lv: 2, how: R`$\frac{${sen} x}{\frac{${sen} x}{\cos x}} = \cos x$.` },
  { from: '(sin(x) + cos(x))^2 - 2sin(x)cos(x)', to: '1', ft: R`(${sen}\,x + \cos x)^2 - 2${sen}\,x\cos x`, tt: '1', lv: 2, how: 'Desarrolla el cuadrado: aparece $\\operatorname{sen}^2x + \\cos^2x$ y el doble producto se cancela.' },
  { from: '(1 - cos(x))(1 + cos(x))', to: 'sin(x)^2', ft: R`(1 - \cos x)(1 + \cos x)`, tt: R`${sen}^2 x`, lv: 2, how: R`Suma por diferencia: $1 - \cos^2 x = ${sen}^2 x$.` },
  { from: '(1 + tan(x)^2)cos(x)^2', to: '1', ft: R`(1 + \tan^2 x)\cos^2 x`, tt: '1', lv: 3, how: R`$\cos^2x + \tan^2x\cos^2x = \cos^2 x + ${sen}^2 x = 1$.` },
  { from: 'sin(x)^4 - cos(x)^4', to: 'sin(x)^2 - cos(x)^2', ft: R`${sen}^4 x - \cos^4 x`, tt: R`${sen}^2 x - \cos^2 x`, lv: 3, how: R`Diferencia de cuadrados: $(${sen}^2x + \cos^2x)(${sen}^2x - \cos^2x)$ y el primer factor vale 1.` },
  { from: 'sin(x)cos(x)tan(x)', to: 'sin(x)^2', ft: R`${sen}\,x\cos x\tan x`, tt: R`${sen}^2 x`, lv: 3, how: R`$\cos x\tan x = ${sen} x$.` },
];

const identities: Generator = {
  id: 'ident.simplify', skillId: 'trig.identities', title: 'Simplificar con identidades', levels: [1, 2, 3],
  generate(rng, level) {
    const it = rng.pick(IDENTITIES.filter((i) => i.lv === level));
    return {
      prompt: R`Simplifica: $${it.ft}$`,
      answer: { kind: 'expression', target: it.to, form: 'simplified' },
      steps: { start: it.from, mode: 'expression' },
      hints: [R`Identidades: $${sen}^2 x + \cos^2 x = 1$, $\tan x = \frac{${sen}\,x}{\cos x}$.`, 'Escribe todo en función de seno y coseno.', it.how + R` Resultado: $${it.tt}$.`],
      solution: [{ math: R`${it.ft} = ${it.tt}`, note: it.how }],
      expectedSeconds: 50 + 20 * level,
    };
  },
};

const findOthers: Generator = {
  id: 'ident.find-others', skillId: 'trig.identities', title: 'Hallar las otras razones', levels: [2, 3],
  generate(rng, level) {
    const [a, b, c] = rng.pick(TRIPLES.slice(0, 4));
    const q = level === 2 ? 1 : rng.pick([2, 3, 4]);
    const sinV = new Frac(q <= 2 ? a : -a, c);
    const cosV = new Frac(q === 1 || q === 4 ? b : -b, c);
    const want = rng.pick(['cos', 'tan'] as const);
    const v = want === 'cos' ? cosV : sinV.div(cosV);
    return {
      prompt: R`Sabiendo que $${sen}\,\alpha = ${sinV.toLatex()}$ y que $\alpha$ está en el ${quadrant(q * 90 - 45)}, calcula $${want === 'cos' ? R`\cos` : R`\tan`}\,\alpha$.`,
      answer: { kind: 'numeric', value: v.toNumber(), requireReduced: true },
      hints: [R`Usa $\cos^2\alpha = 1 - ${sen}^2\alpha$ y elige el signo según el cuadrante. Luego $\tan\alpha = \frac{${sen}\alpha}{\cos\alpha}$.`, R`$\cos^2\alpha = 1 - \frac{${a * a}}{${c * c}} = \frac{${b * b}}{${c * c}}$, así que $\cos\alpha = \pm\frac{${b}}{${c}}$.`, R`En el ${quadrant(q * 90 - 45)}, $\cos\alpha = ${cosV.toLatex()}$${want === 'tan' ? R` y $\tan\alpha = ${v.toLatex()}$` : ''}.`],
      solution: [{ math: R`\cos\alpha = ${cosV.toLatex()},\quad \tan\alpha = ${sinV.div(cosV).toLatex()}` }],
      expectedSeconds: 70,
    };
  },
};

function triangleFromAngles(rng: Rng) {
  const A = rng.int(30, 80), B = rng.int(30, 80);
  return { A, B, C: 180 - A - B };
}

const lawOfSines: Generator = {
  id: 'tri.sines', skillId: 'trig.triangles', title: 'Teorema del seno', levels: [2, 3],
  generate(rng) {
    const { A, B, C } = triangleFromAngles(rng);
    const a = rng.int(5, 20);
    const b = (a * Math.sin(B * DEG)) / Math.sin(A * DEG);
    return {
      prompt: R`En un triángulo, $\hat{A} = ${A}^\circ$, $\hat{B} = ${B}^\circ$ y el lado opuesto a $\hat A$ mide $a = ${a}$ cm. Calcula el lado $b$ (opuesto a $\hat B$) con dos decimales.`,
      visual: { type: 'triangle', sides: [`a = ${a}`, 'b = ?', 'c'], angles: [`${A}°`, `${B}°`, `${C}°`] },
      answer: { kind: 'numeric', value: b, tolerance: 0.011, unit: 'cm' },
      hints: [R`Teorema del seno: $\frac{a}{${sen} A} = \frac{b}{${sen} B}$.`, R`$b = \frac{${a}\cdot ${sen}\,${B}^\circ}{${sen}\,${A}^\circ}$.`, R`$b \approx ${n(round(b))}$ cm.`],
      solution: [{ math: R`b = \frac{${a}\cdot ${sen}\,${B}^\circ}{${sen}\,${A}^\circ} \approx ${n(round(b))}` }], expectedSeconds: 80,
    };
  },
};

const lawOfCosines: Generator = {
  id: 'tri.cosines', skillId: 'trig.triangles', title: 'Teorema del coseno', levels: [2, 3],
  generate(rng) {
    const a = rng.int(4, 15), b = rng.int(4, 15), C = rng.pick([40, 50, 60, 70, 80, 100, 110, 120]);
    const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * DEG));
    return {
      prompt: R`Dos lados de un triángulo miden ${a} cm y ${b} cm, y el ángulo comprendido entre ellos mide $${C}^\circ$. ¿Cuánto mide el tercer lado? (Con dos decimales.)`,
      visual: { type: 'triangle', sides: [`${a}`, `${b}`, 'c = ?'], angles: ['', '', `${C}°`] },
      answer: { kind: 'numeric', value: c, tolerance: 0.011, unit: 'cm' },
      hints: [R`Teorema del coseno: $c^2 = a^2 + b^2 - 2ab\cos C$.`, R`$c^2 = ${a}^2 + ${b}^2 - 2\cdot ${a}\cdot ${b}\cdot\cos ${C}^\circ \approx ${n(round(c * c))}$.`, R`$c \approx ${n(round(c))}$ cm.`],
      solution: [{ math: R`c = \sqrt{${a}^2 + ${b}^2 - 2\cdot ${a}\cdot ${b}\cos ${C}^\circ} \approx ${n(round(c))}` }], expectedSeconds: 90,
    };
  },
};

const elevation: Generator = {
  id: 'tri.elevation', skillId: 'trig.triangles', title: 'Ángulos de elevación', levels: [2, 3],
  generate(rng) {
    const d = rng.int(10, 60), ang = rng.pick([25, 30, 35, 40, 45, 50, 55, 60]);
    const h = d * Math.tan(ang * DEG);
    return {
      prompt: R`Desde un punto situado a ${d} m de la base de un edificio, se ve su parte más alta con un ángulo de elevación de $${ang}^\circ$. ¿Qué altura tiene el edificio? (Con dos decimales.)`,
      visual: { type: 'right-triangle', legA: 'h', legB: `${d} m`, hyp: '', angle: `${ang}°`, angleAt: 'B' },
      answer: { kind: 'numeric', value: h, tolerance: 0.011, unit: 'm' },
      hints: [R`La altura es el cateto opuesto al ángulo y la distancia es el adyacente: usa la tangente.`, R`$h = ${d}\cdot\tan ${ang}^\circ$.`, R`$h \approx ${n(round(h))}$ m.`],
      solution: [{ math: R`h = ${d}\tan ${ang}^\circ \approx ${n(round(h))}` }], expectedSeconds: 60,
    };
  },
};

export const GEOMETRY_GENERATORS: Generator[] = [
  planeArea, compositeArea,
  pythagoras, pythagorasWord, isRightTriangle,
  thales, shadow, similar,
  solids,
  ratiosFromSides, findSide, findAngle,
  unitExact, radians, quadrantSigns,
  identities, findOthers,
  lawOfSines, lawOfCosines, elevation,
];
