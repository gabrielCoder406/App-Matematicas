// Bloque 8: estadística y probabilidad.
import { Frac } from '../../math/fraction';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { comb, factorial, n, perm, R, round } from './util';

const dataTex = (xs: number[]) => xs.map((x) => n(x)).join(',\\ ');
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);
const tolFor = (v: number) => (Number.isInteger(v) ? undefined : 0.006);

function median(xs: number[]): number {
  const s = sorted(xs);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// ---------------------------------------------------------------------------
// Medidas de tendencia central
// ---------------------------------------------------------------------------

const statMean: Generator = {
  id: 'stat.mean', skillId: 'stats.central', title: 'Media aritmética', levels: [1, 2],
  generate(rng, level) {
    const k = rng.int(5, level === 1 ? 6 : 9);
    const xs = Array.from({ length: k }, () => rng.int(1, level === 1 ? 10 : 25));
    const m = mean(xs);
    const sum = xs.reduce((a, b) => a + b, 0);
    return {
      prompt: R`Las notas de un estudiante fueron: $${dataTex(xs)}$. ¿Cuál es su promedio (media)?${Number.isInteger(m) ? '' : ' (Con dos decimales o como fracción.)'}`,
      answer: { kind: 'numeric', value: m, tolerance: tolFor(m) },
      hints: [R`Media: $\bar x = \frac{\text{suma de los datos}}{\text{cantidad de datos}}$.`, R`Suma: $${sum}$; cantidad: $${k}$.`, R`$\bar x = \frac{${sum}}{${k}} = ${new Frac(sum, k).toLatex()}${Number.isInteger(m) ? '' : R` \approx ${n(round(m))}`}$.`],
      solution: [{ math: R`\bar x = \frac{${sum}}{${k}} \approx ${n(round(m))}` }], expectedSeconds: 45,
    };
  },
};

const statMedian: Generator = {
  id: 'stat.median', skillId: 'stats.central', title: 'Mediana', levels: [1, 2, 3],
  generate(rng, level) {
    const k = level === 3 ? rng.pick([6, 8]) : rng.pick([5, 7]);
    let xs = Array.from({ length: k }, () => rng.int(1, 30));
    if (level === 1) xs = sorted(xs);
    const md = median(xs);
    const s = sorted(xs);
    return {
      prompt: R`Halla la mediana de los datos: $${dataTex(xs)}$.`,
      answer: { kind: 'numeric', value: md },
      hints: [R`La mediana es el valor central de los datos **ordenados**. Con una cantidad par de datos, es el promedio de los dos centrales.`, R`Ordenados: $${dataTex(s)}$.`, R`Mediana: $${n(md)}$.`],
      solution: [{ math: R`\text{Me} = ${n(md)}` }], expectedSeconds: 40 + 10 * level,
    };
  },
};

const statMode: Generator = {
  id: 'stat.mode', skillId: 'stats.central', title: 'Moda', levels: [1, 2],
  generate(rng, level) {
    const pool = rng.sample([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 5);
    const modes = level === 2 && rng.bool() ? pool.slice(0, 2) : pool.slice(0, 1);
    const xs: number[] = [];
    modes.forEach((m) => xs.push(m, m, m));
    pool.slice(2).forEach((v) => {
      for (let i = rng.int(1, 2); i > 0; i--) xs.push(v);
    });
    const shuffled = rng.shuffle(xs);
    return {
      prompt: R`¿Cuál es la moda de: $${dataTex(shuffled)}$? (Si hay más de una, escríbelas todas separadas por comas.)`,
      answer: { kind: 'set', elements: modes.map(String) },
      hints: ['La moda es el valor que más se repite. Puede haber más de una.', 'Cuenta cuántas veces aparece cada valor.', `La moda es ${modes.join(' y ')} (aparece${modes.length > 1 ? 'n' : ''} 3 veces).`],
      solution: [{ note: `Mo = ${modes.join(', ')}` }], expectedSeconds: 35,
    };
  },
};

const freqMean: Generator = {
  id: 'stat.freq-mean', skillId: 'stats.central', title: 'Media con tabla de frecuencias', levels: [2, 3],
  generate(rng) {
    const values = sorted(rng.sample([0, 1, 2, 3, 4, 5, 6], 4));
    const freqs = values.map(() => rng.int(1, 9));
    const N = freqs.reduce((a, b) => a + b, 0);
    const S = values.reduce((acc, v, i) => acc + v * freqs[i], 0);
    const m = S / N;
    return {
      prompt: 'La tabla muestra la cantidad de hermanos de los alumnos de un curso. Calcula la media.' + (Number.isInteger(m) ? '' : ' (Con dos decimales.)'),
      visual: { type: 'table', headers: ['Hermanos', 'Frecuencia'], rows: values.map((v, i) => [String(v), String(freqs[i])]) },
      answer: { kind: 'numeric', value: m, tolerance: tolFor(m) },
      hints: [R`Con tabla de frecuencias: $\bar x = \frac{\sum x_i f_i}{\sum f_i}$.`, R`$\sum x_i f_i = ${values.map((v, i) => `${v}\\cdot ${freqs[i]}`).join(' + ')} = ${S}$ y $\sum f_i = ${N}$.`, R`$\bar x = \frac{${S}}{${N}} \approx ${n(round(m))}$.`],
      solution: [{ math: R`\bar x = \frac{${S}}{${N}} \approx ${n(round(m))}` }], expectedSeconds: 70,
    };
  },
};

// ---------------------------------------------------------------------------
// Dispersión
// ---------------------------------------------------------------------------

function niceData(rng: Rng): number[] {
  const mu = rng.int(4, 12);
  const devs = rng.pick([[-2, 0, 2], [-3, -1, 1, 3], [-4, -1, 0, 1, 4], [-2, -2, 1, 3], [-3, 0, 0, 3], [-5, -1, 2, 4]]);
  return rng.shuffle(devs.map((d) => mu + d));
}

const statRange: Generator = {
  id: 'stat.range', skillId: 'stats.dispersion', title: 'Rango', levels: [1],
  generate(rng) {
    const xs = Array.from({ length: rng.int(5, 8) }, () => rng.int(-5, 40));
    const r = Math.max(...xs) - Math.min(...xs);
    return {
      prompt: R`Calcula el rango de: $${dataTex(xs)}$.`,
      answer: { kind: 'numeric', value: r },
      hints: ['Rango = valor máximo − valor mínimo.', R`Máximo: $${Math.max(...xs)}$; mínimo: $${Math.min(...xs)}$.`, R`Rango $= ${r}$.`],
      solution: [{ math: R`${Math.max(...xs)} - ${Math.min(...xs) < 0 ? `(${Math.min(...xs)})` : Math.min(...xs)} = ${r}` }], expectedSeconds: 25,
    };
  },
};

const statVariance: Generator = {
  id: 'stat.variance', skillId: 'stats.dispersion', title: 'Varianza y desviación estándar', levels: [1, 2, 3],
  generate(rng, level) {
    const xs = niceData(rng);
    const m = mean(xs);
    const devs = xs.map((x) => x - m);
    const sq = devs.map((d) => d * d);
    const v = sq.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(v);
    const askSd = level >= 2 && (level === 3 || rng.bool());
    const val = askSd ? sd : v;
    return {
      prompt: R`Calcula la ${askSd ? 'desviación estándar' : 'varianza'} (poblacional) de: $${dataTex(xs)}$.${Number.isInteger(val) ? '' : ' (Con dos decimales.)'}`,
      answer: { kind: 'numeric', value: val, tolerance: tolFor(val) },
      hints: [
        R`Varianza: $\sigma^2 = \frac{\sum (x_i - \bar x)^2}{n}$. Desviación estándar: $\sigma = \sqrt{\sigma^2}$.`,
        R`$\bar x = ${n(m)}$; desvíos al cuadrado: $${sq.map((s) => n(s)).join(',\\ ')}$.`,
        R`$\sigma^2 = \frac{${sq.reduce((a, b) => a + b, 0)}}{${xs.length}} = ${n(round(v, 4))}$${askSd ? R`, $\sigma = \sqrt{${n(round(v, 4))}} \approx ${n(round(sd))}$` : ''}.`,
      ],
      solution: [{ math: R`\sigma^2 = ${n(round(v, 4))},\quad \sigma \approx ${n(round(sd))}` }], expectedSeconds: 90 + 20 * level,
    };
  },
};

// ---------------------------------------------------------------------------
// Gráficos
// ---------------------------------------------------------------------------

const histogram: Generator = {
  id: 'chart.histogram', skillId: 'stats.charts', title: 'Leer un histograma', levels: [1, 2, 3],
  generate(rng, level) {
    const w = rng.pick([5, 10, 20]);
    const start = rng.pick([0, 10, 20]);
    const bins = Array.from({ length: 5 }, (_, i) => ({ label: `${start + i * w}-${start + (i + 1) * w}`, value: rng.int(2, 15) }));
    const total = bins.reduce((a, b) => a + b.value, 0);
    const i = rng.int(0, 4);
    const maxIdx = bins.reduce((best, b, j) => (b.value > bins[best].value ? j : best), 0);
    const isUniqueMax = bins.filter((b) => b.value === bins[maxIdx].value).length === 1;
    const visual = { type: 'histogram' as const, bins, xLabel: 'Tiempo de viaje (min)', yLabel: 'Estudiantes' };
    if (level === 1) return {
      prompt: `Según el histograma, ¿cuántos estudiantes tardan entre ${bins[i].label.replace('-', ' y ')} minutos?`,
      visual, answer: { kind: 'numeric', value: bins[i].value },
      hints: ['La altura de cada barra indica la frecuencia de esa clase.', `Busca la barra ${bins[i].label}.`, `La barra mide ${bins[i].value}.`],
      solution: [{ note: `${bins[i].value} estudiantes.` }], expectedSeconds: 20,
    };
    if (level === 2 && isUniqueMax && rng.bool()) {
      const labels = bins.map((b) => b.label);
      return {
        prompt: '¿Cuál es la clase modal (la de mayor frecuencia)?',
        visual, answer: { kind: 'choice', options: labels, correct: maxIdx },
        hints: ['La clase modal es la barra más alta.', 'Compara las alturas de todas las barras.', `Es la clase ${labels[maxIdx]}.`],
        solution: [{ note: labels[maxIdx] }], expectedSeconds: 20,
      };
    }
    if (level === 2) return {
      prompt: '¿Cuántos estudiantes participaron en total de la encuesta?',
      visual, answer: { kind: 'numeric', value: total },
      hints: ['El total es la suma de las frecuencias (las alturas de todas las barras).', `Suma: ${bins.map((b) => b.value).join(' + ')}.`, `Total: ${total}.`],
      solution: [{ note: `Total = ${total}` }], expectedSeconds: 35,
    };
    const pct = (bins[i].value / total) * 100;
    return {
      prompt: `¿Qué porcentaje de los estudiantes tarda entre ${bins[i].label.replace('-', ' y ')} minutos? (Con un decimal.)`,
      visual, answer: { kind: 'numeric', value: pct, tolerance: 0.06, unit: '%' },
      hints: [R`Frecuencia relativa porcentual $= \frac{f_i}{N}\cdot 100$.`, R`$f_i = ${bins[i].value}$, $N = ${total}$.`, R`$\frac{${bins[i].value}}{${total}}\cdot 100 \approx ${n(round(pct, 1))}\%$.`],
      solution: [{ math: R`\approx ${n(round(pct, 1))}\%` }], expectedSeconds: 60,
    };
  },
};

const scatter: Generator = {
  id: 'chart.scatter', skillId: 'stats.charts', title: 'Diagramas de dispersión', levels: [1, 2],
  generate(rng) {
    const kind = rng.int(0, 2);
    const slope = kind === 0 ? rng.int(1, 3) : kind === 1 ? -rng.int(1, 3) : 0;
    const pts: [number, number][] = Array.from({ length: 14 }, () => {
      const x = rng.int(1, 20);
      const y = kind === 2 ? rng.int(5, 45) : 25 + slope * (x - 10) + rng.int(-4, 4);
      return [x, y];
    });
    const labels = ['Correlación positiva', 'Correlación negativa', 'Sin correlación aparente'];
    return {
      prompt: '¿Qué tipo de relación muestra el diagrama de dispersión?',
      visual: { type: 'scatter', points: pts, xLabel: 'Horas de estudio', yLabel: 'Puntaje' },
      answer: { kind: 'choice', options: labels, correct: kind },
      hints: ['Mira la tendencia general de la nube de puntos de izquierda a derecha.', '¿Los puntos suben, bajan o no siguen un patrón?', `${labels[kind]}.`],
      solution: [{ note: labels[kind] }], expectedSeconds: 20,
    };
  },
};

const relFreq: Generator = {
  id: 'chart.relfreq', skillId: 'stats.charts', title: 'Frecuencia relativa', levels: [1, 2],
  generate(rng) {
    const cats = rng.sample(['Fútbol', 'Básquet', 'Vóley', 'Tenis', 'Natación', 'Hockey'], 4);
    const f = cats.map(() => rng.int(2, 12) * 2);
    const N = f.reduce((a, b) => a + b, 0);
    const i = rng.int(0, 3);
    const rel = new Frac(f[i], N);
    return {
      prompt: `En una encuesta sobre deportes favoritos, ¿cuál es la frecuencia relativa de «${cats[i]}»? (Como fracción o decimal.)`,
      visual: { type: 'table', headers: ['Deporte', 'Frecuencia'], rows: cats.map((c, j) => [c, String(f[j])]) },
      answer: { kind: 'numeric', value: rel.toNumber(), tolerance: 0.0051 },
      hints: [R`Frecuencia relativa $= \frac{f_i}{N}$ (frecuencia sobre el total).`, R`Total $N = ${N}$.`, R`$\frac{${f[i]}}{${N}} = ${rel.toLatex()} \approx ${n(round(rel.toNumber(), 3))}$.`],
      solution: [{ math: R`h_i = ${rel.toLatex()}` }], expectedSeconds: 40,
    };
  },
};

// ---------------------------------------------------------------------------
// Combinatoria
// ---------------------------------------------------------------------------

const factorials: Generator = {
  id: 'comb.factorial', skillId: 'comb.counting', title: 'Factoriales', levels: [1, 2],
  generate(rng, level) {
    if (level === 1) {
      const k = rng.int(3, 7);
      return {
        prompt: R`Calcula $${k}!$`,
        answer: { kind: 'numeric', value: factorial(k) },
        hints: [R`$n! = n\cdot(n-1)\cdots 2\cdot 1$.`, R`$${k}! = ${Array.from({ length: k }, (_, i) => k - i).join('\\cdot ')}$.`, R`$= ${factorial(k)}$.`],
        solution: [{ math: R`${k}! = ${factorial(k)}` }], expectedSeconds: 25,
      };
    }
    const m = rng.int(7, 15), k = rng.int(2, 3);
    const v = perm(m, k);
    return {
      prompt: R`Simplifica y calcula $\frac{${m}!}{${m - k}!}$`,
      answer: { kind: 'numeric', value: v },
      hints: [R`Escribe el mayor factorial hasta llegar al menor: $${m}! = ${Array.from({ length: k }, (_, i) => m - i).join('\\cdot ')}\cdot ${m - k}!$.`, R`Se simplifica $${m - k}!$.`, R`$${Array.from({ length: k }, (_, i) => m - i).join('\\cdot ')} = ${v}$.`],
      solution: [{ math: R`\frac{${m}!}{${m - k}!} = ${v}` }], expectedSeconds: 40,
    };
  },
};

const countingProblems: Generator = {
  id: 'comb.problems', skillId: 'comb.counting', title: 'Problemas de conteo', levels: [1, 2, 3],
  generate(rng, level) {
    const kind = level === 1 ? rng.int(0, 1) : level === 2 ? rng.int(1, 2) : rng.int(2, 4);
    const nn = rng.int(5, 10), k = rng.int(2, 4);
    const cases = [
      { q: `¿De cuántas maneras pueden ordenarse ${Math.min(nn, 7)} libros distintos en un estante?`, v: factorial(Math.min(nn, 7)), f: R`P_{${Math.min(nn, 7)}} = ${Math.min(nn, 7)}!`, why: 'Importa el orden y se usan todos: permutaciones.' },
      { q: `En una carrera con ${nn} participantes, ¿de cuántas formas pueden repartirse oro, plata y bronce?`, v: perm(nn, 3), f: R`V_{${nn},3} = \frac{${nn}!}{${nn - 3}!}`, why: 'Importa el orden y se eligen 3 de n: variaciones.' },
      { q: `¿Cuántos grupos de ${k} estudiantes se pueden formar con ${nn + 2} estudiantes?`, v: comb(nn + 2, k), f: R`C_{${nn + 2},${k}} = \binom{${nn + 2}}{${k}}`, why: 'No importa el orden: combinaciones.' },
      { q: `¿Cuántas claves de ${k + 1} dígitos (del 0 al 9, pudiendo repetirse) existen?`, v: 10 ** (k + 1), f: R`VR_{10,${k + 1}} = 10^{${k + 1}}`, why: 'Importa el orden y se puede repetir: variaciones con repetición.' },
      { q: `¿Cuántos anagramas (con o sin sentido) tiene la palabra «CASA»?`, v: 12, f: R`\frac{4!}{2!} = 12`, why: 'Permutaciones con repetición: la A aparece 2 veces.' },
    ];
    const c = cases[kind];
    return {
      prompt: c.q,
      answer: { kind: 'numeric', value: c.v },
      hints: ['Pregúntate: ¿importa el orden? ¿se usan todos los elementos? ¿se pueden repetir?', c.why, R`$${c.f} = ${c.v}$.`],
      solution: [{ math: R`${c.f} = ${c.v}` }], expectedSeconds: 50 + 15 * level,
    };
  },
};

const whichCount: Generator = {
  id: 'comb.which', skillId: 'comb.counting', title: '¿Permutación, variación o combinación?', levels: [1, 2],
  generate(rng) {
    const items = [
      { q: 'Elegir 3 sabores de helado de entre 10 para un cucurucho (el orden no importa).', a: 2 },
      { q: 'Formar números de 3 cifras distintas con los dígitos 1 al 7.', a: 1 },
      { q: 'Sentar a 6 amigos en 6 sillas en fila.', a: 0 },
      { q: 'Elegir presidente, secretario y tesorero entre 15 personas.', a: 1 },
      { q: 'Elegir 5 cartas de un mazo de 40.', a: 2 },
      { q: 'Ordenar las letras de la palabra «MESA».', a: 0 },
    ];
    const it = rng.pick(items);
    const labels = ['Permutación', 'Variación', 'Combinación'];
    return {
      prompt: `¿Qué tipo de agrupamiento corresponde? ${it.q}`,
      answer: { kind: 'choice', options: labels, correct: it.a },
      hints: ['Permutación: se ordenan todos. Variación: se eligen algunos y el orden importa. Combinación: se eligen algunos y el orden no importa.', '¿Si cambio el orden obtengo un caso distinto?', `Es ${labels[it.a].toLowerCase()}.`],
      solution: [{ note: labels[it.a] }], expectedSeconds: 25,
    };
  },
};

// ---------------------------------------------------------------------------
// Probabilidad
// ---------------------------------------------------------------------------

const dice: Generator = {
  id: 'prob.dice', skillId: 'prob.laplace', title: 'Probabilidad con dados', levels: [1, 2, 3],
  generate(rng, level) {
    if (level === 1) {
      const events = [
        { e: 'salga un número par', fav: 3 }, { e: 'salga un número mayor que 4', fav: 2 },
        { e: 'salga un múltiplo de 3', fav: 2 }, { e: 'salga un número primo', fav: 3 }, { e: 'salga un 6', fav: 1 },
      ];
      const ev = rng.pick(events);
      const p = new Frac(ev.fav, 6);
      return {
        prompt: `Se lanza un dado. ¿Cuál es la probabilidad de que ${ev.e}?`,
        answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
        hints: [R`Regla de Laplace: $P = \frac{\text{favorables}}{\text{posibles}}$.`, `Casos posibles: 6. Casos favorables: ${ev.fav}.`, R`$P = \frac{${ev.fav}}{6} = ${p.toLatex()}$.`],
        solution: [{ math: R`P = ${p.toLatex()}` }], expectedSeconds: 25,
      };
    }
    const target = rng.int(3, 11);
    let fav = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (a + b === target) fav++;
    if (level === 2) {
      const p = new Frac(fav, 36);
      return {
        prompt: `Se lanzan dos dados. ¿Cuál es la probabilidad de que la suma sea ${target}?`,
        answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
        hints: [R`Hay $6\cdot 6 = 36$ resultados posibles (igualmente probables).`, `Cuenta los pares (a, b) con a + b = ${target}: hay ${fav}.`, R`$P = \frac{${fav}}{36} = ${p.toLatex()}$.`],
        solution: [{ math: R`P = \frac{${fav}}{36} = ${p.toLatex()}` }], expectedSeconds: 60,
      };
    }
    const p = new Frac(11, 36);
    return {
      prompt: 'Se lanzan dos dados. ¿Cuál es la probabilidad de obtener al menos un 6?',
      answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
      hints: [R`Usa el complemento: $P(\text{al menos un } 6) = 1 - P(\text{ningún } 6)$.`, R`$P(\text{ningún } 6) = \frac{5}{6}\cdot\frac{5}{6} = \frac{25}{36}$.`, R`$1 - \frac{25}{36} = \frac{11}{36}$.`],
      solution: [{ math: R`1 - \frac{25}{36} = \frac{11}{36}` }], expectedSeconds: 70,
    };
  },
};

const urn: Generator = {
  id: 'prob.urn', skillId: 'prob.laplace', title: 'Extracciones de una urna', levels: [1, 2, 3],
  generate(rng, level) {
    const r = rng.int(2, 8), b = rng.int(2, 8), g = rng.int(1, 6);
    const N = r + b + g;
    if (level === 1) {
      const p = new Frac(r, N);
      return {
        prompt: `Una urna tiene ${r} bolillas rojas, ${b} azules y ${g} verdes. Se saca una al azar. ¿Cuál es la probabilidad de que sea roja?`,
        answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
        hints: [R`$P = \frac{\text{favorables}}{\text{posibles}}$.`, `Hay ${N} bolillas en total y ${r} son rojas.`, R`$P = \frac{${r}}{${N}} = ${p.toLatex()}$.`],
        solution: [{ math: R`P = ${p.toLatex()}` }], expectedSeconds: 30,
      };
    }
    if (level === 2) {
      const p = new Frac(N - g, N);
      return {
        prompt: `Una urna tiene ${r} bolillas rojas, ${b} azules y ${g} verdes. ¿Cuál es la probabilidad de que una bolilla extraída al azar **no** sea verde?`,
        answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
        hints: [R`Complemento: $P(\text{no } A) = 1 - P(A)$.`, R`$P(\text{verde}) = \frac{${g}}{${N}}$.`, R`$1 - \frac{${g}}{${N}} = ${p.toLatex()}$.`],
        solution: [{ math: R`P = ${p.toLatex()}` }], expectedSeconds: 40,
      };
    }
    const p = new Frac(r * (r - 1), N * (N - 1));
    return {
      prompt: `Una urna tiene ${r} bolillas rojas, ${b} azules y ${g} verdes. Se sacan dos sin reposición. ¿Cuál es la probabilidad de que ambas sean rojas?`,
      answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
      hints: [R`Sin reposición, la segunda extracción depende de la primera: $P = P(R_1)\cdot P(R_2 \mid R_1)$.`, R`$P = \frac{${r}}{${N}}\cdot\frac{${r - 1}}{${N - 1}}$.`, R`$P = ${p.toLatex()}$.`],
      solution: [{ math: R`\frac{${r}}{${N}}\cdot\frac{${r - 1}}{${N - 1}} = ${p.toLatex()}` }], expectedSeconds: 80,
    };
  },
};

const probUnion: Generator = {
  id: 'prob.union', skillId: 'prob.laplace', title: 'Probabilidad de la unión', levels: [2, 3],
  generate(rng) {
    const pa = rng.int(20, 60) / 100, pb = rng.int(20, 50) / 100;
    const pab = rng.int(5, Math.min(pa, pb) * 100 - 1) / 100;
    const v = Math.round((pa + pb - pab) * 100) / 100;
    return {
      prompt: R`Si $P(A) = ${n(pa)}$, $P(B) = ${n(pb)}$ y $P(A\cap B) = ${n(pab)}$, ¿cuánto vale $P(A\cup B)$?`,
      answer: { kind: 'numeric', value: v, tolerance: 1e-6 },
      hints: [R`$P(A\cup B) = P(A) + P(B) - P(A\cap B)$ (se resta la intersección para no contarla dos veces).`, R`$${n(pa)} + ${n(pb)} - ${n(pab)}$.`, R`$P(A\cup B) = ${n(v)}$.`],
      solution: [{ math: R`P(A\cup B) = ${n(v)}` }], expectedSeconds: 40,
    };
  },
};

const cards: Generator = {
  id: 'prob.cards', skillId: 'prob.laplace', title: 'Probabilidad con la baraja española', levels: [1, 2],
  generate(rng) {
    const events = [
      { e: 'sea de oros', fav: 10 }, { e: 'sea un as (un 1)', fav: 4 }, { e: 'sea una figura (10, 11 o 12)', fav: 12 },
      { e: 'sea de espadas o de bastos', fav: 20 }, { e: 'sea el 7 de oros', fav: 1 }, { e: 'no sea de copas', fav: 30 },
    ];
    const ev = rng.pick(events);
    const p = new Frac(ev.fav, 40);
    return {
      prompt: `De una baraja española de 40 cartas (4 palos de 10 cartas: 1 al 7, 10, 11 y 12) se extrae una al azar. ¿Cuál es la probabilidad de que ${ev.e}?`,
      answer: { kind: 'numeric', value: p.toNumber(), requireReduced: true },
      hints: [R`Laplace: $P = \frac{\text{favorables}}{40}$.`, `Hay ${ev.fav} cartas favorables.`, R`$P = \frac{${ev.fav}}{40} = ${p.toLatex()}$.`],
      solution: [{ math: R`P = ${p.toLatex()}` }], expectedSeconds: 35,
    };
  },
};

export const STATISTICS_GENERATORS: Generator[] = [
  statMean, statMedian, statMode, freqMean,
  statRange, statVariance,
  histogram, scatter, relFreq,
  factorials, countingProblems, whichCount,
  dice, urn, probUnion, cards,
];
