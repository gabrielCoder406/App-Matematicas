// Bloque 7: álgebra lineal básica.
import { Frac } from '../../math/fraction';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { choices, n, R, round } from './util';

const vecTex = (v: number[]) => R`\left(${v.join(';\ ')}\right)`;
const matTex = (m: (number | string)[][]) => R`\begin{pmatrix} ${m.map((r) => r.join(' & ')).join(R` \\ `)} \end{pmatrix}`;
const detTex = (m: number[][]) => R`\begin{vmatrix} ${m.map((r) => r.join(' & ')).join(R` \\ `)} \end{vmatrix}`;

function randVec(rng: Rng, dim: number, m = 6): number[] {
  return Array.from({ length: dim }, () => rng.int(-m, m));
}

function randMat(rng: Rng, r: number, c: number, m = 5): number[][] {
  return Array.from({ length: r }, () => randVec(rng, c, m));
}

const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

// ---------------------------------------------------------------------------
// Vectores
// ---------------------------------------------------------------------------

const vectorFromPoints: Generator = {
  id: 'vec.points', skillId: 'la.vectors', title: 'Vector entre dos puntos', levels: [1, 2, 3],
  generate(rng, level) {
    const dim = level === 3 ? 3 : 2;
    const A = randVec(rng, dim), B = randVec(rng, dim);
    const AB = B.map((b, i) => b - A[i]);
    const labels = ['x', 'y', 'z'].slice(0, dim);
    return {
      prompt: R`Halla las componentes del vector $\vec{AB}$ si $A = ${vecTex(A)}$ y $B = ${vecTex(B)}$.`,
      visual: dim === 2 ? { type: 'vectors', vectors: [{ x: AB[0], y: AB[1], label: 'AB', from: [A[0], A[1]] }] } : undefined,
      answer: { kind: 'vector', values: AB, labels },
      hints: [R`$\vec{AB} = B - A$ (extremo menos origen), componente a componente.`, R`$\vec{AB} = (${B.map((b, i) => `${b} - ${A[i] < 0 ? `(${A[i]})` : A[i]}`).join(';\\ ')})$.`, R`$\vec{AB} = ${vecTex(AB)}$.`],
      solution: [{ math: R`\vec{AB} = ${vecTex(AB)}` }], expectedSeconds: 35 + 10 * level,
    };
  },
};

const vectorMagnitude: Generator = {
  id: 'vec.magnitude', skillId: 'la.vectors', title: 'Módulo de un vector', levels: [1, 2, 3],
  generate(rng, level) {
    let v: number[];
    if (level === 1) {
      const [a, b] = rng.pick([[3, 4], [6, 8], [5, 12], [8, 15], [9, 12]]);
      v = [a * rng.sign(), b * rng.sign()];
    } else v = randVec(rng, level === 3 ? 3 : 2, 5);
    const s = v.reduce((acc, x) => acc + x * x, 0);
    const mag = Math.sqrt(s);
    return {
      prompt: R`Calcula el módulo de $\vec v = ${vecTex(v)}$${Number.isInteger(mag) ? '' : ' (exacto con raíz o con dos decimales)'}.`,
      answer: { kind: 'numeric', value: mag, tolerance: Number.isInteger(mag) ? undefined : 0.006 },
      hints: [R`$|\vec v| = \sqrt{v_1^2 + v_2^2${v.length === 3 ? ' + v_3^2' : ''}}$.`, R`$|\vec v| = \sqrt{${v.map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join(' + ')}} = \sqrt{${s}}$.`, R`$|\vec v| = ${Number.isInteger(mag) ? mag : R`\sqrt{${s}} \approx ${n(round(mag))}`}$.`],
      solution: [{ math: R`|\vec v| = \sqrt{${s}}${Number.isInteger(mag) ? ` = ${mag}` : ''}` }], expectedSeconds: 35,
    };
  },
};

