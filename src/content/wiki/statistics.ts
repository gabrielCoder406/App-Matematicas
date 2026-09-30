import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_STATISTICS: WikiEntryDef[] = [
  {
    id: 'stats.central',
    keywords: ['media', 'promedio', 'media aritmética', 'mediana', 'moda', 'tendencia central', 'media ponderada', 'cuartiles', 'percentiles', 'valor atípico'],
    summary: R`Las **medidas de tendencia central** resumen un conjunto de datos con un solo valor «típico».`,
    formulas: [
      { name: 'Media', tex: R`\bar x = \frac{\sum x_i}{n}` },
      { name: 'Media con frecuencias', tex: R`\bar x = \frac{\sum x_i\,f_i}{\sum f_i}` },
      { name: 'Media ponderada', tex: R`\bar x = \frac{\sum x_i\,w_i}{\sum w_i}`, note: R`Ej.: notas 6, 8 y 7 con pesos 30%, 30% y 40% dan $0{,}3\cdot 6 + 0{,}3\cdot 8 + 0{,}4\cdot 7 = 7$.` },
      { name: 'Posición de la mediana', tex: R`\frac{n + 1}{2}`, note: 'Con los datos ordenados.' },
    ],
    terms: [
      { term: 'Media', def: 'La suma de los datos dividida por la cantidad de datos.' },
      { term: 'Mediana', def: 'El valor central con los datos **ordenados**; si la cantidad es par, el promedio de los dos centrales.' },
      { term: 'Moda', def: 'El valor que más se repite (puede haber varias o ninguna).' },
      { term: 'Cuartiles', def: R`$Q_1$, $Q_2$ y $Q_3$ dividen los datos ordenados en cuatro partes iguales; $Q_2$ es la mediana.` },
      { term: 'Valor atípico', def: 'Un dato muy alejado del resto; mueve mucho la media y casi nada la mediana.' },
    ],
    tables: [
      {
        title: '¿Cuál conviene?',
        headers: ['Medida', 'Ventaja', 'Cuándo usarla'],
        rows: [
          ['Media', 'Usa todos los datos.', 'Datos sin valores extremos.'],
          ['Mediana', 'No la afectan los valores extremos.', 'Ingresos, precios, tiempos.'],
          ['Moda', 'Sirve para datos no numéricos.', 'Color o marca preferida.'],
        ],
      },
    ],
    example: {
      problem: R`Datos: $3,\ 7,\ 7,\ 2,\ 9,\ 7,\ 5$`,
      steps: [
        { math: R`\bar x = \frac{3 + 7 + 7 + 2 + 9 + 7 + 5}{7} = \frac{40}{7} \approx 5{,}71` },
        { math: R`2,\ 3,\ 5,\ \mathbf{7},\ 7,\ 7,\ 9 \Rightarrow \text{Me} = 7`, note: 'n = 7: la mediana es el 4.º dato ordenado.' },
        { math: R`\text{Mo} = 7` },
      ],
    },
    mistakes: [
      { wrong: 'Buscar la mediana sin ordenar los datos.', right: 'Primero se ordenan.' },
      { wrong: 'Con una cantidad par de datos, la mediana es uno de ellos.', right: 'Es el promedio de los dos centrales.' },
      { wrong: 'En una tabla, dividir la suma de los valores por la cantidad de valores distintos.', right: R`Se multiplica cada valor por su frecuencia: $\bar x = \frac{\sum x_i f_i}{N}$.` },
    ],
    remember: ['La media reparte, la mediana ordena y la moda repite.'],
    seeAlso: ['stats.dispersion', 'stats.charts'],
  },
  {
    id: 'stats.dispersion',
    keywords: ['dispersión', 'varianza', 'desviación estándar', 'desviación típica', 'desvío', 'rango', 'recorrido', 'coeficiente de variación', 'rango intercuartílico', 'varianza muestral', 'varianza poblacional'],
    summary: R`Las **medidas de dispersión** indican cuánto se alejan los datos de la media: dos grupos con la misma media pueden ser muy distintos.`,
    formulas: [
      { name: 'Rango', tex: R`R = x_{\max} - x_{\min}` },
      { name: 'Varianza (poblacional)', tex: R`\sigma^2 = \frac{\sum (x_i - \bar x)^2}{n}` },
      { name: 'Varianza (fórmula abreviada)', tex: R`\sigma^2 = \frac{\sum x_i^2}{n} - \bar x^2` },
      { name: 'Desviación estándar', tex: R`\sigma = \sqrt{\sigma^2}` },
      { name: 'Varianza muestral', tex: R`s^2 = \frac{\sum (x_i - \bar x)^2}{n - 1}`, note: 'Cuando los datos son una muestra de una población mayor.' },
      { name: 'Coeficiente de variación', tex: R`CV = \frac{\sigma}{\bar x}\cdot 100\,\%`, note: 'Sirve para comparar dispersiones de datos con distintas unidades o medias.' },
      { name: 'Rango intercuartílico', tex: R`RIC = Q_3 - Q_1` },
    ],
    steps: {
      title: 'Varianza paso a paso',
      items: [
        R`Calcula la media $\bar x$.`,
        R`Calcula los desvíos $x_i - \bar x$.`,
        'Eleva cada desvío al cuadrado.',
        'Promedia: divide por n (o por n − 1 si es una muestra).',
        'Saca la raíz para obtener la desviación estándar.',
      ],
    },
    example: {
      problem: R`Datos: $1,\ 3,\ 5,\ 7,\ 9$`,
      steps: [
        { math: R`\bar x = \frac{25}{5} = 5` },
        { math: R`(x_i - \bar x)^2:\ 16,\ 4,\ 0,\ 4,\ 16 \Rightarrow \sum = 40` },
        { math: R`\sigma^2 = \frac{40}{5} = 8,\quad \sigma = \sqrt8 \approx 2{,}83` },
      ],
    },
    mistakes: [
      { wrong: 'Promediar los desvíos sin elevarlos al cuadrado.', right: 'Los desvíos siempre suman 0: por eso se elevan al cuadrado.' },
      { wrong: 'La varianza está en las mismas unidades que los datos.', right: 'Está en unidades al cuadrado; la desviación estándar vuelve a las unidades originales.' },
      { wrong: 'Dar la varianza como desviación estándar.', right: 'Falta sacar la raíz cuadrada.' },
    ],
    remember: ['Desviación estándar = raíz de la varianza.'],
    seeAlso: ['stats.central'],
  },
  {
    id: 'stats.charts',
    keywords: ['gráficos estadísticos', 'tabla de frecuencias', 'frecuencia absoluta', 'frecuencia relativa', 'frecuencia acumulada', 'porcentaje', 'histograma', 'diagrama de barras', 'gráfico circular', 'gráfico de torta', 'diagrama de dispersión', 'correlación', 'variables cualitativas', 'variables cuantitativas', 'marca de clase', 'intervalos de clase'],
    summary: R`Las tablas y los gráficos muestran cómo se distribuyen los datos y cómo se relacionan dos variables.`,
    formulas: [
      { name: 'Frecuencia relativa', tex: R`h_i = \frac{f_i}{N}`, note: R`En porcentaje: $h_i\cdot 100$. Todas suman 1 (100%).` },
      { name: 'Frecuencia acumulada', tex: R`F_i = f_1 + f_2 + \dots + f_i` },
      { name: 'Marca de clase', tex: R`x_i = \frac{\text{límite inferior} + \text{límite superior}}{2}` },
      { name: 'Ángulo en un gráfico circular', tex: R`\alpha_i = h_i\cdot 360^\circ` },
    ],
    terms: [
      { term: 'Variable cualitativa', def: 'Toma categorías, no números: color, deporte favorito.' },
      { term: 'Variable cuantitativa discreta', def: 'Toma valores aislados que se cuentan: cantidad de hermanos.' },
      { term: 'Variable cuantitativa continua', def: 'Puede tomar cualquier valor en un intervalo: altura, tiempo. Se agrupa en intervalos de clase.' },
      { term: 'Frecuencia absoluta', def: R`$f_i$: cuántas veces aparece un valor o una clase.` },
      { term: 'Correlación', def: 'Tendencia entre dos variables en un diagrama de dispersión: positiva si la nube sube, negativa si baja.' },
    ],
    tables: [
      {
        title: '¿Qué gráfico usar?',
        headers: ['Gráfico', 'Para…'],
        rows: [
          ['Barras', 'datos cualitativos o cuantitativos discretos'],
          ['Histograma', 'datos continuos agrupados en intervalos (barras contiguas)'],
          ['Circular', 'mostrar las partes de un todo (porcentajes)'],
          ['Dispersión', 'la relación entre dos variables numéricas'],
          ['Líneas', 'la evolución de una variable en el tiempo'],
        ],
      },
    ],
    example: {
      problem: 'Cantidad de hermanos de 20 estudiantes: 0 (4 veces), 1 (8 veces), 2 (5 veces) y 3 (3 veces).',
      steps: [
        { math: R`\begin{array}{c|c|c|c|c} x_i & f_i & h_i & F_i & \alpha_i \\ \hline 0 & 4 & 0{,}20 & 4 & 72^\circ \\ 1 & 8 & 0{,}40 & 12 & 144^\circ \\ 2 & 5 & 0{,}25 & 17 & 90^\circ \\ 3 & 3 & 0{,}15 & 20 & 54^\circ \end{array}` },
        { note: 'Las frecuencias relativas suman 1 y los ángulos, 360°.' },
      ],
    },
    mistakes: [
      { wrong: 'Las frecuencias relativas suman N.', right: 'Suman 1 (el 100 %).' },
      { wrong: 'Dibujar un histograma con barras separadas.', right: 'Las barras del histograma van contiguas; las del diagrama de barras, separadas.' },
      { wrong: 'Si dos variables están correlacionadas, una causa la otra.', right: 'Correlación no implica causalidad.' },
    ],
    remember: ['La frecuencia relativa es una proporción; para el porcentaje se multiplica por 100.'],
    seeAlso: ['stats.central'],
  },
  {
    id: 'comb.counting',
    keywords: ['combinatoria', 'factorial', 'permutaciones', 'variaciones', 'combinaciones', 'número combinatorio', 'principio de multiplicación', 'con repetición', 'sin repetición', 'anagramas', 'triángulo de Pascal', 'conteo', 'binomial'],
    summary: R`La **combinatoria** cuenta de cuántas maneras se pueden ordenar o elegir elementos sin tener que enumerarlas.`,
    formulas: [
      { name: 'Factorial', tex: R`n! = n\cdot(n - 1)\cdots 2\cdot 1,\quad 0! = 1` },
      { name: 'Permutaciones', tex: R`P_n = n!` },
      { name: 'Variaciones', tex: R`V_{n,k} = \frac{n!}{(n - k)!}` },
      { name: 'Variaciones con repetición', tex: R`VR_{n,k} = n^k` },
      { name: 'Combinaciones', tex: R`C_{n,k} = \binom{n}{k} = \frac{n!}{k!\,(n - k)!}` },
      { name: 'Permutaciones con repetición', tex: R`P_n^{a,b,\dots} = \frac{n!}{a!\,b!\cdots}`, note: 'Anagramas de palabras con letras repetidas.' },
      { name: 'Simetría', tex: R`\binom{n}{k} = \binom{n}{n - k}` },
      { name: 'Principio de multiplicación', tex: R`a \text{ opciones y } b \text{ opciones} \Rightarrow a\cdot b` },
    ],
    tables: [
      {
        title: '¿Cuál uso?',
        sheet: true,
        headers: ['¿Entran todos?', '¿Importa el orden?', 'Fórmula'],
        rows: [
          ['Sí', 'Sí', R`Permutaciones: $n!$`],
          ['No', 'Sí', R`Variaciones: $\frac{n!}{(n - k)!}$`],
          ['No', 'No', R`Combinaciones: $\binom{n}{k}$`],
          ['Se pueden repetir', 'Sí', R`Variaciones con repetición: $n^k$`],
        ],
      },
    ],
    example: {
      problem: 'Hay 5 mujeres y 4 varones. ¿Cuántas comisiones de 3 personas con al menos 2 mujeres se pueden formar?',
      steps: [
        { math: R`\text{Exactamente 2 mujeres: } \binom52\cdot\binom41 = 10\cdot 4 = 40` },
        { math: R`\text{3 mujeres: } \binom53 = 10` },
        { math: R`40 + 10 = 50`, note: 'En una comisión no importa el orden: combinaciones.' },
      ],
    },
    mistakes: [
      { wrong: 'Usar combinaciones para un podio (oro, plata, bronce).', right: 'Importa el orden: son variaciones.' },
      { wrong: R`$0! = 0$`, right: R`$0! = 1$` },
      { wrong: R`$\frac{6!}{3!} = 2!$`, right: R`$\frac{6!}{3!} = 6\cdot 5\cdot 4 = 120$` },
    ],
    remember: ['¿Importa el orden? Sí → variaciones o permutaciones. No → combinaciones.'],
    seeAlso: ['prob.laplace'],
  },
  {
    id: 'prob.laplace',
    keywords: ['probabilidad', 'probabilidades', 'regla de Laplace', 'Laplace', 'espacio muestral', 'suceso', 'evento', 'complemento', 'sucesos incompatibles', 'sucesos independientes', 'probabilidad condicional', 'dados', 'monedas', 'urnas', 'al menos uno'],
    summary: R`La **probabilidad** mide qué tan posible es un suceso: entre 0 (imposible) y 1 (seguro).`,
    formulas: [
      { name: 'Regla de Laplace', tex: R`P(A) = \frac{\text{casos favorables}}{\text{casos posibles}}`, note: 'Solo si todos los resultados son igualmente probables.' },
      { name: 'Complemento', tex: R`P(A^c) = 1 - P(A)` },
      { name: 'Unión', tex: R`P(A \cup B) = P(A) + P(B) - P(A \cap B)` },
      { name: 'Sucesos incompatibles', tex: R`P(A \cup B) = P(A) + P(B)` },
      { name: 'Sucesos independientes', tex: R`P(A \cap B) = P(A)\cdot P(B)` },
      { name: 'Probabilidad condicional', tex: R`P(A \mid B) = \frac{P(A \cap B)}{P(B)}` },
      { name: 'Al menos uno', tex: R`P(\text{al menos uno}) = 1 - P(\text{ninguno})` },
    ],
    terms: [
      { term: 'Espacio muestral', def: 'El conjunto de todos los resultados posibles de un experimento aleatorio.' },
      { term: 'Suceso', def: 'Un subconjunto del espacio muestral (por ejemplo, «sale par»).' },
      { term: 'Sucesos incompatibles', def: R`No pueden ocurrir a la vez: $A \cap B = \emptyset$.` },
      { term: 'Sucesos independientes', def: 'Que ocurra uno no cambia la probabilidad del otro (por ejemplo, dos tiradas de un dado).' },
    ],
    example: {
      problem: 'Probabilidad de sacar al menos un 6 en tres tiradas de un dado.',
      steps: [
        { math: R`P(\text{ningún } 6) = \left(\frac56\right)^3 = \frac{125}{216}`, note: 'Tiradas independientes: se multiplican.' },
        { math: R`P(\text{al menos un } 6) = 1 - \frac{125}{216} = \frac{91}{216} \approx 0{,}42` },
      ],
    },
    mistakes: [
      { wrong: R`$P(A \cup B) = P(A) + P(B)$ siempre.`, right: R`Solo si son incompatibles; si no, se resta $P(A \cap B)$.` },
      { wrong: 'Una probabilidad de 1,2.', right: R`Siempre $0 \le P(A) \le 1$.` },
      { wrong: 'Con dos dados, sumar 2 es tan probable como sumar 7.', right: R`$P(2) = \frac{1}{36}$ y $P(7) = \frac{6}{36}$: las sumas no son equiprobables.` },
    ],
    remember: ['Para «al menos uno», calcula el complemento: 1 − P(ninguno).'],
    seeAlso: ['comb.counting', 'sets.operations'],
  },
];
