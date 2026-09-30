import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_STATISTICS: Lesson[] = [
  {
    skillId: 'stats.central',
    intro: 'Las **medidas de tendencia central** resumen un conjunto de datos con un solo valor «típico».',
    sections: [
      {
        type: 'text',
        title: 'Media, mediana y moda',
        body: R`- **Media** $\bar x$: suma de los datos dividida por la cantidad.
- **Mediana**: el valor del medio con los datos **ordenados** (con cantidad par, el promedio de los dos centrales).
- **Moda**: el valor que más se repite (puede haber varias o ninguna).`,
      },
      {
        type: 'widget',
        widget: 'histogram',
        props: { data: [2, 3, 3, 4, 5, 5, 5, 6, 7, 10] },
        caption: 'Agrega o quita datos: la media se desplaza mucho con un valor extremo, la mediana casi nada.',
      },
      {
        type: 'example',
        title: 'Calcular',
        problem: R`Datos: $4,\ 8,\ 6,\ 5,\ 3,\ 8$`,
        steps: [
          { math: R`\bar x = \frac{4 + 8 + 6 + 5 + 3 + 8}{6} = \frac{34}{6} \approx 5{,}67` },
          { math: R`3,\ 4,\ 5,\ 6,\ 8,\ 8 \Rightarrow \text{Me} = \frac{5 + 6}{2} = 5{,}5`, note: 'Primero se ordenan.' },
          { math: R`\text{Mo} = 8` },
        ],
      },
      { type: 'tip', body: 'La media es sensible a valores extremos (si un dato es 1000, la media se dispara); la mediana no. Por eso los ingresos se suelen resumir con la mediana.' },
      { type: 'check', generatorId: 'stat.mean', level: 1 },
      { type: 'check', generatorId: 'stat.median', level: 2 },
      { type: 'summary', points: ['Media: reparte en partes iguales.', 'Mediana: el del medio, con datos ordenados.', 'Moda: el más frecuente.'] },
    ],
  },
  {
    skillId: 'stats.dispersion',
    intro: 'Dos grupos pueden tener la misma media y ser muy distintos. Las **medidas de dispersión** indican cuánto se alejan los datos de la media.',
    sections: [
      {
        type: 'text',
        title: 'Medidas',
        body: R`- **Rango**: máximo − mínimo.
- **Varianza** (poblacional): $\sigma^2 = \frac{\sum (x_i - \bar x)^2}{n}$, el promedio de los desvíos al cuadrado.
- **Desviación estándar**: $\sigma = \sqrt{\sigma^2}$, en las mismas unidades que los datos.`,
      },
      {
        type: 'example',
        title: 'Varianza paso a paso',
        problem: R`Datos: $2,\ 4,\ 6,\ 8$`,
        steps: [
          { math: R`\bar x = 5` },
          { math: R`(x_i - \bar x)^2:\ 9,\ 1,\ 1,\ 9` },
          { math: R`\sigma^2 = \frac{20}{4} = 5,\quad \sigma = \sqrt5 \approx 2{,}24` },
        ],
      },
      {
        type: 'widget',
        widget: 'histogram',
        props: { data: [5, 5, 6, 4, 5, 6, 4, 5], showSd: true },
        caption: 'Agrega datos alejados del centro y observa cómo crece la desviación estándar.',
      },
      { type: 'check', generatorId: 'stat.range', level: 1 },
      { type: 'check', generatorId: 'stat.variance', level: 1 },
      { type: 'summary', points: ['Varianza: promedio de desvíos al cuadrado.', 'Desviación estándar: raíz de la varianza.'] },
    ],
  },
  {
    skillId: 'stats.charts',
    intro: 'Los gráficos permiten ver de un vistazo cómo se distribuyen los datos y cómo se relacionan dos variables.',
    sections: [
      {
        type: 'text',
        title: 'Tablas y gráficos',
        body: R`- **Frecuencia absoluta** $f_i$: cuántas veces aparece un valor o clase. **Relativa**: $h_i = \frac{f_i}{N}$ (en % multiplicando por 100).
- **Histograma**: barras contiguas para datos agrupados en intervalos (clases); la altura es la frecuencia.
- **Diagrama de dispersión**: cada punto es un par $(x, y)$. Si la nube sube, hay correlación positiva; si baja, negativa.`,
      },
      {
        type: 'widget',
        widget: 'histogram',
        props: { data: [12, 15, 18, 22, 25, 25, 28, 31, 33, 35, 38, 41, 45, 52], bins: 5 },
        caption: 'Cambia la cantidad de clases: con muy pocas se pierde detalle, con demasiadas el gráfico se vuelve ruidoso.',
      },
      { type: 'tip', body: 'Correlación no implica causalidad: que dos variables crezcan juntas no significa que una cause la otra.' },
      { type: 'check', generatorId: 'chart.histogram', level: 1 },
      { type: 'check', generatorId: 'chart.scatter', level: 1 },
      { type: 'summary', points: ['Histograma: frecuencia por clase.', 'Dispersión: tendencia entre dos variables.'] },
    ],
  },
  {
    skillId: 'comb.counting',
    intro: 'La **combinatoria** cuenta de cuántas maneras se pueden ordenar o elegir elementos sin tener que enumerarlas una por una.',
    sections: [
      {
        type: 'text',
        title: 'Tres preguntas',
        body: R`¿Se usan todos los elementos? ¿Importa el orden? ¿Se pueden repetir?
- **Permutaciones** (todos, importa el orden): $P_n = n!$.
- **Variaciones** (algunos, importa el orden): $V_{n,k} = \frac{n!}{(n-k)!}$. Con repetición: $n^k$.
- **Combinaciones** (algunos, no importa el orden): $C_{n,k} = \binom{n}{k} = \frac{n!}{k!\,(n-k)!}$.`,
      },
      {
        type: 'example',
        title: 'Podio vs. comisión',
        problem: 'Entre 10 personas:',
        steps: [
          { math: R`\text{Oro, plata y bronce: } V_{10,3} = 10\cdot 9\cdot 8 = 720`, note: 'Importa el orden.' },
          { math: R`\text{Comisión de 3: } C_{10,3} = \frac{720}{3!} = 120`, note: 'No importa el orden: cada grupo se contaba 3! = 6 veces.' },
        ],
      },
      { type: 'tip', body: 'Principio de multiplicación: si una elección tiene $a$ opciones y otra $b$, juntas tienen $a\\cdot b$.' },
      { type: 'check', generatorId: 'comb.which', level: 1 },
      { type: 'check', generatorId: 'comb.problems', level: 1 },
      { type: 'summary', points: ['Todos y con orden: n!.', 'Algunos con orden: variaciones. Sin orden: combinaciones.'] },
    ],
  },
  {
    skillId: 'prob.laplace',
    intro: 'La **probabilidad** mide qué tan posible es un suceso, entre 0 (imposible) y 1 (seguro).',
    sections: [
      {
        type: 'text',
        title: 'Regla de Laplace',
        body: R`Si todos los resultados son igualmente probables: $$P(A) = \frac{\text{casos favorables}}{\text{casos posibles}}$$ Además: $P(A^c) = 1 - P(A)$ y $P(A\cup B) = P(A) + P(B) - P(A\cap B)$.`,
      },
      {
        type: 'widget',
        widget: 'dice',
        props: { dice: 2 },
        caption: 'Lanza los dados muchas veces: la frecuencia relativa de cada suma se acerca a su probabilidad teórica (ley de los grandes números).',
      },
      {
        type: 'example',
        title: 'Dos dados',
        problem: 'Probabilidad de que la suma sea 7.',
        steps: [
          { math: R`\text{Casos posibles: } 6\cdot 6 = 36` },
          { math: R`\text{Favorables: } (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) \to 6` },
          { math: R`P = \frac{6}{36} = \frac16` },
        ],
      },
      { type: 'tip', body: 'Para «al menos uno» suele ser más fácil calcular el complemento: $P(\\text{al menos un } 6) = 1 - P(\\text{ningún } 6)$.' },
      { type: 'check', generatorId: 'prob.dice', level: 1 },
      { type: 'check', generatorId: 'prob.urn', level: 1 },
      { type: 'summary', points: ['Laplace: favorables / posibles.', 'Complemento: 1 − P(A).'] },
    ],
  },
];
