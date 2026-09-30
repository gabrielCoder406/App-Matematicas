import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_ARITHMETIC: Lesson[] = [
  {
    skillId: 'arith.number-sets',
    intro: 'Los números se agrupan en conjuntos que se contienen unos a otros: $\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$.',
    sections: [
      {
        type: 'text',
        title: 'Cada conjunto amplía al anterior',
        body: R`- **Naturales** $\mathbb{N} = \{1, 2, 3, \dots\}$: para contar.
- **Enteros** $\mathbb{Z}$: agregan el 0 y los negativos (se puede restar siempre).
- **Racionales** $\mathbb{Q}$: cocientes de enteros $\frac{a}{b}$ con $b \neq 0$ (se puede dividir). Su expresión decimal es finita o periódica.
- **Irracionales**: decimales infinitos no periódicos, como $\sqrt{2}$, $\pi$ o $e$.
- **Reales** $\mathbb{R}$: racionales e irracionales juntos; llenan la recta numérica.`,
      },
      {
        type: 'example',
        title: 'Clasificar',
        problem: 'Antes de clasificar, simplifica el número.',
        steps: [
          { math: R`\sqrt{9} = 3 \in \mathbb{N}` },
          { math: R`-\frac{12}{4} = -3 \in \mathbb{Z}` },
          { math: R`0{,}25 = \frac{1}{4} \in \mathbb{Q}` },
          { math: R`\sqrt{2} = 1{,}41421\ldots \notin \mathbb{Q}`, note: 'Irracional: su decimal no termina ni se repite.' },
        ],
      },
      { type: 'tip', body: R`Un decimal periódico **sí** es racional: $0{,}\overline{3} = \frac{1}{3}$.` },
      { type: 'check', generatorId: 'numsets.classify', level: 1 },
      { type: 'summary', points: [R`$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$.`, 'Racional: decimal finito o periódico. Irracional: infinito no periódico.'] },
    ],
  },
  {
    skillId: 'arith.signs',
    intro: 'Operar con números negativos requiere dos cosas: la **regla de los signos** y el **orden de las operaciones**.',
    sections: [
      {
        type: 'text',
        title: 'Sumas y restas',
        body: R`- Mismo signo: se suman los valores absolutos y se conserva el signo: $-3 - 5 = -8$.
- Distinto signo: se restan y queda el signo del de mayor valor absoluto: $-7 + 4 = -3$.
- Restar es sumar el opuesto: $5 - (-2) = 5 + 2 = 7$.`,
      },
      { type: 'text', title: 'Productos y cocientes', body: R`$(+)\cdot(+) = +$, $(-)\cdot(-) = +$, $(+)\cdot(-) = -$, $(-)\cdot(+) = -$. Lo mismo para la división.` },
      {
        type: 'example',
        title: 'Operación combinada',
        problem: R`Calcula $-3 + 4\cdot(-2) - (-6) : 3$.`,
        steps: [
          { math: R`4\cdot(-2) = -8 \quad\text{y}\quad (-6):3 = -2`, note: 'Primero multiplicaciones y divisiones.' },
          { math: R`-3 + (-8) - (-2)` },
          { math: R`-3 - 8 + 2 = -9`, note: 'Después sumas y restas, de izquierda a derecha.' },
        ],
      },
      { type: 'tip', title: 'Error frecuente', body: R`$-3^2 = -9$ porque el exponente solo afecta al 3; en cambio $(-3)^2 = 9$. Y $-(4 - 7) = -4 + 7$: el menos cambia **todos** los signos del paréntesis.` },
      { type: 'check', generatorId: 'signs.compute', level: 1 },
      { type: 'check', generatorId: 'signs.compute', level: 2 },
      { type: 'summary', points: ['Signos iguales → +; distintos → −.', 'Orden: paréntesis, potencias, × y :, + y −.'] },
    ],
  },
  {
    skillId: 'arith.fractions',
    intro: 'Una fracción $\\frac{a}{b}$ representa $a$ partes de un entero dividido en $b$ partes iguales.',
    sections: [
      {
        type: 'widget',
        widget: 'fraction-bars',
        props: { a: [1, 2], b: [1, 3] },
        caption: 'Cambia numeradores y denominadores: compara las fracciones y mira cómo el denominador común permite sumarlas.',
      },
      {
        type: 'text',
        title: 'Operaciones',
        body: R`- **Simplificar**: dividir numerador y denominador por su MCD: $\frac{12}{18} = \frac{2}{3}$.
- **Sumar/restar**: con denominador común: $\frac{a}{b} + \frac{c}{d} = \frac{ad + cb}{bd}$.
- **Multiplicar**: $\frac{a}{b}\cdot\frac{c}{d} = \frac{ac}{bd}$.
- **Dividir**: multiplicar por la inversa: $\frac{a}{b} : \frac{c}{d} = \frac{a}{b}\cdot\frac{d}{c}$.`,
      },
      {
        type: 'example',
        title: 'Suma con denominador común',
        problem: R`$\frac{2}{3} + \frac{1}{4}$`,
        steps: [
          { math: R`\text{mcm}(3, 4) = 12` },
          { math: R`\frac{2}{3} + \frac{1}{4} = \frac{8}{12} + \frac{3}{12}`, note: 'Se amplía cada fracción.' },
          { math: R`= \frac{11}{12}` },
        ],
      },
      { type: 'tip', title: 'Error frecuente', body: R`**Nunca** se suman los denominadores: $\frac{1}{2} + \frac{1}{3} \neq \frac{2}{5}$. Media pizza más un tercio no puede ser menos que media pizza.` },
      { type: 'check', generatorId: 'frac.ops', level: 1 },
      { type: 'check', generatorId: 'frac.simplify', level: 1 },
      { type: 'summary', points: ['Sumar: denominador común. Multiplicar: directo.', 'Dividir: por la inversa.', 'Simplifica siempre el resultado.'] },
    ],
  },
  {
    skillId: 'arith.decimals-percent',
    intro: 'Los porcentajes son fracciones con denominador 100: el $p\\%$ es $\\frac{p}{100}$.',
    sections: [
      {
        type: 'text',
        title: 'Porcentajes',
        body: R`- El $p\%$ de $N$: $\frac{p}{100}\cdot N$. Ej.: el 15% de 80 es $0{,}15\cdot 80 = 12$.
- Aumento del $p\%$: multiplicar por $1 + \frac{p}{100}$. Descuento: por $1 - \frac{p}{100}$.
- Qué porcentaje es $a$ de $b$: $\frac{a}{b}\cdot 100$.`,
      },
      {
        type: 'example',
        title: 'Descuento',
        problem: 'Una campera cuesta \\$2400 y tiene un 25% de descuento.',
        steps: [
          { math: R`2400\cdot(1 - 0{,}25) = 2400\cdot 0{,}75 = 1800` },
        ],
      },
      {
        type: 'text',
        title: 'Decimales y fracciones',
        body: R`Un decimal finito es una fracción decimal: $0{,}375 = \frac{375}{1000} = \frac{3}{8}$. Un periódico puro: $0{,}\overline{3} = \frac{3}{9} = \frac13$.`,
      },
      { type: 'tip', body: 'Dos descuentos sucesivos del 10% **no** equivalen a uno del 20%: $0{,}9 \\cdot 0{,}9 = 0{,}81$, es decir, un 19%.' },
      { type: 'check', generatorId: 'pct.of', level: 1 },
      { type: 'check', generatorId: 'pct.change', level: 1 },
      { type: 'summary', points: [R`$p\%$ de $N$ = $\frac{p}{100}N$.`, 'Aumentos y descuentos: multiplicar por un factor.'] },
    ],
  },
  {
    skillId: 'arith.proportion',
    intro: 'Dos magnitudes son **proporcionales** cuando al multiplicar una por un número, la otra queda multiplicada (directa) o dividida (inversa) por ese mismo número.',
    sections: [
      {
        type: 'text',
        title: 'Directa e inversa',
        body: R`- **Directa** (más → más): el cociente es constante. $\frac{4\text{ cuadernos}}{\$600} = \frac{7}{x} \Rightarrow x = \frac{600\cdot 7}{4} = 1050$.
- **Inversa** (más → menos): el producto es constante. 6 obreros tardan 10 días; 4 obreros: $6\cdot 10 = 4x \Rightarrow x = 15$ días.`,
      },
      {
        type: 'example',
        title: 'Regla de tres compuesta',
        problem: '4 obreros trabajando 8 horas diarias terminan en 15 días. ¿Cuánto tardan 6 obreros trabajando 10 horas?',
        steps: [
          { note: 'Más obreros → menos días (inversa). Más horas → menos días (inversa).' },
          { math: R`4\cdot 8\cdot 15 = 6\cdot 10\cdot x` },
          { math: R`x = \frac{480}{60} = 8\ \text{días}` },
        ],
      },
      { type: 'tip', body: 'Antes de calcular, pregúntate: si una magnitud se duplica, ¿la otra se duplica o se reduce a la mitad? Así eliges directa o inversa.' },
      { type: 'check', generatorId: 'prop.type', level: 1 },
      { type: 'check', generatorId: 'prop.rule3', level: 1 },
      { type: 'summary', points: ['Directa: cociente constante.', 'Inversa: producto constante.'] },
    ],
  },
  {
    skillId: 'arith.powers',
    intro: 'Una potencia $a^n$ es un producto repetido: $a^n = a\\cdot a\\cdots a$ ($n$ veces).',
    sections: [
      {
        type: 'text',
        title: 'Propiedades',
        body: R`- $a^m\cdot a^n = a^{m+n}$ (misma base: se suman los exponentes).
- $\frac{a^m}{a^n} = a^{m-n}$.
- $(a^m)^n = a^{m\cdot n}$.
- $(a\cdot b)^n = a^n\cdot b^n$ y $\left(\frac ab\right)^n = \frac{a^n}{b^n}$.
- $a^0 = 1$ y $a^{-n} = \frac{1}{a^n}$ (con $a \neq 0$).`,
      },
      {
        type: 'example',
        title: 'Simplificar',
        problem: R`$\frac{(2x^3)^2\cdot x}{x^4}$`,
        steps: [
          { math: R`(2x^3)^2 = 4x^6`, note: 'El exponente afecta a cada factor.' },
          { math: R`\frac{4x^6\cdot x}{x^4} = \frac{4x^7}{x^4}` },
          { math: R`= 4x^3` },
        ],
      },
      { type: 'tip', title: 'Errores frecuentes', body: R`$2^3 \neq 2\cdot 3$; $x^2\cdot x^3 = x^5$ (no $x^6$); $2^{-3} = \frac{1}{8}$ (no $-8$); $(a+b)^2 \neq a^2 + b^2$.` },
      { type: 'check', generatorId: 'pow.eval', level: 2 },
      { type: 'check', generatorId: 'pow.props', level: 1 },
      { type: 'summary', points: ['Producto: se suman exponentes. Cociente: se restan.', 'Potencia de potencia: se multiplican.', 'Exponente negativo = inverso.'] },
    ],
  },
  {
    skillId: 'arith.roots',
    intro: 'La raíz es la operación inversa de la potencia: $\\sqrt[n]{a} = b \\iff b^n = a$.',
    sections: [
      {
        type: 'text',
        title: 'Propiedades',
        body: R`- $\sqrt[n]{a^m} = a^{m/n}$: toda raíz es una potencia de exponente fraccionario.
- $\sqrt{a\cdot b} = \sqrt a\cdot\sqrt b$ y $\sqrt{\frac ab} = \frac{\sqrt a}{\sqrt b}$.
- Las raíces de índice par de números negativos no son reales; las de índice impar sí: $\sqrt[3]{-8} = -2$.`,
      },
      {
        type: 'example',
        title: 'Simplificar radicales',
        problem: R`$\sqrt{72}$ y $\sqrt{12} + \sqrt{27}$`,
        steps: [
          { math: R`\sqrt{72} = \sqrt{36\cdot 2} = 6\sqrt{2}`, note: 'Se extrae el mayor cuadrado perfecto.' },
          { math: R`\sqrt{12} + \sqrt{27} = 2\sqrt3 + 3\sqrt3 = 5\sqrt3`, note: 'Solo se suman radicales semejantes.' },
        ],
      },
      {
        type: 'example',
        title: 'Racionalizar',
        problem: R`$\frac{6}{\sqrt3}$`,
        steps: [{ math: R`\frac{6}{\sqrt3}\cdot\frac{\sqrt3}{\sqrt3} = \frac{6\sqrt3}{3} = 2\sqrt3` }],
      },
      { type: 'tip', title: 'Error frecuente', body: R`$\sqrt{9 + 16} = \sqrt{25} = 5$, pero $\sqrt9 + \sqrt{16} = 7$: la raíz **no** se distribuye sobre la suma.` },
      { type: 'check', generatorId: 'roots.eval', level: 1 },
      { type: 'check', generatorId: 'roots.simplify', level: 1 },
      { type: 'summary', points: [R`$\sqrt[n]{a^m} = a^{m/n}$.`, 'La raíz se distribuye en productos, no en sumas.', 'Racionalizar: multiplicar por la raíz (o el conjugado).'] },
    ],
  },
];
