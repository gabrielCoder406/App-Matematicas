import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_FUNCTIONS: WikiEntryDef[] = [
  {
    id: 'fn.basics',
    keywords: ['función', 'funciones', 'dominio', 'imagen', 'rango', 'codominio', 'variable independiente', 'variable dependiente', 'intersecciones con los ejes', 'ceros', 'raíces', 'ordenada al origen', 'gráfica', 'crecimiento', 'positividad', 'negatividad'],
    summary: R`Una **función** asigna a cada valor $x$ de su dominio **un único** valor $f(x)$.`,
    terms: [
      { term: 'Dominio', def: R`Los valores de $x$ para los que $f(x)$ existe.` },
      { term: 'Imagen', def: R`Los valores que efectivamente toma $f(x)$ (también llamada rango).` },
      { term: 'Codominio', def: R`El conjunto donde la función puede tomar valores (normalmente $\mathbb{R}$).` },
      { term: 'Raíz o cero', def: R`Valor de $x$ con $f(x) = 0$: donde la gráfica corta al eje $x$.` },
      { term: 'Ordenada al origen', def: R`$f(0)$: donde la gráfica corta al eje $y$.` },
      { term: 'Conjuntos de positividad y negatividad', def: R`$C^+$: los $x$ con $f(x) > 0$; $C^-$: los $x$ con $f(x) < 0$.` },
      { term: 'Prueba de la recta vertical', def: 'Una gráfica es de una función si ninguna recta vertical la corta en más de un punto.' },
    ],
    tables: [
      {
        title: 'Condiciones para el dominio',
        headers: ['Si la fórmula tiene…', 'Se exige'],
        rows: [
          [R`un denominador $\frac{P(x)}{Q(x)}$`, R`$Q(x) \neq 0$`],
          [R`una raíz de índice par $\sqrt{g(x)}$`, R`$g(x) \ge 0$`],
          [R`un logaritmo $\log g(x)$`, R`$g(x) > 0$`],
          [R`una raíz par en el denominador $\frac{1}{\sqrt{g(x)}}$`, R`$g(x) > 0$`],
        ],
      },
    ],
    formulas: [
      { name: 'Corte con el eje y', tex: R`(0;\ f(0))` },
      { name: 'Cortes con el eje x', tex: R`f(x) = 0` },
    ],
    example: {
      problem: R`Dominio de $f(x) = \frac{\sqrt{x + 3}}{x - 1}$.`,
      steps: [
        { math: R`x + 3 \ge 0 \Rightarrow x \ge -3`, note: 'Radicando no negativo.' },
        { math: R`x - 1 \neq 0 \Rightarrow x \neq 1`, note: 'Denominador distinto de cero.' },
        { math: R`\operatorname{Dom} f = [-3;\ 1) \cup (1;\ +\infty)` },
      ],
    },
    mistakes: [
      { wrong: R`Dominio de $\sqrt{x - 2}$: $x > 2$`, right: R`$x \ge 2$`, note: 'La raíz de 0 existe.' },
      { wrong: R`Dominio de $\frac{1}{x^2 + 1}$: $x \neq \pm 1$`, right: R`Todos los reales: $x^2 + 1$ nunca es 0.` },
      { wrong: R`Para el corte con el eje $y$, resolver $f(x) = 0$.`, right: R`Eje $y$: calcular $f(0)$. Eje $x$: resolver $f(x) = 0$.` },
    ],
    remember: ['En el eje x, y = 0; en el eje y, x = 0.'],
    seeAlso: ['alg.linear-inequalities'],
  },
  {
    id: 'fn.linear',
    keywords: ['función lineal', 'función afín', 'recta', 'rectas', 'pendiente', 'ordenada al origen', 'ecuación de la recta', 'punto pendiente', 'recta por dos puntos', 'rectas paralelas', 'rectas perpendiculares', 'forma explícita', 'forma general', 'forma segmentaria'],
    summary: R`$f(x) = mx + b$: su gráfica es una **recta** con pendiente $m$ y ordenada al origen $b$.`,
    formulas: [
      { name: 'Pendiente', tex: R`m = \frac{y_2 - y_1}{x_2 - x_1}` },
      { name: 'Punto-pendiente', tex: R`y - y_1 = m\,(x - x_1)` },
      { name: 'Forma explícita', tex: R`y = mx + b` },
      { name: 'Forma general', tex: R`Ax + By + C = 0\quad \Rightarrow\quad m = -\frac{A}{B}` },
      { name: 'Forma segmentaria', tex: R`\frac{x}{p} + \frac{y}{q} = 1`, note: R`Corta a los ejes en $(p;\ 0)$ y $(0;\ q)$.` },
      { name: 'Raíz', tex: R`x = -\frac{b}{m}` },
      { name: 'Paralelas', tex: R`m_1 = m_2` },
      { name: 'Perpendiculares', tex: R`m_1\cdot m_2 = -1\quad \left(m_2 = -\frac{1}{m_1}\right)` },
    ],
    tables: [
      {
        title: 'Qué indica la pendiente',
        headers: ['Pendiente', 'La recta…'],
        rows: [
          [R`$m > 0$`, 'es creciente'],
          [R`$m < 0$`, 'es decreciente'],
          [R`$m = 0$`, R`es horizontal: $y = b$ (función constante)`],
          ['no definida', R`es vertical: $x = k$ (no es función)`],
        ],
      },
    ],
    example: {
      problem: R`Recta perpendicular a $y = 2x + 1$ que pasa por $(4;\ 1)$.`,
      steps: [
        { math: R`m = -\frac12`, note: 'Inversa y opuesta de 2.' },
        { math: R`y - 1 = -\frac12(x - 4)` },
        { math: R`y = -\frac12 x + 3` },
      ],
    },
    mistakes: [
      { wrong: R`$m = \frac{x_2 - x_1}{y_2 - y_1}$`, right: R`$m = \frac{y_2 - y_1}{x_2 - x_1}$` },
      { wrong: R`La perpendicular a una recta con $m = 2$ tiene $m = -2$.`, right: R`Tiene $m = -\frac12$.` },
      { wrong: R`En $y = 3 - 2x$ la pendiente es 3.`, right: R`$m = -2$ (el coeficiente de $x$) y $b = 3$.` },
    ],
    remember: ['La pendiente dice cuánto sube (o baja) y por cada paso de 1 hacia la derecha en x.'],
    seeAlso: ['alg.systems', 'calc.tangent'],
  },
  {
    id: 'fn.quadratic',
    keywords: ['función cuadrática', 'parábola', 'vértice', 'eje de simetría', 'concavidad', 'raíces', 'forma polinómica', 'forma canónica', 'forma factorizada', 'máximo', 'mínimo', 'imagen de la parábola'],
    summary: R`$f(x) = ax^2 + bx + c$ con $a \neq 0$. Su gráfica es una **parábola**.`,
    formulas: [
      { name: 'Vértice', tex: R`x_v = -\frac{b}{2a},\quad y_v = f(x_v)` },
      { name: 'Vértice a partir de las raíces', tex: R`x_v = \frac{x_1 + x_2}{2}` },
      { name: 'Forma polinómica', tex: R`f(x) = ax^2 + bx + c`, note: R`$c$ es la ordenada al origen.` },
      { name: 'Forma canónica', tex: R`f(x) = a(x - x_v)^2 + y_v` },
      { name: 'Forma factorizada', tex: R`f(x) = a(x - x_1)(x - x_2)` },
      { name: 'Eje de simetría', tex: R`x = x_v` },
    ],
    tables: [
      {
        title: 'El signo de a',
        headers: ['', R`$a > 0$`, R`$a < 0$`],
        rows: [
          ['Abre hacia…', 'arriba (∪)', 'abajo (∩)'],
          ['El vértice es…', 'un mínimo', 'un máximo'],
          ['Imagen', R`$[y_v;\ +\infty)$`, R`$(-\infty;\ y_v]$`],
        ],
      },
    ],
    example: {
      problem: R`Analiza $f(x) = -x^2 + 4x + 5$.`,
      steps: [
        { math: R`x_v = -\frac{4}{2\cdot(-1)} = 2,\quad y_v = -4 + 8 + 5 = 9`, note: 'Vértice (2; 9): máximo, porque a < 0.' },
        { math: R`-x^2 + 4x + 5 = 0 \Rightarrow x_1 = 5,\ x_2 = -1`, note: 'Raíces.' },
        { math: R`f(x) = -(x - 2)^2 + 9 = -(x - 5)(x + 1)`, note: 'Canónica y factorizada. Imagen: (−∞; 9].' },
      ],
    },
    mistakes: [
      { wrong: R`$x_v = \frac{b}{2a}$`, right: R`$x_v = -\frac{b}{2a}$` },
      { wrong: R`En $a(x - 3)^2 + 1$ el vértice es $(-3;\ 1)$.`, right: R`Es $(3;\ 1)$: dentro del paréntesis aparece con el signo cambiado.` },
      { wrong: R`Si $a < 0$, el vértice es un mínimo.`, right: 'Es un máximo: la parábola abre hacia abajo.' },
    ],
    remember: [R`En la forma canónica el vértice se lee directo: $a(x - h)^2 + k \Rightarrow V = (h;\ k)$.`],
    seeAlso: ['alg.quadratic', 'calc.optimization'],
  },
  {
    id: 'fn.poly-rational',
    keywords: ['función polinómica', 'función racional', 'función irracional', 'asíntotas', 'asíntota vertical', 'asíntota horizontal', 'asíntota oblicua', 'multiplicidad', 'hipérbola', 'función homográfica', 'comportamiento en el infinito'],
    summary: R`Las **polinómicas** son continuas y suaves; las **racionales** (cocientes de polinomios) pueden tener **asíntotas**; las **irracionales** incluyen raíces.`,
    tables: [
      {
        title: R`Asíntota horizontal de $\frac{P(x)}{Q(x)}$`,
        headers: ['Grados', 'Asíntota horizontal'],
        rows: [
          [R`$\operatorname{gr} P < \operatorname{gr} Q$`, R`$y = 0$`],
          [R`$\operatorname{gr} P = \operatorname{gr} Q$`, R`$y = \frac{\text{coef. principal de } P}{\text{coef. principal de } Q}$`],
          [R`$\operatorname{gr} P > \operatorname{gr} Q$`, 'no hay (si el grado es uno mayor, hay asíntota oblicua)'],
        ],
      },
    ],
    formulas: [
      { name: 'Asíntota vertical', tex: R`x = a \text{ si } Q(a) = 0 \text{ y } P(a) \neq 0` },
      { name: 'Función homográfica', tex: R`f(x) = \frac{ax + b}{cx + d}:\quad \text{AV } x = -\frac{d}{c},\quad \text{AH } y = \frac{a}{c}` },
    ],
    terms: [
      { term: 'Asíntota', def: 'Recta a la que la gráfica se acerca cada vez más.' },
      { term: 'Multiplicidad de una raíz', def: R`Cuántas veces aparece el factor $(x - a)$. Si es par, la gráfica toca el eje y rebota; si es impar, lo atraviesa.` },
    ],
    example: {
      problem: R`Analiza $f(x) = \frac{2x - 4}{x + 1}$.`,
      steps: [
        { math: R`\operatorname{Dom} f = \mathbb{R} - \{-1\},\quad \text{AV: } x = -1` },
        { math: R`\text{AH: } y = \frac{2}{1} = 2`, note: 'Igual grado: cociente de los coeficientes principales.' },
        { math: R`\text{Raíz: } x = 2,\quad f(0) = -4` },
      ],
    },
    mistakes: [
      { wrong: 'Hay asíntota vertical en todo cero del denominador.', right: R`Si también anula el numerador puede ser un «agujero»: $\frac{x^2 - 1}{x - 1}$ no tiene AV en $x = 1$.` },
      { wrong: R`La AH de $\frac{3x^2}{x^2 + 1}$ es $y = 0$.`, right: R`Es $y = 3$ (igual grado).` },
      { wrong: 'La gráfica nunca cruza la asíntota horizontal.', right: 'Puede cruzarla: la AH describe lo que pasa cuando x → ±∞.' },
    ],
    remember: ['AV: donde se anula el denominador. AH: comparar grados.'],
    seeAlso: ['alg.polynomials', 'calc.limits'],
  },
  {
    id: 'fn.exp-log',
    keywords: ['función exponencial', 'exponencial', 'logaritmo', 'logaritmos', 'logaritmo natural', 'ln', 'log', 'propiedades de los logaritmos', 'cambio de base', 'ecuaciones exponenciales', 'ecuaciones logarítmicas', 'crecimiento exponencial', 'interés compuesto', 'número e'],
    summary: R`La **exponencial** $a^x$ modela crecimientos y decrecimientos rápidos; su inversa es el **logaritmo**: $\log_a b = c \iff a^c = b$.`,
    formulas: [
      { name: 'Definición', tex: R`\log_a b = c \iff a^c = b`, note: R`Con $a > 0$, $a \neq 1$ y $b > 0$.` },
      { name: 'Logaritmo de un producto', tex: R`\log_a (x\cdot y) = \log_a x + \log_a y` },
      { name: 'Logaritmo de un cociente', tex: R`\log_a \frac{x}{y} = \log_a x - \log_a y` },
      { name: 'Logaritmo de una potencia', tex: R`\log_a x^n = n\cdot\log_a x` },
      { name: 'Cambio de base', tex: R`\log_a x = \frac{\log x}{\log a} = \frac{\ln x}{\ln a}` },
      { name: 'Valores especiales', tex: R`\log_a 1 = 0,\quad \log_a a = 1,\quad a^{\log_a x} = x` },
      { name: 'Crecimiento exponencial', tex: R`N(t) = N_0\cdot(1 + r)^t`, note: R`$r$: tasa por período (decimal). Interés compuesto: $C = C_0(1 + r)^n$.` },
    ],
    terms: [
      { term: 'Logaritmo decimal', def: R`$\log x = \log_{10} x$.` },
      { term: 'Logaritmo natural', def: R`$\ln x = \log_e x$, con $e \approx 2{,}718$.` },
      { term: 'Función exponencial', def: R`$f(x) = a^x$: crece si $a > 1$ y decrece si $0 < a < 1$; siempre es positiva, pasa por $(0;\ 1)$ y tiene asíntota $y = 0$.` },
      { term: 'Función logarítmica', def: R`$f(x) = \log_a x$: dominio $x > 0$, pasa por $(1;\ 0)$ y tiene asíntota $x = 0$.` },
    ],
    steps: {
      title: 'Ecuaciones exponenciales y logarítmicas',
      items: [
        R`Si se puede, escribe ambos miembros con la misma base e iguala los exponentes: $2^{x+1} = 2^4 \Rightarrow x = 3$.`,
        R`Si no, aplica logaritmos: $a^x = b \Rightarrow x = \frac{\log b}{\log a}$.`,
        R`En las logarítmicas, junta todo en un solo logaritmo y pasa a la forma exponencial.`,
        'Verifica: los argumentos de los logaritmos deben ser positivos.',
      ],
    },
    example: {
      problem: R`$\log_2(x + 1) + \log_2(x - 1) = 3$`,
      steps: [
        { math: R`\log_2\big[(x + 1)(x - 1)\big] = 3`, note: 'Logaritmo de un producto.' },
        { math: R`x^2 - 1 = 2^3 = 8 \Rightarrow x = \pm 3` },
        { math: R`x = 3`, note: 'x = −3 se descarta: haría negativos los argumentos.' },
      ],
    },
    mistakes: [
      { wrong: R`$\log(x + y) = \log x + \log y$`, right: R`$\log(x\cdot y) = \log x + \log y$`, note: 'La propiedad es para el producto.' },
      { wrong: R`$\frac{\log x}{\log y} = \log x - \log y$`, right: R`$\log\frac{x}{y} = \log x - \log y$` },
      { wrong: R`$\log_2 8 = 4$`, right: R`$\log_2 8 = 3$, porque $2^3 = 8$.` },
      { wrong: 'No verificar las soluciones de una ecuación logarítmica.', right: 'Descarta las que anulan o hacen negativo algún argumento.' },
    ],
    remember: ['El logaritmo es un exponente: «¿a qué número elevo la base para obtener b?».'],
    seeAlso: ['arith.powers'],
  },
];
