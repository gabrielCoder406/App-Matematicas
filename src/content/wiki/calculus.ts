import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_CALCULUS: WikiEntryDef[] = [
  {
    id: 'calc.limits',
    keywords: ['límites', 'límite', 'continuidad', 'indeterminación', 'cero sobre cero', 'infinito sobre infinito', 'límites laterales', 'límite en el infinito', 'discontinuidad', 'discontinuidad evitable', 'salto', 'límite notable', 'racionalizar'],
    summary: R`$\lim_{x \to a} f(x) = L$ significa que $f(x)$ se acerca a $L$ cuando $x$ se acerca a $a$, aunque $f(a)$ no exista.`,
    steps: {
      title: 'Cómo calcularlo',
      items: [
        '**Sustituye**. Si da un número, ese es el límite.',
        R`Si da $\frac00$: **factoriza y simplifica**, o racionaliza con el conjugado.`,
        R`Si da $\frac{k}{0}$ con $k \neq 0$: el límite es infinito (mira los límites laterales para el signo).`,
        R`En el infinito, con cocientes de polinomios: **compara los grados** (o divide por la mayor potencia).`,
      ],
    },
    formulas: [
      { name: 'Continuidad en a', tex: R`\lim_{x\to a} f(x) = f(a)`, note: 'Existe f(a), existe el límite y coinciden.' },
      { name: 'Existencia del límite', tex: R`\lim_{x\to a^-} f(x) = \lim_{x\to a^+} f(x)` },
      { name: 'Límite básico en el infinito', tex: R`\lim_{x\to\infty}\frac{k}{x^n} = 0\quad (n > 0)` },
      { name: 'Límite notable', tex: R`\lim_{x\to 0}\frac{\sen x}{x} = 1` },
      { name: 'Número e', tex: R`\lim_{x\to\infty}\left(1 + \frac1x\right)^x = e` },
    ],
    tables: [
      {
        title: R`Límite en el infinito de $\frac{P(x)}{Q(x)}$`,
        headers: ['Grados', 'Límite'],
        rows: [
          [R`$\operatorname{gr} P < \operatorname{gr} Q$`, R`$0$`],
          [R`$\operatorname{gr} P = \operatorname{gr} Q$`, 'cociente de los coeficientes principales'],
          [R`$\operatorname{gr} P > \operatorname{gr} Q$`, R`$\pm\infty$`],
        ],
      },
    ],
    terms: [
      { term: 'Indeterminación', def: R`Resultado que no permite decidir el límite sin transformar la expresión: $\frac00$, $\frac{\infty}{\infty}$, $\infty - \infty$, $0\cdot\infty$, $1^\infty$.` },
      { term: 'Discontinuidad evitable', def: R`El límite existe, pero $f(a)$ no existe o es distinto (un «agujero»).` },
      { term: 'Discontinuidad de salto', def: 'Los límites laterales existen pero son distintos.' },
      { term: 'Discontinuidad esencial', def: 'Algún límite lateral es infinito o no existe (por ejemplo, en una asíntota vertical).' },
    ],
    example: {
      problem: R`$\lim_{x\to 4}\frac{\sqrt{x} - 2}{x - 4}$`,
      steps: [
        { note: R`Sustituyendo da $\frac00$: hay que transformar.` },
        { math: R`\frac{\sqrt{x} - 2}{x - 4} = \frac{\sqrt{x} - 2}{(\sqrt{x} - 2)(\sqrt{x} + 2)} = \frac{1}{\sqrt{x} + 2}`, note: R`$x - 4$ es una diferencia de cuadrados.` },
        { math: R`\lim_{x\to 4}\frac{1}{\sqrt{x} + 2} = \frac14` },
      ],
    },
    mistakes: [
      { wrong: R`$\frac00 = 0$ (o $= 1$)`, right: 'Es una indeterminación: hay que transformar la expresión.' },
      { wrong: R`$\frac50 = 0$`, right: R`Tiende a $\pm\infty$: mira los límites laterales.` },
      { wrong: R`Si $f(a)$ no existe, no hay límite en $a$.`, right: R`El límite puede existir igual: $\frac{x^2 - 4}{x - 2} \to 4$ cuando $x \to 2$.` },
    ],
    remember: ['Primero sustituye; solo si aparece una indeterminación, transforma.'],
    seeAlso: ['alg.factoring', 'fn.poly-rational'],
  },
  {
    id: 'calc.derivatives',
    keywords: ['derivadas', 'derivada', 'derivar', 'reglas de derivación', 'regla de la cadena', 'derivada del producto', 'derivada del cociente', 'tabla de derivadas', 'tasa de cambio', 'pendiente de la tangente', 'velocidad', 'aceleración', 'cociente incremental', 'derivada segunda'],
    summary: R`La **derivada** $f'(a)$ mide la rapidez con que cambia $f$ en $x = a$: es la pendiente de la recta tangente en ese punto.`,
    formulas: [
      { name: 'Definición', tex: R`f'(a) = \lim_{h\to 0}\frac{f(a + h) - f(a)}{h}` },
      { name: 'Suma y resta', tex: R`(f \pm g)' = f' \pm g'` },
      { name: 'Constante por función', tex: R`(k\cdot f)' = k\cdot f'` },
      { name: 'Producto', tex: R`(f\cdot g)' = f'\cdot g + f\cdot g'` },
      { name: 'Cociente', tex: R`\left(\frac{f}{g}\right)' = \frac{f'\cdot g - f\cdot g'}{g^2}` },
      { name: 'Regla de la cadena', tex: R`\big[f(g(x))\big]' = f'(g(x))\cdot g'(x)` },
    ],
    tables: [
      {
        title: 'Derivadas elementales',
        sheet: true,
        headers: [R`$f(x)$`, R`$f'(x)$`],
        rows: [
          [R`$k$ (constante)`, R`$0$`],
          [R`$x^n$`, R`$n\,x^{n-1}$`],
          [R`$\sqrt{x}$`, R`$\frac{1}{2\sqrt{x}}$`],
          [R`$\frac1x$`, R`$-\frac{1}{x^2}$`],
          [R`$e^x$`, R`$e^x$`],
          [R`$a^x$`, R`$a^x\ln a$`],
          [R`$\ln x$`, R`$\frac1x$`],
          [R`$\sen x$`, R`$\cos x$`],
          [R`$\cos x$`, R`$-\sen x$`],
          [R`$\tan x$`, R`$\frac{1}{\cos^2 x}$`],
        ],
      },
    ],
    terms: [
      { term: 'Tasa de cambio instantánea', def: R`Otro nombre de $f'(a)$. Si $s(t)$ es la posición, $s'(t)$ es la velocidad y $s''(t)$ la aceleración.` },
      { term: 'Derivada segunda', def: R`$f''(x)$: la derivada de la derivada. Indica la concavidad.` },
    ],
    example: {
      title: 'Regla de la cadena',
      problem: R`Deriva $f(x) = (3x^2 + 1)^5$.`,
      steps: [
        { math: R`f'(x) = 5(3x^2 + 1)^4\cdot(3x^2 + 1)'`, note: 'Derivada de la potencia por la derivada de lo de adentro.' },
        { math: R`= 5(3x^2 + 1)^4\cdot 6x = 30x(3x^2 + 1)^4` },
      ],
    },
    mistakes: [
      { wrong: R`$(x^3)' = 3x^3$`, right: R`$(x^3)' = 3x^2$` },
      { wrong: R`$(f\cdot g)' = f'\cdot g'$`, right: R`$(f\cdot g)' = f'g + fg'$` },
      { wrong: R`$\big[(2x + 1)^3\big]' = 3(2x + 1)^2$`, right: R`$3(2x + 1)^2\cdot 2 = 6(2x + 1)^2$`, note: 'Falta multiplicar por la derivada de lo de adentro (cadena).' },
      { wrong: R`$(\cos x)' = \sen x$`, right: R`$(\cos x)' = -\sen x$` },
      { wrong: R`$(5)' = 5$`, right: R`La derivada de una constante es $0$.` },
    ],
    remember: ['Derivada de una potencia: «baja el exponente y réstale uno».'],
    seeAlso: ['calc.tangent', 'calc.integrals'],
  },
  {
    id: 'calc.tangent',
    keywords: ['recta tangente', 'tangente', 'recta normal', 'ecuación de la tangente', 'punto de tangencia', 'tangente horizontal', 'derivada en un punto'],
    summary: R`La recta tangente a $f$ en $x = a$ pasa por el punto $(a;\ f(a))$ y tiene pendiente $f'(a)$.`,
    formulas: [
      { name: 'Recta tangente', tex: R`y = f'(a)\,(x - a) + f(a)` },
      { name: 'Recta normal', tex: R`y = -\frac{1}{f'(a)}\,(x - a) + f(a)`, note: R`Perpendicular a la tangente (si $f'(a) \neq 0$).` },
      { name: 'Tangente horizontal', tex: R`f'(a) = 0` },
    ],
    steps: {
      title: 'Cómo hallarla',
      items: [
        R`Calcula $f(a)$: es el punto de tangencia.`,
        R`Deriva y calcula $f'(a)$: es la pendiente.`,
        R`Reemplaza en $y = f'(a)(x - a) + f(a)$.`,
        R`Simplifica a la forma $y = mx + b$.`,
      ],
    },
    example: {
      problem: R`Tangente a $f(x) = \frac{4}{x}$ en $x = 2$.`,
      steps: [
        { math: R`f(2) = 2` },
        { math: R`f'(x) = -\frac{4}{x^2} \Rightarrow f'(2) = -1` },
        { math: R`y = -1\cdot(x - 2) + 2 = -x + 4` },
      ],
    },
    mistakes: [
      { wrong: R`Usar $f'(x)$ (una función) como pendiente.`, right: R`La pendiente es el número $f'(a)$.` },
      { wrong: R`$y = f'(a)(x - a)$`, right: R`$y = f'(a)(x - a) + f(a)$`, note: 'Sin f(a), la recta no pasa por el punto.' },
    ],
    remember: [R`Punto $(a;\ f(a))$ + pendiente $f'(a)$ = recta tangente.`],
    seeAlso: ['fn.linear', 'calc.derivatives'],
  },
  {
    id: 'calc.optimization',
    keywords: ['optimización', 'máximos', 'mínimos', 'máximos y mínimos', 'extremos', 'extremos relativos', 'puntos críticos', 'derivada segunda', 'crecimiento', 'decrecimiento', 'concavidad', 'punto de inflexión', 'problemas de optimización'],
    summary: R`En los máximos y mínimos de una función derivable la tangente es horizontal: $f'(x) = 0$. Así se resuelven los problemas de **optimización**.`,
    formulas: [
      { name: 'Puntos críticos', tex: R`f'(x) = 0` },
      { name: 'Criterio de la derivada segunda', tex: R`f''(c) > 0 \Rightarrow \text{mínimo},\quad f''(c) < 0 \Rightarrow \text{máximo}` },
      { name: 'Crecimiento', tex: R`f' > 0 \Rightarrow f \text{ crece},\quad f' < 0 \Rightarrow f \text{ decrece}` },
      { name: 'Concavidad', tex: R`f'' > 0 \Rightarrow \cup,\quad f'' < 0 \Rightarrow \cap`, note: 'Donde f″ cambia de signo hay un punto de inflexión.' },
    ],
    steps: {
      title: 'Problemas de optimización',
      items: [
        'Identifica la magnitud a optimizar y las variables (haz un dibujo).',
        'Usa el dato (la restricción) para dejarla en función de **una sola** variable.',
        'Deriva e iguala a cero.',
        R`Clasifica con $f''$ (o con el signo de $f'$) y revisa los extremos del dominio.`,
        'Responde lo que se pide, con unidades.',
      ],
    },
    example: {
      problem: 'De una cartulina de 12 cm × 12 cm se cortan cuadrados de lado x en las esquinas para armar una caja sin tapa. ¿Qué x da el volumen máximo?',
      steps: [
        { math: R`V(x) = x(12 - 2x)^2 = 4x^3 - 48x^2 + 144x,\quad 0 < x < 6` },
        { math: R`V'(x) = 12x^2 - 96x + 144 = 12(x - 2)(x - 6) = 0 \Rightarrow x = 2`, note: 'x = 6 queda fuera del dominio (la caja no tendría base).' },
        { math: R`V''(2) = 24\cdot 2 - 96 = -48 < 0`, note: 'Máximo: con x = 2 cm, V = 128 cm³.' },
      ],
    },
    mistakes: [
      { wrong: R`Si $f'(c) = 0$, en $c$ hay un máximo o un mínimo.`, right: R`Puede ser un punto de inflexión: $f(x) = x^3$ en $x = 0$.` },
      { wrong: 'Derivar una expresión con dos variables.', right: 'Primero usa el dato para dejar una sola variable.' },
      { wrong: 'Olvidar el dominio del problema.', right: 'Descarta valores sin sentido (longitudes negativas o nulas).' },
    ],
    remember: ['Máximo: la derivada pasa de + a −. Mínimo: pasa de − a +.'],
    seeAlso: ['fn.quadratic'],
  },
  {
    id: 'calc.integrals',
    keywords: ['integrales', 'integral', 'integral indefinida', 'primitiva', 'antiderivada', 'integrales inmediatas', 'tabla de integrales', 'constante de integración', 'integrar', 'linealidad'],
    summary: R`Integrar es el proceso inverso de derivar: una **primitiva** de $f$ es una función $F$ tal que $F' = f$.`,
    tables: [
      {
        title: 'Integrales inmediatas',
        sheet: true,
        headers: [R`$f(x)$`, R`$\int f(x)\,dx$`],
        rows: [
          [R`$x^n$ ($n \neq -1$)`, R`$\frac{x^{n+1}}{n+1} + C$`],
          [R`$\frac1x$`, R`$\ln|x| + C$`],
          [R`$e^x$`, R`$e^x + C$`],
          [R`$a^x$`, R`$\frac{a^x}{\ln a} + C$`],
          [R`$\cos x$`, R`$\sen x + C$`],
          [R`$\sen x$`, R`$-\cos x + C$`],
          [R`$\frac{1}{\cos^2 x}$`, R`$\tan x + C$`],
        ],
      },
    ],
    formulas: [
      { name: 'Linealidad', tex: R`\int (k\,f + g)\,dx = k\int f\,dx + \int g\,dx` },
      { name: 'Sustitución lineal', tex: R`\int f(ax + b)\,dx = \frac{1}{a}\,F(ax + b) + C` },
    ],
    terms: [
      { term: 'Primitiva', def: R`$F$ es primitiva de $f$ si $F'(x) = f(x)$.` },
      { term: 'Constante de integración', def: R`$C$: todas las funciones $F(x) + C$ tienen la misma derivada, porque la derivada de una constante es 0.` },
    ],
    example: {
      problem: R`$\int\left(3\sqrt{x} - \frac{2}{x^2}\right)dx$`,
      steps: [
        { math: R`= \int\left(3x^{1/2} - 2x^{-2}\right)dx`, note: 'Se escribe todo como potencias.' },
        { math: R`= 3\cdot\frac{x^{3/2}}{3/2} - 2\cdot\frac{x^{-1}}{-1} + C = 2x^{3/2} + \frac{2}{x} + C` },
        { note: R`Comprobación: $(2x^{3/2} + 2x^{-1})' = 3\sqrt{x} - \frac{2}{x^2}$ ✓` },
      ],
    },
    mistakes: [
      { wrong: R`$\int x^2\,dx = 2x + C$`, right: R`$\int x^2\,dx = \frac{x^3}{3} + C$`, note: 'Eso era derivar.' },
      { wrong: R`$\int \frac1x\,dx = \frac{x^0}{0}$`, right: R`$\int \frac1x\,dx = \ln|x| + C$` },
      { wrong: R`$\int f\cdot g\,dx = \int f\,dx\cdot\int g\,dx$`, right: 'No vale: primero desarrolla el producto.' },
      { wrong: R`Olvidar la constante $C$.`, right: R`Toda integral indefinida lleva $+\,C$.` },
    ],
    remember: ['Verifica siempre derivando tu resultado: tiene que dar la función original.'],
    seeAlso: ['calc.derivatives', 'calc.definite'],
  },
  {
    id: 'calc.definite',
    keywords: ['integral definida', 'regla de Barrow', 'Barrow', 'área bajo la curva', 'área entre curvas', 'teorema fundamental del cálculo', 'sumas de Riemann', 'Riemann', 'cálculo de áreas'],
    summary: R`La **integral definida** $\int_a^b f(x)\,dx$ es el área **con signo** entre la curva y el eje $x$, desde $a$ hasta $b$.`,
    formulas: [
      { name: 'Regla de Barrow', tex: R`\int_a^b f(x)\,dx = F(b) - F(a)`, note: R`$F$ es cualquier primitiva de $f$.` },
      { name: 'Aditividad', tex: R`\int_a^b f\,dx + \int_b^c f\,dx = \int_a^c f\,dx` },
      { name: 'Invertir los límites', tex: R`\int_b^a f\,dx = -\int_a^b f\,dx` },
      { name: 'Área entre dos curvas', tex: R`A = \int_a^b \big[f(x) - g(x)\big]\,dx\quad \text{si } f \ge g` },
      { name: 'Área con partes negativas', tex: R`A = \int_a^b |f(x)|\,dx` },
      { name: 'Teorema fundamental del cálculo', tex: R`\left(\int_a^x f(t)\,dt\right)' = f(x)` },
    ],
    steps: {
      title: 'Área entre una curva y el eje x',
      items: [
        R`Busca las raíces de $f$ dentro de $[a;\ b]$.`,
        R`Separa en intervalos donde $f$ no cambia de signo.`,
        'Integra en cada intervalo con Barrow.',
        'Suma los valores absolutos.',
      ],
    },
    example: {
      problem: R`Área entre $f(x) = x^2 - 4$ y el eje $x$, en $[0;\ 3]$.`,
      steps: [
        { note: R`$f$ se anula en $x = 2$: es negativa en $[0;\ 2]$ y positiva en $[2;\ 3]$. Primitiva: $F(x) = \frac{x^3}{3} - 4x$.` },
        { math: R`\int_0^2 f\,dx = \frac83 - 8 = -\frac{16}{3},\quad \int_2^3 f\,dx = -3 - \left(-\frac{16}{3}\right) = \frac73` },
        { math: R`A = \frac{16}{3} + \frac73 = \frac{23}{3} \approx 7{,}67`, note: 'La integral de 0 a 3 da −3: no es el área.' },
      ],
    },
    mistakes: [
      { wrong: 'El área es la integral aunque la función sea negativa.', right: 'Las partes bajo el eje se toman en valor absoluto.' },
      { wrong: R`$\int_a^b f\,dx = F(a) - F(b)$`, right: R`$\int_a^b f\,dx = F(b) - F(a)$` },
      { wrong: 'Área entre curvas: restar «la de abajo menos la de arriba».', right: 'Se resta «la de arriba menos la de abajo».' },
    ],
    remember: ['Barrow: la primitiva evaluada arriba menos la primitiva evaluada abajo.'],
    seeAlso: ['calc.integrals'],
  },
];
