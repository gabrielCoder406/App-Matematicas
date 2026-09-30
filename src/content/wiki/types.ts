// Tipos de la wiki de temas: una ficha de consulta rápida (ayuda memoria) por tema.
import type { BlockId, Rich, SolutionStep } from '../types';

export interface WikiFormula {
  /** Nombre corto: «Fórmula resolvente», «Producto de potencias»… */
  name: string;
  /** LaTeX (sin $). */
  tex: string;
  note?: Rich;
}

export interface WikiTerm {
  /** Término del glosario (texto plano, sin fórmulas). */
  term: string;
  def: Rich;
}

export interface WikiTable {
  title: Rich;
  headers: Rich[];
  rows: Rich[][];
  /** Se incluye también en el formulario (tablas de fórmulas o de valores para memorizar). */
  sheet?: boolean;
}

export interface WikiMistake {
  wrong: Rich;
  right: Rich;
  note?: Rich;
}

export interface WikiEntryDef {
  /** Id de la habilidad del temario, o «ref.*» para fichas de referencia general. */
  id: string;
  /** Solo para fichas que no son habilidades del temario (las demás usan el título de la habilidad). */
  title?: string;
  /** Sinónimos y nombres propios para el buscador (Bhaskara, Ruffini, Sarrus…). */
  keywords: string[];
  /** Qué es, en una o dos oraciones. */
  summary: Rich;
  formulas?: WikiFormula[];
  tables?: WikiTable[];
  terms?: WikiTerm[];
  steps?: { title: string; items: Rich[] };
  example?: { title?: string; problem: Rich; steps: SolutionStep[] };
  mistakes?: WikiMistake[];
  /** Trucos y reglas mnemotécnicas. */
  remember?: Rich[];
  /** Otras fichas relacionadas además de requisitos y dependientes. */
  seeAlso?: string[];
}

export interface WikiEntry extends WikiEntryDef {
  title: string;
  /** Bloque del temario (null en las fichas de referencia general). */
  block: BlockId | null;
  /** La ficha corresponde a una habilidad del temario (tiene lección y práctica). */
  isSkill: boolean;
}
