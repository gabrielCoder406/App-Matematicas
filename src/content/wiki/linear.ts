import type { WikiEntryDef } from './types';

const R = String.raw;

export const WIKI_LINEAR: WikiEntryDef[] = [
  {
    id: 'la.vectors',
    keywords: ['vectores', 'vector', 'componentes', 'módulo', 'norma', 'dirección', 'sentido', 'suma de vectores', 'producto por un escalar', 'versor', 'vector unitario', 'vector entre dos puntos', 'regla del paralelogramo', 'punto medio'],
    summary: R`Un **vector** tiene módulo (longitud), dirección y sentido. En el plano se escribe con sus componentes: $\vec v = (v_1;\ v_2)$.`,
    formulas: [
      { name: 'Vector entre dos puntos', tex: R`\vec{AB} = B - A = (x_B - x_A;\ y_B - y_A)` },
      { name: 'Módulo', tex: R`|\vec v| = \sqrt{v_1^2 + v_2^2}`, note: R`En 3D se suma también $v_3^2$.` },
      { name: 'Suma', tex: R`\vec u + \vec v = (u_1 + v_1;\ u_2 + v_2)` },
      { name: 'Producto por un escalar', tex: R`k\,\vec v = (k\,v_1;\ k\,v_2)` },
      { name: 'Versor (vector unitario)', tex: R`\hat v = \frac{\vec v}{|\vec v|}` },
      { name: 'Punto medio', tex: R`M = \left(\frac{x_A + x_B}{2};\ \frac{y_A + y_B}{2}\right)` },
      { name: 'Vectores paralelos', tex: R`\vec u = k\,\vec v`, note: 'Sus componentes son proporcionales.' },
    ],
    terms: [
      { term: 'Módulo', def: 'La longitud del vector.' },
      { term: 'Dirección y sentido', def: 'La dirección es la recta sobre la que está el vector; el sentido, hacia dónde apunta sobre ella.' },
      { term: 'Versor', def: 'Vector de módulo 1 que indica una dirección y un sentido.' },
    ],
    example: {
      problem: R`$\vec u = (2;\ -1)$, $\vec v = (1;\ 3)$. Calcula $2\vec u - \vec v$ y su módulo.`,
      steps: [
        { math: R`2\vec u - \vec v = (4 - 1;\ -2 - 3) = (3;\ -5)` },
        { math: R`|2\vec u - \vec v| = \sqrt{3^2 + (-5)^2} = \sqrt{34} \approx 5{,}83` },
      ],
    },
    mistakes: [
      { wrong: R`$\vec{AB} = A - B$`, right: R`$\vec{AB} = B - A$`, note: 'Extremo menos origen.' },
      { wrong: R`$|(3;\ -4)| = \sqrt{9 - 16}$`, right: R`$|(3;\ -4)| = \sqrt{9 + 16} = 5$`, note: 'Los cuadrados siempre suman.' },
      { wrong: R`$|\vec u + \vec v| = |\vec u| + |\vec v|$`, right: 'En general no: solo si tienen la misma dirección y sentido.' },
    ],
    remember: ['Vector de A a B: «punta menos cola».'],
    seeAlso: ['geo.pythagoras'],
  },
  {
    id: 'la.products',
    keywords: ['producto escalar', 'producto punto', 'producto interno', 'producto vectorial', 'producto cruz', 'ángulo entre vectores', 'vectores perpendiculares', 'ortogonales', 'proyección', 'área del paralelogramo', 'regla de la mano derecha'],
    summary: R`El producto **escalar** da un número que mide cuánto «apuntan hacia el mismo lado» dos vectores; el producto **vectorial** (en 3D) da un vector perpendicular a ambos.`,
    formulas: [
      { name: 'Producto escalar', tex: R`\vec u\cdot\vec v = u_1v_1 + u_2v_2 + u_3v_3` },
      { name: 'Con el ángulo', tex: R`\vec u\cdot\vec v = |\vec u|\,|\vec v|\cos\theta` },
      { name: 'Ángulo entre vectores', tex: R`\cos\theta = \frac{\vec u\cdot\vec v}{|\vec u|\,|\vec v|}` },
      { name: 'Perpendiculares', tex: R`\vec u \perp \vec v \iff \vec u\cdot\vec v = 0` },
      { name: 'Producto vectorial', tex: R`\vec u\times\vec v = \begin{vmatrix} \vec i & \vec j & \vec k \\ u_1 & u_2 & u_3 \\ v_1 & v_2 & v_3 \end{vmatrix} = (u_2v_3 - u_3v_2;\ u_3v_1 - u_1v_3;\ u_1v_2 - u_2v_1)` },
      { name: 'Módulo del producto vectorial', tex: R`|\vec u\times\vec v| = |\vec u|\,|\vec v|\sen\theta`, note: 'Es el área del paralelogramo que forman; la mitad es el área del triángulo.' },
      { name: 'Proyección', tex: R`\operatorname{proy}_{\vec v}\vec u = \frac{\vec u\cdot\vec v}{|\vec v|^2}\,\vec v` },
    ],
    tables: [
      {
        title: 'Signo del producto escalar',
        headers: ['Producto escalar', 'Ángulo entre los vectores'],
        rows: [
          [R`$> 0$`, 'agudo (menor que 90°)'],
          [R`$= 0$`, 'recto: son perpendiculares'],
          [R`$< 0$`, 'obtuso (mayor que 90°)'],
        ],
      },
    ],
    example: {
      problem: R`$\vec u = (1;\ 2;\ 3)$, $\vec v = (2;\ 0;\ -1)$.`,
      steps: [
        { math: R`\vec u\cdot\vec v = 2 + 0 - 3 = -1`, note: 'Negativo: forman un ángulo obtuso.' },
        { math: R`\vec u\times\vec v = (2\cdot(-1) - 3\cdot 0;\ 3\cdot 2 - 1\cdot(-1);\ 1\cdot 0 - 2\cdot 2) = (-2;\ 7;\ -4)` },
        { note: R`Control: $(-2;\ 7;\ -4)\cdot\vec u = -2 + 14 - 12 = 0$ ✓ (perpendicular a $\vec u$).` },
      ],
    },
    mistakes: [
      { wrong: 'El producto escalar da un vector.', right: 'Da un número (un escalar).' },
      { wrong: R`$\vec u\times\vec v = \vec v\times\vec u$`, right: R`$\vec u\times\vec v = -\,\vec v\times\vec u$` },
      { wrong: R`Si $\vec u\cdot\vec v = 0$, alguno de los dos es nulo.`, right: 'También da 0 si son perpendiculares.' },
    ],
    remember: ['Producto escalar 0 ⇔ perpendiculares. Producto vectorial nulo ⇔ paralelos.'],
    seeAlso: ['la.vectors', 'la.determinants'],
  },
  {
    id: 'la.matrices',
    keywords: ['matrices', 'matriz', 'dimensión', 'orden', 'filas', 'columnas', 'suma de matrices', 'producto de matrices', 'traspuesta', 'transpuesta', 'matriz identidad', 'matriz cuadrada', 'diagonal principal', 'matriz simétrica', 'matriz nula'],
    summary: R`Una **matriz** $m\times n$ es una tabla de números con $m$ filas y $n$ columnas.`,
    formulas: [
      { name: 'Suma', tex: R`(A + B)_{ij} = a_{ij} + b_{ij}`, note: 'Solo entre matrices de la misma dimensión.' },
      { name: 'Producto por un escalar', tex: R`(k\,A)_{ij} = k\,a_{ij}` },
      { name: 'Producto', tex: R`(A\cdot B)_{ij} = \sum_{k} a_{ik}\,b_{kj}`, note: R`Fila $i$ de $A$ por columna $j$ de $B$.` },
      { name: 'Dimensiones del producto', tex: R`A_{m\times n}\cdot B_{n\times p} = C_{m\times p}` },
      { name: 'Traspuesta', tex: R`(A^T)_{ij} = a_{ji},\quad (A\cdot B)^T = B^T\cdot A^T` },
      { name: 'Identidad', tex: R`A\cdot I = I\cdot A = A` },
    ],
    terms: [
      { term: 'Matriz cuadrada', def: 'Tiene la misma cantidad de filas que de columnas.' },
      { term: 'Diagonal principal', def: R`Los elementos $a_{11}, a_{22}, \dots, a_{nn}$ de una matriz cuadrada.` },
      { term: 'Matriz identidad', def: R`$I$: unos en la diagonal principal y ceros en el resto.` },
      { term: 'Matriz traspuesta', def: R`$A^T$: se obtiene cambiando filas por columnas.` },
      { term: 'Matriz simétrica', def: R`Cumple $A^T = A$.` },
    ],
    example: {
      problem: R`$\begin{pmatrix} 1 & 2 \\ 0 & -1 \end{pmatrix}\cdot\begin{pmatrix} 3 & 1 \\ 2 & 4 \end{pmatrix}$`,
      steps: [
        { math: R`= \begin{pmatrix} 1\cdot 3 + 2\cdot 2 & 1\cdot 1 + 2\cdot 4 \\ 0\cdot 3 + (-1)\cdot 2 & 0\cdot 1 + (-1)\cdot 4 \end{pmatrix} = \begin{pmatrix} 7 & 9 \\ -2 & -4 \end{pmatrix}` },
      ],
    },
    mistakes: [
      { wrong: 'Multiplicar matrices elemento a elemento.', right: 'Se multiplica fila por columna.' },
      { wrong: R`$A\cdot B = B\cdot A$`, right: 'En general no: el producto de matrices no es conmutativo.' },
      { wrong: R`Se puede multiplicar $A_{2\times 3}$ por $B_{2\times 3}$.`, right: 'Solo si las columnas de A coinciden con las filas de B.' },
    ],
    remember: [R`$(m\times\mathbf{n})\cdot(\mathbf{n}\times p)$: los números del medio deben coincidir y los de afuera dan el tamaño del resultado.`],
    seeAlso: ['la.determinants'],
  },
  {
    id: 'la.determinants',
    keywords: ['determinantes', 'determinante', 'Sarrus', 'regla de Sarrus', 'cofactores', 'menor complementario', 'desarrollo por una fila', 'matriz inversa', 'inversa', 'invertible', 'matriz singular', 'propiedades del determinante'],
    summary: R`El **determinante** de una matriz cuadrada es un número que indica si es invertible y cuánto escala las áreas.`,
    formulas: [
      { name: 'Determinante 2×2', tex: R`\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad - bc` },
      { name: 'Regla de Sarrus (3×3)', tex: R`\begin{vmatrix} a & b & c \\ d & e & f \\ g & h & i \end{vmatrix} = aei + bfg + cdh - ceg - afh - bdi` },
      { name: 'Inversa 2×2', tex: R`A^{-1} = \frac{1}{ad - bc}\begin{pmatrix} d & -b \\ -c & a \end{pmatrix}` },
      { name: 'Invertible', tex: R`A \text{ es invertible} \iff \det A \neq 0` },
      { name: 'Producto', tex: R`\det(A\cdot B) = \det A\cdot\det B` },
      { name: 'Escalar (matriz n×n)', tex: R`\det(k\,A) = k^n\det A` },
      { name: 'Traspuesta', tex: R`\det A^T = \det A` },
    ],
    tables: [
      {
        title: 'Propiedades útiles',
        headers: ['Si…', 'el determinante…'],
        rows: [
          ['se intercambian dos filas', 'cambia de signo'],
          ['se multiplica una fila por k', 'queda multiplicado por k'],
          ['a una fila se le suma un múltiplo de otra', 'no cambia'],
          ['dos filas son iguales o proporcionales', 'vale 0'],
          ['hay una fila de ceros', 'vale 0'],
        ],
      },
    ],
    terms: [
      { term: 'Matriz singular', def: 'Matriz cuadrada con determinante 0: no tiene inversa.' },
      { term: 'Desarrollo por una fila', def: R`Suma de cada elemento de la fila por su cofactor (su menor con el signo $(-1)^{i+j}$). Sirve para cualquier tamaño.` },
    ],
    example: {
      title: 'Regla de Sarrus',
      problem: R`$\begin{vmatrix} 2 & 1 & 3 \\ 0 & -1 & 4 \\ 1 & 2 & 0 \end{vmatrix}$`,
      steps: [
        { math: R`= 2\cdot(-1)\cdot 0 + 1\cdot 4\cdot 1 + 3\cdot 0\cdot 2 - 3\cdot(-1)\cdot 1 - 2\cdot 4\cdot 2 - 1\cdot 0\cdot 0` },
        { math: R`= 0 + 4 + 0 + 3 - 16 - 0 = -9` },
      ],
    },
    mistakes: [
      { wrong: R`$\begin{vmatrix} a & b \\ c & d \end{vmatrix} = ad + bc$`, right: R`$ad - bc$` },
      { wrong: 'Aplicar Sarrus en una matriz 4×4.', right: 'Sarrus solo vale para 3×3; en las demás, desarrollo por una fila.' },
      { wrong: R`$\det(2A) = 2\det A$ con $A$ de 3×3`, right: R`$\det(2A) = 2^3\det A = 8\det A$` },
    ],
    remember: ['det = 0 ⇔ la matriz no tiene inversa (y el sistema asociado no tiene solución única).'],
    seeAlso: ['la.linear-systems', 'la.products'],
  },
  {
    id: 'la.linear-systems',
    keywords: ['sistemas lineales', 'sistemas con matrices', 'matriz ampliada', 'Gauss', 'Gauss-Jordan', 'eliminación gaussiana', 'Cramer', 'regla de Cramer', 'operaciones elementales', 'rango', 'Rouché-Frobenius', 'forma matricial', 'sistema 3x3'],
    summary: R`Un sistema lineal se escribe $A\,\vec x = \vec b$. Se resuelve con **Gauss-Jordan** (operaciones de fila) o con la **regla de Cramer** (determinantes).`,
    formulas: [
      { name: 'Regla de Cramer', tex: R`x = \frac{\Delta_x}{\Delta},\quad y = \frac{\Delta_y}{\Delta},\quad z = \frac{\Delta_z}{\Delta}`, note: R`$\Delta = \det A \neq 0$; $\Delta_x$ es el determinante con la **columna** de $x$ reemplazada por los términos independientes.` },
      { name: 'Con la inversa', tex: R`A\,\vec x = \vec b \Rightarrow \vec x = A^{-1}\,\vec b` },
      { name: 'Rouché-Frobenius', tex: R`\text{compatible} \iff \operatorname{rg}(A) = \operatorname{rg}(A \mid b)`, note: 'Es determinado si además ese rango es igual al número de incógnitas.' },
    ],
    terms: [
      { term: 'Matriz ampliada', def: R`$(A \mid b)$: la matriz de coeficientes con la columna de términos independientes agregada.` },
      { term: 'Operaciones elementales de fila', def: R`Intercambiar filas ($F_1 \leftrightarrow F_2$), multiplicar una fila por un número no nulo y sumarle a una fila un múltiplo de otra ($F_2 \to F_2 - 2F_1$).` },
      { term: 'Rango', def: 'Cantidad de filas no nulas que quedan al escalonar la matriz.' },
    ],
    steps: {
      title: 'Método de Gauss-Jordan',
      items: [
        R`Escribe la matriz ampliada $(A \mid b)$.`,
        'Consigue un pivote (idealmente 1) en la primera columna.',
        R`Haz ceros debajo del pivote con operaciones $F_i \to F_i - k\,F_1$.`,
        'Repite con la siguiente columna (Gauss-Jordan también hace ceros arriba) hasta leer la solución.',
        R`Una fila $(0\ 0\ 0 \mid c)$ con $c \neq 0$ indica un sistema incompatible; una fila de ceros, uno indeterminado.`,
      ],
    },
    example: {
      title: 'Eliminación de Gauss',
      problem: R`$\begin{cases} x + y + z = 6 \\ 2x - y + z = 3 \\ x + 2y - z = 2 \end{cases}$`,
      steps: [
        { math: R`\left(\begin{array}{ccc|c} 1 & 1 & 1 & 6 \\ 2 & -1 & 1 & 3 \\ 1 & 2 & -1 & 2 \end{array}\right)` },
        { math: R`\left(\begin{array}{ccc|c} 1 & 1 & 1 & 6 \\ 0 & -3 & -1 & -9 \\ 0 & 1 & -2 & -4 \end{array}\right)`, note: 'F₂ → F₂ − 2F₁ y F₃ → F₃ − F₁.' },
        { math: R`\left(\begin{array}{ccc|c} 1 & 1 & 1 & 6 \\ 0 & 1 & -2 & -4 \\ 0 & 0 & -7 & -21 \end{array}\right)`, note: 'F₂ ↔ F₃ y después F₃ → F₃ + 3F₂.' },
        { math: R`z = 3,\quad y = -4 + 2\cdot 3 = 2,\quad x = 6 - 2 - 3 = 1`, note: 'Sustitución hacia atrás.' },
      ],
    },
    mistakes: [
      { wrong: 'En Cramer, reemplazar una fila por los términos independientes.', right: 'Se reemplaza la **columna** de la incógnita.' },
      { wrong: 'Aplicar la operación de fila solo a los coeficientes.', right: 'También se aplica a la columna de términos independientes.' },
      { wrong: R`Usar Cramer con $\Delta = 0$.`, right: 'Si Δ = 0, Cramer no se aplica: el sistema es indeterminado o incompatible.' },
    ],
    remember: [R`Cramer: «determinante con la columna de la incógnita cambiada, sobre el determinante del sistema».`],
    seeAlso: ['alg.systems', 'la.determinants'],
  },
];
