import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_GEOMETRY: WikiEntryDef[] = [
  {
    id: 'geo.plane',
    keywords: ['perímetro', 'perímetros', 'área', 'áreas', 'superficie', 'rectángulo', 'cuadrado', 'triángulo', 'círculo', 'circunferencia', 'trapecio', 'rombo', 'paralelogramo', 'polígono regular', 'apotema', 'sector circular', 'Herón', 'figuras compuestas', 'figuras planas'],
    summary: R`El **perímetro** mide el contorno (unidades de longitud) y el **área**, la superficie encerrada (unidades cuadradas).`,
    tables: [
      {
        title: 'Figuras planas',
        sheet: true,
        headers: ['Figura', 'Área', 'Perímetro'],
        rows: [
          [R`Cuadrado de lado $l$`, R`$l^2$`, R`$4l$`],
          ['Rectángulo', R`$b\cdot h$`, R`$2(b + h)$`],
          ['Triángulo', R`$\frac{b\cdot h}{2}$`, R`$a + b + c$`],
          ['Paralelogramo', R`$b\cdot h$`, R`$2(a + b)$`],
          [R`Rombo (diagonales $D$ y $d$)`, R`$\frac{D\cdot d}{2}$`, R`$4l$`],
          [R`Trapecio (bases $B$ y $b$)`, R`$\frac{(B + b)\cdot h}{2}$`, 'suma de los lados'],
          [R`Polígono regular de $n$ lados`, R`$\frac{P\cdot ap}{2}$`, R`$n\cdot l$`],
          [R`Círculo de radio $r$`, R`$\pi r^2$`, R`$2\pi r$`],
        ],
      },
    ],
    formulas: [
      { name: 'Sector circular (ángulo α en grados)', tex: R`A = \frac{\pi r^2\cdot\alpha}{360^\circ},\quad L_{arco} = \frac{2\pi r\cdot\alpha}{360^\circ}` },
      { name: 'Fórmula de Herón', tex: R`A = \sqrt{s(s - a)(s - b)(s - c)},\quad s = \frac{a + b + c}{2}`, note: 'Área de un triángulo conociendo sus tres lados.' },
      { name: 'Unidades de área', tex: R`1\ \text{m}^2 = 10\,000\ \text{cm}^2,\quad 1\ \text{ha} = 10\,000\ \text{m}^2` },
    ],
    terms: [
      { term: 'Altura', def: 'Segmento perpendicular a la base desde el vértice (o lado) opuesto; no es el lado inclinado.' },
      { term: 'Apotema', def: 'En un polígono regular, la distancia del centro al punto medio de un lado.' },
    ],
    example: {
      problem: 'Un terreno rectangular de 20 m × 12 m tiene un cantero circular de 2 m de radio. ¿Qué superficie queda libre?',
      steps: [
        { math: R`A_{rect} = 20\cdot 12 = 240\ \text{m}^2` },
        { math: R`A_{\text{círculo}} = \pi\cdot 2^2 = 4\pi \approx 12{,}57\ \text{m}^2` },
        { math: R`A_{libre} \approx 240 - 12{,}57 = 227{,}43\ \text{m}^2`, note: 'Figuras compuestas: se suman o se restan áreas.' },
      ],
    },
    mistakes: [
      { wrong: 'Usar el lado inclinado como altura del paralelogramo.', right: 'La altura es perpendicular a la base.' },
      { wrong: R`$A = \pi d^2$ usando el diámetro.`, right: R`$A = \pi r^2$ con $r = \frac{d}{2}$.` },
      { wrong: R`$1\ \text{m}^2 = 100\ \text{cm}^2$`, right: R`$1\ \text{m}^2 = 100^2\ \text{cm}^2 = 10\,000\ \text{cm}^2$` },
    ],
    remember: ['Área en unidades², perímetro en unidades.', 'Figuras compuestas: descomponer en figuras simples.'],
  },
  {
    id: 'geo.pythagoras',
    keywords: ['Pitágoras', 'teorema de Pitágoras', 'triángulo rectángulo', 'hipotenusa', 'catetos', 'terna pitagórica', 'diagonal', 'distancia entre dos puntos', 'recíproco de Pitágoras'],
    summary: R`En todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos.`,
    formulas: [
      { name: 'Teorema de Pitágoras', tex: R`a^2 + b^2 = c^2`, note: R`$c$ es la hipotenusa; $a$ y $b$, los catetos.` },
      { name: 'Hipotenusa', tex: R`c = \sqrt{a^2 + b^2}` },
      { name: 'Cateto', tex: R`a = \sqrt{c^2 - b^2}` },
      { name: 'Diagonal del rectángulo', tex: R`d = \sqrt{b^2 + h^2}`, note: R`En el cuadrado: $d = l\sqrt2$.` },
      { name: 'Altura del triángulo equilátero', tex: R`h = \frac{\sqrt3}{2}\,l` },
      { name: 'Distancia entre dos puntos', tex: R`d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}` },
    ],
    terms: [
      { term: 'Hipotenusa', def: 'El lado opuesto al ángulo recto; siempre es el más largo.' },
      { term: 'Catetos', def: 'Los dos lados que forman el ángulo recto.' },
      { term: 'Terna pitagórica', def: 'Tres enteros que cumplen el teorema: 3-4-5, 5-12-13, 8-15-17, 7-24-25 (y sus múltiplos, como 6-8-10).' },
      { term: 'Recíproco de Pitágoras', def: R`Si $a^2 + b^2 = c^2$ con $c$ el lado mayor, el triángulo es rectángulo.` },
    ],
    example: {
      problem: 'Una escalera de 5 m está apoyada en una pared con el pie a 3 m de ella. ¿A qué altura llega?',
      steps: [
        { math: R`h = \sqrt{5^2 - 3^2} = \sqrt{25 - 9} = \sqrt{16} = 4\ \text{m}`, note: 'La escalera es la hipotenusa: se busca un cateto, así que se resta.' },
      ],
    },
    mistakes: [
      { wrong: R`Cateto: $b = \sqrt{13^2 + 5^2}$`, right: R`$b = \sqrt{13^2 - 5^2} = 12$`, note: 'Para un cateto se resta.' },
      { wrong: R`$\sqrt{a^2 + b^2} = a + b$`, right: R`$\sqrt{3^2 + 4^2} = 5 \neq 3 + 4$` },
      { wrong: 'Aplicar Pitágoras en cualquier triángulo.', right: 'Solo en triángulos rectángulos; en los demás, teorema del coseno.' },
    ],
    remember: ['La hipotenusa es el lado más largo y está enfrente del ángulo recto.'],
    seeAlso: ['trig.triangles', 'la.vectors'],
  },
  {
    id: 'geo.thales',
    keywords: ['Tales', 'teorema de Tales', 'semejanza', 'triángulos semejantes', 'proporcionalidad de segmentos', 'paralelas', 'transversales', 'razón de semejanza', 'escala', 'sombras', 'criterios de semejanza'],
    summary: R`Si varias rectas **paralelas** cortan a dos transversales, los segmentos que determinan son **proporcionales**.`,
    formulas: [
      { name: 'Teorema de Tales', tex: R`\frac{\overline{AB}}{\overline{BC}} = \frac{\overline{A'B'}}{\overline{B'C'}}`, note: 'Segmentos correspondientes sobre las dos transversales.' },
      { name: 'Semejanza con razón k', tex: R`\frac{a'}{a} = \frac{b'}{b} = \frac{c'}{c} = k` },
      { name: 'Perímetros, áreas y volúmenes', tex: R`P' = k\,P,\quad A' = k^2 A,\quad V' = k^3 V` },
    ],
    terms: [
      { term: 'Triángulos semejantes', def: 'Tienen los mismos ángulos y sus lados correspondientes son proporcionales.' },
      { term: 'Razón de semejanza', def: R`El cociente $k$ entre lados correspondientes.` },
      { term: 'Criterios de semejanza', def: 'AA: dos ángulos iguales. LLL: tres lados proporcionales. LAL: dos lados proporcionales y el ángulo comprendido igual.' },
      { term: 'Lados homólogos', def: 'Lados correspondientes: los que están enfrentados a ángulos iguales.' },
    ],
    example: {
      problem: 'Un triángulo tiene lados 4, 6 y 8. Otro semejante tiene 10 como lado menor. ¿Cuánto miden sus otros lados? ¿Y la razón entre sus áreas?',
      steps: [
        { math: R`k = \frac{10}{4} = 2{,}5` },
        { math: R`6\cdot 2{,}5 = 15,\quad 8\cdot 2{,}5 = 20` },
        { math: R`\frac{A'}{A} = k^2 = 6{,}25` },
      ],
    },
    mistakes: [
      { wrong: 'Si los lados se duplican, el área se duplica.', right: R`El área se multiplica por $2^2 = 4$.` },
      { wrong: 'Emparejar lados que no se corresponden.', right: 'Compara siempre lados homólogos (enfrentados a ángulos iguales).' },
    ],
    remember: ['Lados × k, áreas × k², volúmenes × k³.'],
    seeAlso: ['arith.proportion'],
  },
  {
    id: 'geo.solids',
    keywords: ['cuerpos geométricos', 'volumen', 'volúmenes', 'área lateral', 'área total', 'prisma', 'cubo', 'ortoedro', 'cilindro', 'pirámide', 'cono', 'esfera', 'generatriz', 'capacidad', 'litros'],
    summary: R`El **volumen** es el espacio que ocupa un cuerpo (unidades cúbicas); el **área** es la superficie que lo envuelve.`,
    tables: [
      {
        title: 'Volúmenes y áreas',
        sheet: true,
        headers: ['Cuerpo', 'Volumen', 'Área total'],
        rows: [
          [R`Cubo de arista $a$`, R`$a^3$`, R`$6a^2$`],
          [R`Prisma rectangular $a\times b\times c$`, R`$a\cdot b\cdot c$`, R`$2(ab + ac + bc)$`],
          ['Prisma', R`$A_{base}\cdot h$`, R`$2A_{base} + A_{lateral}$`],
          ['Cilindro', R`$\pi r^2 h$`, R`$2\pi r^2 + 2\pi r h$`],
          ['Pirámide', R`$\frac{A_{base}\cdot h}{3}$`, R`$A_{base} + A_{lateral}$`],
          [R`Cono (generatriz $g$)`, R`$\frac{\pi r^2 h}{3}$`, R`$\pi r^2 + \pi r g$`],
          ['Esfera', R`$\frac43\pi r^3$`, R`$4\pi r^2$`],
        ],
      },
    ],
    formulas: [
      { name: 'Generatriz del cono', tex: R`g = \sqrt{r^2 + h^2}` },
      { name: 'Diagonal del prisma rectangular', tex: R`D = \sqrt{a^2 + b^2 + c^2}` },
      { name: 'Capacidad', tex: R`1\ \text{dm}^3 = 1\ \text{L},\quad 1\ \text{m}^3 = 1000\ \text{L},\quad 1\ \text{cm}^3 = 1\ \text{mL}` },
    ],
    example: {
      problem: 'Cono de radio 3 cm y altura 4 cm: volumen y área total.',
      steps: [
        { math: R`g = \sqrt{3^2 + 4^2} = 5\ \text{cm}` },
        { math: R`V = \frac{\pi\cdot 3^2\cdot 4}{3} = 12\pi \approx 37{,}70\ \text{cm}^3` },
        { math: R`A = \pi\cdot 3^2 + \pi\cdot 3\cdot 5 = 24\pi \approx 75{,}40\ \text{cm}^2` },
      ],
    },
    mistakes: [
      { wrong: R`Volumen del cono: $\pi r^2 h$`, right: R`$\frac{\pi r^2 h}{3}$ (un tercio del cilindro)` },
      { wrong: 'Usar la altura en el área lateral del cono.', right: R`$A_{lateral} = \pi r g$, con la generatriz $g$.` },
      { wrong: R`$1\ \text{m}^3 = 100\ \text{L}$`, right: R`$1\ \text{m}^3 = 1000\ \text{L}$` },
    ],
    remember: ['Los cuerpos «con punta» (pirámide, cono) tienen un tercio del volumen del prisma o cilindro de igual base y altura.'],
    seeAlso: ['geo.plane'],
  },
  {
    id: 'trig.ratios',
    keywords: ['trigonometría', 'razones trigonométricas', 'seno', 'coseno', 'tangente', 'sen', 'cos', 'tan', 'cateto opuesto', 'cateto adyacente', 'SOH CAH TOA', 'arcoseno', 'funciones inversas', 'ángulo de elevación', 'ángulo de depresión', 'secante', 'cosecante', 'cotangente'],
    summary: R`En un triángulo rectángulo, los cocientes entre los lados dependen solo del ángulo: son las **razones trigonométricas**.`,
    formulas: [
      { name: 'Seno', tex: R`\sen\alpha = \frac{\text{opuesto}}{\text{hipotenusa}}` },
      { name: 'Coseno', tex: R`\cos\alpha = \frac{\text{adyacente}}{\text{hipotenusa}}` },
      { name: 'Tangente', tex: R`\tan\alpha = \frac{\text{opuesto}}{\text{adyacente}} = \frac{\sen\alpha}{\cos\alpha}` },
      { name: 'Razones recíprocas', tex: R`\operatorname{cosec}\alpha = \frac{1}{\sen\alpha},\quad \sec\alpha = \frac{1}{\cos\alpha},\quad \operatorname{cotg}\alpha = \frac{1}{\tan\alpha}` },
      { name: 'Ángulo a partir de los lados', tex: R`\alpha = \operatorname{arctg}\frac{\text{op}}{\text{ady}}`, note: R`También $\operatorname{arcsen}$ y $\arccos$: en la calculadora, $\sen^{-1}$, $\cos^{-1}$, $\tan^{-1}$.` },
      { name: 'Ángulos complementarios', tex: R`\sen\alpha = \cos(90^\circ - \alpha)` },
    ],
    terms: [
      { term: 'Cateto opuesto', def: 'El cateto que está enfrente del ángulo.' },
      { term: 'Cateto adyacente', def: 'El cateto que forma el ángulo junto con la hipotenusa.' },
      { term: 'Ángulo de elevación', def: 'Ángulo entre la horizontal y la visual hacia un objeto más alto.' },
      { term: 'Ángulo de depresión', def: 'Ángulo entre la horizontal y la visual hacia un objeto más bajo.' },
    ],
    example: {
      problem: 'Desde 20 m de un árbol, la copa se ve con un ángulo de elevación de 35°. ¿Qué altura tiene?',
      steps: [
        { math: R`\tan 35^\circ = \frac{h}{20}`, note: 'La altura es el cateto opuesto; los 20 m, el adyacente.' },
        { math: R`h = 20\cdot\tan 35^\circ \approx 14{,}00\ \text{m}` },
      ],
    },
    mistakes: [
      { wrong: 'Calculadora en RAD con ángulos en grados.', right: 'Configúrala en DEG (grados).' },
      { wrong: R`$\sen\alpha = \frac{\text{adyacente}}{\text{hipotenusa}}$`, right: R`$\sen\alpha = \frac{\text{opuesto}}{\text{hipotenusa}}$` },
      { wrong: R`Para hallar el ángulo: $\alpha = \frac{\text{op}}{\text{hip}}$`, right: R`$\alpha = \operatorname{arcsen}\frac{\text{op}}{\text{hip}}$ (función inversa)` },
    ],
    remember: ['SOH-CAH-TOA: Seno = Opuesto/Hipotenusa, Coseno = Adyacente/Hipotenusa, Tangente = Opuesto/Adyacente.'],
    seeAlso: ['trig.unit-circle', 'trig.triangles'],
  },
  {
    id: 'trig.unit-circle',
    keywords: ['círculo unitario', 'circunferencia trigonométrica', 'radianes', 'radián', 'grados', 'cuadrantes', 'signos', 'valores notables', 'ángulos notables', 'ángulo de referencia', 'reducción al primer cuadrante', 'pi'],
    summary: R`En el círculo de radio 1, el punto del ángulo $\alpha$ es $(\cos\alpha;\ \sen\alpha)$: así se definen las razones para **cualquier** ángulo.`,
    formulas: [
      { name: 'Grados y radianes', tex: R`180^\circ = \pi\ \text{rad}` },
      { name: 'De grados a radianes', tex: R`\alpha_{rad} = \alpha^\circ\cdot\frac{\pi}{180^\circ}` },
      { name: 'Segundo cuadrante', tex: R`\sen(180^\circ - \alpha) = \sen\alpha,\quad \cos(180^\circ - \alpha) = -\cos\alpha` },
      { name: 'Tercer cuadrante', tex: R`\sen(180^\circ + \alpha) = -\sen\alpha,\quad \cos(180^\circ + \alpha) = -\cos\alpha` },
      { name: 'Cuarto cuadrante', tex: R`\sen(360^\circ - \alpha) = -\sen\alpha,\quad \cos(360^\circ - \alpha) = \cos\alpha` },
    ],
    tables: [
      {
        title: 'Valores notables',
        sheet: true,
        headers: ['Ángulo', 'Radianes', R`$\sen$`, R`$\cos$`, R`$\tan$`],
        rows: [
          ['0°', R`$0$`, R`$0$`, R`$1$`, R`$0$`],
          ['30°', R`$\frac{\pi}{6}$`, R`$\frac12$`, R`$\frac{\sqrt3}{2}$`, R`$\frac{\sqrt3}{3}$`],
          ['45°', R`$\frac{\pi}{4}$`, R`$\frac{\sqrt2}{2}$`, R`$\frac{\sqrt2}{2}$`, R`$1$`],
          ['60°', R`$\frac{\pi}{3}$`, R`$\frac{\sqrt3}{2}$`, R`$\frac12$`, R`$\sqrt3$`],
          ['90°', R`$\frac{\pi}{2}$`, R`$1$`, R`$0$`, 'no existe'],
          ['180°', R`$\pi$`, R`$0$`, R`$-1$`, R`$0$`],
          ['270°', R`$\frac{3\pi}{2}$`, R`$-1$`, R`$0$`, 'no existe'],
        ],
      },
      {
        title: 'Signos por cuadrante',
        sheet: true,
        headers: ['Cuadrante', R`$\sen$`, R`$\cos$`, R`$\tan$`],
        rows: [
          ['I (0° a 90°)', '+', '+', '+'],
          ['II (90° a 180°)', '+', '−', '−'],
          ['III (180° a 270°)', '−', '−', '+'],
          ['IV (270° a 360°)', '−', '+', '−'],
        ],
      },
    ],
    terms: [
      { term: 'Radián', def: 'Ángulo que abarca un arco de longitud igual al radio. Una vuelta completa mide 2π rad.' },
      { term: 'Ángulo de referencia', def: 'El ángulo agudo que forma el lado terminal con el eje x; da el valor absoluto de las razones.' },
    ],
    example: {
      problem: R`Calcula $\cos 120^\circ$ y $\sen 225^\circ$.`,
      steps: [
        { math: R`\cos 120^\circ = -\cos 60^\circ = -\frac12`, note: 'II cuadrante: el coseno es negativo.' },
        { math: R`\sen 225^\circ = -\sen 45^\circ = -\frac{\sqrt2}{2}`, note: 'III cuadrante: el seno es negativo.' },
      ],
    },
    mistakes: [
      { wrong: R`$\cos 120^\circ = \frac12$`, right: R`$\cos 120^\circ = -\frac12$` },
      { wrong: R`$30^\circ = \frac{\pi}{3}$`, right: R`$30^\circ = \frac{\pi}{6}$` },
      { wrong: 'El seno o el coseno pueden valer 2.', right: R`Siempre $-1 \le \sen\alpha \le 1$ y $-1 \le \cos\alpha \le 1$.` },
    ],
    remember: [
      'Signos: «Todas, Seno, Tangente, Coseno» son las positivas en los cuadrantes I, II, III y IV.',
      R`Senos de 0°, 30°, 45°, 60° y 90°: $\frac{\sqrt0}{2}, \frac{\sqrt1}{2}, \frac{\sqrt2}{2}, \frac{\sqrt3}{2}, \frac{\sqrt4}{2}$. Los cosenos, en orden inverso.`,
    ],
    seeAlso: ['trig.ratios', 'trig.identities'],
  },
  {
    id: 'trig.identities',
    keywords: ['identidades trigonométricas', 'identidad pitagórica', 'identidad fundamental', 'seno al cuadrado', 'ángulo doble', 'suma de ángulos', 'simplificar expresiones trigonométricas', 'demostrar identidades', 'paridad'],
    summary: R`Una **identidad trigonométrica** es una igualdad que vale para todos los ángulos donde está definida.`,
    formulas: [
      { name: 'Identidad pitagórica', tex: R`\sen^2 x + \cos^2 x = 1` },
      { name: 'Tangente', tex: R`\tan x = \frac{\sen x}{\cos x}` },
      { name: 'Con la tangente', tex: R`1 + \tan^2 x = \frac{1}{\cos^2 x}` },
      { name: 'Ángulo doble', tex: R`\sen 2x = 2\sen x\cos x,\quad \cos 2x = \cos^2 x - \sen^2 x` },
      { name: 'Seno de una suma', tex: R`\sen(a \pm b) = \sen a\cos b \pm \cos a\sen b` },
      { name: 'Coseno de una suma', tex: R`\cos(a \pm b) = \cos a\cos b \mp \sen a\sen b` },
      { name: 'Paridad', tex: R`\sen(-x) = -\sen x,\quad \cos(-x) = \cos x` },
    ],
    steps: {
      title: 'Estrategia para simplificar o demostrar',
      items: [
        'Pasa todo a senos y cosenos.',
        R`Busca $\sen^2 + \cos^2$ (o $1 - \sen^2$, $1 - \cos^2$) para reemplazar.`,
        'Opera las fracciones (denominador común) y factoriza.',
        'Para demostrar, trabaja un solo miembro hasta llegar al otro.',
      ],
    },
    example: {
      problem: R`Demuestra que $(\sen x + \cos x)^2 = 1 + \sen 2x$.`,
      steps: [
        { math: R`(\sen x + \cos x)^2 = \sen^2 x + 2\sen x\cos x + \cos^2 x`, note: 'Cuadrado de un binomio.' },
        { math: R`= 1 + 2\sen x\cos x = 1 + \sen 2x`, note: 'Identidad pitagórica y ángulo doble. ∎' },
      ],
    },
    mistakes: [
      { wrong: R`$\sen^2 x = \sen(x^2)$`, right: R`$\sen^2 x = (\sen x)^2$` },
      { wrong: R`$\sen(a + b) = \sen a + \sen b$`, right: R`$\sen(a + b) = \sen a\cos b + \cos a\sen b$` },
      { wrong: R`$\sen 2x = 2\sen x$`, right: R`$\sen 2x = 2\sen x\cos x$` },
      { wrong: R`$\sen\alpha = \frac35$ en el II cuadrante $\Rightarrow \cos\alpha = \frac45$`, right: R`$\cos\alpha = -\frac45$`, note: 'El signo lo da el cuadrante.' },
    ],
    remember: [R`Si ves $1 - \cos^2 x$, piensa en $\sen^2 x$ (y al revés).`],
    seeAlso: ['trig.unit-circle'],
  },
  {
    id: 'trig.triangles',
    keywords: ['resolución de triángulos', 'teorema del seno', 'teorema del coseno', 'ley de senos', 'ley de cosenos', 'triángulos oblicuángulos', 'triángulos no rectángulos', 'suma de ángulos interiores', 'área con el seno', 'caso ambiguo'],
    summary: R`Para triángulos que no son rectángulos se usan el **teorema del seno** y el **teorema del coseno**.`,
    formulas: [
      { name: 'Teorema del seno', tex: R`\frac{a}{\sen A} = \frac{b}{\sen B} = \frac{c}{\sen C}`, note: R`Cada lado va con el seno de su ángulo **opuesto**.` },
      { name: 'Teorema del coseno', tex: R`c^2 = a^2 + b^2 - 2ab\cos C`, note: R`$C$ es el ángulo comprendido entre $a$ y $b$ (opuesto a $c$).` },
      { name: 'Ángulo a partir de los tres lados', tex: R`\cos C = \frac{a^2 + b^2 - c^2}{2ab}` },
      { name: 'Suma de ángulos interiores', tex: R`A + B + C = 180^\circ` },
      { name: 'Área con dos lados y el ángulo comprendido', tex: R`\text{Área} = \frac12\,a\,b\,\sen C` },
    ],
    tables: [
      {
        title: '¿Qué teorema uso?',
        headers: ['Datos', 'Teorema'],
        rows: [
          ['Dos ángulos y un lado', 'Del seno'],
          ['Dos lados y el ángulo opuesto a uno de ellos', 'Del seno (caso ambiguo: puede haber 0, 1 o 2 triángulos)'],
          ['Dos lados y el ángulo comprendido', 'Del coseno'],
          ['Los tres lados', 'Del coseno'],
        ],
      },
    ],
    example: {
      problem: R`En un triángulo, $A = 40^\circ$, $B = 60^\circ$ y $c = 10$. Halla los otros lados.`,
      steps: [
        { math: R`C = 180^\circ - 40^\circ - 60^\circ = 80^\circ` },
        { math: R`a = \frac{10\cdot\sen 40^\circ}{\sen 80^\circ} \approx 6{,}53` },
        { math: R`b = \frac{10\cdot\sen 60^\circ}{\sen 80^\circ} \approx 8{,}79` },
      ],
    },
    mistakes: [
      { wrong: 'Usar Pitágoras en un triángulo que no es rectángulo.', right: 'Teorema del coseno (con un ángulo de 90° se convierte en Pitágoras).' },
      { wrong: 'En el teorema del seno, emparejar un lado con un ángulo que no es el opuesto.', right: 'Cada lado va con el seno del ángulo que tiene enfrente.' },
    ],
    remember: ['El teorema del coseno es «Pitágoras con corrección»: −2ab·cos C.'],
    seeAlso: ['trig.ratios', 'geo.pythagoras'],
  },
];