const vectorOps: Generator = {
  id: 'vec.ops', skillId: 'la.vectors', title: 'Suma de vectores y producto por escalar', levels: [1, 2, 3],
  generate(rng, level) {
    const dim = level === 3 ? 3 : 2;
    const u = randVec(rng, dim, 5), v = randVec(rng, dim, 5);
    const a = level === 1 ? 1 : rng.nonZero(3), b = level === 1 ? rng.pick([1, -1]) : rng.nonZero(3);
    const res = u.map((x, i) => a * x + b * v[i]);
    const coef = (k: number, name: string, first: boolean) => `${first ? (k < 0 ? '-' : '') : k < 0 ? ' - ' : ' + '}${Math.abs(k) === 1 ? '' : Math.abs(k)}${name}`;
    const exprT = `${coef(a, R`\vec u`, true)}${coef(b, R`\vec v`, false)}`;
    return {
      prompt: R`Sean $\vec u = ${vecTex(u)}$ y $\vec v = ${vecTex(v)}$. Calcula $${exprT}$.`,
      visual: dim === 2 ? { type: 'vectors', vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v' }, { x: res[0], y: res[1], label: 'resultado' }] } : undefined,
      answer: { kind: 'vector', values: res, labels: ['x', 'y', 'z'].slice(0, dim) },
      hints: [R`Se opera componente a componente: $k(u_1, u_2) = (ku_1, ku_2)$ y $(u_1, u_2) + (v_1, v_2) = (u_1 + v_1, u_2 + v_2)$.`, R`$${exprT} = ${vecTex(u.map((x) => a * x))} + ${vecTex(v.map((x) => b * x))}$.`, R`Resultado: $${vecTex(res)}$.`],
      solution: [{ math: R`${exprT} = ${vecTex(res)}` }], expectedSeconds: 40 + 10 * level,
    };
  },
};

const unitVector: Generator = {
  id: 'vec.unit', skillId: 'la.vectors', title: 'Vector unitario', levels: [3],
  generate(rng) {
    const [a, b] = rng.pick([[3, 4], [6, 8], [5, 12], [8, 15]]);
    const v = [a * rng.sign(), b * rng.sign()];
    const m = Math.hypot(v[0], v[1]);
    const u = v.map((x) => new Frac(x, m));
    return {
      prompt: R`Halla el vector unitario con la misma dirección y sentido que $\vec v = ${vecTex(v)}$.`,
      answer: { kind: 'vector', values: u.map((f) => f.toNumber()), labels: ['x', 'y'] },
      hints: [R`$\hat v = \frac{\vec v}{|\vec v|}$.`, R`$|\vec v| = ${m}$.`, R`$\hat v = \left(${u[0].toLatex()};\ ${u[1].toLatex()}\right)$.`],
      solution: [{ math: R`\hat v = \left(${u[0].toLatex()};\ ${u[1].toLatex()}\right)` }], expectedSeconds: 50,
    };
  },
};

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

const dotProduct: Generator = {
  id: 'dot.compute', skillId: 'la.products', title: 'Producto escalar', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 3) {
      const b = rng.nonZero(5), c = rng.nonZero(5), d = rng.nonZero(5);
      // (k, b)·(c, d) = 0 → k = -b d / c ; aseguramos entero
      const k = new Frac(-b * d, c);
      return {
        prompt: R`¿Para qué valor de $k$ son perpendiculares $\vec u = (k;\ ${b})$ y $\vec v = (${c};\ ${d})$?`,
        answer: { kind: 'numeric', value: k.toNumber(), requireReduced: !k.isInt() },
        hints: [R`Dos vectores son perpendiculares si su producto escalar es 0.`, R`$${c}k + ${b < 0 ? `(${b})` : b}\cdot ${d < 0 ? `(${d})` : d} = 0$.`, R`$k = ${k.toLatex()}$.`],
        solution: [{ math: R`k = ${k.toLatex()}` }], expectedSeconds: 50,
      };
    }
    const dim = level === 2 ? 3 : 2;
    const u = randVec(rng, dim, 5), v = randVec(rng, dim, 5);
    const dot = u.reduce((acc, x, i) => acc + x * v[i], 0);
    return {
      prompt: R`Calcula $\vec u \cdot \vec v$ para $\vec u = ${vecTex(u)}$ y $\vec v = ${vecTex(v)}$.`,
      answer: { kind: 'numeric', value: dot },
      hints: [R`$\vec u\cdot\vec v = u_1v_1 + u_2v_2${dim === 3 ? ' + u_3v_3' : ''}$ (el resultado es un número).`, R`$${u.map((x, i) => `${x < 0 ? `(${x})` : x}\\cdot ${v[i] < 0 ? `(${v[i]})` : v[i]}`).join(' + ')}$.`, R`$\vec u\cdot\vec v = ${dot}$.`],
      solution: [{ math: R`\vec u\cdot\vec v = ${dot}` }], expectedSeconds: 35,
    };
  },
};

