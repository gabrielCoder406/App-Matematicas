// Temario: bloques y habilidades con sus dependencias (grafo de conocimiento).
import type { Block, BlockId, Skill } from './types';

const R = String.raw;

export const BLOCKS: Block[] = [
  { id: 'logica', number: 1, title: 'Lógica matemática y conjuntos', short: 'Lógica', hue: 265, description: 'Proposiciones, tablas de verdad, leyes lógicas, conjuntos, cuantificadores, demostraciones y álgebra de Boole.' },
  { id: 'aritmetica', number: 2, title: 'Aritmética fundamental', short: 'Aritmética', hue: 25, description: 'Conjuntos numéricos, signos, fracciones, decimales, porcentajes, proporcionalidad, potencias y raíces.' },
  { id: 'algebra', number: 3, title: 'Álgebra básica e intermedia', short: 'Álgebra', hue: 212, description: 'Lenguaje algebraico, polinomios, productos notables, factoreo, ecuaciones, inecuaciones y sistemas.' },
  { id: 'geometria', number: 4, title: 'Geometría y trigonometría', short: 'Geometría', hue: 150, description: 'Perímetros, áreas, Pitágoras, Tales, cuerpos, razones trigonométricas, círculo unitario e identidades.' },
  { id: 'funciones', number: 5, title: 'Funciones y modelado gráfico', short: 'Funciones', hue: 325, description: 'Dominio, imagen, funciones lineales, cuadráticas, polinómicas, racionales, exponenciales y logarítmicas.' },
  { id: 'calculo', number: 6, title: 'Introducción al cálculo', short: 'Cálculo', hue: 0, description: 'Límites, continuidad, derivadas, rectas tangentes, optimización, integrales y áreas.' },
  { id: 'lineal', number: 7, title: 'Álgebra lineal básica', short: 'Álgebra lineal', hue: 185, description: 'Vectores en 2D y 3D, matrices, determinantes y sistemas con Gauss-Jordan y Cramer.' },
  { id: 'estadistica', number: 8, title: 'Estadística y probabilidad', short: 'Estadística', hue: 42, description: 'Estadística descriptiva, gráficos, combinatoria y probabilidad.' },
];

