import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_LOGIC: WikiEntryDef[] = [
  {
    id: 'logic.connectives',
    keywords: ['proposición', 'proposiciones', 'conectores', 'conectivos', 'negación', 'conjunción', 'disyunción', 'implicación', 'condicional', 'bicondicional', 'valor de verdad', 'antecedente', 'consecuente', 'disyunción exclusiva', 'si entonces', 'si y solo si'],
    summary: R`Una **proposición** es una afirmación que es verdadera (V) o falsa (F), nunca ambas. Los **conectores** combinan proposiciones simples para formar compuestas.`,
    tables: [
      {
        title: 'Tabla de los conectores',
        sheet: true,
        headers: [R`$p$`, R`$q$`, R`$\neg p$`, R`$p \land q$`, R`$p \lor q$`, R`$p \veebar q$`, R`$p \Rightarrow q$`, R`$p \Leftrightarrow q$`],
        rows: [
          ['V', 'V', 'F', 'V', 'V', 'F', 'V', 'V'],
          ['V', 'F', 'F', 'F', 'V', 'V', 'F', 'F'],
          ['F', 'V', 'V', 'F', 'V', 'V', 'V', 'F'],
          ['F', 'F', 'V', 'F', 'F', 'F', 'V', 'V'],
        ],
      },
    ],
    terms: [
      { term: 'Proposición', def: R`Afirmación con un único valor de verdad (V o F). «$x > 3$» no lo es: su valor depende de $x$ (es una función proposicional).` },
      { term: 'Negación', def: R`$\neg p$ («no $p$»): tiene el valor contrario a $p$.` },
      { term: 'Conjunción', def: R`$p \land q$ («$p$ y $q$»): es V solo si **ambas** son V.` },
      { term: 'Disyunción', def: R`$p \lor q$ («$p$ o $q$»): es F solo si **ambas** son F.` },
      { term: 'Disyunción exclusiva', def: R`$p \veebar q$ («o $p$ o $q$»): es V cuando exactamente una de las dos es V.` },
      { term: 'Implicación', def: R`$p \Rightarrow q$ («si $p$, entonces $q$»): es F solo cuando $p$ es V y $q$ es F. $p$ es el **antecedente** y $q$ el **consecuente**.` },
      { term: 'Bicondicional', def: R`$p \Leftrightarrow q$ («$p$ si y solo si $q$»): es V cuando $p$ y $q$ tienen el mismo valor.` },
    ],
    example: {
      problem: R`Si $p$, $q$ y $r$ son verdaderas, ¿cuánto vale $(p \land q) \Rightarrow \neg r$?`,
      steps: [
        { math: R`p \land q = \mathrm{V} \land \mathrm{V} = \mathrm{V}` },
        { math: R`\neg r = \neg\mathrm{V} = \mathrm{F}` },
        { math: R`\mathrm{V} \Rightarrow \mathrm{F} = \mathrm{F}`, note: 'Es el único caso en que una implicación es falsa.' },
      ],
    },
    mistakes: [
      { wrong: 'Si el antecedente es falso, la implicación es falsa.', right: R`Con antecedente falso, $p \Rightarrow q$ es **verdadera**.`, note: 'La implicación solo falla en el caso V ⇒ F.' },
      { wrong: R`$p \lor q$ es F si una de las dos es F.`, right: R`$p \lor q$ es V si **al menos una** es V.` },
      { wrong: R`«$x + 1 = 5$» es una proposición.`, right: 'Es una función proposicional: su valor depende de x.' },
    ],
    remember: [
      '«Y» exige las dos; «o» se conforma con una.',
      'La implicación es una promesa: solo se rompe si se cumple la condición y no el resultado (V ⇒ F).',
    ],
  },
  {
    id: 'logic.truth-tables',
    keywords: ['tabla de verdad', 'tablas', 'tautología', 'contradicción', 'contingencia', 'equivalencia lógica', 'filas', 'clasificar fórmulas'],
    summary: R`Muestra el valor de verdad de una proposición compuesta en **todas** las combinaciones posibles de valores de sus variables.`,
    formulas: [
      { name: 'Cantidad de filas', tex: R`2^n`, note: R`Con $n$ variables: 2 variables → 4 filas; 3 variables → 8 filas.` },
      { name: 'Equivalencia lógica', tex: R`A \equiv B \iff A \Leftrightarrow B \text{ es tautología}`, note: 'Dos fórmulas son equivalentes si su última columna es igual.' },
    ],
    terms: [
      { term: 'Tautología', def: R`Fórmula que es V en todas las filas. Ej.: $p \lor \neg p$.` },
      { term: 'Contradicción', def: R`Fórmula que es F en todas las filas. Ej.: $p \land \neg p$.` },
      { term: 'Contingencia', def: R`Fórmula que tiene filas V y filas F. Ej.: $p \Rightarrow q$.` },
    ],
    steps: {
      title: 'Cómo se arma',
      items: [
        R`Cuenta las variables: con $n$ variables hay $2^n$ filas.`,
        'Completa las variables alternando V y F: la primera columna en mitades (V arriba), la siguiente en cuartos… la última alterna V, F, V, F.',
        'Agrega una columna por cada subfórmula, de adentro hacia afuera (primero las negaciones y los paréntesis).',
        'Clasifica mirando la última columna: todo V → tautología; todo F → contradicción; mezcla → contingencia.',
      ],
    },
    example: {
      problem: R`Clasifica $(p \land q) \Rightarrow p$.`,
      steps: [
        { math: R`\begin{array}{c|c|c|c} p & q & p \land q & (p \land q) \Rightarrow p \\ \hline \mathrm{V} & \mathrm{V} & \mathrm{V} & \mathrm{V} \\ \mathrm{V} & \mathrm{F} & \mathrm{F} & \mathrm{V} \\ \mathrm{F} & \mathrm{V} & \mathrm{F} & \mathrm{V} \\ \mathrm{F} & \mathrm{F} & \mathrm{F} & \mathrm{V} \end{array}` },
        { note: 'La última columna es V en todas las filas: es una **tautología**.' },
      ],
    },
    mistakes: [
      { wrong: 'Con 3 variables hay 6 filas.', right: R`Hay $2^3 = 8$ filas.` },
      { wrong: R`$\mathrm{F} \Rightarrow \mathrm{F}$ es F.`, right: R`$\mathrm{F} \Rightarrow \mathrm{F}$ es V.` },
      { wrong: 'Comparar dos tablas armadas con distinto orden de filas.', right: 'Usa siempre el mismo orden (V primero) para comparar fila por fila.' },
    ],
    remember: ['Una columna por subfórmula: nunca calcules la última columna «de cabeza».'],
    seeAlso: ['logic.connectives'],
  },
  {
    id: 'logic.laws',
    keywords: ['leyes lógicas', 'De Morgan', 'doble negación', 'contrarrecíproca', 'recíproca', 'contraria', 'distributiva', 'Modus Ponens', 'Modus Tollens', 'silogismo', 'falacia', 'inferencia', 'equivalencias', 'negación de la implicación', 'absorción'],
    summary: R`Las **leyes lógicas** son equivalencias que valen siempre; las **reglas de inferencia** permiten sacar conclusiones válidas.`,
    formulas: [
      { name: 'De Morgan (conjunción)', tex: R`\neg(p \land q) \equiv \neg p \lor \neg q` },
      { name: 'De Morgan (disyunción)', tex: R`\neg(p \lor q) \equiv \neg p \land \neg q` },
      { name: 'Doble negación', tex: R`\neg\neg p \equiv p` },
      { name: 'Implicación', tex: R`p \Rightarrow q \equiv \neg p \lor q` },
      { name: 'Contrarrecíproca', tex: R`p \Rightarrow q \equiv \neg q \Rightarrow \neg p` },
      { name: 'Negación de la implicación', tex: R`\neg(p \Rightarrow q) \equiv p \land \neg q` },
      { name: 'Bicondicional', tex: R`p \Leftrightarrow q \equiv (p \Rightarrow q) \land (q \Rightarrow p)` },
      { name: 'Distributivas', tex: R`p \land (q \lor r) \equiv (p \land q) \lor (p \land r)`, note: R`Y también $p \lor (q \land r) \equiv (p \lor q) \land (p \lor r)$.` },
      { name: 'Absorción', tex: R`p \lor (p \land q) \equiv p` },
    ],
    tables: [
      {
        title: 'Reglas de inferencia',
        sheet: true,
        headers: ['Regla', 'Premisas', 'Conclusión'],
        rows: [
          ['Modus Ponens', R`$p \Rightarrow q$ y $p$`, R`$q$`],
          ['Modus Tollens', R`$p \Rightarrow q$ y $\neg q$`, R`$\neg p$`],
          ['Silogismo hipotético', R`$p \Rightarrow q$ y $q \Rightarrow r$`, R`$p \Rightarrow r$`],
          ['Silogismo disyuntivo', R`$p \lor q$ y $\neg p$`, R`$q$`],
          ['Falacia: afirmar el consecuente', R`$p \Rightarrow q$ y $q$`, R`✗ no se concluye $p$`],
          ['Falacia: negar el antecedente', R`$p \Rightarrow q$ y $\neg p$`, R`✗ no se concluye $\neg q$`],
        ],
      },
    ],
    terms: [
      { term: 'Recíproca', def: R`De $p \Rightarrow q$ es $q \Rightarrow p$. **No** es equivalente a la original.` },
      { term: 'Contraria', def: R`De $p \Rightarrow q$ es $\neg p \Rightarrow \neg q$. **No** es equivalente a la original.` },
      { term: 'Contrarrecíproca', def: R`De $p \Rightarrow q$ es $\neg q \Rightarrow \neg p$. **Sí** es equivalente a la original.` },
    ],
    example: {
      title: 'Negar una implicación',
      problem: '¿Cuál es la negación de «si llueve, llevo paraguas»?',
      steps: [
        { math: R`\neg(p \Rightarrow q) \equiv \neg(\neg p \lor q)`, note: 'Equivalencia de la implicación.' },
        { math: R`\equiv \neg\neg p \land \neg q \equiv p \land \neg q`, note: 'De Morgan y doble negación.' },
        { note: '«Llueve **y** no llevo paraguas».' },
      ],
    },
    mistakes: [
      { wrong: R`$\neg(p \land q) \equiv \neg p \land \neg q$`, right: R`$\neg(p \land q) \equiv \neg p \lor \neg q$`, note: 'Al negar, también cambia el conector.' },
      { wrong: R`$p \Rightarrow q \equiv q \Rightarrow p$`, right: R`$p \Rightarrow q \equiv \neg q \Rightarrow \neg p$`, note: 'Solo la contrarrecíproca es equivalente.' },
      { wrong: R`$\neg(p \Rightarrow q) \equiv \neg p \Rightarrow \neg q$`, right: R`$\neg(p \Rightarrow q) \equiv p \land \neg q$` },
    ],
    remember: ['De Morgan: «niega cada parte y cambia el conector» (∧ ↔ ∨).', 'La negación de una implicación no es otra implicación: es una conjunción.'],
    seeAlso: ['sets.operations'],
  },
  {
    id: 'sets.basics',
    keywords: ['conjunto', 'conjuntos', 'elemento', 'pertenencia', 'pertenece', 'inclusión', 'subconjunto', 'vacío', 'extensión', 'comprensión', 'cardinal', 'conjunto de partes', 'conjunto potencia', 'universal', 'igualdad de conjuntos'],
    summary: R`Un **conjunto** es una colección de elementos. Se describe por **extensión** (listando: $A = \{2, 4, 6\}$) o por **comprensión** (con una propiedad: $A = \{x \in \mathbb{N} : x \text{ es par y } x \le 6\}$).`,
    formulas: [
      { name: 'Cantidad de subconjuntos', tex: R`|\mathcal{P}(A)| = 2^{|A|}`, note: R`Un conjunto de 3 elementos tiene $2^3 = 8$ subconjuntos (incluidos $\emptyset$ y $A$).` },
      { name: 'Igualdad de conjuntos', tex: R`A = B \iff A \subseteq B \land B \subseteq A` },
      { name: 'El vacío', tex: R`\emptyset \subseteq A \text{ para todo } A` },
    ],
    terms: [
      { term: 'Pertenencia', def: R`$a \in A$: el **elemento** $a$ está en el conjunto $A$ ($a \notin A$: no está).` },
      { term: 'Inclusión', def: R`$B \subseteq A$: todo elemento de $B$ está en $A$ ($B$ es **subconjunto** de $A$).` },
      { term: 'Conjunto vacío', def: R`$\emptyset$: el conjunto sin elementos.` },
      { term: 'Cardinal', def: R`$|A|$: cantidad de elementos de $A$.` },
      { term: 'Conjunto de partes', def: R`$\mathcal{P}(A)$: el conjunto formado por todos los subconjuntos de $A$.` },
      { term: 'Conjunto universal', def: R`$U$: el conjunto que contiene a todos los elementos que se consideran.` },
    ],
    example: {
      problem: R`Sea $A = \{1, 2, 3\}$. ¿Qué afirmaciones son verdaderas?`,
      steps: [
        { math: R`2 \in A`, note: 'V: 2 es un elemento de A.' },
        { math: R`\{2\} \subseteq A`, note: 'V: el conjunto {2} está incluido en A.' },
        { math: R`\{2\} \in A`, note: 'F: los elementos de A son números, no conjuntos.' },
        { math: R`\emptyset \subseteq A`, note: 'V: el vacío está incluido en todo conjunto.' },
      ],
    },
    mistakes: [
      { wrong: R`$\{2\} \in \{1, 2, 3\}$`, right: R`$\{2\} \subseteq \{1, 2, 3\}$`, note: '{2} es un conjunto, no un elemento.' },
      { wrong: R`$2 \subseteq \{1, 2, 3\}$`, right: R`$2 \in \{1, 2, 3\}$` },
      { wrong: R`$\{1, 2\}$ y $\{2, 1, 1\}$ son distintos.`, right: 'Son iguales: el orden y las repeticiones no importan.' },
    ],
    remember: [R`A la izquierda de $\in$ va un elemento; a la izquierda de $\subseteq$, un conjunto.`],
  },
  {
    id: 'sets.operations',
    keywords: ['unión', 'intersección', 'diferencia', 'complemento', 'diferencia simétrica', 'diagrama de Venn', 'Venn', 'inclusión-exclusión', 'De Morgan', 'disjuntos', 'operaciones con conjuntos'],
    summary: R`Las operaciones entre conjuntos construyen conjuntos nuevos; los **diagramas de Venn** las muestran como regiones.`,
    formulas: [
      { name: 'Unión', tex: R`A \cup B = \{x : x \in A \lor x \in B\}` },
      { name: 'Intersección', tex: R`A \cap B = \{x : x \in A \land x \in B\}` },
      { name: 'Diferencia', tex: R`A - B = \{x : x \in A \land x \notin B\}` },
      { name: 'Complemento', tex: R`A^c = U - A` },
      { name: 'Diferencia simétrica', tex: R`A \triangle B = (A - B) \cup (B - A)` },
      { name: 'De Morgan', tex: R`(A \cup B)^c = A^c \cap B^c`, note: R`Y también $(A \cap B)^c = A^c \cup B^c$.` },
      { name: 'Inclusión-exclusión', tex: R`|A \cup B| = |A| + |B| - |A \cap B|`, note: 'Se resta lo que se contó dos veces.' },
    ],
    terms: [
      { term: 'Conjuntos disjuntos', def: R`No tienen elementos en común: $A \cap B = \emptyset$.` },
      { term: 'Diagrama de Venn', def: 'Representación de los conjuntos como regiones dentro de un rectángulo (el universal).' },
    ],
    example: {
      problem: R`$U = \{1, \dots, 8\}$, $A = \{1, 2, 3, 4\}$, $B = \{3, 4, 5, 6\}$.`,
      steps: [
        { math: R`A \cup B = \{1, 2, 3, 4, 5, 6\},\quad A \cap B = \{3, 4\}` },
        { math: R`A - B = \{1, 2\},\quad B - A = \{5, 6\}` },
        { math: R`A^c = \{5, 6, 7, 8\},\quad A \triangle B = \{1, 2, 5, 6\}` },
      ],
    },
    mistakes: [
      { wrong: R`$A - B = B - A$`, right: R`En general $A - B \neq B - A$.` },
      { wrong: R`$(A \cup B)^c = A^c \cup B^c$`, right: R`$(A \cup B)^c = A^c \cap B^c$` },
      { wrong: R`$|A \cup B| = |A| + |B|$`, right: R`$|A \cup B| = |A| + |B| - |A \cap B|$`, note: 'Solo se suman directamente si son disjuntos.' },
    ],
    remember: ['Unión ↔ «o» (∨); intersección ↔ «y» (∧); complemento ↔ «no» (¬): las leyes de la lógica valen para conjuntos.'],
    seeAlso: ['logic.laws', 'prob.laplace'],
  },
  {
    id: 'logic.quantifiers',
    keywords: ['cuantificadores', 'cuantificador universal', 'cuantificador existencial', 'para todo', 'existe', 'contraejemplo', 'negación de cuantificadores', 'función proposicional'],
    summary: R`Los **cuantificadores** convierten una función proposicional $P(x)$ en una proposición, indicando **para cuántos** elementos se cumple.`,
    formulas: [
      { name: 'Negación del universal', tex: R`\neg\big(\forall x: P(x)\big) \equiv \exists x: \neg P(x)` },
      { name: 'Negación del existencial', tex: R`\neg\big(\exists x: P(x)\big) \equiv \forall x: \neg P(x)` },
    ],
    tables: [
      {
        title: 'Valor de verdad',
        headers: ['Proposición', 'Es V si…', 'Es F si…'],
        rows: [
          [R`$\forall x \in D: P(x)$`, R`**todos** los elementos de $D$ cumplen $P$`, 'hay al menos un contraejemplo'],
          [R`$\exists x \in D: P(x)$`, R`**al menos uno** cumple $P$`, 'ninguno cumple'],
        ],
      },
    ],
    terms: [
      { term: 'Función proposicional', def: R`Expresión con variables, como $P(x): x > 3$; su valor depende de $x$.` },
      { term: 'Cuantificador universal', def: R`$\forall$ («para todo»).` },
      { term: 'Cuantificador existencial', def: R`$\exists$ («existe al menos un»). $\exists!$ significa «existe un único».` },
      { term: 'Contraejemplo', def: 'Un caso concreto que no cumple la propiedad: basta uno para que un «para todo» sea falso.' },
    ],
    example: {
      problem: 'Niega: «Todos los números pares son mayores que 3».',
      steps: [
        { math: R`\neg(\forall x \in P: x > 3) \equiv \exists x \in P: x \le 3`, note: 'Cambia el cuantificador y se niega la propiedad (> pasa a ≤).' },
        { note: '«Existe un número par que no es mayor que 3» (por ejemplo, 2). La original es falsa.' },
      ],
    },
    mistakes: [
      { wrong: '«Todos aprobaron» se niega como «ninguno aprobó».', right: '«Alguno no aprobó».' },
      { wrong: R`$\neg(\forall x: x > 0) \equiv \forall x: x \le 0$`, right: R`$\neg(\forall x: x > 0) \equiv \exists x: x \le 0$` },
      { wrong: 'Muchos ejemplos a favor prueban un «para todo».', right: 'Hace falta una demostración general; en cambio, un solo contraejemplo lo refuta.' },
    ],
    remember: [R`Al negar: $\forall \leftrightarrow \exists$ y se niega la propiedad.`],
  },
  {
    id: 'logic.proofs',
    keywords: ['demostración', 'demostraciones', 'método directo', 'reducción al absurdo', 'contradicción', 'contraejemplo', 'inducción matemática', 'inducción', 'hipótesis', 'tesis', 'caso base', 'paso inductivo', 'teorema'],
    summary: R`Estrategias para probar que una afirmación vale en **todos** los casos, o para refutarla con uno solo.`,
    tables: [
      {
        title: '¿Qué método usar?',
        headers: ['Método', 'Idea', 'Cuándo conviene'],
        rows: [
          ['Directa', 'De la hipótesis a la tesis con pasos válidos.', 'Cuando hay un camino claro.'],
          ['Contrarrecíproco', R`Probar $\neg q \Rightarrow \neg p$ en lugar de $p \Rightarrow q$.`, 'Cuando negar la tesis da más información.'],
          ['Reducción al absurdo', 'Suponer que la tesis es falsa y llegar a una contradicción.', R`Irracionalidad de $\sqrt2$, infinitud de los primos.`],
          ['Contraejemplo', 'Mostrar un caso donde falla.', 'Para refutar un «para todo».'],
          ['Inducción', 'Caso base y paso inductivo.', 'Propiedades de todos los naturales (sumas, divisibilidad).'],
        ],
      },
    ],
    formulas: [
      { name: 'Principio de inducción', tex: R`P(1) \land \big(\forall k: P(k) \Rightarrow P(k+1)\big) \Rightarrow \forall n \in \mathbb{N}: P(n)` },
      { name: 'Suma de los primeros naturales', tex: R`1 + 2 + \dots + n = \frac{n(n+1)}{2}`, note: 'Resultado clásico que se prueba por inducción.' },
    ],
    terms: [
      { term: 'Hipótesis', def: 'Lo que se supone verdadero (el antecedente).' },
      { term: 'Tesis', def: 'Lo que se quiere demostrar (el consecuente).' },
    ],
    steps: {
      title: 'Demostración por inducción',
      items: [
        R`**Caso base**: verifica $P(1)$.`,
        R`**Hipótesis inductiva**: supón que $P(k)$ es verdadera.`,
        R`**Paso inductivo**: usando $P(k)$, demuestra $P(k+1)$.`,
        R`Concluye que $P(n)$ vale para todo natural $n$.`,
      ],
    },
    example: {
      title: 'Demostración directa',
      problem: R`Si $n$ es par, entonces $n^2$ es par.`,
      steps: [
        { math: R`n = 2k \ (k \in \mathbb{Z})`, note: 'Hipótesis: n es par.' },
        { math: R`n^2 = (2k)^2 = 4k^2 = 2\cdot(2k^2)`, note: 'Es 2 por un entero: n² es par. ∎' },
      ],
    },
    mistakes: [
      { wrong: 'Verifiqué 10 casos, así que vale siempre.', right: 'Los ejemplos no demuestran un «para todo».' },
      { wrong: R`En inducción, suponer $P(k+1)$.`, right: R`Se supone $P(k)$ y se **demuestra** $P(k+1)$.` },
      { wrong: 'Un contraejemplo demuestra una propiedad general.', right: 'Un contraejemplo sirve para **refutarla**.' },
    ],
    remember: ['Para refutar basta un contraejemplo; para demostrar hace falta un argumento general.'],
    seeAlso: ['logic.laws'],
  },
  {
    id: 'logic.boolean',
    keywords: ['álgebra de Boole', 'booleana', 'compuertas lógicas', 'compuertas', 'AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'circuitos', 'bits', 'binario', 'lógica digital'],
    summary: R`Lógica con 1 (encendido) y 0 (apagado), usada en los circuitos digitales. Los conectores se llaman **compuertas**.`,
    tables: [
      {
        title: 'Tabla de las compuertas',
        sheet: true,
        headers: [R`$A$`, R`$B$`, R`NOT $\overline{A}$`, R`AND $A\cdot B$`, R`OR $A + B$`, R`XOR $A \oplus B$`],
        rows: [
          ['0', '0', '1', '0', '0', '0'],
          ['0', '1', '1', '0', '1', '1'],
          ['1', '0', '0', '0', '1', '1'],
          ['1', '1', '0', '1', '1', '0'],
        ],
      },
    ],
    formulas: [
      { name: 'Complemento', tex: R`A + \overline{A} = 1,\quad A\cdot\overline{A} = 0` },
      { name: 'Neutros', tex: R`A + 0 = A,\quad A\cdot 1 = A` },
      { name: 'Dominación', tex: R`A + 1 = 1,\quad A\cdot 0 = 0` },
      { name: 'Idempotencia', tex: R`A + A = A,\quad A\cdot A = A` },
      { name: 'Absorción', tex: R`A + A\cdot B = A` },
      { name: 'De Morgan', tex: R`\overline{A + B} = \overline{A}\cdot\overline{B},\quad \overline{A\cdot B} = \overline{A} + \overline{B}` },
      { name: 'XOR con AND, OR y NOT', tex: R`A \oplus B = A\,\overline{B} + \overline{A}\,B` },
    ],
    terms: [
      { term: 'AND', def: R`$A\cdot B$: da 1 solo si ambas entradas son 1 (conjunción).` },
      { term: 'OR', def: R`$A + B$: da 1 si alguna entrada es 1 (disyunción).` },
      { term: 'NOT', def: R`$\overline{A}$: invierte la entrada (negación).` },
      { term: 'XOR', def: R`$A \oplus B$: da 1 si las entradas son **distintas**.` },
      { term: 'NAND y NOR', def: R`Negaciones de AND y OR: $\overline{A\cdot B}$ y $\overline{A + B}$.` },
    ],
    example: {
      problem: R`Calcula $A\cdot B + \overline{C}$ para $A = 1$, $B = 0$, $C = 0$.`,
      steps: [
        { math: R`A\cdot B = 1\cdot 0 = 0` },
        { math: R`\overline{C} = \overline{0} = 1` },
        { math: R`0 + 1 = 1`, note: 'La salida está encendida.' },
      ],
    },
    mistakes: [
      { wrong: R`$1 + 1 = 2$`, right: R`$1 + 1 = 1$`, note: 'En Boole, + es OR.' },
      { wrong: R`$\overline{A\cdot B} = \overline{A}\cdot\overline{B}$`, right: R`$\overline{A\cdot B} = \overline{A} + \overline{B}$` },
      { wrong: 'XOR es lo mismo que OR.', right: 'XOR da 0 cuando ambas entradas son 1.' },
    ],
    remember: ['AND se parece a multiplicar y OR a sumar, salvo que 1 + 1 = 1.'],
    seeAlso: ['logic.laws'],
  },
];
