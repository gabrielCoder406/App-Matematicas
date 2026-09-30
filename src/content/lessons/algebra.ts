import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_ALGEBRA: Lesson[] = [
  {
    skillId: 'alg.like-terms',
    intro: 'El álgebra usa letras para representar números desconocidos o variables. Así podemos escribir y manipular relaciones generales.',
    sections: [
      {
        type: 'text',
        title: 'Del lenguaje coloquial al algebraico',
        body: R`- «El doble de un número» → $2x$; «la mitad» → $\frac{x}{2}$; «el cuadrado» → $x^2$.
- «Un número aumentado en 5» → $x + 5$; «el consecutivo» → $x + 1$.
- «El doble de la suma de un número y 3» → $2(x + 3)$, que no es lo mismo que $2x + 3$.`,
      },
      {
        type: 'text',
        title: 'Términos semejantes',
        body: R`En $5x^2y$, el **coeficiente** es 5 y la **parte literal** es $x^2y$. Dos términos son **semejantes** si tienen la misma parte literal; solo esos se pueden sumar: $3x^2 + 5x^2 = 8x^2$, pero $3x^2 + 5x$ queda así.`,
      },
      {
        type: 'example',
        title: 'Reducir',
        problem: R`$3x + 5y - 2x + 4 - 7y$`,
        steps: [
          { math: R`(3x - 2x) + (5y - 7y) + 4`, note: 'Agrupamos semejantes.' },
          { math: R`= x - 2y + 4` },
        ],
      },
      { type: 'tip', body: R`Si hay un signo menos delante de un paréntesis, cambia el signo de **todos** los términos al quitarlo: $-(x - 3y) = -x + 3y$.` },
      { type: 'check', generatorId: 'alg.reduce', level: 1 },
      { type: 'check', generatorId: 'alg.translate', level: 1 },
      { type: 'summary', points: ['Solo se suman términos semejantes (misma parte literal).', 'Al traducir, fíjate qué afecta a qué: 2x + 3 ≠ 2(x + 3).'] },
    ],
  },
  {
    skillId: 'alg.polynomials',
    intro: 'Un **polinomio** es una suma de monomios: $P(x) = 3x^3 - 2x + 5$. Su **grado** es el mayor exponente de la variable.',
    sections: [
      {
        type: 'text',
        title: 'Operaciones',
        body: R`- **Valor numérico**: reemplazar $x$ por un número: si $P(x) = x^2 - 3x$, $P(-2) = (-2)^2 - 3(-2) = 10$.
- **Suma y resta**: se reducen términos semejantes (al restar, cambian todos los signos del sustraendo).
- **Producto**: cada término del primero por cada término del segundo.`,
      },
      {
        type: 'example',
        title: 'Producto de polinomios',
        problem: R`$(x - 2)(x^2 + 3x - 1)$`,
        steps: [
          { math: R`x\cdot(x^2 + 3x - 1) - 2\cdot(x^2 + 3x - 1)` },
          { math: R`= x^3 + 3x^2 - x - 2x^2 - 6x + 2` },
          { math: R`= x^3 + x^2 - 7x + 2` },
        ],
      },
      {
        type: 'text',
        title: 'Regla de Ruffini y teorema del resto',
        body: R`Para dividir por $(x - a)$ se usa Ruffini. El **teorema del resto** dice que el resto de esa división es $P(a)$: si $P(a) = 0$, entonces $(x - a)$ es un factor de $P$ y $a$ es una raíz.`,
      },
      { type: 'tip', body: R`Al evaluar con números negativos, usa paréntesis: $-x^2$ con $x = -2$ vale $-(-2)^2 = -4$.` },
      { type: 'check', generatorId: 'poly.eval', level: 1 },
      { type: 'check', generatorId: 'poly.ops', level: 2 },
      { type: 'summary', points: ['Grado = mayor exponente.', 'Producto: todos por todos, luego reducir.', 'Resto de dividir por (x − a) = P(a).'] },
    ],
  },
  {
    skillId: 'alg.notable-products',
    intro: 'Algunos productos aparecen tan seguido que conviene memorizar su resultado: son los **productos notables**.',
    sections: [
      {
        type: 'text',
        title: 'Fórmulas',
        body: R`- $(a + b)^2 = a^2 + 2ab + b^2$
- $(a - b)^2 = a^2 - 2ab + b^2$
- $(a + b)(a - b) = a^2 - b^2$
- $(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$`,
      },
      {
        type: 'example',
        title: 'Aplicarlos',
        problem: R`$(2x - 5)^2$ y $(x + 4)(x - 4)$`,
        steps: [
          { math: R`(2x - 5)^2 = (2x)^2 - 2\cdot 2x\cdot 5 + 5^2 = 4x^2 - 20x + 25` },
          { math: R`(x + 4)(x - 4) = x^2 - 16` },
        ],
      },
      {
        type: 'text',
        title: 'Por qué el doble producto',
        body: R`Un cuadrado de lado $a + b$ se divide en un cuadrado $a^2$, otro $b^2$ y **dos** rectángulos $ab$. Por eso $(a+b)^2$ tiene el término $2ab$.`,
      },
      { type: 'tip', title: 'Error frecuente', body: R`$(x + 3)^2 \neq x^2 + 9$. Comprueba con $x = 1$: $(1+3)^2 = 16$, pero $1 + 9 = 10$.` },
      { type: 'check', generatorId: 'notable.middle', level: 1 },
      { type: 'check', generatorId: 'notable.expand', level: 1 },
      { type: 'summary', points: ['Cuadrado de un binomio: ¡no olvides el doble producto!', 'Suma por diferencia = diferencia de cuadrados.'] },
    ],
  },
  {
    skillId: 'alg.factoring',
    intro: '**Factorizar** es escribir un polinomio como producto. Es el camino inverso de los productos notables y la clave para simplificar y resolver ecuaciones.',
    sections: [
      {
        type: 'text',
        title: 'Casos (en este orden)',
        body: R`1. **Factor común**: $6x^2 + 9x = 3x(2x + 3)$.
2. **Diferencia de cuadrados**: $x^2 - 25 = (x + 5)(x - 5)$.
3. **Trinomio cuadrado perfecto**: $x^2 + 6x + 9 = (x + 3)^2$.
4. **Trinomio de segundo grado**: $ax^2 + bx + c = a(x - x_1)(x - x_2)$, con $x_1, x_2$ sus raíces. Si $a = 1$, busca dos números cuya suma sea $-b$ y cuyo producto sea $c$: $x^2 - 5x + 6 = (x - 2)(x - 3)$.`,
      },
      {
        type: 'example',
        title: 'Combinar casos',
        problem: R`$2x^3 - 8x$`,
        steps: [
          { math: R`2x^3 - 8x = 2x(x^2 - 4)`, note: 'Factor común.' },
          { math: R`= 2x(x + 2)(x - 2)`, note: 'Diferencia de cuadrados.' },
        ],
      },
      { type: 'tip', body: 'Revisa al final que ningún factor se pueda seguir factorizando. Puedes verificar desarrollando: debe volver al polinomio original.' },
      { type: 'check', generatorId: 'factor.common', level: 1 },
      { type: 'check', generatorId: 'factor.trinomial', level: 1 },
      { type: 'summary', points: ['Primero factor común, después los demás casos.', 'Trinomio: a(x − x₁)(x − x₂).'] },
    ],
  },
  {
    skillId: 'alg.linear-equations',
    intro: 'Una **ecuación** es una igualdad con una incógnita. Resolverla es encontrar el valor que la hace verdadera.',
    sections: [
      {
        type: 'widget',
        widget: 'balance',
        props: { a: 3, b: 2, c: 1, d: 8 },
        caption: 'La ecuación es una balanza en equilibrio: quita lo mismo de ambos platos o divide ambos en grupos iguales. Si quitas de un solo lado, se desequilibra.',
      },
      {
        type: 'text',
        title: 'Operaciones permitidas',
        body: R`- Sumar o restar lo mismo en ambos miembros (en la práctica, «pasar» un término cambiando su signo).
- Multiplicar o dividir ambos miembros por el mismo número **distinto de 0** («pasar» un factor dividiendo).`,
      },
      {
        type: 'example',
        title: 'Paso a paso',
        problem: R`$3(x - 2) = x + 4$`,
        steps: [
          { math: R`3x - 6 = x + 4`, note: 'Distributiva (el 3 multiplica a los dos términos).' },
          { math: R`3x - x = 4 + 6`, note: 'Agrupamos: el −6 pasa sumando y la x pasa restando.' },
          { math: R`2x = 10` },
          { math: R`x = 5`, note: 'El 2 multiplica, pasa dividiendo. Verificación: 3(5 − 2) = 9 = 5 + 4. ✓' },
        ],
      },
      { type: 'tip', title: 'Resuelve con validación', body: 'En los ejercicios, activa el modo **Paso a paso**: cada línea se valida al escribirla y, si te equivocas, el sistema te dice exactamente qué pasó (por ejemplo, «error de signo al trasponer el término 5»).' },
      { type: 'check', generatorId: 'lineq.solve', level: 1 },
      { type: 'summary', points: ['Lo que haces en un miembro, hazlo en el otro.', 'Término que suma pasa restando; factor que multiplica pasa dividiendo.', 'Verifica reemplazando la solución.'] },
    ],
  },
  {
    skillId: 'alg.linear-inequalities',
    intro: 'Una **inecuación** compara dos expresiones con $<$, $>$, $\\le$ o $\\ge$. Su solución suele ser un **intervalo** de números, no uno solo.',
    sections: [
      {
        type: 'text',
        title: 'Se resuelven como ecuaciones, con una diferencia',
        body: R`Al **multiplicar o dividir por un número negativo, la desigualdad cambia de sentido**: $-2x < 6 \Rightarrow x > -3$. (Piensa: $2 < 3$, pero $-2 > -3$.)`,
      },
      {
        type: 'example',
        title: 'Con coeficiente negativo',
        problem: R`$5 - 3x \ge 11$`,
        steps: [
          { math: R`-3x \ge 6` },
          { math: R`x \le -2`, note: 'Al dividir por −3 el ≥ pasa a ≤.' },
          { math: R`x \in (-\infty;\ -2]` },
        ],
      },
      {
        type: 'widget',
        widget: 'number-line',
        props: { inequality: '5 - 3x >= 11' },
        caption: 'Escribe una inecuación y mira su conjunto solución en la recta: punto lleno si el extremo se incluye, vacío si no.',
      },
      { type: 'tip', body: 'Corchete [ ] = el extremo se incluye (≤, ≥). Paréntesis ( ) = no se incluye (<, >). En ±∞ siempre va paréntesis.' },
      { type: 'check', generatorId: 'ineq.solve', level: 2 },
      { type: 'check', generatorId: 'ineq.interval', level: 1 },
      { type: 'summary', points: ['Multiplicar o dividir por un negativo invierte la desigualdad.', 'La solución se expresa como intervalo.'] },
    ],
  },
  {
    skillId: 'alg.quadratic',
    intro: 'Una ecuación cuadrática tiene la forma $ax^2 + bx + c = 0$ con $a \\neq 0$. Puede tener dos, una o ninguna solución real.',
    sections: [
      {
        type: 'text',
        title: 'Incompletas: sin fórmula',
        body: R`- $ax^2 + c = 0$: despejar $x^2$ y sacar raíz **con ±**: $x^2 = 9 \Rightarrow x = \pm 3$.
- $ax^2 + bx = 0$: factor común: $x(ax + b) = 0 \Rightarrow x = 0$ o $x = -\frac{b}{a}$.`,
      },
      {
        type: 'text',
        title: 'Fórmula resolvente y discriminante',
        body: R`$$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$ El **discriminante** $\Delta = b^2 - 4ac$ indica: $\Delta > 0$ dos soluciones; $\Delta = 0$ una (doble); $\Delta < 0$ ninguna real.`,
      },
      {
        type: 'example',
        title: 'Aplicar la fórmula',
        problem: R`$x^2 - 2x - 3 = 0$`,
        steps: [
          { math: R`\Delta = (-2)^2 - 4\cdot 1\cdot(-3) = 16` },
          { math: R`x = \frac{2 \pm 4}{2} \Rightarrow x_1 = 3,\ x_2 = -1` },
        ],
      },
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['a*x^2 + b*x + c'], params: { a: 1, b: -2, c: -3 }, showRoots: true },
        caption: 'Las soluciones son los cortes de la parábola con el eje x. Mueve a, b y c y observa cómo cambia el discriminante.',
      },
      { type: 'tip', title: 'Error frecuente', body: R`De $x^2 = 9$ salen **dos** soluciones: $3$ y $-3$. Y no dividas ambos miembros por $x$ (en $x^2 = 5x$): perderías la solución $x = 0$.` },
      { type: 'check', generatorId: 'quad.solve', level: 1 },
      { type: 'check', generatorId: 'quad.discriminant', level: 1 },
      { type: 'summary', points: ['Incompletas: despeje o factor común.', 'Completas: fórmula resolvente.', 'El discriminante dice cuántas soluciones hay.'] },
    ],
  },
  {
    skillId: 'alg.systems',
    intro: 'Un **sistema** de dos ecuaciones con dos incógnitas busca los valores de $x$ e $y$ que cumplen **ambas** a la vez.',
    sections: [
      {
        type: 'text',
        title: 'Métodos',
        body: R`- **Sustitución**: despejar una incógnita en una ecuación y reemplazarla en la otra.
- **Igualación**: despejar la misma incógnita en las dos y comparar.
- **Reducción**: multiplicar las ecuaciones para que, al sumarlas, una incógnita desaparezca.`,
      },
      {
        type: 'example',
        title: 'Reducción',
        problem: R`$\begin{cases} 2x + y = 7 \\ x - y = 2 \end{cases}$`,
        steps: [
          { math: R`3x = 9 \Rightarrow x = 3`, note: 'Sumando las ecuaciones se cancela y.' },
          { math: R`3 - y = 2 \Rightarrow y = 1`, note: 'Reemplazamos en la segunda.' },
        ],
      },
      {
        type: 'widget',
        widget: 'grapher',
        props: { functions: ['7 - 2*x', 'x - 2'], showIntersections: true },
        caption: 'Cada ecuación es una recta: la solución es el punto donde se cortan, (3; 1).',
      },
      {
        type: 'text',
        title: 'Clasificación',
        body: 'Compatible determinado: las rectas se cortan (una solución). Indeterminado: son la misma recta (infinitas). Incompatible: son paralelas (ninguna).',
      },
      { type: 'check', generatorId: 'sys.solve', level: 1 },
      { type: 'check', generatorId: 'sys.graph', level: 1 },
      { type: 'summary', points: ['Solución = punto común de las dos rectas.', 'Verifica en ambas ecuaciones.'] },
    ],
  },
];