const angleBetween: Generator = {
  id: 'dot.angle', skillId: 'la.products', title: 'Ángulo entre vectores', levels: [2, 3],
  generate(rng) {
    let u = randVec(rng, 2, 5), v = randVec(rng, 2, 5);
    while (Math.hypot(u[0], u[1]) === 0 || Math.hypot(v[0], v[1]) === 0) { u = randVec(rng, 2, 5); v = randVec(rng, 2, 5); }
    const dot = u[0] * v[0] + u[1] * v[1];
    const cos = dot / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
    const ang = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    return {
      prompt: R`Calcula el ángulo (en grados, con un decimal) entre $\vec u = ${vecTex(u)}$ y $\vec v = ${vecTex(v)}$.`,
      visual: { type: 'vectors', vectors: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v' }] },
      answer: { kind: 'numeric', value: ang, tolerance: 0.06, unit: '°' },
      hints: [R`$\cos\theta = \frac{\vec u\cdot\vec v}{|\vec u|\,|\vec v|}$.`, R`$\vec u\cdot\vec v = ${dot}$, $|\vec u| = \sqrt{${u[0] ** 2 + u[1] ** 2}}$, $|\vec v| = \sqrt{${v[0] ** 2 + v[1] ** 2}}$.`, R`$\theta = \arccos(${n(round(cos, 4))}) \approx ${n(round(ang, 1))}^\circ$.`],
      solution: [{ math: R`\theta \approx ${n(round(ang, 1))}^\circ` }], expectedSeconds: 80,
    };
  },
};

const crossProduct: Generator = {
  id: 'cross.compute', skillId: 'la.products', title: 'Producto vectorial', levels: [2, 3],
  generate(rng) {
    const u = randVec(rng, 3, 4), v = randVec(rng, 3, 4);
    const c = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    return {
      prompt: R`Calcula $\vec u \times \vec v$ para $\vec u = ${vecTex(u)}$ y $\vec v = ${vecTex(v)}$.`,
      answer: { kind: 'vector', values: c, labels: ['x', 'y', 'z'] },
      hints: [R`$\vec u\times\vec v = (u_2v_3 - u_3v_2;\ u_3v_1 - u_1v_3;\ u_1v_2 - u_2v_1)$ (determinante con $\hat i, \hat j, \hat k$).`, R`Primera componente: $${u[1]}\cdot ${v[2]} - ${u[2]}\cdot ${v[1]} = ${c[0]}$.`, R`$\vec u\times\vec v = ${vecTex(c)}$.`],
      solution: [{ math: R`\vec u\times\vec v = ${vecTex(c)}` }], expectedSeconds: 90,
    };
  },
};

// ---------------------------------------------------------------------------
// Matrices
// ---------------------------------------------------------------------------

const matrixAdd: Generator = {
  id: 'mat.add', skillId: 'la.matrices', title: 'Suma, resta y producto por escalar', levels: [1, 2],
  generate(rng, level) {
    const r = 2, c = level === 1 ? 2 : 3;
    const A = randMat(rng, r, c), B = randMat(rng, r, c);
    const k = level === 1 ? 1 : rng.nonZero(3);
    const op = rng.pick(['+', '-']);
    const res = A.map((row, i) => row.map((x, j) => k * x + (op === '+' ? 1 : -1) * B[i][j]));
    const exprT = `${k === 1 ? '' : k === -1 ? '-' : k}A ${op} B`;
    return {
      prompt: R`Sean $A = ${matTex(A)}$ y $B = ${matTex(B)}$. Calcula $${exprT}$.`,
      answer: { kind: 'matrix', rows: res },
      hints: [R`Las matrices se suman elemento a elemento; el escalar multiplica a cada elemento.`, R`Elemento $(1,1)$: $${k === 1 ? '' : `${k}\\cdot `}${A[0][0] < 0 ? `(${A[0][0]})` : A[0][0]} ${op} ${B[0][0] < 0 ? `(${B[0][0]})` : B[0][0]} = ${res[0][0]}$.`, R`Resultado: $${matTex(res)}$.`],
      solution: [{ math: R`${exprT} = ${matTex(res)}` }], expectedSeconds: 50 + 20 * level,
    };
  },
};

const matrixMul: Generator = {
  id: 'mat.mul', skillId: 'la.matrices', title: 'Producto de matrices', levels: [1, 2, 3],
  generate(rng, level) {
    const [m, k, p] = level === 1 ? [2, 2, 1] : level === 2 ? [2, 2, 2] : [2, 3, 2];
    const A = randMat(rng, m, k, 4), B = randMat(rng, k, p, 4);
    const C = A.map((row) => Array.from({ length: p }, (_, j) => row.reduce((acc, x, t) => acc + x * B[t][j], 0)));
    return {
      prompt: R`Calcula $A\cdot B$ con $A = ${matTex(A)}$ y $B = ${matTex(B)}$.`,
      answer: { kind: 'matrix', rows: C },
      hints: [R`El elemento $(i,j)$ del producto es la fila $i$ de $A$ multiplicada (producto escalar) por la columna $j$ de $B$. El resultado es ${m}×${p}.`, R`Elemento $(1,1)$: $${A[0].map((x, t) => `${x < 0 ? `(${x})` : x}\\cdot ${B[t][0] < 0 ? `(${B[t][0]})` : B[t][0]}`).join(' + ')} = ${C[0][0]}$.`, R`$A\cdot B = ${matTex(C)}$.`],
      solution: [{ math: R`A\cdot B = ${matTex(C)}` }], expectedSeconds: 60 + 40 * level,
    };
  },
};

const matrixDims: Generator = {
  id: 'mat.dims', skillId: 'la.matrices', title: 'Dimensiones del producto', levels: [1, 2],
  generate(rng) {
    const m = rng.int(1, 4), k = rng.int(1, 4), p = rng.int(1, 4);
    const k2 = rng.bool(0.7) ? k : rng.intExcept(1, 4, k);
    const ok = k === k2;
    const correct = ok ? `$${m}\\times ${p}$` : 'No se puede multiplicar';
    const { options, correct: ci } = choices(rng, correct, [`$${m}\\times ${p}$`, `$${k}\\times ${k2}$`, `$${p}\\times ${m}$`, 'No se puede multiplicar', `$${m}\\times ${k2}$`]);
    return {
      prompt: R`Si $A$ es de ${m}×${k} y $B$ es de ${k2}×${p}, ¿de qué dimensión es $A\cdot B$?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: ['Para multiplicar, las columnas de A deben coincidir con las filas de B.', R`$(m\times k)\cdot(k\times p) = m\times p$.`, ok ? `El resultado es ${m}×${p}.` : `${k} ≠ ${k2}: no se pueden multiplicar.`],
      solution: [{ note: ok ? `${m}×${p}` : 'No está definido.' }], expectedSeconds: 25,
    };
  },
};

const transpose: Generator = {
  id: 'mat.transpose', skillId: 'la.matrices', title: 'Matriz traspuesta', levels: [1],
  generate(rng) {
    const A = randMat(rng, 2, 3);
    const T = [0, 1, 2].map((j) => [A[0][j], A[1][j]]);
    return {
      prompt: R`Escribe la traspuesta de $A = ${matTex(A)}$.`,
      answer: { kind: 'matrix', rows: T },
      hints: ['La traspuesta intercambia filas por columnas: la fila 1 pasa a ser la columna 1.', 'A es 2×3, así que su traspuesta es 3×2.', R`$A^T = ${matTex(T)}$.`],
      solution: [{ math: R`A^T = ${matTex(T)}` }], expectedSeconds: 30,
    };
  },
};

// ---------------------------------------------------------------------------
// Determinantes
// ---------------------------------------------------------------------------

const determinant: Generator = {
  id: 'det.compute', skillId: 'la.determinants', title: 'Calcular determinantes', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 1) {
      const M = randMat(rng, 2, 2, 7);
      const d = det2(M);
      return {
        prompt: R`Calcula el determinante: $${detTex(M)}$`,
        answer: { kind: 'numeric', value: d },
        hints: [R`$\begin{vmatrix} a & b \\ c & d\end{vmatrix} = ad - bc$.`, R`$${M[0][0]}\cdot ${M[1][1] < 0 ? `(${M[1][1]})` : M[1][1]} - ${M[0][1] < 0 ? `(${M[0][1]})` : M[0][1]}\cdot ${M[1][0] < 0 ? `(${M[1][0]})` : M[1][0]}$.`, R`$= ${d}$.`],
        solution: [{ math: R`${detTex(M)} = ${d}` }], expectedSeconds: 30,
      };
    }
    const M = randMat(rng, 3, 3, level === 2 ? 3 : 5);
    const d = det3(M);
    return {
      prompt: R`Calcula el determinante: $${detTex(M)}$`,
      answer: { kind: 'numeric', value: d },
      hints: [R`Regla de Sarrus: suma de los productos de las diagonales principales menos la suma de los productos de las secundarias. También puedes desarrollar por una fila.`, R`Desarrollando por la primera fila: $${M[0][0]}\cdot ${det2([[M[1][1], M[1][2]], [M[2][1], M[2][2]]])} - ${M[0][1] < 0 ? `(${M[0][1]})` : M[0][1]}\cdot ${det2([[M[1][0], M[1][2]], [M[2][0], M[2][2]]])} + ${M[0][2] < 0 ? `(${M[0][2]})` : M[0][2]}\cdot ${det2([[M[1][0], M[1][1]], [M[2][0], M[2][1]]])}$.`, R`$= ${d}$.`],
      solution: [{ math: R`${detTex(M)} = ${d}` }], expectedSeconds: 90 + 20 * level,
    };
  },
};

const inverse2: Generator = {
  id: 'det.inverse', skillId: 'la.determinants', title: 'Inversa de una matriz 2×2', levels: [2, 3],
  generate(rng) {
    let M = randMat(rng, 2, 2, 5);
    while (det2(M) === 0) M = randMat(rng, 2, 2, 5);
    const d = det2(M);
    const inv = [[M[1][1], -M[0][1]], [-M[1][0], M[0][0]]].map((r) => r.map((x) => new Frac(x, d)));
    return {
      prompt: R`Calcula la inversa de $A = ${matTex(M)}$ (usa fracciones si hace falta).`,
      answer: { kind: 'matrix', rows: inv.map((r) => r.map((f) => f.toNumber())) },
      hints: [R`$A^{-1} = \frac{1}{\det A}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.`, R`$\det A = ${d}$.`, R`$A^{-1} = ${matTex(inv.map((r) => r.map((f) => f.toLatex())))}$.`],
      solution: [{ math: R`A^{-1} = ${matTex(inv.map((r) => r.map((f) => f.toLatex())))}` }], expectedSeconds: 100,
    };
  },
};

// ---------------------------------------------------------------------------
// Sistemas con matrices
// ---------------------------------------------------------------------------

function sysTex(A: number[][], b: number[], vars: string[]): string {
  const row = (r: number[], rhs: number) => {
    let s = '';
    r.forEach((c, j) => {
      if (c === 0) return;
      const abs = Math.abs(c);
      const t = `${abs === 1 ? '' : abs}${vars[j]}`;
      s += s === '' ? (c < 0 ? `-${t}` : t) : c < 0 ? ` - ${t}` : ` + ${t}`;
    });
    return `${s || '0'} = ${rhs}`;
  };
  return R`\begin{cases} ${A.map((r, i) => row(r, b[i])).join(R` \\ `)} \end{cases}`;
}

const cramer: Generator = {
  id: 'cramer.solve', skillId: 'la.linear-systems', title: 'Regla de Cramer', levels: [1, 2, 3],
  generate(rng, level) {
    const dim = level === 3 ? 3 : 2;
    let A = randMat(rng, dim, dim, dim === 3 ? 3 : 5);
    const det = (m: number[][]) => (dim === 2 ? det2(m) : det3(m));
    while (det(A) === 0) A = randMat(rng, dim, dim, dim === 3 ? 3 : 5);
    const sol = randVec(rng, dim, 4);
    const b = A.map((r) => r.reduce((acc, x, j) => acc + x * sol[j], 0));
    const vars = ['x', 'y', 'z'].slice(0, dim);
    const D = det(A);
    const Dx = det(A.map((r, i) => r.map((x, j) => (j === 0 ? b[i] : x))));
    if (level === 1) return {
      prompt: R`Para el sistema $${sysTex(A, b, vars)}$, calcula el determinante $\Delta_x$ (columna de $x$ reemplazada por los términos independientes).`,
      answer: { kind: 'numeric', value: Dx },
      hints: [R`$\Delta_x$ se obtiene reemplazando la columna de los coeficientes de $x$ por la columna de términos independientes.`, R`$\Delta_x = ${detTex(A.map((r, i) => r.map((x, j) => (j === 0 ? b[i] : x))))}$.`, R`$\Delta_x = ${Dx}$ (y $\Delta = ${D}$, así que $x = ${sol[0]}$).`],
      solution: [{ math: R`\Delta_x = ${Dx}` }], expectedSeconds: 50,
    };
    return {
      prompt: R`Resuelve por la regla de Cramer: $${sysTex(A, b, vars)}$`,
      answer: { kind: 'vector', values: sol, labels: vars },
      hints: [R`Cramer: $x = \frac{\Delta_x}{\Delta}$, $y = \frac{\Delta_y}{\Delta}$${dim === 3 ? R`, $z = \frac{\Delta_z}{\Delta}$` : ''}, con $\Delta$ el determinante de los coeficientes.`, R`$\Delta = ${D}$, $\Delta_x = ${Dx}$.`, R`Solución: $${vars.map((v, i) => `${v} = ${sol[i]}`).join(',\\ ')}$.`],
      solution: [{ math: vars.map((v, i) => `${v} = ${sol[i]}`).join(',\\quad ') }], expectedSeconds: 100 + 60 * (level - 1),
    };
  },
};

const gaussStep: Generator = {
  id: 'gauss.step', skillId: 'la.linear-systems', title: 'Operaciones elementales de Gauss-Jordan', levels: [2, 3],
  generate(rng) {
    const a = rng.nonZero(4);
    const M = [[1, rng.int(-3, 3), rng.int(-5, 5)], [a, rng.int(-5, 5), rng.int(-9, 9)]];
    const R2 = M[1].map((x, j) => x - a * M[0][j]);
    const coef = Math.abs(a) === 1 ? '' : String(Math.abs(a));
    const correct = R`$F_2 \to F_2 ${a < 0 ? '+' : '-'} ${coef}F_1$`;
    const wrong = [
      R`$F_2 \to F_2 ${a < 0 ? '-' : '+'} ${coef}F_1$`,
      R`$F_1 \to F_1 - ${coef}F_2$`,
      R`$F_1 \leftrightarrow F_2$`,
    ];
    const { options, correct: ci } = choices(rng, correct, wrong);
    return {
      prompt: R`¿Qué operación elemental transforma la matriz ampliada $${matTex(M)}$ en $${matTex([M[0], R2])}$?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: ['En Gauss-Jordan se buscan ceros debajo del pivote (el 1 de la primera fila).', `Para anular el ${a} de la segunda fila hay que restarle ${a} veces la primera.`, `La operación es ${correct}.`],
      solution: [{ note: correct }], expectedSeconds: 45,
    };
  },
};

export const LINEAR_GENERATORS: Generator[] = [
  vectorFromPoints, vectorMagnitude, vectorOps, unitVector,
  dotProduct, angleBetween, crossProduct,
  matrixAdd, matrixMul, matrixDims, transpose,
  determinant, inverse2,
  cramer, gaussStep,
];
