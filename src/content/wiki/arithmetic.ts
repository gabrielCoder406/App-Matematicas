import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_ARITHMETIC: WikiEntryDef[] = [
  {
    id: 'arith.number-sets',
    keywords: ['conjuntos numéricos', 'naturales', 'enteros', 'racionales', 'irracionales', 'reales', 'recta numérica', 'decimal periódico', 'periódico', 'número pi', 'número e', 'fracción generatriz'],
    summary: R`Los números se organizan en conjuntos que se amplían unos a otros: $\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}$.`,
    tables: [
      {
        title: 'Los conjuntos numéricos',
        headers: ['Conjunto', 'Qué incluye', 'Ejemplos'],
        rows: [
          [R`Naturales $\mathbb{N}$`, 'Los números para contar.', '1, 2, 3, …'],
          [R`Enteros $\mathbb{Z}$`, 'Los naturales, el 0 y los negativos.', '−5, 0, 7'],
          [R`Racionales $\mathbb{Q}$`, R`Cocientes $\frac{a}{b}$ de enteros con $b \neq 0$: decimal finito o periódico.`, R`$\frac34$, $-0{,}5$, $0{,}\overline{3}$`],
          [R`Irracionales $\mathbb{I}$`, 'Decimales infinitos no periódicos.', R`$\sqrt2$, $\pi$, $e$`],
          [R`Reales $\mathbb{R}$`, 'Racionales e irracionales juntos: llenan la recta.', 'Todos los anteriores'],
        ],
      },
    ],
    formulas: [
      { name: 'Inclusiones', tex: R`\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R},\quad \mathbb{R} = \mathbb{Q} \cup \mathbb{I}` },
      { name: 'Decimal finito a fracción', tex: R`0{,}375 = \frac{375}{1000} = \frac38` },
      { name: 'Periódico puro', tex: R`0{,}\overline{36} = \frac{36}{99} = \frac{4}{11}`, note: 'Tantos 9 como cifras tiene el período.' },
      { name: 'Periódico mixto', tex: R`0{,}1\overline{6} = \frac{16 - 1}{90} = \frac16`, note: 'Un 9 por cifra del período y un 0 por cada cifra no periódica.' },
    ],
    example: {
      title: 'Clasificar',
      problem: 'Antes de clasificar, simplifica el número.',
      steps: [
        { math: R`\sqrt9 = 3 \in \mathbb{N}` },
        { math: R`-\frac{12}{4} = -3 \in \mathbb{Z}` },
        { math: R`0{,}25 = \frac14 \in \mathbb{Q}` },
        { math: R`\sqrt2 = 1{,}41421\ldots \in \mathbb{I}`, note: 'Su decimal no termina ni se repite.' },
      ],
    },
    mistakes: [
      { wrong: R`$0{,}\overline{3}$ es irracional porque tiene infinitos decimales.`, right: R`Es racional: $0{,}\overline{3} = \frac13$.`, note: 'Los periódicos son racionales.' },
      { wrong: R`$\sqrt9$ es irracional.`, right: R`$\sqrt9 = 3 \in \mathbb{N}$.` },
      { wrong: R`$\pi = 3{,}14$`, right: R`$\pi \approx 3{,}14$`, note: '3,14 es solo una aproximación: π es irracional.' },
    ],
    remember: ['Todo natural es entero, todo entero es racional y todo racional es real (no al revés).'],
  },
  {
    id: 'arith.signs',
    keywords: ['regla de los signos', 'signos', 'números negativos', 'enteros', 'orden de las operaciones', 'jerarquía de operaciones', 'paréntesis', 'valor absoluto', 'opuesto', 'supresión de paréntesis', 'operaciones combinadas'],
    summary: R`Para operar con números negativos hay que aplicar la **regla de los signos** y respetar el **orden de las operaciones**.`,
    tables: [
      {
        title: 'Regla de los signos (multiplicación y división)',
        sheet: true,
        headers: ['Signos', 'Resultado', 'Ejemplo'],
        rows: [
          [R`$(+)\cdot(+)$`, R`$+$`, R`$3\cdot 4 = 12$`],
          [R`$(-)\cdot(-)$`, R`$+$`, R`$(-3)\cdot(-4) = 12$`],
          [R`$(+)\cdot(-)$`, R`$-$`, R`$3\cdot(-4) = -12$`],
          [R`$(-)\cdot(+)$`, R`$-$`, R`$(-12) : 4 = -3$`],
        ],
      },
    ],
    formulas: [
      { name: 'Restar es sumar el opuesto', tex: R`a - (-b) = a + b` },
      { name: 'Menos delante de un paréntesis', tex: R`-(a - b + c) = -a + b - c`, note: 'Cambian los signos de **todos** los términos.' },
      { name: 'Propiedad distributiva', tex: R`a\cdot(b + c) = a\cdot b + a\cdot c` },
      { name: 'Valor absoluto', tex: R`|a| = \begin{cases} a & \text{si } a \ge 0 \\ -a & \text{si } a < 0 \end{cases}` },
    ],
    steps: {
      title: 'Orden de las operaciones',
      items: [
        'Paréntesis (de adentro hacia afuera).',
        'Potencias y raíces.',
        'Multiplicaciones y divisiones, de izquierda a derecha.',
        'Sumas y restas, de izquierda a derecha.',
      ],
    },
    terms: [
      { term: 'Valor absoluto', def: R`Distancia de un número al 0: $|-5| = |5| = 5$.` },
      { term: 'Opuesto', def: R`El número con el signo cambiado: el opuesto de $7$ es $-7$.` },
    ],
    example: {
      problem: R`Calcula $5 - 2\cdot(-3)^2 + 12 : (-4)$.`,
      steps: [
        { math: R`(-3)^2 = 9`, note: 'Primero la potencia.' },
        { math: R`2\cdot 9 = 18,\quad 12 : (-4) = -3`, note: 'Después multiplicaciones y divisiones.' },
        { math: R`5 - 18 - 3 = -16`, note: 'Por último, sumas y restas.' },
      ],
    },
    mistakes: [
      { wrong: R`$-3^2 = 9$`, right: R`$-3^2 = -9$`, note: R`El exponente afecta solo al 3; en cambio $(-3)^2 = 9$.` },
      { wrong: R`$2 + 3\cdot 4 = 20$`, right: R`$2 + 3\cdot 4 = 14$`, note: 'La multiplicación va antes que la suma.' },
      { wrong: R`$-(4 - 7) = -4 - 7$`, right: R`$-(4 - 7) = -4 + 7$` },
      { wrong: R`$-7 + 4 = -11$`, right: R`$-7 + 4 = -3$`, note: 'Signos distintos: se restan y queda el signo del mayor en valor absoluto.' },
    ],
    remember: ['En × y ÷: signos iguales dan +, distintos dan −.', 'En + y −: mismo signo, se suman; distinto signo, se restan.'],
  },
  {
    id: 'arith.fractions',
    keywords: ['fracciones', 'fracción', 'numerador', 'denominador', 'simplificar', 'MCD', 'mcm', 'denominador común', 'fracciones equivalentes', 'irreducible', 'inversa', 'recíproco', 'suma de fracciones', 'división de fracciones'],
    summary: R`La fracción $\frac{a}{b}$ representa $a$ partes de un entero dividido en $b$ partes iguales ($b \neq 0$).`,
    formulas: [
      { name: 'Suma y resta', tex: R`\frac{a}{b} \pm \frac{c}{d} = \frac{a\cdot d \pm b\cdot c}{b\cdot d}`, note: 'O con el mcm de los denominadores como denominador común.' },
      { name: 'Igual denominador', tex: R`\frac{a}{b} + \frac{c}{b} = \frac{a + c}{b}` },
      { name: 'Multiplicación', tex: R`\frac{a}{b}\cdot\frac{c}{d} = \frac{a\cdot c}{b\cdot d}` },
      { name: 'División', tex: R`\frac{a}{b} : \frac{c}{d} = \frac{a}{b}\cdot\frac{d}{c} = \frac{a\cdot d}{b\cdot c}`, note: 'Multiplicar por la inversa.' },
      { name: 'Fracciones equivalentes', tex: R`\frac{a}{b} = \frac{a\cdot k}{b\cdot k}\quad (k \neq 0)` },
      { name: 'Fracción de un número', tex: R`\frac{a}{b} \text{ de } N = \frac{a\cdot N}{b}` },
    ],
    terms: [
      { term: 'Fracción irreducible', def: 'El numerador y el denominador no tienen divisores comunes (salvo 1).' },
      { term: 'MCD', def: R`Máximo común divisor: sirve para **simplificar**. $\text{MCD}(12, 18) = 6 \Rightarrow \frac{12}{18} = \frac23$.` },
      { term: 'mcm', def: R`Mínimo común múltiplo: sirve para el **denominador común**. $\text{mcm}(4, 6) = 12$.` },
      { term: 'Inversa', def: R`La inversa (o recíproca) de $\frac{a}{b}$ es $\frac{b}{a}$.` },
    ],
    steps: {
      title: 'Sumar o restar fracciones',
      items: [
        'Busca el mcm de los denominadores.',
        'Amplía cada fracción para que tenga ese denominador.',
        'Suma o resta los numeradores y conserva el denominador.',
        'Simplifica el resultado.',
      ],
    },
    example: {
      problem: R`$\frac56 - \frac34\cdot\frac29$`,
      steps: [
        { math: R`\frac34\cdot\frac29 = \frac{6}{36} = \frac16`, note: 'Primero la multiplicación.' },
        { math: R`\frac56 - \frac16 = \frac46 = \frac23` },
      ],
    },
    mistakes: [
      { wrong: R`$\frac12 + \frac13 = \frac25$`, right: R`$\frac12 + \frac13 = \frac{3 + 2}{6} = \frac56$`, note: 'Nunca se suman los denominadores.' },
      { wrong: R`$\frac23 : \frac45 = \frac{8}{15}$`, right: R`$\frac23 : \frac45 = \frac23\cdot\frac54 = \frac56$` },
      { wrong: R`$\frac{1}{a + b} = \frac1a + \frac1b$`, right: R`$\frac{1}{a + b}$ no se separa (sí vale $\frac{a + b}{c} = \frac{a}{c} + \frac{b}{c}$).` },
    ],
    remember: ['Para dividir: se da vuelta la segunda fracción y se multiplica.', 'Simplifica siempre el resultado final.'],
  },
  {
    id: 'arith.decimals-percent',
    keywords: ['porcentajes', 'porcentaje', 'tanto por ciento', 'decimales', 'aumento', 'descuento', 'IVA', 'variación porcentual', 'recargo', 'rebaja', 'interés simple'],
    summary: R`El $p\%$ es la fracción $\frac{p}{100}$. Los aumentos y descuentos se calculan multiplicando por un **factor**.`,
    formulas: [
      { name: 'El p % de N', tex: R`\frac{p}{100}\cdot N` },
      { name: 'Aumento del p %', tex: R`N\cdot\left(1 + \frac{p}{100}\right)`, note: R`Aumento del 21%: multiplicar por $1{,}21$.` },
      { name: 'Descuento del p %', tex: R`N\cdot\left(1 - \frac{p}{100}\right)`, note: R`Descuento del 15%: multiplicar por $0{,}85$.` },
      { name: 'Qué porcentaje es a de b', tex: R`\frac{a}{b}\cdot 100` },
      { name: 'Variación porcentual', tex: R`\frac{\text{final} - \text{inicial}}{\text{inicial}}\cdot 100` },
      { name: 'Valor antes de un aumento', tex: R`N_0 = \frac{N}{1 + \frac{p}{100}}`, note: R`Precio sin IVA (21%): $\frac{\text{precio}}{1{,}21}$.` },
    ],
    tables: [
      {
        title: 'Equivalencias útiles',
        headers: ['Porcentaje', 'Fracción', 'Decimal'],
        rows: [
          ['50 %', R`$\frac12$`, R`$0{,}5$`],
          ['25 %', R`$\frac14$`, R`$0{,}25$`],
          ['75 %', R`$\frac34$`, R`$0{,}75$`],
          ['20 %', R`$\frac15$`, R`$0{,}2$`],
          ['10 %', R`$\frac{1}{10}$`, R`$0{,}1$`],
          ['12,5 %', R`$\frac18$`, R`$0{,}125$`],
        ],
      },
    ],
    example: {
      problem: 'Una campera de \\$2400 tiene un 25 % de descuento. Después, el precio rebajado sube un 10 %. ¿Cuánto cuesta?',
      steps: [
        { math: R`2400\cdot 0{,}75 = 1800`, note: 'Descuento del 25%: factor 0,75.' },
        { math: R`1800\cdot 1{,}10 = 1980`, note: 'Aumento del 10%: factor 1,10.' },
        { math: R`0{,}75\cdot 1{,}10 = 0{,}825`, note: 'En total bajó un 17,5% (no un 15%).' },
      ],
    },
    mistakes: [
      { wrong: 'Dos descuentos del 10 % equivalen a uno del 20 %.', right: R`$0{,}9\cdot 0{,}9 = 0{,}81$: equivalen a un 19 %.` },
      { wrong: 'Si sube un 20 % y luego baja un 20 %, vuelve al valor original.', right: R`$1{,}2\cdot 0{,}8 = 0{,}96$: queda un 4 % por debajo.` },
      { wrong: 'Precio sin IVA = precio − 21 % del precio.', right: R`Precio sin IVA $= \frac{\text{precio}}{1{,}21}$.` },
    ],
    remember: [R`Aumentar un $p\%$ es multiplicar por $1 + \frac{p}{100}$; descontar, por $1 - \frac{p}{100}$.`],
    seeAlso: ['arith.proportion'],
  },
  {
    id: 'arith.proportion',
    keywords: ['regla de tres', 'regla de tres simple', 'regla de tres compuesta', 'proporcionalidad', 'proporcionalidad directa', 'proporcionalidad inversa', 'razón', 'proporción', 'constante de proporcionalidad', 'magnitudes', 'escala'],
    summary: R`Dos magnitudes son **directamente** proporcionales si su **cociente** es constante, e **inversamente** proporcionales si su **producto** es constante.`,
    formulas: [
      { name: 'Directa', tex: R`\frac{a}{b} = \frac{c}{x} \Rightarrow x = \frac{b\cdot c}{a}`, note: R`$a$ corresponde a $b$ y $c$ corresponde a $x$.` },
      { name: 'Inversa', tex: R`a\cdot b = c\cdot x \Rightarrow x = \frac{a\cdot b}{c}` },
      { name: 'Propiedad fundamental', tex: R`\frac{a}{b} = \frac{c}{d} \iff a\cdot d = b\cdot c` },
      { name: 'Regla de tres compuesta', tex: R`x = x_0\cdot\frac{\text{nuevo}}{\text{viejo}}\cdots\frac{\text{viejo}}{\text{nuevo}}`, note: R`Por cada magnitud: $\frac{\text{nuevo}}{\text{viejo}}$ si es directa respecto de la incógnita y $\frac{\text{viejo}}{\text{nuevo}}$ si es inversa.` },
    ],
    tables: [
      {
        title: 'Directa o inversa',
        headers: ['', 'Directa', 'Inversa'],
        rows: [
          ['Si una se duplica, la otra…', 'se duplica', 'se reduce a la mitad'],
          ['Lo constante es…', 'el cociente', 'el producto'],
          ['Gráfico', 'recta que pasa por el origen', 'hipérbola'],
          ['Ejemplos', 'cantidad y precio; tiempo y distancia a velocidad fija', 'obreros y días; velocidad y tiempo para una distancia fija'],
        ],
      },
    ],
    terms: [
      { term: 'Razón', def: R`Cociente entre dos cantidades: $\frac{a}{b}$.` },
      { term: 'Proporción', def: R`Igualdad entre dos razones: $\frac{a}{b} = \frac{c}{d}$.` },
      { term: 'Escala', def: R`Razón entre una medida en el plano y la real: 1 : 500 significa que 1 cm del plano son 500 cm reales.` },
    ],
    example: {
      title: 'Regla de tres compuesta',
      problem: '4 obreros, trabajando 8 horas por día, terminan una obra en 15 días. ¿Cuánto tardan 6 obreros trabajando 10 horas?',
      steps: [
        { note: 'Más obreros → menos días (inversa). Más horas → menos días (inversa).' },
        { math: R`x = 15\cdot\frac{4}{6}\cdot\frac{8}{10} = 8 \text{ días}` },
      ],
    },
    mistakes: [
      { wrong: 'Más obreros → más días.', right: 'Más obreros → menos días: es inversa.' },
      { wrong: R`Inversa planteada como directa: $\frac{6}{10} = \frac{4}{x}$`, right: R`$6\cdot 10 = 4\cdot x \Rightarrow x = 15$` },
    ],
    remember: ['Pregúntate: «si una se duplica, ¿la otra se duplica o se reduce a la mitad?».'],
    seeAlso: ['arith.decimals-percent', 'geo.thales'],
  },
  {
    id: 'arith.powers',
    keywords: ['potencias', 'potencia', 'exponente', 'base', 'propiedades de las potencias', 'exponente negativo', 'exponente cero', 'potencia de potencia', 'notación científica', 'cuadrado', 'cubo'],
    summary: R`$a^n = a\cdot a\cdots a$ ($n$ factores): $a$ es la **base** y $n$, el **exponente**.`,
    formulas: [
      { name: 'Producto de igual base', tex: R`a^m\cdot a^n = a^{m+n}` },
      { name: 'Cociente de igual base', tex: R`\frac{a^m}{a^n} = a^{m-n}` },
      { name: 'Potencia de potencia', tex: R`(a^m)^n = a^{m\cdot n}` },
      { name: 'Potencia de un producto', tex: R`(a\cdot b)^n = a^n\cdot b^n` },
      { name: 'Potencia de un cociente', tex: R`\left(\frac{a}{b}\right)^n = \frac{a^n}{b^n}` },
      { name: 'Exponente cero', tex: R`a^0 = 1\quad (a \neq 0)` },
      { name: 'Exponente negativo', tex: R`a^{-n} = \frac{1}{a^n},\quad \left(\frac{a}{b}\right)^{-n} = \left(\frac{b}{a}\right)^n` },
      { name: 'Signo de la potencia', tex: R`(-a)^{\text{par}} > 0,\quad (-a)^{\text{impar}} < 0\quad (a > 0)` },
    ],
    terms: [
      { term: 'Notación científica', def: R`Escritura $a\cdot 10^n$ con $1 \le |a| < 10$: $45\,000 = 4{,}5\cdot 10^4$ y $0{,}003 = 3\cdot 10^{-3}$.` },
    ],
    example: {
      problem: R`Simplifica $\frac{3^5\cdot 3^{-2}}{3^4}$ y $\left(\frac23\right)^{-2}$.`,
      steps: [
        { math: R`\frac{3^5\cdot 3^{-2}}{3^4} = 3^{5 - 2 - 4} = 3^{-1} = \frac13` },
        { math: R`\left(\frac23\right)^{-2} = \left(\frac32\right)^2 = \frac94` },
      ],
    },
    mistakes: [
      { wrong: R`$2^3 = 6$`, right: R`$2^3 = 2\cdot 2\cdot 2 = 8$` },
      { wrong: R`$x^2\cdot x^3 = x^6$`, right: R`$x^2\cdot x^3 = x^5$` },
      { wrong: R`$(x^2)^3 = x^5$`, right: R`$(x^2)^3 = x^6$` },
      { wrong: R`$2^{-3} = -8$`, right: R`$2^{-3} = \frac18$` },
      { wrong: R`$(2x)^3 = 2x^3$`, right: R`$(2x)^3 = 8x^3$`, note: 'El exponente afecta a todos los factores.' },
    ],
    remember: ['Misma base: al multiplicar se suman los exponentes, al dividir se restan; potencia de potencia: se multiplican.', 'Exponente negativo = «dar vuelta» la base.'],
    seeAlso: ['arith.roots'],
  },
  {
    id: 'arith.roots',
    keywords: ['raíces', 'raíz', 'radicación', 'radicales', 'raíz cuadrada', 'raíz cúbica', 'índice', 'radicando', 'exponente fraccionario', 'simplificar radicales', 'extraer factores', 'racionalizar', 'conjugado', 'cuadrados perfectos'],
    summary: R`La raíz es la operación inversa de la potencia: $\sqrt[n]{a} = b \iff b^n = a$.`,
    formulas: [
      { name: 'Exponente fraccionario', tex: R`\sqrt[n]{a^m} = a^{m/n}` },
      { name: 'Raíz de un producto', tex: R`\sqrt[n]{a\cdot b} = \sqrt[n]{a}\cdot\sqrt[n]{b}` },
      { name: 'Raíz de un cociente', tex: R`\sqrt[n]{\frac{a}{b}} = \frac{\sqrt[n]{a}}{\sqrt[n]{b}}` },
      { name: 'Raíz de raíz', tex: R`\sqrt[m]{\sqrt[n]{a}} = \sqrt[m\cdot n]{a}` },
      { name: 'Raíz de un cuadrado', tex: R`\sqrt{a^2} = |a|` },
      { name: 'Racionalizar', tex: R`\frac{k}{\sqrt{a}} = \frac{k\sqrt{a}}{a}` },
      { name: 'Racionalizar con el conjugado', tex: R`\frac{k}{\sqrt{a} + \sqrt{b}} = \frac{k\,(\sqrt{a} - \sqrt{b})}{a - b}` },
    ],
    tables: [
      {
        title: 'Cuadrados y cubos perfectos',
        headers: [R`$n$`, R`$n^2$`, R`$n^3$`],
        rows: [
          ['2', '4', '8'], ['3', '9', '27'], ['4', '16', '64'], ['5', '25', '125'], ['6', '36', '216'],
          ['7', '49', '343'], ['8', '64', '512'], ['9', '81', '729'], ['10', '100', '1000'], ['11', '121', '1331'], ['12', '144', '1728'],
        ],
      },
    ],
    terms: [
      { term: 'Índice y radicando', def: R`En $\sqrt[n]{a}$, $n$ es el índice y $a$ el radicando.` },
      { term: 'Radicales semejantes', def: R`Tienen el mismo índice y el mismo radicando; solo esos se suman: $2\sqrt3 + 5\sqrt3 = 7\sqrt3$.` },
      { term: 'Racionalizar', def: 'Transformar una fracción para que no quede una raíz en el denominador.' },
      { term: 'Conjugado', def: R`De $\sqrt{a} + \sqrt{b}$ es $\sqrt{a} - \sqrt{b}$; su producto es $a - b$ (sin raíces).` },
    ],
    steps: {
      title: 'Simplificar un radical',
      items: [
        R`Descompón el radicando buscando el mayor factor que sea potencia del índice: $72 = 36\cdot 2$.`,
        R`Separa la raíz: $\sqrt{36\cdot 2} = \sqrt{36}\cdot\sqrt2$.`,
        R`Extrae: $\sqrt{72} = 6\sqrt2$.`,
      ],
    },
    example: {
      title: 'Racionalizar con el conjugado',
      problem: R`$\frac{2}{\sqrt5 - 1}$`,
      steps: [
        { math: R`\frac{2}{\sqrt5 - 1}\cdot\frac{\sqrt5 + 1}{\sqrt5 + 1} = \frac{2(\sqrt5 + 1)}{5 - 1}` },
        { math: R`= \frac{\sqrt5 + 1}{2}` },
      ],
    },
    mistakes: [
      { wrong: R`$\sqrt{9 + 16} = 3 + 4$`, right: R`$\sqrt{9 + 16} = \sqrt{25} = 5$`, note: 'La raíz no se distribuye en sumas.' },
      { wrong: R`$\sqrt2 + \sqrt3 = \sqrt5$`, right: 'No se pueden sumar: no son semejantes.' },
      { wrong: R`$\sqrt{x^2} = x$`, right: R`$\sqrt{x^2} = |x|$` },
      { wrong: R`$\sqrt{-4} = -2$`, right: R`$\sqrt{-4}$ no es real (en cambio, $\sqrt[3]{-8} = -2$).` },
    ],
    remember: ['La raíz se distribuye en productos y cocientes, nunca en sumas ni restas.'],
    seeAlso: ['arith.powers'],
  },
];
