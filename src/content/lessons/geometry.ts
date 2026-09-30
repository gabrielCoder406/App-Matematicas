import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_GEOMETRY: Lesson[] = [
  {
    skillId: 'geo.plane',
    intro: 'El **perímetro** mide el contorno (unidades de longitud) y el **área** la superficie encerrada (unidades cuadradas).',
    sections: [
      {
        type: 'text',
        title: 'Fórmulas',
        body: R`- Rectángulo: $A = b\cdot h$, $P = 2(b + h)$. Cuadrado: $A = l^2$, $P = 4l$.
- Triángulo: $A = \frac{b\cdot h}{2}$ (la altura es perpendicular a la base).
- Paralelogramo: $A = b\cdot h$. Rombo: $A = \frac{D\cdot d}{2}$.
- Trapecio: $A = \frac{(B + b)\cdot h}{2}$.
- Círculo: $A = \pi r^2$; circunferencia: $L = 2\pi r$.`,
      },
      {
        type: 'example',
        title: 'Figura compuesta',
        problem: 'Una ventana es un rectángulo de 2 m × 3 m con un semicírculo de diámetro 2 m encima.',
        steps: [
          { math: R`A_{rect} = 2\cdot 3 = 6\ \text{m}^2` },
          { math: R`A_{semi} = \frac{\pi\cdot 1^2}{2} \approx 1{,}57\ \text{m}^2`, note: 'El radio es la mitad del diámetro.' },
          { math: R`A \approx 7{,}57\ \text{m}^2` },
        ],
      },
      { type: 'tip', body: 'En el paralelogramo y el triángulo se usa la **altura** (perpendicular), no el lado inclinado. Y no confundas radio con diámetro.' },
      { type: 'check', generatorId: 'geo.area', level: 1 },
      { type: 'check', generatorId: 'geo.area', level: 2 },
      { type: 'summary', points: ['Área en unidades², perímetro en unidades.', 'Figuras compuestas: descomponer en figuras simples.'] },
    ],
  },
  {
    skillId: 'geo.pythagoras',
    intro: 'En todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: $a^2 + b^2 = c^2$.',
    sections: [
      {
        type: 'widget',
        widget: 'pythagoras',
        props: { a: 3, b: 4 },
        caption: 'Arrastra los vértices: el área del cuadrado grande siempre es igual a la suma de las áreas de los dos cuadrados pequeños.',
      },
      {
        type: 'example',
        title: 'Calcular un cateto',
        problem: 'La hipotenusa mide 13 y un cateto 5. ¿Cuánto mide el otro?',
        steps: [
          { math: R`b^2 = c^2 - a^2 = 169 - 25 = 144` },
          { math: R`b = \sqrt{144} = 12` },
        ],
      },
      {
        type: 'text',
        title: 'Recíproco',
        body: R`Si en un triángulo se cumple $a^2 + b^2 = c^2$ (con $c$ el lado mayor), entonces es rectángulo. Así se reconoce que 5, 12, 13 forma un triángulo rectángulo.`,
      },
      { type: 'tip', title: 'Error frecuente', body: 'Para hallar un **cateto** se resta ($c^2 - a^2$), no se suma. La hipotenusa es siempre el lado más largo.' },
      { type: 'check', generatorId: 'pyth.side', level: 1 },
      { type: 'check', generatorId: 'pyth.is-right', level: 1 },
      { type: 'summary', points: [R`$c = \sqrt{a^2 + b^2}$ y $a = \sqrt{c^2 - b^2}$.`, 'Solo vale en triángulos rectángulos.'] },
    ],
  },
  {
    skillId: 'geo.thales',
    intro: 'Si varias rectas **paralelas** cortan a dos transversales, los segmentos que determinan son **proporcionales**.',
    sections: [
      {
        type: 'widget',
        widget: 'thales',
        props: {},
        caption: 'Mueve las paralelas y las transversales: el cociente entre segmentos correspondientes se mantiene igual.',
      },
      {
        type: 'example',
        title: 'Sombras',
        problem: 'Un palo de 2 m da una sombra de 1,5 m; a la misma hora, un árbol da una sombra de 9 m. ¿Cuánto mide el árbol?',
        steps: [
          { note: 'Los rayos del sol son paralelos: los triángulos palo-sombra y árbol-sombra son semejantes.' },
          { math: R`\frac{2}{1{,}5} = \frac{h}{9} \Rightarrow h = \frac{2\cdot 9}{1{,}5} = 12\ \text{m}` },
        ],
      },
      { type: 'text', title: 'Semejanza', body: R`Dos triángulos son **semejantes** si tienen los mismos ángulos; entonces sus lados son proporcionales con razón $k$, y sus áreas están en razón $k^2$.` },
      { type: 'check', generatorId: 'thales.segments', level: 1 },
      { type: 'check', generatorId: 'thales.shadow', level: 2 },
      { type: 'summary', points: [R`$\frac{a}{b} = \frac{c}{d}$ entre paralelas.`, 'Lados en razón k ⇒ áreas en razón k².'] },
    ],
  },
  {
    skillId: 'geo.solids',
    intro: 'Los cuerpos geométricos tienen **área** (superficie que los envuelve) y **volumen** (espacio que ocupan, en unidades cúbicas).',
    sections: [
      {
        type: 'text',
        title: 'Volúmenes',
        body: R`- Prisma y cilindro: $V = A_{base}\cdot h$ (cilindro: $V = \pi r^2 h$).
- Pirámide y cono: $V = \frac{A_{base}\cdot h}{3}$ (cono: $V = \frac{\pi r^2 h}{3}$).
- Esfera: $V = \frac{4}{3}\pi r^3$. Cubo: $V = a^3$.`,
      },
      {
        type: 'text',
        title: 'Áreas',
        body: R`- Cubo: $6a^2$. Prisma rectangular: $2(ab + ac + bc)$.
- Cilindro: $2\pi r^2 + 2\pi r h$ (dos tapas + la cara lateral, que desplegada es un rectángulo).
- Esfera: $4\pi r^2$.`,
      },
      {
        type: 'example',
        title: 'Cilindro',
        problem: 'Radio 3 cm, altura 10 cm.',
        steps: [
          { math: R`V = \pi\cdot 3^2\cdot 10 = 90\pi \approx 282{,}74\ \text{cm}^3` },
          { math: R`A = 2\pi\cdot 9 + 2\pi\cdot 3\cdot 10 = 78\pi \approx 245{,}04\ \text{cm}^2` },
        ],
      },
      { type: 'tip', body: 'Un cono tiene exactamente un tercio del volumen del cilindro de igual base y altura. Lo mismo pasa entre pirámide y prisma.' },
      { type: 'check', generatorId: 'solids.volume', level: 1 },
      { type: 'check', generatorId: 'solids.volume', level: 2 },
      { type: 'summary', points: ['Prisma/cilindro: base × altura.', 'Pirámide/cono: un tercio de eso.'] },
    ],
  },
  {
    skillId: 'trig.ratios',
    intro: 'En un triángulo rectángulo, los cocientes entre lados dependen solo del ángulo: son las **razones trigonométricas**.',
    sections: [
      {
        type: 'text',
        title: 'Definiciones',
        body: R`Para un ángulo agudo $\alpha$: $$\operatorname{sen}\alpha = \frac{\text{opuesto}}{\text{hipotenusa}},\quad \cos\alpha = \frac{\text{adyacente}}{\text{hipotenusa}},\quad \tan\alpha = \frac{\text{opuesto}}{\text{adyacente}}$$`,
      },
      {
        type: 'widget',
        widget: 'triangle-solver',
        props: { mode: 'right' },
        caption: 'Cambia el ángulo y la hipotenusa: los lados cambian, pero seno, coseno y tangente dependen solo del ángulo.',
      },
      {
        type: 'example',
        title: 'Calcular un lado',
        problem: R`Hipotenusa 10, ángulo $35^\circ$. ¿Cateto opuesto?`,
        steps: [
          { math: R`\operatorname{sen} 35^\circ = \frac{x}{10}` },
          { math: R`x = 10\cdot\operatorname{sen}35^\circ \approx 5{,}74` },
        ],
      },
      { type: 'tip', body: 'Configura la calculadora en **grados** (DEG) si los ángulos están en grados. Para hallar un ángulo usa la función inversa: $\\alpha = \\arctan\\frac{op}{ady}$.' },
      { type: 'check', generatorId: 'trig.ratios-sides', level: 1 },
      { type: 'check', generatorId: 'trig.find-side', level: 2 },
      { type: 'summary', points: ['sen = op/hip, cos = ady/hip, tan = op/ady.', 'Para un ángulo: funciones inversas.'] },
    ],
  },
  {
    skillId: 'trig.unit-circle',
    intro: 'El **círculo unitario** (radio 1) extiende las razones trigonométricas a cualquier ángulo: el punto del ángulo $\\alpha$ es $(\\cos\\alpha, \\operatorname{sen}\\alpha)$.',
    sections: [
      {
        type: 'widget',
        widget: 'unit-circle',
        props: { angle: 30 },
        caption: 'Arrastra el punto: la coordenada x es el coseno y la y es el seno. Observa los signos en cada cuadrante.',
      },
      {
        type: 'text',
        title: 'Radianes',
        body: R`Un **radián** es el ángulo que abarca un arco de longitud igual al radio. $180^\circ = \pi$ rad, así que $90^\circ = \frac{\pi}{2}$, $60^\circ = \frac{\pi}{3}$, $45^\circ = \frac{\pi}{4}$, $30^\circ = \frac{\pi}{6}$.`,
      },
      {
        type: 'text',
        title: 'Valores notables',
        body: R`$\operatorname{sen}30^\circ = \frac12$, $\operatorname{sen}45^\circ = \frac{\sqrt2}{2}$, $\operatorname{sen}60^\circ = \frac{\sqrt3}{2}$, y los cosenos en orden inverso. Para otros cuadrantes se usa el **ángulo de referencia** y el signo del cuadrante: $\cos 120^\circ = -\cos 60^\circ = -\frac12$.`,
      },
      { type: 'tip', body: 'Signos: en el I cuadrante todo es positivo; en el II solo el seno; en el III solo la tangente; en el IV solo el coseno.' },
      { type: 'check', generatorId: 'unit.exact', level: 1 },
      { type: 'check', generatorId: 'unit.radians', level: 1 },
      { type: 'summary', points: ['Punto del ángulo: (cos α, sen α).', '180° = π rad.'] },
    ],
  },
  {
    skillId: 'trig.identities',
    intro: 'Una **identidad trigonométrica** es una igualdad que vale para todos los ángulos. La más importante sale de Pitágoras en el círculo unitario.',
    sections: [
      {
        type: 'text',
        title: 'Identidades fundamentales',
        body: R`$$\operatorname{sen}^2 x + \cos^2 x = 1 \qquad \tan x = \frac{\operatorname{sen} x}{\cos x}$$ De la primera: $\operatorname{sen}^2x = 1 - \cos^2x$ y $\cos^2 x = 1 - \operatorname{sen}^2 x$.`,
      },
      {
        type: 'example',
        title: 'Simplificar',
        problem: R`$\frac{1 - \operatorname{sen}^2 x}{\cos x}$`,
        steps: [
          { math: R`= \frac{\cos^2 x}{\cos x}`, note: 'Identidad pitagórica.' },
          { math: R`= \cos x` },
        ],
      },
      {
        type: 'example',
        title: 'Hallar las otras razones',
        problem: R`$\operatorname{sen}\alpha = \frac35$ con $\alpha$ en el II cuadrante.`,
        steps: [
          { math: R`\cos^2\alpha = 1 - \frac{9}{25} = \frac{16}{25} \Rightarrow \cos\alpha = -\frac45`, note: 'En el II cuadrante el coseno es negativo.' },
          { math: R`\tan\alpha = \frac{3/5}{-4/5} = -\frac34` },
        ],
      },
      { type: 'tip', body: 'Estrategia: pasa todo a senos y cosenos, busca $\\operatorname{sen}^2 + \\cos^2$ y factoriza.' },
      { type: 'check', generatorId: 'ident.simplify', level: 1 },
      { type: 'check', generatorId: 'ident.find-others', level: 2 },
      { type: 'summary', points: ['sen² + cos² = 1.', 'tan = sen/cos.'] },
    ],
  },
  {
    skillId: 'trig.triangles',
    intro: 'Para triángulos que **no** son rectángulos se usan dos teoremas que relacionan lados y ángulos.',
    sections: [
      {
        type: 'text',
        title: 'Teoremas',
        body: R`- **Del seno**: $\frac{a}{\operatorname{sen}A} = \frac{b}{\operatorname{sen}B} = \frac{c}{\operatorname{sen}C}$. Útil con dos ángulos y un lado.
- **Del coseno**: $c^2 = a^2 + b^2 - 2ab\cos C$. Útil con dos lados y el ángulo comprendido, o con los tres lados.
- Además: $A + B + C = 180^\circ$.`,
      },
      {
        type: 'widget',
        widget: 'triangle-solver',
        props: { mode: 'general' },
        caption: 'Arrastra los vértices: los lados y ángulos se recalculan y puedes comprobar ambos teoremas.',
      },
      {
        type: 'example',
        title: 'Teorema del coseno',
        problem: R`Lados 7 y 9 con ángulo comprendido de $60^\circ$.`,
        steps: [
          { math: R`c^2 = 49 + 81 - 2\cdot 7\cdot 9\cdot\cos 60^\circ = 130 - 63 = 67` },
          { math: R`c = \sqrt{67} \approx 8{,}19` },
        ],
      },
      { type: 'tip', body: 'Con el ángulo de elevación y la distancia horizontal, la altura es: distancia × tangente del ángulo.' },
      { type: 'check', generatorId: 'tri.elevation', level: 2 },
      { type: 'check', generatorId: 'tri.cosines', level: 2 },
      { type: 'summary', points: ['Dos ángulos y un lado → teorema del seno.', 'Dos lados y el ángulo entre ellos → teorema del coseno.'] },
    ],
  },
];
