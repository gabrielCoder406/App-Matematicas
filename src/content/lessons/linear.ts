import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_LINEAR: Lesson[] = [
  {
    skillId: 'la.vectors',
    intro: 'Un **vector** tiene módulo (longitud), dirección y sentido. En el plano se escribe con sus componentes: $\\vec v = (v_1;\\ v_2)$.',
    sections: [
      {
        type: 'widget',
        widget: 'vectors',
        props: { u: [3, 1], v: [1, 2] },
        caption: 'Arrastra las puntas de los vectores: la suma sigue la regla del paralelogramo y los valores se actualizan en vivo.',
      },
      {
        type: 'text',
        title: 'Operaciones',
        body: R`- Vector entre puntos: $\vec{AB} = B - A$.
- Módulo: $|\vec v| = \sqrt{v_1^2 + v_2^2}$ (en 3D se suma $v_3^2$).
- Suma: componente a componente. Producto por escalar: $k\vec v = (kv_1;\ kv_2)$.
- Vector unitario: $\hat v = \frac{\vec v}{|\vec v|}$.`,
      },
      {
        type: 'example',
        title: 'Vector y módulo',
        problem: R`$A = (1;\ 2)$, $B = (4;\ 6)$.`,
        steps: [
          { math: R`\vec{AB} = (4 - 1;\ 6 - 2) = (3;\ 4)` },
          { math: R`|\vec{AB}| = \sqrt{9 + 16} = 5` },
        ],
      },
      { type: 'check', generatorId: 'vec.points', level: 1 },
      { type: 'check', generatorId: 'vec.magnitude', level: 1 },
      { type: 'summary', points: ['AB = extremo − origen.', 'Módulo por Pitágoras.'] },
    ],
  },
  {
    skillId: 'la.products',
    intro: 'El **producto escalar** de dos vectores da un número que mide cuánto «apuntan hacia el mismo lado»; el **producto vectorial** (en 3D) da un vector perpendicular a ambos.',
    sections: [
      {
        type: 'text',
        title: 'Producto escalar',
        body: R`$\vec u\cdot\vec v = u_1v_1 + u_2v_2 (+ u_3v_3) = |\vec u|\,|\vec v|\cos\theta$. Si es 0, los vectores son **perpendiculares**; si es positivo, el ángulo es agudo; si es negativo, obtuso.`,
      },
      {
        type: 'widget',
        widget: 'vectors',
        props: { u: [3, 1], v: [-1, 3], showAngle: true },
        caption: 'Gira los vectores hasta que el producto escalar sea 0: el ángulo entre ellos será de 90°.',
      },
      {
        type: 'example',
        title: 'Ángulo entre vectores',
        problem: R`$\vec u = (1;\ 0)$, $\vec v = (1;\ 1)$.`,
        steps: [
          { math: R`\cos\theta = \frac{1}{1\cdot\sqrt2} = \frac{\sqrt2}{2} \Rightarrow \theta = 45^\circ` },
        ],
      },
      {
        type: 'text',
        title: 'Producto vectorial',
        body: R`$\vec u\times\vec v = (u_2v_3 - u_3v_2;\ u_3v_1 - u_1v_3;\ u_1v_2 - u_2v_1)$. Su módulo es el área del paralelogramo que forman $\vec u$ y $\vec v$.`,
      },
      { type: 'check', generatorId: 'dot.compute', level: 1 },
      { type: 'check', generatorId: 'cross.compute', level: 2 },
      { type: 'summary', points: ['Escalar = 0 ⇔ perpendiculares.', 'Vectorial: perpendicular a ambos.'] },
    ],
  },
  {
    skillId: 'la.matrices',
    intro: 'Una **matriz** es una tabla de números con $m$ filas y $n$ columnas. Sirven para organizar datos, resolver sistemas y describir transformaciones.',
    sections: [
      {
        type: 'text',
        title: 'Operaciones',
        body: R`- **Suma**: elemento a elemento (mismas dimensiones).
- **Producto por escalar**: multiplica cada elemento.
- **Producto** $A_{m\times n}\cdot B_{n\times p}$: el elemento $(i, j)$ es la fila $i$ de $A$ por la columna $j$ de $B$ (producto escalar). El resultado es $m\times p$.
- **Traspuesta** $A^T$: filas por columnas.`,
      },
      {
        type: 'example',
        title: 'Producto',
        problem: R`$\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}\cdot\begin{pmatrix} 5 \\ 6 \end{pmatrix}$`,
        steps: [{ math: R`= \begin{pmatrix} 1\cdot5 + 2\cdot6 \\ 3\cdot5 + 4\cdot6 \end{pmatrix} = \begin{pmatrix} 17 \\ 39 \end{pmatrix}` }],
      },
      {
        type: 'widget',
        widget: 'matrix',
        props: { m: [[1, 1], [0, 1]] },
        caption: 'Una matriz 2×2 transforma el plano: mira cómo deforma el cuadrado unidad al cambiar sus elementos.',
      },
      { type: 'tip', body: R`El producto **no** es conmutativo: en general $AB \neq BA$ (y a veces uno de los dos ni siquiera está definido).` },
      { type: 'check', generatorId: 'mat.add', level: 1 },
      { type: 'check', generatorId: 'mat.mul', level: 1 },
      { type: 'summary', points: ['Producto: fila × columna.', '(m×n)·(n×p) = m×p.', 'AB ≠ BA.'] },
    ],
  },
  {
    skillId: 'la.determinants',
    intro: 'El **determinante** de una matriz cuadrada es un número que indica si la matriz es invertible y cuánto escala las áreas.',
    sections: [
      {
        type: 'text',
        title: 'Cálculo',
        body: R`- 2×2: $\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc$.
- 3×3: regla de **Sarrus** (suma de productos de las tres diagonales descendentes menos los de las ascendentes) o desarrollo por una fila.
- $A$ es invertible $\iff \det A \neq 0$. Para 2×2: $A^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}$.`,
      },
      {
        type: 'widget',
        widget: 'matrix',
        props: { m: [[2, 1], [1, 2]], showDet: true },
        caption: 'El determinante es el área (con signo) del paralelogramo transformado. Si vale 0, el cuadrado se aplasta en una recta.',
      },
      {
        type: 'example',
        title: 'Determinante 3×3',
        problem: R`$\begin{vmatrix} 1 & 2 & 0 \\ 3 & 1 & 1 \\ 0 & 2 & 1 \end{vmatrix}$`,
        steps: [
          { math: R`= 1(1\cdot1 - 1\cdot2) - 2(3\cdot1 - 1\cdot0) + 0 = -1 - 6 = -7`, note: 'Desarrollo por la primera fila.' },
        ],
      },
      { type: 'check', generatorId: 'det.compute', level: 1 },
      { type: 'check', generatorId: 'det.compute', level: 2 },
      { type: 'summary', points: ['2×2: ad − bc.', 'det = 0 ⇔ no invertible.'] },
    ],
  },
  {
    skillId: 'la.linear-systems',
    intro: 'Un sistema lineal se escribe en forma matricial $A\\vec x = \\vec b$. Dos métodos clásicos: **Cramer** (con determinantes) y **Gauss-Jordan** (con operaciones de fila).',
    sections: [
      {
        type: 'text',
        title: 'Regla de Cramer',
        body: R`Si $\Delta = \det A \neq 0$: $x = \frac{\Delta_x}{\Delta}$, $y = \frac{\Delta_y}{\Delta}$ (…), donde $\Delta_x$ es el determinante de $A$ con la columna de $x$ reemplazada por los términos independientes.`,
      },
      {
        type: 'example',
        title: 'Cramer 2×2',
        problem: R`$\begin{cases} 2x + y = 5 \\ x - y = 1 \end{cases}$`,
        steps: [
          { math: R`\Delta = \begin{vmatrix} 2 & 1 \\ 1 & -1 \end{vmatrix} = -3` },
          { math: R`\Delta_x = \begin{vmatrix} 5 & 1 \\ 1 & -1 \end{vmatrix} = -6,\quad \Delta_y = \begin{vmatrix} 2 & 5 \\ 1 & 1 \end{vmatrix} = -3` },
          { math: R`x = \frac{-6}{-3} = 2,\quad y = \frac{-3}{-3} = 1` },
        ],
      },
      {
        type: 'text',
        title: 'Gauss-Jordan',
        body: R`Se trabaja con la matriz ampliada $(A \mid b)$ y operaciones elementales: intercambiar filas ($F_1 \leftrightarrow F_2$), multiplicar una fila por un número no nulo y sumar a una fila un múltiplo de otra ($F_2 \to F_2 - 2F_1$), hasta obtener la identidad a la izquierda.`,
      },
      { type: 'check', generatorId: 'cramer.solve', level: 1 },
      { type: 'check', generatorId: 'gauss.step', level: 2 },
      { type: 'summary', points: ['Cramer: x = Δx/Δ (si Δ ≠ 0).', 'Gauss-Jordan: operaciones elementales de fila.'] },
    ],
  },
];
