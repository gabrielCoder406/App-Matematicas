// Buscador de la wiki: sin distinguir tildes ni mayúsculas, tolerante a plurales y a palabras a
// medio escribir. Pondera título > sinónimos > definiciones y fórmulas > resto del texto.
import { BLOCK_BY_ID } from '../curriculum';
import type { WikiEntry, WikiFormula, WikiTerm } from './types';

export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Raíz simple para que singular y plural coincidan: «raíces» ≈ «raíz», «fracciones» ≈ «fracción». */
function stem(w: string): string {
  if (w.length > 3 && w.endsWith('s')) w = w.slice(0, -1);
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  if (w.endsWith('z')) w = `${w.slice(0, -1)}c`;
  return w;
}

/** Texto enriquecido sin fórmulas ni marcas de formato. */
function plain(rich: string): string {
  return rich.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, ' ').replace(/\*\*/g, '');
}

function words(text: string): string[] {
  return normalize(plain(text)).split(/[^a-z0-9]+/).filter(Boolean).map(stem);
}

const STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'lo', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'en', 'a', 'al', 'que', 'por', 'para', 'con', 'se', 'es', 'su', 'sus', 'como', 'cual', 'cuales', 'mi', 'me', 'te']);

/** Frase sin palabras vacías, para premiar coincidencias completas («teorema del seno»). */
function phrase(text: string): string {
  return normalize(plain(text)).split(/[^a-z0-9]+/).filter((w) => w && !STOPWORDS.has(w)).map(stem).join(' ');
}

/** Palabras de la consulta (sin palabras vacías, salvo que no quede ninguna). */
export function queryTokens(query: string): string[] {
  const raw = normalize(query).split(/[^a-z0-9]+/).filter(Boolean);
  const useful = raw.filter((w) => !STOPWORDS.has(w));
  return (useful.length ? useful : raw).map(stem);
}

interface Field {
  words: string[];
  weight: number;
}

interface Doc {
  entry: WikiEntry;
  fields: Field[];
  phrases: string[];
}

/** Coincidencia de una palabra de la consulta con un campo: exacta, prefijo o parte de una palabra. */
function tokenScore(tok: string, ws: string[]): number {
  let best = 0;
  for (const w of ws) {
    if (w === tok) return 1;
    if (tok.length >= 2 && w.startsWith(tok)) best = Math.max(best, 0.75);
    else if (tok.length >= 4 && w.includes(tok)) best = Math.max(best, 0.4);
  }
  return best;
}

function buildDoc(e: WikiEntry): Doc {
  const fields: Field[] = [];
  const add = (text: string | undefined, weight: number) => {
    if (text) fields.push({ words: words(text), weight });
  };
  add(e.title, 10);
  e.keywords.forEach((k) => add(k, 8));
  if (e.block) add(BLOCK_BY_ID[e.block].title, 1.5);
  add(e.summary, 3);
  e.terms?.forEach((t) => {
    add(t.term, 7);
    add(t.def, 2);
  });
  e.formulas?.forEach((f) => {
    add(f.name, 6);
    add(f.note, 1.5);
  });
  e.tables?.forEach((t) => {
    add(t.title, 2);
    t.headers.forEach((h) => add(h, 1));
    t.rows.forEach((r) => r.forEach((c) => add(c, 1.5)));
  });
  if (e.steps) {
    add(e.steps.title, 2);
    e.steps.items.forEach((s) => add(s, 1));
  }
  if (e.example) {
    add(e.example.title, 1.5);
    add(e.example.problem, 1);
    e.example.steps.forEach((s) => add(s.note, 1));
  }
  e.mistakes?.forEach((m) => {
    add(m.wrong, 1.5);
    add(m.right, 1.5);
    add(m.note, 1);
  });
  e.remember?.forEach((r) => add(r, 1.5));
  return { entry: e, fields, phrases: [e.title, ...e.keywords].map(phrase) };
}

export type WikiMatch = { kind: 'formula'; formula: WikiFormula } | { kind: 'term'; term: WikiTerm };

export interface WikiHit {
  entry: WikiEntry;
  score: number;
  /** Fórmulas o definiciones de la ficha que coinciden con la búsqueda (para verlas sin abrirla). */
  matches: WikiMatch[];
}

/** Fórmulas y definiciones cuyo nombre coincide con la consulta, las más parecidas primero. */
function bestMatches(e: WikiEntry, tokens: string[]): WikiMatch[] {
  const scored: { m: WikiMatch; s: number }[] = [];
  // Las palabras que ya están en el título de la ficha distinguen poco dentro de ella
  // («derivada del producto» en «Derivadas» debe destacar la regla del producto).
  const title = words(e.title);
  const weights = tokens.map((t) => (tokenScore(t, title) > 0 ? 0.3 : 1));
  const score = (text: string) => {
    const ws = words(text);
    return tokens.reduce((total, t, i) => total + weights[i] * tokenScore(t, ws), 0);
  };
  e.terms?.forEach((term) => {
    const s = score(term.term);
    if (s > 0) scored.push({ m: { kind: 'term', term }, s: s + 0.1 });
  });
  e.formulas?.forEach((formula) => {
    const s = score(formula.name);
    if (s > 0) scored.push({ m: { kind: 'formula', formula }, s });
  });
  return scored.sort((a, b) => b.s - a.s).slice(0, 2).map((x) => x.m);
}

export function createSearch(entries: WikiEntry[]) {
  let docs: Doc[] | null = null;
  return function search(query: string, limit = 30): WikiHit[] {
    const tokens = queryTokens(query);
    if (!tokens.length) return [];
    docs ??= entries.map(buildDoc);
    const joined = tokens.join(' ');
    const hits: WikiHit[] = [];
    for (const doc of docs) {
      let score = 0;
      let missing = false;
      for (const tok of tokens) {
        let best = 0;
        for (const f of doc.fields) best = Math.max(best, f.weight * tokenScore(tok, f.words));
        if (best === 0) {
          missing = true;
          break;
        }
        score += best;
      }
      if (missing) continue;
      // Frase completa al comienzo de una palabra (la última puede estar a medio escribir).
      const inPhrase = (p: string) => ` ${p}`.includes(` ${joined}`);
      if (inPhrase(doc.phrases[0])) score += 12;
      else if (doc.phrases.slice(1).some((p) => p === joined)) score += 10;
      else if (tokens.length > 1 && doc.phrases.some(inPhrase)) score += 8;
      hits.push({ entry: doc.entry, score, matches: bestMatches(doc.entry, tokens) });
    }
    // Orden estable: a igual puntaje, el orden del temario.
    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  };
}