export const SKILLS: Skill[] = [
  // ---------------------------- Bloque 1 ----------------------------
  {
    id: 'logic.connectives', block: 'logica', title: 'Proposiciones y conectores', minutes: 5, prereqs: [],
    summary: 'Proposiciones simples y compuestas; negación, conjunción, disyunción, implicación y bicondicional.',
    concept: R`$\neg p$ invierte el valor de $p$. $p \land q$ es V solo si ambas son V. $p \lor q$ es F solo si ambas son F. $p \Rightarrow q$ es F solo cuando $p$ es V y $q$ es F. $p \Leftrightarrow q$ es V cuando ambas tienen el mismo valor.`,
  },
  {
    id: 'logic.truth-tables', block: 'logica', title: 'Tablas de verdad', minutes: 6, prereqs: ['logic.connectives'],
    summary: 'Construir tablas de verdad y clasificar fórmulas en tautología, contradicción o contingencia.',
    concept: R`Con $n$ variables hay $2^n$ filas. Se evalúa de adentro hacia afuera, una columna por cada subfórmula. Tautología: siempre V. Contradicción: siempre F. Contingencia: a veces V y a veces F.`,
  },
  {
    id: 'logic.laws', block: 'logica', title: 'Leyes lógicas e inferencia', minutes: 7, prereqs: ['logic.truth-tables'],
    summary: 'De Morgan, doble negación, contrarrecíproca, Modus Ponens y Modus Tollens.',
    concept: R`De Morgan: $\neg(p\land q)\equiv\neg p\lor\neg q$ y $\neg(p\lor q)\equiv\neg p\land\neg q$. Implicación: $p\Rightarrow q\equiv\neg p\lor q\equiv\neg q\Rightarrow\neg p$. Modus Ponens: de $p\Rightarrow q$ y $p$ se deduce $q$. Modus Tollens: de $p\Rightarrow q$ y $\neg q$ se deduce $\neg p$.`,
  },
  {
    id: 'sets.basics', block: 'logica', title: 'Conjuntos: pertenencia e inclusión', minutes: 4, prereqs: [],
    summary: 'Conjuntos por extensión y comprensión, pertenencia, inclusión y conjunto vacío.',
    concept: R`$\in$ relaciona un **elemento** con un conjunto; $\subseteq$ relaciona **dos conjuntos**: $A \subseteq B$ si todo elemento de $A$ está en $B$. El vacío está incluido en todo conjunto. Un conjunto de $n$ elementos tiene $2^n$ subconjuntos.`,
  },
  {
    id: 'sets.operations', block: 'logica', title: 'Operaciones con conjuntos', minutes: 6, prereqs: ['sets.basics'],
    summary: 'Unión, intersección, diferencia, complemento y diagramas de Venn.',
    concept: R`$A\cup B$: elementos que están en $A$ o en $B$. $A\cap B$: los que están en ambos. $A-B$: los de $A$ que no están en $B$. $A^c$: los del universal que no están en $A$. $|A\cup B|=|A|+|B|-|A\cap B|$.`,
  },
  {
    id: 'logic.quantifiers', block: 'logica', title: 'Cuantificadores', minutes: 5, prereqs: ['logic.connectives', 'sets.basics'],
    summary: 'Cuantificador universal y existencial; negación de proposiciones cuantificadas.',
    concept: R`$\forall x: P(x)$ es V si **todos** cumplen $P$ (basta un contraejemplo para que sea F). $\exists x: P(x)$ es V si **al menos uno** cumple. Negación: $\neg\forall x: P(x) \equiv \exists x: \neg P(x)$ y $\neg\exists x: P(x)\equiv\forall x: \neg P(x)$.`,
  },
  {
    id: 'logic.proofs', block: 'logica', title: 'Métodos de demostración', minutes: 7, prereqs: ['logic.laws', 'logic.quantifiers'],
    summary: 'Demostración directa, por reducción al absurdo, contraejemplo e inducción matemática.',
    concept: R`Directa: de la hipótesis a la tesis. Absurdo: suponer la negación de la tesis y llegar a una contradicción. Contraejemplo: un caso concreto que refuta un «para todo». Inducción: caso base $P(1)$ y paso inductivo $P(k)\Rightarrow P(k+1)$.`,
  },
  {
    id: 'logic.boolean', block: 'logica', title: 'Álgebra de Boole y compuertas', minutes: 5, prereqs: ['logic.truth-tables'],
    summary: 'Compuertas AND, OR, NOT y XOR; circuitos y expresiones booleanas.',
    concept: R`AND ($A\cdot B$) da 1 solo si ambas entradas son 1. OR ($A+B$) da 1 si alguna es 1. NOT ($\overline{A}$) invierte la entrada. XOR ($A\oplus B$) da 1 si las entradas son distintas.`,
  },

  // ---------------------------- Bloque 2 ----------------------------
  {
    id: 'arith.number-sets', block: 'aritmetica', title: 'Conjuntos numéricos', minutes: 4, prereqs: [],
    summary: 'Naturales, enteros, racionales, irracionales y reales.',
    concept: R`$\mathbb{N}\subset\mathbb{Z}\subset\mathbb{Q}\subset\mathbb{R}$. Un racional se puede escribir como fracción de enteros (su decimal es finito o periódico). Los irracionales, como $\sqrt{2}$ o $\pi$, tienen infinitas cifras decimales no periódicas.`,
  },
  {
    id: 'arith.signs', block: 'aritmetica', title: 'Operaciones con signos', minutes: 5, prereqs: ['arith.number-sets'],
    summary: 'Suma, resta, multiplicación y división de enteros; jerarquía de operaciones.',
    concept: R`Regla de los signos: $(+)\cdot(+)=+$, $(-)\cdot(-)=+$, $(+)\cdot(-)=-$. Orden de las operaciones: paréntesis, potencias y raíces, multiplicaciones y divisiones, sumas y restas.`,
  },
  {
    id: 'arith.fractions', block: 'aritmetica', title: 'Fracciones', minutes: 6, prereqs: ['arith.signs'],
    summary: 'Simplificar, sumar, restar, multiplicar y dividir fracciones.',
    concept: R`Para sumar o restar, lleva a denominador común. Para multiplicar, numerador por numerador y denominador por denominador. Para dividir, multiplica por la inversa. Simplifica dividiendo numerador y denominador por su MCD.`,
  },
  {
    id: 'arith.decimals-percent', block: 'aritmetica', title: 'Decimales y porcentajes', minutes: 5, prereqs: ['arith.fractions'],
    summary: 'Conversión entre decimales y fracciones, porcentajes, aumentos y descuentos.',
    concept: R`El $p\%$ de $N$ es $\frac{p}{100}\cdot N$. Un aumento del $p\%$ multiplica por $1+\frac{p}{100}$; un descuento del $p\%$ multiplica por $1-\frac{p}{100}$.`,
  },
  {
    id: 'arith.proportion', block: 'aritmetica', title: 'Regla de tres', minutes: 6, prereqs: ['arith.decimals-percent'],
    summary: 'Proporcionalidad directa e inversa; regla de tres simple y compuesta.',
    concept: R`Directa: si una magnitud se duplica, la otra también ($\frac{a}{b}=\frac{c}{x}$). Inversa: si una se duplica, la otra se reduce a la mitad ($a\cdot b = c\cdot x$). En la compuesta, analiza cada magnitud por separado respecto de la incógnita.`,
  },
  {
    id: 'arith.powers', block: 'aritmetica', title: 'Potencias', minutes: 6, prereqs: ['arith.signs', 'arith.fractions'],
    summary: 'Potencias de exponente entero y sus propiedades.',
    concept: R`$a^m\cdot a^n=a^{m+n}$, $\frac{a^m}{a^n}=a^{m-n}$, $(a^m)^n=a^{m\cdot n}$, $(ab)^n=a^nb^n$, $a^0=1$, $a^{-n}=\frac{1}{a^n}$. Cuidado: $-2^2=-4$ pero $(-2)^2=4$.`,
  },
  {
    id: 'arith.roots', block: 'aritmetica', title: 'Radicación', minutes: 6, prereqs: ['arith.powers'],
    summary: 'Raíces, exponentes fraccionarios, simplificación de radicales y racionalización.',
    concept: R`$\sqrt[n]{a^m}=a^{m/n}$, $\sqrt{a\cdot b}=\sqrt a\cdot\sqrt b$, $\sqrt{\frac ab}=\frac{\sqrt a}{\sqrt b}$. Pero $\sqrt{a+b}\neq\sqrt a+\sqrt b$. Las raíces de índice par de números negativos no son reales.`,
  },

  // ---------------------------- Bloque 3 ----------------------------
  {
    id: 'alg.like-terms', block: 'algebra', title: 'Lenguaje algebraico y términos semejantes', minutes: 5, prereqs: ['arith.signs'],
    summary: 'Traducir enunciados al lenguaje algebraico y reducir términos semejantes.',
    concept: R`Los términos semejantes tienen la misma parte literal (mismas letras con los mismos exponentes). Se suman sus coeficientes: $3x^2 + 5x^2 = 8x^2$, pero $3x^2 + 5x$ no se puede reducir.`,
  },
  {
    id: 'alg.polynomials', block: 'algebra', title: 'Polinomios', minutes: 7, prereqs: ['alg.like-terms', 'arith.powers'],
    summary: 'Grado, valor numérico, operaciones con polinomios y regla de Ruffini.',
    concept: R`El grado es el mayor exponente de la variable. Para multiplicar, cada término del primero por cada término del segundo. Teorema del resto: el resto de dividir $P(x)$ por $(x-a)$ es $P(a)$.`,
  },
  {
    id: 'alg.notable-products', block: 'algebra', title: 'Productos notables', minutes: 5, prereqs: ['alg.polynomials'],
    summary: 'Cuadrado y cubo de un binomio; suma por diferencia.',
    concept: R`$(a+b)^2=a^2+2ab+b^2$, $(a-b)^2=a^2-2ab+b^2$, $(a+b)(a-b)=a^2-b^2$, $(a+b)^3=a^3+3a^2b+3ab^2+b^3$.`,
  },
  {
    id: 'alg.factoring', block: 'algebra', title: 'Factoreo', minutes: 7, prereqs: ['alg.notable-products'],
    summary: 'Factor común, diferencia de cuadrados, trinomio cuadrado perfecto y trinomio de segundo grado.',
    concept: R`Orden sugerido: 1) factor común; 2) diferencia de cuadrados $a^2-b^2=(a+b)(a-b)$; 3) trinomio cuadrado perfecto $a^2\pm 2ab+b^2=(a\pm b)^2$; 4) trinomio $ax^2+bx+c=a(x-x_1)(x-x_2)$ usando sus raíces.`,
  },
  {
    id: 'alg.linear-equations', block: 'algebra', title: 'Ecuaciones lineales', minutes: 6, prereqs: ['alg.like-terms', 'arith.fractions'],
    summary: 'Ecuaciones de primer grado con paréntesis y fracciones.',
    concept: R`Una ecuación es como una balanza en equilibrio: lo que hagas en un miembro, hazlo en el otro. Puedes sumar o restar lo mismo a ambos lados, o multiplicar y dividir ambos lados por el mismo número distinto de 0.`,
  },
  {
    id: 'alg.linear-inequalities', block: 'algebra', title: 'Inecuaciones lineales', minutes: 5, prereqs: ['alg.linear-equations'],
    summary: 'Inecuaciones de primer grado y su solución en forma de intervalo.',
    concept: R`Se resuelven como las ecuaciones, pero **al multiplicar o dividir por un número negativo la desigualdad cambia de sentido**. La solución es un intervalo: $x > 2 \iff x\in(2, +\infty)$.`,
  },
  {
    id: 'alg.quadratic', block: 'algebra', title: 'Ecuaciones cuadráticas', minutes: 7, prereqs: ['alg.factoring', 'alg.linear-equations', 'arith.roots'],
    summary: 'Ecuaciones incompletas, fórmula resolvente, discriminante e inecuaciones cuadráticas.',
    concept: R`$ax^2+bx+c=0 \Rightarrow x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}$. El discriminante $\Delta=b^2-4ac$ indica cuántas soluciones hay: $\Delta>0$ dos, $\Delta=0$ una (doble), $\Delta<0$ ninguna real.`,
  },
  {
    id: 'alg.systems', block: 'algebra', title: 'Sistemas de ecuaciones lineales', minutes: 7, prereqs: ['alg.linear-equations'],
    summary: 'Sistemas 2×2: sustitución, igualación, reducción y método gráfico.',
    concept: R`Sustitución: despeja una incógnita y reemplázala en la otra ecuación. Reducción: multiplica las ecuaciones para que, al sumarlas, se cancele una incógnita. Gráficamente, la solución es el punto donde se cortan las rectas.`,
  },

  // ---------------------------- Bloque 4 ----------------------------
  {
    id: 'geo.plane', block: 'geometria', title: 'Perímetros y áreas', minutes: 5, prereqs: ['arith.decimals-percent'],
    summary: 'Figuras planas: rectángulo, triángulo, círculo, trapecio y figuras compuestas.',
    concept: R`Rectángulo: $b\cdot h$. Triángulo: $\frac{b\cdot h}{2}$. Círculo: $\pi r^2$ (perímetro $2\pi r$). Trapecio: $\frac{(B+b)\cdot h}{2}$. El perímetro es la suma de los lados.`,
  },
  {
    id: 'geo.pythagoras', block: 'geometria', title: 'Teorema de Pitágoras', minutes: 5, prereqs: ['geo.plane', 'arith.roots'],
    summary: 'Relación entre los catetos y la hipotenusa de un triángulo rectángulo.',
    concept: R`En un triángulo rectángulo, $a^2+b^2=c^2$, donde $c$ es la hipotenusa (el lado opuesto al ángulo recto, el más largo). Para hallar un cateto: $a=\sqrt{c^2-b^2}$.`,
  },
  {
    id: 'geo.thales', block: 'geometria', title: 'Teorema de Tales y semejanza', minutes: 5, prereqs: ['geo.plane', 'arith.proportion'],
    summary: 'Segmentos proporcionales entre paralelas y triángulos semejantes.',
    concept: R`Si varias rectas paralelas cortan a dos transversales, los segmentos que determinan son proporcionales: $\frac{a}{b}=\frac{c}{d}$. En triángulos semejantes, los lados correspondientes son proporcionales.`,
  },
  {
    id: 'geo.solids', block: 'geometria', title: 'Cuerpos geométricos', minutes: 6, prereqs: ['geo.plane', 'arith.powers'],
    summary: 'Áreas y volúmenes de prismas, cilindros, pirámides, conos y esferas.',
    concept: R`Prisma y cilindro: $V=A_{base}\cdot h$. Pirámide y cono: $V=\frac{A_{base}\cdot h}{3}$. Esfera: $V=\frac{4}{3}\pi r^3$ y $A=4\pi r^2$. Cubo de arista $a$: $V=a^3$, $A=6a^2$.`,
  },
  {
    id: 'trig.ratios', block: 'geometria', title: 'Razones trigonométricas', minutes: 6, prereqs: ['geo.pythagoras', 'geo.thales'],
    summary: 'Seno, coseno y tangente en el triángulo rectángulo.',
    concept: R`$\operatorname{sen}\alpha=\frac{\text{opuesto}}{\text{hipotenusa}}$, $\cos\alpha=\frac{\text{adyacente}}{\text{hipotenusa}}$, $\tan\alpha=\frac{\text{opuesto}}{\text{adyacente}}$.`,
  },
  {
    id: 'trig.unit-circle', block: 'geometria', title: 'Círculo unitario', minutes: 6, prereqs: ['trig.ratios'],
    summary: 'Radianes, valores exactos y signos de las razones en cada cuadrante.',
    concept: R`En el círculo de radio 1, el punto correspondiente al ángulo $\alpha$ es $(\cos\alpha, \operatorname{sen}\alpha)$. $180° = \pi$ rad. Para 30°, 45° y 60° los valores son $\frac12$, $\frac{\sqrt2}{2}$ y $\frac{\sqrt3}{2}$.`,
  },
  {
    id: 'trig.identities', block: 'geometria', title: 'Identidades trigonométricas', minutes: 6, prereqs: ['trig.unit-circle', 'alg.factoring'],
    summary: 'Identidad pitagórica y simplificación de expresiones trigonométricas.',
    concept: R`$\operatorname{sen}^2 x+\cos^2 x=1$ y $\tan x=\frac{\operatorname{sen}x}{\cos x}$. Estrategia: escribe todo en términos de seno y coseno y simplifica.`,
  },
  {
    id: 'trig.triangles', block: 'geometria', title: 'Resolución de triángulos', minutes: 7, prereqs: ['trig.ratios'],
    summary: 'Teoremas del seno y del coseno; problemas de aplicación.',
    concept: R`Teorema del seno: $\frac{a}{\operatorname{sen}A}=\frac{b}{\operatorname{sen}B}=\frac{c}{\operatorname{sen}C}$. Teorema del coseno: $c^2=a^2+b^2-2ab\cos C$. La suma de los ángulos interiores es 180°.`,
  },

  // ---------------------------- Bloque 5 ----------------------------
  {
    id: 'fn.basics', block: 'funciones', title: 'Dominio, imagen e intersecciones', minutes: 6, prereqs: ['alg.linear-equations', 'alg.linear-inequalities'],
    summary: 'Dominio, codominio, imagen e intersecciones con los ejes.',
    concept: R`Dominio: valores de $x$ para los que la función existe (no se divide por 0, no hay raíces de índice par de negativos). Corte con el eje $y$: $f(0)$. Cortes con el eje $x$: soluciones de $f(x)=0$.`,
  },
  {
    id: 'fn.linear', block: 'funciones', title: 'Funciones lineales y afines', minutes: 6, prereqs: ['fn.basics'],
    summary: 'Pendiente, ordenada al origen, rectas paralelas y perpendiculares.',
    concept: R`En $f(x)=mx+b$, la pendiente es $m=\frac{y_2-y_1}{x_2-x_1}$ y $b$ es la ordenada al origen. Rectas paralelas: igual pendiente. Perpendiculares: $m_1\cdot m_2=-1$.`,
  },
  {
    id: 'fn.quadratic', block: 'funciones', title: 'Funciones cuadráticas', minutes: 6, prereqs: ['fn.linear', 'alg.quadratic'],
    summary: 'Vértice, eje de simetría, raíces, concavidad y forma canónica.',
    concept: R`En $f(x)=ax^2+bx+c$ el vértice está en $x_v=-\frac{b}{2a}$, $y_v=f(x_v)$. Forma canónica: $f(x)=a(x-x_v)^2+y_v$. Si $a>0$ la parábola abre hacia arriba y el vértice es un mínimo.`,
  },
  {
    id: 'fn.poly-rational', block: 'funciones', title: 'Polinómicas, racionales e irracionales', minutes: 6, prereqs: ['fn.quadratic', 'alg.factoring'],
    summary: 'Raíces de polinomios, asíntotas de funciones racionales y dominio de irracionales.',
    concept: R`Asíntota vertical: donde se anula el denominador (y no el numerador). Asíntota horizontal de un cociente de polinomios: si los grados son iguales, es el cociente de los coeficientes principales; si el numerador tiene menor grado, es $y=0$.`,
  },
  {
    id: 'fn.exp-log', block: 'funciones', title: 'Exponenciales y logaritmos', minutes: 7, prereqs: ['fn.basics', 'arith.powers'],
    summary: 'Propiedades de los logaritmos, ecuaciones exponenciales y modelos de crecimiento.',
    concept: R`$\log_a b = c \iff a^c = b$. $\log(x\cdot y)=\log x+\log y$, $\log\frac{x}{y}=\log x-\log y$, $\log x^n = n\log x$. Para despejar un exponente, aplica logaritmos o iguala bases.`,
  },

  // ---------------------------- Bloque 6 ----------------------------
  {
    id: 'calc.limits', block: 'calculo', title: 'Límites y continuidad', minutes: 7, prereqs: ['fn.poly-rational'],
    summary: 'Límites por sustitución, indeterminaciones 0/0, límites en el infinito y continuidad.',
    concept: R`Primero sustituye. Si queda $\frac{0}{0}$, factoriza y simplifica. En el infinito, para cocientes de polinomios compara los grados. Una función es continua en $a$ si $\lim_{x\to a} f(x) = f(a)$.`,
  },
  {
    id: 'calc.derivatives', block: 'calculo', title: 'Derivadas', minutes: 7, prereqs: ['calc.limits'],
    summary: 'La derivada como tasa de cambio y reglas de derivación.',
    concept: R`$(x^n)'=n\,x^{n-1}$, $(k)'=0$, $(f\pm g)'=f'\pm g'$, $(f\cdot g)'=f'g+fg'$, $\left(\frac fg\right)'=\frac{f'g-fg'}{g^2}$. $f'(a)$ es la pendiente de la recta tangente en $x=a$.`,
  },
  {
    id: 'calc.tangent', block: 'calculo', title: 'Recta tangente', minutes: 5, prereqs: ['calc.derivatives', 'fn.linear'],
    summary: 'Ecuación de la recta tangente a una curva en un punto.',
    concept: R`La recta tangente a $f$ en $x=a$ es $y=f'(a)\,(x-a)+f(a)$: pasa por $(a, f(a))$ y tiene pendiente $f'(a)$.`,
  },
  {
    id: 'calc.optimization', block: 'calculo', title: 'Máximos, mínimos y optimización', minutes: 7, prereqs: ['calc.derivatives', 'alg.quadratic'],
    summary: 'Puntos críticos, extremos relativos y problemas de optimización.',
    concept: R`Los extremos relativos están donde $f'(x)=0$. Si $f''(a)>0$ hay un mínimo; si $f''(a)<0$, un máximo. En problemas: escribe la magnitud a optimizar en función de una sola variable y deriva.`,
  },
  {
    id: 'calc.integrals', block: 'calculo', title: 'Integrales inmediatas', minutes: 6, prereqs: ['calc.derivatives'],
    summary: 'Primitivas de funciones elementales.',
    concept: R`$\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$ si $n\neq-1$; $\int\frac1x\,dx=\ln|x|+C$; $\int e^x\,dx = e^x + C$; $\int \cos x\,dx=\operatorname{sen}x+C$. Comprueba siempre derivando tu resultado.`,
  },
  {
    id: 'calc.definite', block: 'calculo', title: 'Regla de Barrow y áreas', minutes: 6, prereqs: ['calc.integrals'],
    summary: 'Integral definida y cálculo de áreas bajo la curva.',
    concept: R`Regla de Barrow: $\int_a^b f(x)\,dx = F(b)-F(a)$, donde $F$ es una primitiva de $f$. Si $f$ es negativa en el intervalo, el área es el valor absoluto de la integral.`,
  },

  // ---------------------------- Bloque 7 ----------------------------
  {
    id: 'la.vectors', block: 'lineal', title: 'Vectores', minutes: 5, prereqs: ['geo.pythagoras'],
    summary: 'Componentes, módulo, suma y producto por un escalar en 2D y 3D.',
    concept: R`$\vec{AB}=B-A$ (extremo menos origen). Módulo: $|\vec v|=\sqrt{v_1^2+v_2^2}$ (en 3D se suma también $v_3^2$). Los vectores se suman componente a componente.`,
  },
  {
    id: 'la.products', block: 'lineal', title: 'Producto escalar y vectorial', minutes: 6, prereqs: ['la.vectors', 'trig.ratios'],
    summary: 'Producto escalar, ángulo entre vectores, ortogonalidad y producto vectorial.',
    concept: R`$\vec u\cdot\vec v=u_1v_1+u_2v_2+u_3v_3=|\vec u|\,|\vec v|\cos\theta$. Dos vectores son perpendiculares si su producto escalar es 0. $\vec u\times\vec v$ es un vector perpendicular a ambos.`,
  },
  {
    id: 'la.matrices', block: 'lineal', title: 'Matrices', minutes: 6, prereqs: ['arith.fractions'],
    summary: 'Suma, producto por escalar, producto de matrices y traspuesta.',
    concept: R`$A_{m\times n}\cdot B_{n\times p}$ da una matriz $m\times p$: el elemento $(i,j)$ es la fila $i$ de $A$ por la columna $j$ de $B$. El producto de matrices no es conmutativo.`,
  },
  {
    id: 'la.determinants', block: 'lineal', title: 'Determinantes', minutes: 6, prereqs: ['la.matrices'],
    summary: 'Determinantes 2×2 y 3×3 (regla de Sarrus) e inversa de una matriz 2×2.',
    concept: R`$\begin{vmatrix}a&b\\c&d\end{vmatrix}=ad-bc$. Para 3×3 se usa la regla de Sarrus. Una matriz es invertible si y solo si su determinante no es 0.`,
  },
  {
    id: 'la.linear-systems', block: 'lineal', title: 'Sistemas con matrices', minutes: 7, prereqs: ['la.determinants', 'alg.systems'],
    summary: 'Método de Gauss-Jordan y regla de Cramer.',
    concept: R`Cramer: $x=\frac{\Delta_x}{\Delta}$, $y=\frac{\Delta_y}{\Delta}$, donde $\Delta_x$ es el determinante con la columna de $x$ reemplazada por los términos independientes (requiere $\Delta\neq0$). Gauss-Jordan: operaciones elementales de fila hasta obtener la identidad.`,
  },

  // ---------------------------- Bloque 8 ----------------------------
  {
    id: 'stats.central', block: 'estadistica', title: 'Media, mediana y moda', minutes: 5, prereqs: ['arith.decimals-percent'],
    summary: 'Medidas de tendencia central.',
    concept: R`Media: suma de los datos dividida por la cantidad de datos. Mediana: el valor central con los datos **ordenados** (si la cantidad es par, el promedio de los dos centrales). Moda: el valor que más se repite.`,
  },
  {
    id: 'stats.dispersion', block: 'estadistica', title: 'Varianza y desviación estándar', minutes: 6, prereqs: ['stats.central', 'arith.roots'],
    summary: 'Rango, varianza y desviación estándar.',
    concept: R`Varianza (poblacional): $\sigma^2=\frac{\sum (x_i-\bar x)^2}{n}$, el promedio de los cuadrados de los desvíos. Desviación estándar: $\sigma=\sqrt{\sigma^2}$. Rango: máximo menos mínimo.`,
  },
  {
    id: 'stats.charts', block: 'estadistica', title: 'Gráficos estadísticos', minutes: 5, prereqs: ['stats.central'],
    summary: 'Tablas de frecuencia, histogramas y diagramas de dispersión.',
    concept: R`En un histograma, la altura de cada barra es la frecuencia de la clase. La frecuencia relativa es la frecuencia dividida por el total. En un diagrama de dispersión, una nube creciente indica correlación positiva.`,
  },
  {
    id: 'comb.counting', block: 'estadistica', title: 'Combinatoria', minutes: 7, prereqs: ['arith.powers'],
    summary: 'Permutaciones, variaciones y combinaciones.',
    concept: R`Permutaciones: $P_n=n!$. Variaciones (importa el orden): $V_{n,k}=\frac{n!}{(n-k)!}$. Combinaciones (no importa el orden): $C_{n,k}=\binom nk=\frac{n!}{k!\,(n-k)!}$.`,
  },
  {
    id: 'prob.laplace', block: 'estadistica', title: 'Probabilidad', minutes: 6, prereqs: ['comb.counting', 'arith.fractions'],
    summary: 'Regla de Laplace, sucesos complementarios y unión de sucesos.',
    concept: R`Regla de Laplace (casos equiprobables): $P(A)=\frac{\text{casos favorables}}{\text{casos posibles}}$. Complemento: $P(A^c)=1-P(A)$. Unión: $P(A\cup B)=P(A)+P(B)-P(A\cap B)$.`,
  },
];

