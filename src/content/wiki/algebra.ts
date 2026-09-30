import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_ALGEBRA: WikiEntryDef[] = [
  {
    id: 'alg.like-terms',
    keywords: ['lenguaje algebraico', 'expresión algebraica', 'términos semejantes', 'coeficiente', 'parte literal', 'monomio', 'reducir', 'traducir enunciados', 'doble', 'triple', 'consecutivo', 'distributiva', 'sacar paréntesis'],
    summary: R`El álgebra usa letras para representar números. Solo se pueden sumar los **términos semejantes** (misma parte literal).`,
    tables: [
      {
        title: 'Del lenguaje coloquial al algebraico',
        headers: ['Enunciado', 'Expresión'],
        rows: [
          ['El doble de un número', R`$2x$`],
          ['La mitad de un número', R`$\frac{x}{2}$`],
          ['El cuadrado de un número', R`$x^2$`],
          ['Un número aumentado en 5', R`$x + 5$`],
          ['El doble de la suma de un número y 3', R`$2(x + 3)$`],
          ['La suma del doble de un número y 3', R`$2x + 3$`],
          ['Dos números consecutivos', R`$x$ y $x + 1$`],
          ['Un número par / impar', R`$2n$ / $2n + 1$`],
          ['El cuadrado de la suma / la suma de los cuadrados', R`$(x + y)^2$ / $x^2 + y^2$`],
        ],
      },
    ],
    formulas: [
      { name: 'Reducir semejantes', tex: R`a\,x^n + b\,x^n = (a + b)\,x^n` },
      { name: 'Distributiva', tex: R`k(a + b) = ka + kb` },
      { name: 'Menos delante de un paréntesis', tex: R`-(a - b) = -a + b` },
    ],
    terms: [
      { term: 'Coeficiente', def: R`El número que multiplica a las letras: en $5x^2y$ es 5.` },
      { term: 'Parte literal', def: R`Las letras con sus exponentes: en $5x^2y$ es $x^2y$.` },
      { term: 'Términos semejantes', def: R`Tienen la misma parte literal: $3x^2$ y $-7x^2$ lo son; $3x^2$ y $3x$ no.` },
      { term: 'Monomio', def: R`Expresión de un solo término, como $-4a^3b$. Su grado es la suma de los exponentes (aquí, 4).` },
    ],
    example: {
      problem: R`Reduce $2(3x - 1) - (x - 4)$.`,
      steps: [
        { math: R`= 6x - 2 - x + 4`, note: 'Distributiva y cambio de signos por el menos.' },
        { math: R`= 5x + 2`, note: 'Se agrupan los semejantes.' },
      ],
    },
    mistakes: [
      { wrong: R`$3x^2 + 5x = 8x^3$`, right: R`$3x^2 + 5x$ no se puede reducir.`, note: 'No son semejantes.' },
      { wrong: R`$2(x + 3) = 2x + 3$`, right: R`$2(x + 3) = 2x + 6$` },
      { wrong: R`$-(x - 3y) = -x - 3y$`, right: R`$-(x - 3y) = -x + 3y$` },
      { wrong: R`$x + x = x^2$`, right: R`$x + x = 2x$ (en cambio, $x\cdot x = x^2$).` },
    ],
    remember: ['Semejantes = mismas letras con los mismos exponentes.'],
  },
  {
    id: 'alg.polynomials',
    keywords: ['polinomios', 'polinomio', 'grado', 'coeficiente principal', 'término independiente', 'valor numérico', 'Ruffini', 'regla de Ruffini', 'teorema del resto', 'división de polinomios', 'raíz de un polinomio', 'Gauss', 'raíces racionales'],
    summary: R`Un **polinomio** es una suma de monomios en una variable, como $P(x) = 3x^3 - 2x + 5$. Su **grado** es el mayor exponente.`,
    formulas: [
      { name: 'Teorema del resto', tex: R`\text{resto de } P(x) : (x - a) = P(a)` },
      { name: 'Factor y raíz', tex: R`P(a) = 0 \iff (x - a) \text{ es factor de } P(x)` },
      { name: 'Algoritmo de la división', tex: R`P(x) = D(x)\cdot Q(x) + R(x)`, note: 'El resto tiene menor grado que el divisor.' },
      { name: 'Grado del producto', tex: R`\operatorname{gr}(P\cdot Q) = \operatorname{gr}(P) + \operatorname{gr}(Q)` },
      { name: 'Raíces racionales posibles (Gauss)', tex: R`\frac{\text{divisores del término independiente}}{\text{divisores del coeficiente principal}}` },
    ],
    terms: [
      { term: 'Grado de un polinomio', def: R`El mayor exponente de la variable: $3x^3 - 2x + 5$ tiene grado 3.` },
      { term: 'Coeficiente principal', def: 'El coeficiente del término de mayor grado.' },
      { term: 'Término independiente', def: R`El término sin $x$ (es $P(0)$).` },
      { term: 'Raíz de un polinomio', def: R`Número $a$ tal que $P(a) = 0$.` },
      { term: 'Valor numérico', def: R`Resultado de reemplazar $x$ por un número: si $P(x) = x^2 - 3x$, $P(-2) = 10$.` },
    ],
    steps: {
      title: 'Regla de Ruffini (dividir por x − a)',
      items: [
        R`Escribe los coeficientes del dividendo completo y ordenado (con 0 en los términos que faltan).`,
        R`Pon $a$ a la izquierda. Ojo: para dividir por $x + 2$ se usa $a = -2$.`,
        'Baja el primer coeficiente. Multiplícalo por a y súmalo al siguiente; repite hasta el final.',
        'El último número es el resto; los anteriores son los coeficientes del cociente (un grado menos).',
      ],
    },
    example: {
      problem: R`$(x^3 - 2x^2 - 5x + 6) : (x - 1)$`,
      steps: [
        { math: R`\begin{array}{c|cccc} & 1 & -2 & -5 & 6 \\ 1 & & 1 & -1 & -6 \\ \hline & 1 & -1 & -6 & 0 \end{array}` },
        { math: R`Q(x) = x^2 - x - 6,\quad R = 0`, note: 'Resto 0: x = 1 es raíz.' },
        { math: R`x^3 - 2x^2 - 5x + 6 = (x - 1)(x - 3)(x + 2)` },
      ],
    },
    mistakes: [
      { wrong: R`En Ruffini con $x^3 - 1$: coeficientes $1,\ -1$.`, right: R`Completa con ceros: $1,\ 0,\ 0,\ -1$.` },
      { wrong: R`Dividir por $x + 2$ usando $a = 2$.`, right: R`$x + 2 = x - (-2)$: se usa $a = -2$.` },
      { wrong: R`Si $P(x) = -x^2$, $P(-2) = 4$.`, right: R`$P(-2) = -(-2)^2 = -4$`, note: 'Usa paréntesis al reemplazar por negativos.' },
    ],
    remember: ['Resto de dividir por (x − a) = P(a).'],
    seeAlso: ['alg.factoring', 'fn.poly-rational'],
  },
  {
    id: 'alg.notable-products',
    keywords: ['productos notables', 'cuadrado de un binomio', 'binomio al cuadrado', 'cubo de un binomio', 'diferencia de cuadrados', 'suma por diferencia', 'trinomio cuadrado perfecto', 'identidades notables', 'suma de cubos', 'diferencia de cubos'],
    summary: R`Productos que conviene saber de memoria porque aparecen todo el tiempo.`,
    formulas: [
      { name: 'Cuadrado de una suma', tex: R`(a + b)^2 = a^2 + 2ab + b^2` },
      { name: 'Cuadrado de una resta', tex: R`(a - b)^2 = a^2 - 2ab + b^2` },
      { name: 'Suma por diferencia', tex: R`(a + b)(a - b) = a^2 - b^2` },
      { name: 'Cubo de una suma', tex: R`(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3` },
      { name: 'Cubo de una resta', tex: R`(a - b)^3 = a^3 - 3a^2b + 3ab^2 - b^3` },
      { name: 'Suma de cubos', tex: R`a^3 + b^3 = (a + b)(a^2 - ab + b^2)` },
      { name: 'Diferencia de cubos', tex: R`a^3 - b^3 = (a - b)(a^2 + ab + b^2)` },
    ],
    example: {
      problem: R`Desarrolla $(2x - 5)^2$, $(x + 4)(x - 4)$ y $(x + 1)^3$.`,
      steps: [
        { math: R`(2x - 5)^2 = (2x)^2 - 2\cdot 2x\cdot 5 + 5^2 = 4x^2 - 20x + 25` },
        { math: R`(x + 4)(x - 4) = x^2 - 16` },
        { math: R`(x + 1)^3 = x^3 + 3x^2 + 3x + 1` },
      ],
    },
    mistakes: [
      { wrong: R`$(x + 3)^2 = x^2 + 9$`, right: R`$(x + 3)^2 = x^2 + 6x + 9$`, note: R`Comprueba con $x = 1$: $(1 + 3)^2 = 16$, pero $1 + 9 = 10$.` },
      { wrong: R`$(a - b)^2 = a^2 - b^2$`, right: R`$(a - b)^2 = a^2 - 2ab + b^2$` },
      { wrong: R`$(2x + 1)^2 = 4x^2 + 2x + 1$`, right: R`$(2x + 1)^2 = 4x^2 + 4x + 1$`, note: R`Doble producto: $2\cdot 2x\cdot 1 = 4x$.` },
    ],
    remember: ['«Cuadrado del primero, más (o menos) el doble del primero por el segundo, más el cuadrado del segundo».'],
    seeAlso: ['alg.factoring'],
  },
  {
    id: 'alg.factoring',
    keywords: ['factoreo', 'factorizar', 'factorización', 'casos de factoreo', 'factor común', 'factor común por grupos', 'diferencia de cuadrados', 'trinomio cuadrado perfecto', 'trinomio de segundo grado', 'simplificar expresiones', 'expresiones racionales'],
    summary: R`**Factorizar** es escribir una expresión como un **producto**. Es el camino inverso de los productos notables y sirve para simplificar y resolver ecuaciones.`,
    formulas: [
      { name: 'Factor común', tex: R`ab + ac = a(b + c)` },
      { name: 'Diferencia de cuadrados', tex: R`a^2 - b^2 = (a + b)(a - b)` },
      { name: 'Trinomio cuadrado perfecto', tex: R`a^2 \pm 2ab + b^2 = (a \pm b)^2` },
      { name: 'Trinomio de segundo grado', tex: R`ax^2 + bx + c = a(x - x_1)(x - x_2)`, note: R`$x_1$ y $x_2$ son las raíces (fórmula resolvente).` },
      { name: 'Suma y producto (a = 1)', tex: R`x^2 + sx + p = (x + m)(x + n)`, note: R`Con $m + n = s$ y $m\cdot n = p$: $x^2 - 5x + 6 = (x - 2)(x - 3)$.` },
    ],
    steps: {
      title: 'Casos, en este orden',
      items: [
        R`**Factor común**: $6x^2 + 9x = 3x(2x + 3)$.`,
        R`**Factor común por grupos**: $x^3 + 2x^2 + 3x + 6 = x^2(x + 2) + 3(x + 2) = (x + 2)(x^2 + 3)$.`,
        R`**Diferencia de cuadrados**: $x^2 - 25 = (x + 5)(x - 5)$.`,
        R`**Trinomio cuadrado perfecto**: $x^2 + 6x + 9 = (x + 3)^2$.`,
        R`**Trinomio de segundo grado**: con sus raíces, $a(x - x_1)(x - x_2)$.`,
        R`**Grado mayor**: buscar raíces (Gauss) y dividir con Ruffini.`,
      ],
    },
    example: {
      problem: R`Factoriza $3x^2 - 12x + 12$ y simplifica $\frac{x^2 - 9}{x^2 + 3x}$.`,
      steps: [
        { math: R`3x^2 - 12x + 12 = 3(x^2 - 4x + 4) = 3(x - 2)^2`, note: 'Factor común y trinomio cuadrado perfecto.' },
        { math: R`\frac{x^2 - 9}{x^2 + 3x} = \frac{(x + 3)(x - 3)}{x(x + 3)} = \frac{x - 3}{x}`, note: R`Se cancela el factor $(x + 3)$ (con $x \neq -3$).` },
      ],
    },
    mistakes: [
      { wrong: R`$x^2 + 9 = (x + 3)(x - 3)$`, right: R`$x^2 + 9$ no se factoriza en los reales; $(x + 3)(x - 3) = x^2 - 9$.` },
      { wrong: R`$\frac{x + 3}{3} = x$`, right: R`Solo se cancelan **factores**: $\frac{3(x + 1)}{3} = x + 1$.` },
      { wrong: R`$x^2 - 5x + 6 = (x + 2)(x + 3)$`, right: R`$x^2 - 5x + 6 = (x - 2)(x - 3)$`, note: 'Deben sumar −5 y multiplicar 6.' },
      { wrong: R`$2x^2 - 8 = (2x + 4)(x - 2)$ (y listo)`, right: R`$2x^2 - 8 = 2(x + 2)(x - 2)$`, note: 'Saca primero el factor común para no dejarla incompleta.' },
    ],
    remember: ['Empieza siempre por el factor común y comprueba desarrollando: tiene que volver a la expresión original.'],
    seeAlso: ['alg.notable-products', 'alg.quadratic', 'calc.limits'],
  },
  {
    id: 'alg.linear-equations',
    keywords: ['ecuaciones lineales', 'ecuación', 'primer grado', 'despejar', 'incógnita', 'pasaje de términos', 'transponer', 'miembros', 'verificar', 'ecuaciones con fracciones', 'ecuaciones con paréntesis', 'infinitas soluciones', 'sin solución'],
    summary: R`Una **ecuación lineal** es una igualdad con una incógnita de grado 1. Resolverla es encontrar el valor que la hace verdadera.`,
    formulas: [
      { name: 'Forma general', tex: R`ax + b = c \Rightarrow x = \frac{c - b}{a}\quad (a \neq 0)` },
      { name: 'Pasaje de términos', tex: R`x + b = c \Rightarrow x = c - b`, note: 'Lo que suma pasa restando (y viceversa).' },
      { name: 'Pasaje de factores', tex: R`a\,x = c \Rightarrow x = \frac{c}{a}`, note: 'Lo que multiplica pasa dividiendo (y viceversa).' },
    ],
    steps: {
      title: 'Cómo resolverla',
      items: [
        'Quita los paréntesis (propiedad distributiva).',
        'Quita los denominadores multiplicando **todos** los términos por el mcm.',
        R`Agrupa los términos con $x$ en un miembro y los números en el otro.`,
        'Reduce y despeja dividiendo por el coeficiente.',
        'Verifica reemplazando en la ecuación original.',
      ],
    },
    tables: [
      {
        title: 'Cantidad de soluciones',
        headers: ['Al final queda…', 'Soluciones'],
        rows: [
          [R`$a\,x = b$ con $a \neq 0$`, R`Una: $x = \frac{b}{a}$`],
          [R`$0\,x = 0$`, 'Infinitas (identidad)'],
          [R`$0\,x = 5$`, 'Ninguna'],
        ],
      },
    ],
    example: {
      problem: R`$\frac{x}{2} - \frac{x - 1}{3} = 2$`,
      steps: [
        { math: R`3x - 2(x - 1) = 12`, note: 'Se multiplica todo por 6 (mcm de 2 y 3).' },
        { math: R`3x - 2x + 2 = 12` },
        { math: R`x = 10`, note: 'Verificación: 10/2 − 9/3 = 5 − 3 = 2 ✓' },
      ],
    },
    mistakes: [
      { wrong: R`$x + 5 = 9 \Rightarrow x = 9 + 5$`, right: R`$x = 9 - 5 = 4$` },
      { wrong: R`$3x = 12 \Rightarrow x = 12 - 3$`, right: R`$x = \frac{12}{3} = 4$` },
      { wrong: R`$-2x = 8 \Rightarrow x = 4$`, right: R`$x = \frac{8}{-2} = -4$`, note: 'El signo del coeficiente pasa con él.' },
      { wrong: R`$\frac{x}{3} = 4 \Rightarrow x = \frac43$`, right: R`$x = 4\cdot 3 = 12$` },
      { wrong: R`$\frac{x}{2} + 1 = 3 \Rightarrow x + 1 = 6$`, right: R`$x + 2 = 6$`, note: 'Al multiplicar por el mcm se multiplican todos los términos.' },
    ],
    remember: ['Lo que haces en un miembro, hazlo en el otro.', 'Verifica siempre reemplazando la solución.'],
  },
  {
    id: 'alg.linear-inequalities',
    keywords: ['inecuaciones', 'inecuación', 'desigualdad', 'desigualdades', 'intervalos', 'intervalo', 'recta numérica', 'conjunto solución', 'cambio de sentido', 'intervalo abierto', 'intervalo cerrado', 'doble desigualdad'],
    summary: R`Una **inecuación** compara dos expresiones con $<$, $>$, $\le$ o $\ge$. Su solución suele ser un **intervalo**.`,
    formulas: [
      { name: 'Cambio de sentido', tex: R`-2x < 6 \Rightarrow x > -3`, note: 'Al multiplicar o dividir por un negativo, la desigualdad se invierte.' },
      { name: 'Doble desigualdad', tex: R`a < x \le b \iff x \in (a;\ b]` },
    ],
    tables: [
      {
        title: 'Intervalos',
        sheet: true,
        headers: ['Desigualdad', 'Intervalo', 'En la recta'],
        rows: [
          [R`$x > a$`, R`$(a;\ +\infty)$`, 'punto vacío en a, hacia la derecha'],
          [R`$x \ge a$`, R`$[a;\ +\infty)$`, 'punto lleno en a, hacia la derecha'],
          [R`$x < a$`, R`$(-\infty;\ a)$`, 'punto vacío en a, hacia la izquierda'],
          [R`$x \le a$`, R`$(-\infty;\ a]$`, 'punto lleno en a, hacia la izquierda'],
          [R`$a < x \le b$`, R`$(a;\ b]$`, 'entre a (vacío) y b (lleno)'],
        ],
      },
    ],
    terms: [
      { term: 'Intervalo abierto', def: R`No incluye los extremos: $(a;\ b)$, desigualdades estrictas ($<$, $>$).` },
      { term: 'Intervalo cerrado', def: R`Incluye los extremos: $[a;\ b]$, desigualdades con igual ($\le$, $\ge$).` },
    ],
    example: {
      problem: R`$-1 < 2x + 3 \le 7$`,
      steps: [
        { math: R`-4 < 2x \le 4`, note: 'Se resta 3 en las tres partes.' },
        { math: R`-2 < x \le 2`, note: 'Se divide por 2 (positivo: no cambia el sentido).' },
        { math: R`x \in (-2;\ 2]` },
      ],
    },
    mistakes: [
      { wrong: R`$-2x < 6 \Rightarrow x < -3$`, right: R`$-2x < 6 \Rightarrow x > -3$` },
      { wrong: R`$x \ge 3 \Rightarrow x \in (3;\ +\infty)$`, right: R`$x \in [3;\ +\infty)$` },
      { wrong: R`$[3;\ +\infty]$`, right: R`$[3;\ +\infty)$`, note: 'En el infinito siempre va paréntesis.' },
    ],
    remember: ['Negativo que multiplica o divide ⇒ la desigualdad se da vuelta.', 'Corchete [ ] incluye el extremo; paréntesis ( ) no.'],
    seeAlso: ['fn.basics'],
  },
  {
    id: 'alg.quadratic',
    keywords: ['ecuación cuadrática', 'cuadráticas', 'segundo grado', 'fórmula resolvente', 'resolvente', 'Bhaskara', 'fórmula general', 'discriminante', 'raíces', 'ecuaciones incompletas', 'suma y producto de raíces', 'Vieta', 'inecuación cuadrática'],
    summary: R`Ecuación de la forma $ax^2 + bx + c = 0$ con $a \neq 0$. Puede tener dos, una o ninguna solución real.`,
    formulas: [
      { name: 'Fórmula resolvente', tex: R`x_{1,2} = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}` },
      { name: 'Discriminante', tex: R`\Delta = b^2 - 4ac` },
      { name: 'Suma de las raíces', tex: R`x_1 + x_2 = -\frac{b}{a}` },
      { name: 'Producto de las raíces', tex: R`x_1\cdot x_2 = \frac{c}{a}` },
      { name: 'Forma factorizada', tex: R`ax^2 + bx + c = a(x - x_1)(x - x_2)` },
    ],
    tables: [
      {
        title: 'Qué dice el discriminante',
        sheet: true,
        headers: ['Discriminante', 'Soluciones', 'La parábola…'],
        rows: [
          [R`$\Delta > 0$`, 'Dos reales distintas', 'corta al eje x en dos puntos'],
          [R`$\Delta = 0$`, 'Una (raíz doble)', 'toca al eje x en el vértice'],
          [R`$\Delta < 0$`, 'Ninguna real', 'no corta al eje x'],
        ],
      },
    ],
    steps: {
      title: 'Cómo resolverla',
      items: [
        R`Pasa todo a un miembro: $ax^2 + bx + c = 0$.`,
        R`Si falta $b$ ($ax^2 + c = 0$): despeja $x^2$ y saca raíz **con ±**.`,
        R`Si falta $c$ ($ax^2 + bx = 0$): factor común, $x(ax + b) = 0 \Rightarrow x = 0$ o $x = -\frac{b}{a}$.`,
        R`Si está completa: calcula $\Delta$ y aplica la fórmula resolvente.`,
        R`Inecuaciones ($ax^2 + bx + c < 0$): halla las raíces y analiza el signo en cada intervalo. Si $a > 0$, la expresión es negativa entre las raíces.`,
      ],
    },
    example: {
      problem: R`$2x^2 - 3x - 2 = 0$`,
      steps: [
        { math: R`\Delta = (-3)^2 - 4\cdot 2\cdot(-2) = 9 + 16 = 25` },
        { math: R`x = \frac{3 \pm 5}{4} \Rightarrow x_1 = 2,\ x_2 = -\frac12` },
        { note: R`Control: $x_1 + x_2 = \frac32 = -\frac{b}{a}$ ✓ y $x_1\cdot x_2 = -1 = \frac{c}{a}$ ✓` },
      ],
    },
    mistakes: [
      { wrong: R`$x^2 = 9 \Rightarrow x = 3$`, right: R`$x^2 = 9 \Rightarrow x = \pm 3$` },
      { wrong: R`$x^2 = 5x \Rightarrow x = 5$ (dividiendo por $x$)`, right: R`$x(x - 5) = 0 \Rightarrow x = 0$ o $x = 5$`, note: 'Dividir por x pierde la solución x = 0.' },
      { wrong: R`Con $b = -3$: $\Delta = -3^2 - 4ac$`, right: R`$\Delta = (-3)^2 - 4ac = 9 - 4ac$` },
      { wrong: R`$x = -b \pm \dfrac{\sqrt{\Delta}}{2a}$`, right: R`$x = \dfrac{-b \pm \sqrt{\Delta}}{2a}$`, note: 'Todo el numerador se divide por 2a.' },
    ],
    remember: ['Calcula primero Δ: te dice cuántas soluciones hay antes de buscarlas.'],
    seeAlso: ['fn.quadratic', 'alg.factoring'],
  },
  {
    id: 'alg.systems',
    keywords: ['sistemas de ecuaciones', 'sistema', 'sistema 2x2', 'sustitución', 'igualación', 'reducción', 'eliminación', 'método gráfico', 'compatible determinado', 'compatible indeterminado', 'incompatible', 'rectas paralelas', 'intersección de rectas'],
    summary: R`Dos ecuaciones con dos incógnitas: se buscan los valores de $x$ e $y$ que cumplen **ambas** a la vez.`,
    terms: [
      { term: 'Sustitución', def: 'Despejar una incógnita en una ecuación y reemplazarla en la otra.' },
      { term: 'Igualación', def: 'Despejar la misma incógnita en las dos ecuaciones e igualar las expresiones.' },
      { term: 'Reducción', def: 'Multiplicar las ecuaciones por números convenientes para que, al sumarlas, se cancele una incógnita.' },
      { term: 'Método gráfico', def: 'Cada ecuación es una recta; la solución es el punto donde se cortan.' },
    ],
    tables: [
      {
        title: 'Clasificación',
        headers: ['Tipo', 'Soluciones', 'Rectas'],
        rows: [
          ['Compatible determinado', 'Una', 'se cortan en un punto'],
          ['Compatible indeterminado', 'Infinitas', 'son la misma recta'],
          ['Incompatible', 'Ninguna', 'son paralelas'],
        ],
      },
    ],
    formulas: [
      { name: 'Sistema general', tex: R`\begin{cases} a\,x + b\,y = c \\ a'x + b'y = c' \end{cases}` },
      { name: 'Compatible determinado', tex: R`\frac{a}{a'} \neq \frac{b}{b'}` },
      { name: 'Compatible indeterminado', tex: R`\frac{a}{a'} = \frac{b}{b'} = \frac{c}{c'}` },
      { name: 'Incompatible', tex: R`\frac{a}{a'} = \frac{b}{b'} \neq \frac{c}{c'}` },
    ],
    example: {
      title: 'Sustitución',
      problem: R`$\begin{cases} y = 2x - 1 \\ 3x + y = 9 \end{cases}$`,
      steps: [
        { math: R`3x + (2x - 1) = 9 \Rightarrow 5x = 10 \Rightarrow x = 2`, note: 'Se reemplaza y en la segunda ecuación.' },
        { math: R`y = 2\cdot 2 - 1 = 3` },
        { note: 'Verificación en la segunda: 3·2 + 3 = 9 ✓. Solución: (2; 3).' },
      ],
    },
    mistakes: [
      { wrong: R`Hallar $x$ y dar el ejercicio por terminado.`, right: R`Hay que hallar también $y$ y verificar en **ambas** ecuaciones.` },
      { wrong: 'Al preparar la reducción, multiplicar un solo término de la ecuación.', right: 'Se multiplican todos los términos de ambos miembros.' },
      { wrong: 'Si no hay solución, me equivoqué en las cuentas.', right: 'Puede ser un sistema incompatible (rectas paralelas).' },
    ],
    remember: ['La solución de un sistema es el punto donde se cortan las dos rectas.'],
    seeAlso: ['la.linear-systems', 'fn.linear'],
  },
];
