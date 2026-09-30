// Wiki de temas: una ficha de consulta rápida por tema del temario (fórmulas, definiciones,
// procedimiento, ejemplo resuelto y errores frecuentes), más fichas de referencia general.
import { BLOCKS, dependents, SKILL_BY_ID, SKILLS } from '../curriculum';
import type { BlockId } from '../types';
import { WIKI_ALGEBRA } from './algebra';
import { WIKI_ARITHMETIC } from './arithmetic';
import { WIKI_CALCULUS } from './calculus';
import { WIKI_FUNCTIONS } from './functions';
import { WIKI_GEOMETRY } from './geometry';
import { WIKI_LINEAR } from './linear';
import { WIKI_LOGIC } from './logic';
import { WIKI_REFERENCE } from './reference';
import { createSearch, normalize } from './search';
import { WIKI_STATISTICS } from './statistics';
import type { WikiEntry, WikiEntryDef, WikiTerm } from './types';

export type { WikiEntry, WikiFormula, WikiMistake, WikiTable, WikiTerm } from './types';
export type { WikiHit, WikiMatch } from './search';

const DEFS: WikiEntryDef[] = [
  ...WIKI_REFERENCE, ...WIKI_LOGIC, ...WIKI_ARITHMETIC, ...WIKI_ALGEBRA, ...WIKI_GEOMETRY,
  ...WIKI_FUNCTIONS, ...WIKI_CALCULUS, ...WIKI_LINEAR, ...WIKI_STATISTICS,
];

function build(def: WikiEntryDef): WikiEntry {
  const skill = SKILL_BY_ID[def.id];
  return { ...def, title: def.title ?? skill?.title ?? def.id, block: skill?.block ?? null, isSkill: !!skill };
}

const BUILT = new Map(DEFS.map((d) => [d.id, build(d)]));

/** Todas las fichas: primero las de referencia general y después en el orden del temario. */
export const WIKI: WikiEntry[] = [
  ...DEFS.filter((d) => !SKILL_BY_ID[d.id]).map((d) => BUILT.get(d.id)!),
  ...SKILLS.flatMap((s) => BUILT.get(s.id) ?? []),
];

export const WIKI_BY_ID: Record<string, WikiEntry> = Object.fromEntries(WIKI.map((e) => [e.id, e]));

export function wikiEntry(id: string | null | undefined): WikiEntry | undefined {
  return id ? WIKI_BY_ID[id] : undefined;
}

/** Grupos para navegar: «Referencia general» y los bloques del temario. */
export function wikiGroups(block: BlockId | null = null): { block: BlockId | null; title: string; entries: WikiEntry[] }[] {
  const general = { block: null, title: 'Referencia general', entries: WIKI.filter((e) => !e.block) };
  const blocks = BLOCKS.map((b) => ({ block: b.id, title: b.title, entries: WIKI.filter((e) => e.block === b.id) }));
  const all = [general, ...blocks].filter((g) => g.entries.length > 0);
  return block ? all.filter((g) => g.block === block) : all;
}

/** Fichas relacionadas: requisitos, temas que la usan y otras que conviene ver. */
export function relatedEntries(id: string): { prereqs: WikiEntry[]; usedIn: WikiEntry[]; seeAlso: WikiEntry[] } {
  const entry = WIKI_BY_ID[id];
  const pick = (ids: string[]) => ids.flatMap((i) => WIKI_BY_ID[i] ?? []);
  const prereqs = pick(SKILL_BY_ID[id]?.prereqs ?? []);
  const usedIn = pick(SKILL_BY_ID[id] ? dependents(id).map((s) => s.id) : []);
  const shown = new Set([id, ...prereqs.map((e) => e.id), ...usedIn.map((e) => e.id)]);
  const seeAlso = pick(entry?.seeAlso ?? []).filter((e) => !shown.has(e.id));
  return { prereqs, usedIn, seeAlso };
}

/** Ficha anterior y siguiente (para recorrer la wiki en orden). */
export function neighbors(id: string): { prev?: WikiEntry; next?: WikiEntry } {
  const i = WIKI.findIndex((e) => e.id === id);
  if (i < 0) return {};
  return { prev: WIKI[i - 1], next: WIKI[i + 1] };
}

export interface GlossaryItem extends WikiTerm {
  entry: WikiEntry;
  /** Letra inicial (sin tilde) para agrupar. */
  letter: string;
}

let glossaryCache: GlossaryItem[] | null = null;

/** Todas las definiciones de la wiki en orden alfabético. */
export function glossary(): GlossaryItem[] {
  glossaryCache ??= WIKI.flatMap((entry) =>
    (entry.terms ?? []).map((t) => ({ ...t, entry, letter: normalize(t.term).charAt(0).toUpperCase() })),
  ).sort((a, b) => a.term.localeCompare(b.term, 'es', { sensitivity: 'base' }));
  return glossaryCache;
}

/** Busca en todas las fichas (título, sinónimos, definiciones, fórmulas y texto). */
export const searchWiki = createSearch(WIKI);