export const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const BLOCK_BY_ID: Record<BlockId, Block> = Object.fromEntries(BLOCKS.map((b) => [b.id, b])) as Record<BlockId, Block>;

export function skillsOfBlock(block: BlockId): Skill[] {
  return SKILLS.filter((s) => s.block === block);
}

/** Habilidades que dependen directamente de `id`. */
export function dependents(id: string): Skill[] {
  return SKILLS.filter((s) => s.prereqs.includes(id));
}

/** Todos los prerrequisitos (transitivos) de una habilidad. */
export function ancestors(id: string, acc: Set<string> = new Set()): Set<string> {
  for (const p of SKILL_BY_ID[id]?.prereqs ?? []) {
    if (!acc.has(p)) {
      acc.add(p);
      ancestors(p, acc);
    }
  }
  return acc;
}

/** Todas las habilidades que dependen (transitivamente) de `id`. */
export function descendants(id: string, acc: Set<string> = new Set()): Set<string> {
  for (const d of dependents(id)) {
    if (!acc.has(d.id)) {
      acc.add(d.id);
      descendants(d.id, acc);
    }
  }
  return acc;
}

/** Orden topológico (respeta prerrequisitos y el orden del temario). */
export function topoOrder(): Skill[] {
  const done = new Set<string>();
  const out: Skill[] = [];
  const visit = (s: Skill) => {
    if (done.has(s.id)) return;
    s.prereqs.forEach((p) => visit(SKILL_BY_ID[p]));
    done.add(s.id);
    out.push(s);
  };
  SKILLS.forEach(visit);
  return out;
}

export function blockHue(id: BlockId): number {
  return BLOCK_BY_ID[id].hue;
}
