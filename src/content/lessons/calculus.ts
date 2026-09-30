import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_CALCULUS: Lesson[] = [
  {
    skillId: 'calc.limits',
    intro: 'El **límite** describe a qué valor se acerca $f(x)$ cuando $x$ se acerca a un número, aunque la función no esté definida justo ahí.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['(x^2 - 4)/(x - 2)'], points: [{ x: 2, y: 4, open: true }] },
        caption: R`$\frac{x^2 - 4}{x - 2}$ no está definida en $x = 2$ (hay un «agujero»), pero cerca de 2 sus valores se acercan a 4.`,
      },
      {
        type: 'text',
        title: 'Cómo calcularlos',
        body: R`1. **Sustituir**. Si da un número, ese es el límite (funciones continuas).
2. Si da $\frac{0}{0}$ (indeterminación), **factorizar y simplificar**, o racionalizar.
3. En el **infinito**, con cocientes de polinomios, comparar grados.`,
      },
      {
        type: 'example',
        title: 'Indeterminación 0/0',
        problem: R`$\lim_{x \to 2}\frac{x^2 - 4}{x - 2}$`,
        steps: [
          { math: R`\frac{x^2 - 4}{x - 2} = \frac{(x - 2)(x + 2)}{x - 2} = x + 2 \quad (x \neq 2)` },
          { math: R`\lim_{x \to 2}(x + 2) = 4` },
        ],
      },
      { type: 'text', title: 'Continuidad', body: R`$f$ es continua en $a$ si existe $f(a)$, existe el límite y ambos coinciden: $\lim_{x\to a} f(x) = f(a)$. Gráficamente: se dibuja sin levantar el lápiz.` },
      { type: 'check', generatorId: 'lim.subst', level: 1 },
      { type: 'check', generatorId: 'lim.00', level: 2 },
      { type: 'summary', points: ['Primero sustituir.', '0/0: factorizar y simplificar.', 'Continua: límite = valor.'] },
    ],
  },
  {
    skillId: 'calc.derivatives',
    intro: 'La **derivada** $f\'(a)$ mide la rapidez con que cambia $f$ en $x = a$: es la pendiente de la recta tangente a la gráfica en ese punto.',
    sections: [
      {
        type: 'widget',
        widget: 'tangent',
        props: { expr: 'x^2' },
        caption: R`Mueve el punto $a$ y el valor de $h$: la recta secante se convierte en tangente cuando $h \to 0$, y su pendiente tiende a $f'(a)$.`,
      },
      {
        type: 'text',
        title: 'Reglas',
        body: R`- $(k)' = 0$, $(x^n)' = n\,x^{n-1}$ (vale para exponentes negativos y fraccionarios).
- $(f \pm g)' = f' \pm g'$ y $(k\cdot f)' = k\cdot f'$.
- Producto: $(fg)' = f'g + fg'$. Cociente: $\left(\frac fg\right)' = \frac{f'g - fg'}{g^2}$.
- Cadena: $[f(g(x))]' = f'(g(x))\cdot g'(x)$.
- $(e^x)' = e^x$, $(\ln x)' = \frac1x$, $(\operatorname{sen}x)' = \cos x$, $(\cos x)' = -\operatorname{sen}x$.`,
      },
      {
        type: 'example',
        title: 'Derivar',
        problem: R`$f(x) = 3x^4 - \frac{2}{x} + 5$`,
        steps: [
          { math: R`f(x) = 3x^4 - 2x^{-1} + 5` },
          { math: R`f'(x) = 12x^3 + 2x^{-2} = 12x^3 + \frac{2}{x^2}` },
        ],
      },
      { type: 'tip', body: 'Si $s(t)$ es la posición, $s\'(t)$ es la velocidad y $s\'\'(t)$ la aceleración.' },
      { type: 'check', generatorId: 'der.rules', level: 1 },
      { type: 'check', generatorId: 'der.meaning', level: 1 },
      { type: 'summary', points: ["f'(a) = pendiente de la tangente = tasa de cambio instantánea.", '(xⁿ)\' = n·xⁿ⁻¹.'] },
    ],
  },
  {
    skillId: 'calc.tangent',
    intro: 'La recta tangente a $f$ en $x = a$ pasa por $(a;\\ f(a))$ y tiene pendiente $f\'(a)$.',
    sections: [
      { type: 'text', title: 'Ecuación', body: R`$$y = f'(a)\,(x - a) + f(a)$$` },
      {
        type: 'widget',
        widget: 'tangent',
        props: { expr: 'x^3 - 3*x', a: 2, secant: false },
        caption: 'La tangente «toca» la curva en el punto y tiene su misma inclinación. Donde la tangente es horizontal, la derivada vale 0.',
      },
      {
        type: 'example',
        title: 'Tangente a una parábola',
        problem: R`$f(x) = x^2 - 3x$ en $x = 2$.`,
        steps: [
          { math: R`f(2) = 4 - 6 = -2` },
          { math: R`f'(x) = 2x - 3 \Rightarrow f'(2) = 1` },
          { math: R`y = 1\cdot(x - 2) - 2 = x - 4` },
        ],
      },
      { type: 'check', generatorId: 'tan.line', level: 1 },
      { type: 'check', generatorId: 'tan.line', level: 2 },
      { type: 'summary', points: ["Punto: (a; f(a)). Pendiente: f'(a).", "y = f'(a)(x − a) + f(a)."] },
    ],
  },
  {
    skillId: 'calc.optimization',
    intro: 'En los **máximos y mínimos** la tangente es horizontal: la derivada vale 0. Así se resuelven problemas de optimización.',
    sections: [
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['x*(P/2 - x)'], params: { P: 20 }, view: { xmin: -1, xmax: 12, ymin: -5, ymax: 30 }, showVertex: true },
        caption: R`Área de un rectángulo de perímetro $P$ con un lado $x$: $A(x) = x\left(\frac P2 - x\right)$. El máximo está donde la parábola da vuelta.`,
      },
      {
        type: 'text',
        title: 'Método',
        body: R`1. Escribir la magnitud a optimizar en función de **una** variable (usando los datos).
2. Derivar e igualar a cero: $f'(x) = 0$ (puntos críticos).
3. Clasificar: si $f''(x) < 0$ hay máximo; si $f''(x) > 0$, mínimo.
4. Responder lo que se pide (con unidades).`,
      },
      {
        type: 'example',
        title: 'Rectángulo de área máxima',
        problem: 'Con 20 m de alambre, ¿qué rectángulo encierra más área?',
        steps: [
          { math: R`A(x) = x(10 - x) = 10x - x^2` },
          { math: R`A'(x) = 10 - 2x = 0 \Rightarrow x = 5` },
          { math: R`A''(x) = -2 < 0`, note: 'Máximo: un cuadrado de 5 m de lado, con 25 m².' },
        ],
      },
      { type: 'check', generatorId: 'opt.critical', level: 1 },
      { type: 'check', generatorId: 'opt.word', level: 2 },
      { type: 'summary', points: ["Extremos: f'(x) = 0.", "f'' < 0 → máximo; f'' > 0 → mínimo."] },
    ],
  },
  {
    skillId: 'calc.integrals',
    intro: 'Integrar es el proceso inverso de derivar: una **primitiva** de $f$ es una función $F$ tal que $F\' = f$.',
    sections: [
      {
        type: 'text',
        title: 'Integrales inmediatas',
        body: R`- $\int x^n\,dx = \frac{x^{n+1}}{n+1} + C$ (si $n \neq -1$).
- $\int \frac{1}{x}\,dx = \ln|x| + C$.
- $\int e^x\,dx = e^x + C$.
- $\int \cos x\,dx = \operatorname{sen}x + C$ y $\int\operatorname{sen}x\,dx = -\cos x + C$.
- La integral de una suma es la suma de las integrales; las constantes salen afuera.`,
      },
      {
        type: 'example',
        title: 'Integrar un polinomio',
        problem: R`$\int (6x^2 - 4x + 3)\,dx$`,
        steps: [
          { math: R`= 6\cdot\frac{x^3}{3} - 4\cdot\frac{x^2}{2} + 3x + C` },
          { math: R`= 2x^3 - 2x^2 + 3x + C`, note: 'Comprobación: la derivada es 6x² − 4x + 3. ✓' },
        ],
      },
      { type: 'tip', body: 'La constante $C$ aparece porque la derivada de una constante es 0: todas las funciones $F(x) + C$ tienen la misma derivada. Verifica siempre derivando tu resultado.' },
      { type: 'check', generatorId: 'int.basic', level: 1 },
      { type: 'check', generatorId: 'int.basic', level: 2 },
      { type: 'summary', points: ['∫xⁿ dx = xⁿ⁺¹/(n+1) + C.', 'Comprueba derivando.'] },
    ],
  },
  {
    skillId: 'calc.definite',
    intro: 'La **integral definida** $\\int_a^b f(x)\\,dx$ mide el área (con signo) entre la curva y el eje $x$ desde $a$ hasta $b$.',
    sections: [
      {
        type: 'widget',
        widget: 'riemann',
        props: { expr: 'x^2', a: 0, b: 2, n: 6 },
        caption: 'Aproximamos el área con rectángulos. Con más rectángulos, la suma se acerca al valor exacto de la integral.',
      },
      {
        type: 'text',
        title: 'Regla de Barrow',
        body: R`Si $F$ es una primitiva de $f$: $$\int_a^b f(x)\,dx = F(b) - F(a)$$ Donde $f < 0$ la integral es negativa; para calcular **áreas** esas partes se toman en valor absoluto.`,
      },
      {
        type: 'example',
        title: 'Área bajo una parábola',
        problem: R`$\int_0^2 x^2\,dx$`,
        steps: [
          { math: R`F(x) = \frac{x^3}{3}` },
          { math: R`F(2) - F(0) = \frac83 - 0 = \frac83 \approx 2{,}67` },
        ],
      },
      { type: 'check', generatorId: 'def.barrow', level: 1 },
      { type: 'check', generatorId: 'def.area', level: 2 },
      { type: 'summary', points: ['∫ₐᵇ f = F(b) − F(a).', 'Área: partes negativas en valor absoluto.'] },
    ],
  },
];
