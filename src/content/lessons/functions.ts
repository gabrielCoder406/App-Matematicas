import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_FUNCTIONS: Lesson[] = [
  {
    skillId: 'fn.basics',
    intro: 'Una **función** asigna a cada valor de $x$ (de su dominio) **un único** valor $f(x)$.',
    sections: [
      {
        type: 'text',
        title: 'Dominio e imagen',
        body: R`- **Dominio**: los $x$ para los que $f(x)$ existe. Se excluyen los valores que anulan un denominador, que hacen negativo un radicando de índice par o que no hacen positivo el argumento de un logaritmo.
- **Imagen**: los valores que efectivamente toma $f(x)$.
- **Codominio**: el conjunto donde la función puede tomar valores (normalmente $\mathbb{R}$).`,
      },
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['sqrt(x - a)'], params: { a: 2 } },
        caption: R`La gráfica de $\sqrt{x - a}$ empieza en $x = a$: a la izquierda no hay función. Mueve $a$ y observa cómo cambia el dominio.`,
      },
      {
        type: 'example',
        title: 'Cortes con los ejes',
        problem: R`$f(x) = x^2 - x - 6$`,
        steps: [
          { math: R`f(0) = -6`, note: 'Corte con el eje y: (0; −6).' },
          { math: R`x^2 - x - 6 = 0 \Rightarrow x = 3 \ \text{o}\ x = -2`, note: 'Cortes con el eje x: (3; 0) y (−2; 0).' },
        ],
      },
      { type: 'tip', body: R`Para hallar el dominio de $\frac{1}{\sqrt{x - 2}}$ hay dos condiciones a la vez: radicando $\ge 0$ y denominador $\neq 0$, es decir $x > 2$.` },
      { type: 'check', generatorId: 'fn.domain', level: 1 },
      { type: 'check', generatorId: 'fn.intercepts', level: 1 },
      { type: 'summary', points: ['Dominio: donde la fórmula tiene sentido.', 'Eje y: f(0). Eje x: resolver f(x) = 0.'] },
    ],
  },
  {
    skillId: 'fn.linear',
    intro: 'Las funciones $f(x) = mx + b$ tienen como gráfica una **recta**: $m$ es la pendiente y $b$ la ordenada al origen.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['m*x + b'], params: { m: 1, b: 2 } },
        caption: R`Mueve $m$: la recta gira (si $m > 0$ crece, si $m < 0$ decrece). Mueve $b$: la recta sube o baja sin girar.`,
      },
      {
        type: 'text',
        title: 'Pendiente',
        body: R`La pendiente es cuánto cambia $y$ por cada unidad que aumenta $x$: $$m = \frac{y_2 - y_1}{x_2 - x_1}$$ Rectas **paralelas** tienen la misma pendiente; **perpendiculares**, pendientes cuyo producto es $-1$.`,
      },
      {
        type: 'example',
        title: 'Recta por dos puntos',
        problem: R`Pasa por $(1;\ 3)$ y $(3;\ 7)$.`,
        steps: [
          { math: R`m = \frac{7 - 3}{3 - 1} = 2` },
          { math: R`y - 3 = 2(x - 1) \Rightarrow y = 2x + 1` },
        ],
      },
      { type: 'check', generatorId: 'lin.slope', level: 1 },
      { type: 'check', generatorId: 'lin.read-graph', level: 1 },
      { type: 'summary', points: ['m = cambio en y / cambio en x.', 'b = corte con el eje y.', 'Paralelas: igual m. Perpendiculares: m₁·m₂ = −1.'] },
    ],
  },
  {
    skillId: 'fn.quadratic',
    intro: 'Las funciones cuadráticas $f(x) = ax^2 + bx + c$ tienen como gráfica una **parábola**.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['a*(x - h)^2 + k'], params: { a: 1, h: 2, k: -1 }, showVertex: true },
        caption: R`Forma canónica: $a$ abre o cierra la parábola (y la da vuelta si es negativa); $(h;\ k)$ es el vértice.`,
      },
      {
        type: 'text',
        title: 'Elementos',
        body: R`- **Vértice**: $x_v = -\frac{b}{2a}$, $y_v = f(x_v)$. Es el mínimo si $a > 0$ o el máximo si $a < 0$.
- **Eje de simetría**: la recta $x = x_v$.
- **Raíces**: soluciones de $f(x) = 0$ (fórmula resolvente).
- **Forma canónica**: $f(x) = a(x - x_v)^2 + y_v$. **Factorizada**: $a(x - x_1)(x - x_2)$.`,
      },
      {
        type: 'example',
        title: 'Vértice',
        problem: R`$f(x) = 2x^2 - 8x + 5$`,
        steps: [
          { math: R`x_v = -\frac{-8}{2\cdot 2} = 2` },
          { math: R`y_v = 2\cdot 4 - 16 + 5 = -3` },
          { math: R`f(x) = 2(x - 2)^2 - 3`, note: 'Forma canónica. Imagen: [−3; +∞).' },
        ],
      },
      { type: 'check', generatorId: 'quadf.vertex', level: 1 },
      { type: 'check', generatorId: 'quadf.features', level: 1 },
      { type: 'summary', points: ['Vértice en x = −b/(2a).', 'a > 0: abre hacia arriba (mínimo).'] },
    ],
  },
  {
    skillId: 'fn.poly-rational',
    intro: 'Las funciones **polinómicas** son continuas y suaves; las **racionales** (cocientes de polinomios) pueden tener **asíntotas**; las **irracionales** incluyen raíces.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['(a*x + 1)/(x - c)'], params: { a: 2, c: 1 } },
        caption: R`La gráfica se acerca a la recta vertical $x = c$ sin tocarla (asíntota vertical) y a $y = a$ cuando $x$ crece (asíntota horizontal).`,
      },
      {
        type: 'text',
        title: 'Asíntotas de funciones racionales',
        body: R`- **Vertical**: en los $x$ que anulan el denominador (y no el numerador).
- **Horizontal** (al comparar grados): si el numerador tiene menor grado, $y = 0$; si tienen igual grado, $y = \frac{\text{coef. principal num.}}{\text{coef. principal den.}}$; si el numerador tiene mayor grado, no hay horizontal.`,
      },
      {
        type: 'example',
        title: 'Raíces de un polinomio',
        problem: R`$P(x) = x^3 - 4x$`,
        steps: [
          { math: R`P(x) = x(x^2 - 4) = x(x - 2)(x + 2)` },
          { math: R`x \in \{-2,\ 0,\ 2\}` },
        ],
      },
      { type: 'check', generatorId: 'rat.asymptotes', level: 1 },
      { type: 'check', generatorId: 'poly.roots', level: 1 },
      { type: 'summary', points: ['AV: donde se anula el denominador.', 'AH: comparar grados.'] },
    ],
  },
  {
    skillId: 'fn.exp-log',
    intro: 'La función **exponencial** $f(x) = a^x$ modela crecimientos y decrecimientos rápidos; su inversa es el **logaritmo**: $\\log_a b = c \\iff a^c = b$.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['a^x', 'log(x)/log(a)'], params: { a: 2 } },
        caption: R`La exponencial y el logaritmo de la misma base son simétricas respecto de la recta $y = x$. Si $0 < a < 1$, la exponencial decrece.`,
      },
      {
        type: 'text',
        title: 'Propiedades de los logaritmos',
        body: R`- $\log(x\cdot y) = \log x + \log y$
- $\log\frac{x}{y} = \log x - \log y$
- $\log x^n = n\log x$
- $\log_a a = 1$ y $\log_a 1 = 0$`,
      },
      {
        type: 'example',
        title: 'Ecuación exponencial',
        problem: R`$2^{x+1} = 16$`,
        steps: [
          { math: R`2^{x+1} = 2^4`, note: 'Escribimos ambos miembros con la misma base.' },
          { math: R`x + 1 = 4 \Rightarrow x = 3` },
        ],
      },
      { type: 'tip', body: R`$\log(x + y) \neq \log x + \log y$: la propiedad es para el **producto**.` },
      { type: 'check', generatorId: 'log.eval', level: 1 },
      { type: 'check', generatorId: 'exp.equation', level: 1 },
      { type: 'summary', points: ['log_a b es el exponente al que hay que elevar a para obtener b.', 'Misma base ⇒ igualar exponentes.'] },
    ],
  },
];
