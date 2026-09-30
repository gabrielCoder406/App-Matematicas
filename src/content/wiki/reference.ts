// Fichas de referencia general (no corresponden a una habilidad del temario).
import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_REFERENCE: WikiEntryDef[] = [
  {
    id: 'ref.symbols',
    title: 'Símbolos y notación',
    keywords: ['símbolos', 'notación', 'significado de los símbolos', 'cómo se lee', 'letras griegas', 'alfabeto griego'],
    summary: R`Qué significa cada símbolo y cómo se lee.`,
    tables: [
      {
        title: 'Relaciones y operaciones',
        headers: ['Símbolo', 'Se lee', 'Ejemplo'],
        rows: [
          [R`$\neq$`, 'distinto de', R`$3 \neq 5$`],
          [R`$\approx$`, 'aproximadamente igual a', R`$\pi \approx 3{,}14$`],
          [R`$<\ \ >$`, 'menor que, mayor que', R`$-2 < 1$`],
          [R`$\le\ \ \ge$`, 'menor o igual, mayor o igual', R`$x \ge 0$`],
          [R`$\pm$`, 'más o menos', R`$x = \pm 3$`],
          [R`$\cdot\ \ \times$`, 'por (multiplicación)', R`$2\cdot 3 = 6$`],
          [R`$:\ \ \div$`, 'dividido', R`$8 : 2 = 4$`],
          [R`$|x|$`, 'valor absoluto de x', R`$|-4| = 4$`],
          [R`$n!$`, 'factorial de n', R`$4! = 24$`],
          [R`$\sum$`, 'sumatoria', R`$\sum_{i=1}^{3} i = 1 + 2 + 3$`],
          [R`$\sqrt[n]{a}$`, 'raíz n-ésima de a', R`$\sqrt[3]{8} = 2$`],
          [R`$\infty$`, 'infinito', R`$x \to \infty$`],
          [R`$\Delta$`, 'delta: variación o discriminante', R`$\Delta = b^2 - 4ac$`],
        ],
      },
      {
        title: 'Lógica y conjuntos',
        headers: ['Símbolo', 'Se lee', 'Ejemplo'],
        rows: [
          [R`$\neg$`, 'no', R`$\neg p$`],
          [R`$\land\ \ \lor$`, 'y, o', R`$p \land q$`],
          [R`$\Rightarrow$`, 'implica («si… entonces…»)', R`$p \Rightarrow q$`],
          [R`$\Leftrightarrow$`, 'si y solo si', R`$p \Leftrightarrow q$`],
          [R`$\equiv$`, 'equivale a', R`$\neg\neg p \equiv p$`],
          [R`$\forall$`, 'para todo', R`$\forall x \in \mathbb{R}$`],
          [R`$\exists$`, 'existe', R`$\exists x: x > 2$`],
          [R`$\in\ \ \notin$`, 'pertenece, no pertenece', R`$2 \in \mathbb{N}$`],
          [R`$\subseteq$`, 'está incluido en', R`$\{1\} \subseteq \{1, 2\}$`],
          [R`$\cup\ \ \cap$`, 'unión, intersección', R`$A \cup B$`],
          [R`$\emptyset$`, 'conjunto vacío', R`$A \cap B = \emptyset$`],
          [R`$A^c$`, 'complemento de A', R`$A^c = U - A$`],
          [R`$:\ \ \mid$`, 'tal que', R`$\{x \in \mathbb{Z} : x > 0\}$`],
          [R`$\mathbb{N}\ \mathbb{Z}\ \mathbb{Q}\ \mathbb{R}$`, 'naturales, enteros, racionales, reales', R`$\sqrt2 \in \mathbb{R}$`],
        ],
      },
      {
        title: 'Funciones, cálculo y álgebra lineal',
        headers: ['Símbolo', 'Se lee', 'Ejemplo'],
        rows: [
          [R`$f(x)$`, 'f de x', R`$f(2) = 5$`],
          [R`$f'(x)$`, 'derivada de f', R`$(x^2)' = 2x$`],
          [R`$\lim$`, 'límite', R`$\lim_{x\to 0}\frac{\sen x}{x} = 1$`],
          [R`$\to$`, 'tiende a', R`$x \to 2$`],
          [R`$\int$`, 'integral', R`$\int x\,dx$`],
          [R`$\log_a\ \ \ln$`, 'logaritmo en base a, logaritmo natural', R`$\log_2 8 = 3$`],
          [R`$\vec v$`, 'vector v', R`$\vec v = (1;\ 2)$`],
          [R`$|\vec v|$`, 'módulo de v', R`$|(3;\ 4)| = 5$`],
          [R`$\det A$`, 'determinante de A', R`$\det I = 1$`],
          [R`$A^T\ \ A^{-1}$`, 'traspuesta, inversa', R`$A\cdot A^{-1} = I$`],
          [R`$\bar x$`, 'media', R`$\bar x = 5$`],
          [R`$\sigma$`, 'desviación estándar', R`$\sigma^2$: varianza`],
          [R`$\binom{n}{k}$`, 'combinaciones de n tomados de a k', R`$\binom42 = 6$`],
        ],
      },
      {
        title: 'Letras griegas más usadas',
        headers: ['Letra', 'Nombre', 'Uso habitual'],
        rows: [
          [R`$\alpha\ \ \beta\ \ \gamma$`, 'alfa, beta, gamma', 'ángulos'],
          [R`$\delta\ \ \Delta$`, 'delta', 'variación, discriminante'],
          [R`$\varepsilon$`, 'épsilon', 'cantidad muy pequeña'],
          [R`$\theta$`, 'theta', 'ángulos'],
          [R`$\lambda$`, 'lambda', 'escalares, parámetros'],
          [R`$\mu$`, 'mu', 'media de una población'],
          [R`$\pi$`, 'pi', R`$\pi \approx 3{,}14159$`],
          [R`$\sigma\ \ \Sigma$`, 'sigma', 'desviación estándar, sumatoria'],
          [R`$\varphi$`, 'fi', 'ángulos, número de oro'],
          [R`$\omega\ \ \Omega$`, 'omega', 'velocidad angular, espacio muestral'],
        ],
      },
    ],
    mistakes: [
      { wrong: R`$\{2\} \in \{1, 2\}$`, right: R`$2 \in \{1, 2\}$ y $\{2\} \subseteq \{1, 2\}$`, note: '∈ para elementos; ⊆ para conjuntos.' },
      { wrong: R`$\pi = 3{,}14$`, right: R`$\pi \approx 3{,}14$`, note: '= solo si es exactamente igual.' },
      { wrong: R`$\Rightarrow$ significa «es igual a».`, right: R`$\Rightarrow$ significa «implica»; para igualdades se usa $=$.` },
    ],
  },
];
