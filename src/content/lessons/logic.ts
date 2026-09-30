import type { Lesson } from '../types';

const R = String.raw;

export const LESSONS_LOGIC: Lesson[] = [
  {
    skillId: 'logic.connectives',
    intro: 'Una **proposición** es una afirmación que es verdadera (V) o falsa (F), nunca ambas. Con los **conectores lógicos** combinamos proposiciones simples para formar proposiciones compuestas.',
    sections: [
      {
        type: 'text',
        title: '¿Qué es y qué no es una proposición?',
        body: R`«7 es un número primo» (V) y «$2 + 2 = 5$» (F) son proposiciones. No lo son las preguntas («¿qué hora es?»), las órdenes («cerrá la puerta») ni las frases como $x > 3$, cuyo valor depende de $x$ (son *funciones proposicionales*).`,
      },
      {
        type: 'text',
        title: 'Los cinco conectores',
        body: R`- **Negación** $\neg p$ («no»): tiene el valor contrario a $p$.
- **Conjunción** $p \land q$ («y»): es V solo si **ambas** son V.
- **Disyunción** $p \lor q$ («o»): es F solo si **ambas** son F.
- **Implicación** $p \Rightarrow q$ («si… entonces…»): es F solo cuando $p$ es V y $q$ es F.
- **Bicondicional** $p \Leftrightarrow q$ («si y solo si»): es V cuando $p$ y $q$ tienen el mismo valor.`,
      },
      {
        type: 'widget',
        widget: 'prop-tree',
        props: { formula: '(p ∧ q) ⇒ ¬r' },
        caption: 'Árbol de la proposición: cambia los valores de $p$, $q$ y $r$ y mira cómo se recalcula cada nodo, de las hojas hacia la raíz.',
      },
      {
        type: 'example',
        title: 'Evaluar una proposición compuesta',
        problem: R`Si $p$ es V y $q$ es F, ¿cuánto vale $\neg p \lor q$?`,
        steps: [
          { math: R`\neg p = \neg \mathrm{V} = \mathrm{F}`, note: 'Primero la negación (lo más interno).' },
          { math: R`\neg p \lor q = \mathrm{F} \lor \mathrm{F} = \mathrm{F}`, note: 'Una disyunción con ambas partes falsas es falsa.' },
        ],
      },
      {
        type: 'tip',
        title: 'Error frecuente',
        body: R`Una implicación con antecedente falso es **verdadera**: «si $2 + 2 = 5$, entonces la Luna es de queso» es V. La implicación solo es falsa cuando lo prometido se cumple ($p$ V) y la consecuencia no ($q$ F).`,
      },
      { type: 'check', generatorId: 'logic.eval', level: 1 },
      {
        type: 'summary',
        points: [
          'Proposición: afirmación con un único valor de verdad.',
          R`$\land$ exige las dos; $\lor$ se conforma con una.`,
          R`$p \Rightarrow q$ solo falla en el caso V ⇒ F.`,
        ],
      },
    ],
  },
  {
    skillId: 'logic.truth-tables',
    intro: 'Una **tabla de verdad** muestra el valor de una proposición compuesta en **todos** los casos posibles. Es la herramienta para comprobar equivalencias y clasificar fórmulas.',
    sections: [
      {
        type: 'text',
        title: 'Cómo se arma',
        body: R`Con $n$ variables hay $2^n$ filas (2 variables: 4 filas; 3 variables: 8). Se agrega una columna por cada subfórmula y se completan **de adentro hacia afuera**, usando solo columnas anteriores.`,
      },
      {
        type: 'example',
        title: R`Tabla de $\neg p \lor q$`,
        problem: 'Completamos primero la columna de la negación y después la disyunción.',
        steps: [
          { math: R`\begin{array}{c|c|c|c} p & q & \neg p & \neg p \lor q \\ \hline \mathrm{V} & \mathrm{V} & \mathrm{F} & \mathrm{V} \\ \mathrm{V} & \mathrm{F} & \mathrm{F} & \mathrm{F} \\ \mathrm{F} & \mathrm{V} & \mathrm{V} & \mathrm{V} \\ \mathrm{F} & \mathrm{F} & \mathrm{V} & \mathrm{V} \end{array}` },
          { note: R`La última columna coincide con la de $p \Rightarrow q$: son **equivalentes**.` },
        ],
      },
      {
        type: 'widget',
        widget: 'truth-table',
        props: { formula: '(p ⇒ q) ∧ p' },
        caption: 'Escribe cualquier fórmula y la tabla se construye sola, con una columna por subfórmula.',
      },
      {
        type: 'text',
        title: 'Tautología, contradicción, contingencia',
        body: R`- **Tautología**: V en todas las filas (ej. $p \lor \neg p$).
- **Contradicción**: F en todas las filas (ej. $p \land \neg p$).
- **Contingencia**: tiene filas V y filas F (ej. $p \Rightarrow q$).`,
      },
      { type: 'tip', body: 'Mantén siempre el mismo orden de filas (V primero): así puedes comparar tablas de dos fórmulas fila por fila.' },
      { type: 'check', generatorId: 'tt.fill', level: 1 },
      { type: 'check', generatorId: 'tt.classify', level: 1 },
      { type: 'summary', points: [R`$2^n$ filas para $n$ variables.`, 'Una columna por subfórmula, de adentro hacia afuera.', 'Dos fórmulas son equivalentes si su última columna es igual.'] },
    ],
  },
  {
    skillId: 'logic.laws',
    intro: 'Las **leyes lógicas** son equivalencias que siempre valen (tautologías). Permiten transformar proposiciones sin cambiar su valor, igual que las propiedades algebraicas transforman expresiones.',
    sections: [
      {
        type: 'text',
        title: 'Leyes más usadas',
        body: R`- **De Morgan**: $\neg(p \land q) \equiv \neg p \lor \neg q$ y $\neg(p \lor q) \equiv \neg p \land \neg q$.
- **Doble negación**: $\neg\neg p \equiv p$.
- **Implicación**: $p \Rightarrow q \equiv \neg p \lor q$.
- **Contrarrecíproca**: $p \Rightarrow q \equiv \neg q \Rightarrow \neg p$.
- **Distributiva**: $p \land (q \lor r) \equiv (p \land q) \lor (p \land r)$.
- **Negación de la implicación**: $\neg(p \Rightarrow q) \equiv p \land \neg q$.`,
      },
      {
        type: 'example',
        title: 'Eliminar negaciones de paréntesis',
        problem: R`Simplifica $\neg(p \Rightarrow \neg q)$.`,
        steps: [
          { math: R`\neg(p \Rightarrow \neg q)`, note: 'Enunciado.' },
          { math: R`\equiv \neg(\neg p \lor \neg q)`, note: 'Equivalencia de la implicación.' },
          { math: R`\equiv \neg\neg p \land \neg\neg q`, note: 'De Morgan: se niegan ambas y el ∨ pasa a ∧.' },
          { math: R`\equiv p \land q`, note: 'Doble negación.' },
        ],
      },
      {
        type: 'widget',
        widget: 'truth-table',
        props: { formula: '¬(p ∧ q) ⇔ (¬p ∨ ¬q)' },
        caption: 'La ley de De Morgan es una tautología: la última columna es V en todas las filas.',
      },
      {
        type: 'text',
        title: 'Reglas de inferencia',
        body: R`- **Modus Ponens**: de $p \Rightarrow q$ y $p$ se concluye $q$.
- **Modus Tollens**: de $p \Rightarrow q$ y $\neg q$ se concluye $\neg p$.
- **Silogismo hipotético**: de $p \Rightarrow q$ y $q \Rightarrow r$ se concluye $p \Rightarrow r$.
- **Falacias**: de $p \Rightarrow q$ y $q$ **no** se puede concluir $p$; de $p \Rightarrow q$ y $\neg p$ **no** se puede concluir $\neg q$.`,
      },
      { type: 'tip', title: 'Error frecuente', body: R`$\neg(p \land q)$ **no** es $\neg p \land \neg q$: al negar, también cambia el conector. «No es cierto que estudio y trabajo» significa «no estudio **o** no trabajo».` },
      { type: 'check', generatorId: 'laws.simplify', level: 1 },
      { type: 'check', generatorId: 'laws.inference', level: 1 },
      { type: 'summary', points: ['De Morgan: negar ambas y cambiar el conector.', R`$p \Rightarrow q \equiv \neg p \lor q \equiv \neg q \Rightarrow \neg p$.`, 'Modus Ponens y Modus Tollens son válidos; afirmar el consecuente no.'] },
    ],
  },
  {
    skillId: 'sets.basics',
    intro: 'Un **conjunto** es una colección de objetos llamados **elementos**. Se nombra con mayúsculas y sus elementos se escriben entre llaves.',
    sections: [
      {
        type: 'text',
        title: 'Extensión y comprensión',
        body: R`**Por extensión** se listan los elementos: $A = \{2, 4, 6, 8\}$. **Por comprensión** se da una propiedad: $A = \{x \in \mathbb{N} : x \text{ es par y } x \le 8\}$. El orden y las repeticiones no importan: $\{1, 2\} = \{2, 1, 1\}$.`,
      },
      {
        type: 'text',
        title: 'Pertenencia e inclusión',
        body: R`- $\in$ relaciona un **elemento** con un conjunto: $4 \in A$, $5 \notin A$.
- $\subseteq$ relaciona **dos conjuntos**: $B \subseteq A$ si todo elemento de $B$ está en $A$.
- El conjunto vacío $\emptyset$ no tiene elementos y está incluido en cualquier conjunto.
- Un conjunto de $n$ elementos tiene $2^n$ subconjuntos.`,
      },
      {
        type: 'example',
        title: 'Pertenencia vs. inclusión',
        problem: R`Sea $A = \{1, 2, 3\}$.`,
        steps: [
          { math: R`2 \in A`, note: 'Verdadero: 2 es un elemento de A.' },
          { math: R`\{2\} \subseteq A`, note: 'Verdadero: el conjunto {2} está incluido en A.' },
          { math: R`\{2\} \in A`, note: 'Falso: los elementos de A son números, no conjuntos.' },
          { math: R`|\mathcal{P}(A)| = 2^3 = 8`, note: 'A tiene 8 subconjuntos (incluidos ∅ y A).' },
        ],
      },
      { type: 'tip', body: R`Pregúntate siempre qué hay a la izquierda: si es un elemento, usa $\in$; si es un conjunto, usa $\subseteq$.` },
      { type: 'check', generatorId: 'sets.membership', level: 1 },
      { type: 'check', generatorId: 'sets.extension', level: 1 },
      { type: 'summary', points: [R`$\in$: elemento en conjunto. $\subseteq$: conjunto dentro de conjunto.`, R`$\emptyset \subseteq A$ para todo $A$.`, R`$n$ elementos ⇒ $2^n$ subconjuntos.`] },
    ],
  },
  {
    skillId: 'sets.operations',
    intro: 'Las operaciones entre conjuntos construyen conjuntos nuevos. Los **diagramas de Venn** las hacen visibles.',
    sections: [
      {
        type: 'text',
        title: 'Operaciones',
        body: R`- **Unión** $A \cup B$: elementos que están en $A$ **o** en $B$.
- **Intersección** $A \cap B$: elementos que están en $A$ **y** en $B$.
- **Diferencia** $A - B$: elementos de $A$ que **no** están en $B$.
- **Complemento** $A^c$: elementos del universal $U$ que no están en $A$.
- **Diferencia simétrica** $A \triangle B$: elementos que están en uno solo de los dos.`,
      },
      {
        type: 'widget',
        widget: 'venn',
        props: { sets: 2, expr: 'A ∩ B' },
        caption: 'Escribe una operación para ver su región, o toca regiones para descubrir qué operación representan.',
      },
      {
        type: 'example',
        title: 'Calcular operaciones',
        problem: R`$U = \{1, \dots, 8\}$, $A = \{1, 2, 3, 4\}$, $B = \{3, 4, 5, 6\}$.`,
        steps: [
          { math: R`A \cup B = \{1, 2, 3, 4, 5, 6\}` },
          { math: R`A \cap B = \{3, 4\}` },
          { math: R`A - B = \{1, 2\},\quad B - A = \{5, 6\}` },
          { math: R`A^c = \{5, 6, 7, 8\}` },
        ],
      },
      {
        type: 'text',
        title: 'Dos resultados útiles',
        body: R`**De Morgan**: $(A \cup B)^c = A^c \cap B^c$ y $(A \cap B)^c = A^c \cup B^c$. **Inclusión-exclusión**: $|A \cup B| = |A| + |B| - |A \cap B|$ (se resta lo que se contó dos veces).`,
      },
      { type: 'tip', body: R`La diferencia no es conmutativa: $A - B \neq B - A$.` },
      { type: 'check', generatorId: 'sets.venn', level: 1 },
      { type: 'check', generatorId: 'sets.ops', level: 1 },
      { type: 'summary', points: ['Unión = «o»; intersección = «y»; diferencia = «pero no».', 'De Morgan también vale para conjuntos.', R`$|A\cup B| = |A| + |B| - |A \cap B|$.`] },
    ],
  },
  {
    skillId: 'logic.quantifiers',
    intro: 'Los **cuantificadores** convierten una función proposicional (como $x > 3$) en una proposición, diciendo **para cuántos** elementos se cumple.',
    sections: [
      {
        type: 'text',
        title: 'Universal y existencial',
        body: R`- $\forall x \in D: P(x)$ («para todo»): es V si **todos** los elementos de $D$ cumplen $P$. Un solo contraejemplo la hace F.
- $\exists x \in D: P(x)$ («existe»): es V si **al menos uno** cumple $P$.`,
      },
      {
        type: 'example',
        title: 'Valor de verdad',
        problem: R`Sea $D = \{1, 2, 3, 4\}$.`,
        steps: [
          { math: R`\forall x \in D: x^2 > 0`, note: 'V: todos los cuadrados son positivos.' },
          { math: R`\forall x \in D: x > 1`, note: 'F: x = 1 es un contraejemplo.' },
          { math: R`\exists x \in D: x + 3 = 7`, note: 'V: x = 4 lo cumple.' },
        ],
      },
      {
        type: 'text',
        title: 'Negación',
        body: R`Al negar se cambia el cuantificador y se niega la propiedad: $\neg(\forall x: P(x)) \equiv \exists x: \neg P(x)$ y $\neg(\exists x: P(x)) \equiv \forall x: \neg P(x)$. «Todos aprobaron» se niega como «**alguno no** aprobó».`,
      },
      { type: 'tip', title: 'Error frecuente', body: 'La negación de «todos aprobaron» **no** es «ninguno aprobó»: basta con que uno no haya aprobado.' },
      { type: 'check', generatorId: 'quant.truth', level: 1 },
      { type: 'check', generatorId: 'quant.negation', level: 1 },
      { type: 'summary', points: [R`$\forall$: todos. $\exists$: al menos uno.`, R`Negar: $\forall \leftrightarrow \exists$ y se niega la propiedad.`] },
    ],
  },
  {
    skillId: 'logic.proofs',
    intro: 'Demostrar es convencer con lógica, paso a paso, de que una afirmación es verdadera en **todos** los casos. Hay varias estrategias.',
    sections: [
      {
        type: 'text',
        title: 'Métodos',
        body: R`- **Directa**: se parte de la hipótesis y se llega a la tesis. *Si $n$ es par, $n^2$ es par*: $n = 2k \Rightarrow n^2 = 4k^2 = 2(2k^2)$.
- **Reducción al absurdo**: se supone que la tesis es falsa y se llega a una contradicción.
- **Contraejemplo**: para refutar un «para todo» basta un caso donde falla. *«Todo primo es impar»* es falso: 2.
- **Inducción**: para probar $P(n)$ para todo natural: (1) caso base $P(1)$; (2) paso inductivo: $P(k) \Rightarrow P(k+1)$.`,
      },
      {
        type: 'example',
        title: 'Inducción',
        problem: R`Probar que $1 + 2 + \dots + n = \frac{n(n+1)}{2}$.`,
        steps: [
          { math: R`n = 1:\ 1 = \frac{1\cdot 2}{2}`, note: 'Caso base: se cumple.' },
          { math: R`1 + \dots + k = \frac{k(k+1)}{2}`, note: 'Hipótesis inductiva.' },
          { math: R`1 + \dots + k + (k+1) = \frac{k(k+1)}{2} + (k+1) = \frac{(k+1)(k+2)}{2}`, note: 'Paso inductivo: vale para k + 1.' },
        ],
      },
      { type: 'tip', body: 'Muchos ejemplos a favor **no** demuestran un «para todo»; en cambio, un solo contraejemplo lo refuta.' },
      { type: 'check', generatorId: 'proofs.method', level: 1 },
      { type: 'check', generatorId: 'proofs.counterexample', level: 1 },
      { type: 'summary', points: ['Directa: hipótesis → tesis.', 'Absurdo: suponer lo contrario y llegar a una contradicción.', 'Inducción: caso base + paso inductivo.'] },
    ],
  },
  {
    skillId: 'logic.boolean',
    intro: 'El **álgebra de Boole** es la lógica de los circuitos digitales: los valores son 1 (encendido) y 0 (apagado) y los conectores son **compuertas**.',
    sections: [
      {
        type: 'text',
        title: 'Compuertas',
        body: R`- **AND** $A \cdot B$: 1 solo si ambas entradas son 1.
- **OR** $A + B$: 1 si alguna entrada es 1.
- **NOT** $\overline{A}$: invierte la entrada.
- **XOR** $A \oplus B$: 1 si las entradas son **distintas**.`,
      },
      {
        type: 'widget',
        widget: 'circuit',
        props: { expr: '(A ∧ B) ∨ ¬C' },
        caption: 'Toca las entradas para encenderlas o apagarlas y toca una compuerta para cambiar su tipo (AND → OR → XOR).',
      },
      {
        type: 'example',
        title: 'Salida de un circuito',
        problem: R`Calcula $A\cdot B + \overline{C}$ para $A = 1$, $B = 0$, $C = 0$.`,
        steps: [
          { math: R`A \cdot B = 1 \cdot 0 = 0` },
          { math: R`\overline{C} = \overline{0} = 1` },
          { math: R`0 + 1 = 1`, note: 'La lámpara se enciende.' },
        ],
      },
      { type: 'text', title: 'Propiedades útiles', body: R`$A + \overline{A} = 1$, $A \cdot \overline{A} = 0$, $A + 1 = 1$, $A \cdot 1 = A$, $A + A\cdot B = A$ (absorción) y De Morgan: $\overline{A + B} = \overline{A}\cdot\overline{B}$.` },
      { type: 'check', generatorId: 'bool.eval', level: 1 },
      { type: 'check', generatorId: 'bool.table', level: 1 },
      { type: 'summary', points: ['AND = conjunción, OR = disyunción, NOT = negación.', 'XOR da 1 cuando las entradas difieren.'] },
    ],
  },
];
