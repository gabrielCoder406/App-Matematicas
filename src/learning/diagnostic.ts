// Evaluación diagnóstica adaptativa: recorre el grafo de habilidades como una búsqueda
// binaria. Un acierto confirma la habilidad y todos sus prerrequisitos; un error
// descarta la habilidad y todo lo que depende de ella.
import { ancestors, descendants, SKILLS, topoOrder } from '../content/curriculum';
import type { BlockId } from '../content/types';

export interface DiagnosticState {
  candidates: string[];
  known: string[];
  weak: string[];
  asked: { skillId: string; correct: boolean }[];
  maxQuestions: number;
}

export function startDiagnostic(blocks: BlockId[], maxQuestions = 18): DiagnosticState {
  const set = new Set(blocks);
  const candidates = topoOrder().filter((s) => set.has(s.block)).map((s) => s.id);
  return { candidates, known: [], weak: [], asked: [], maxQuestions };
}

function undetermined(st: DiagnosticState): string[] {
  const done = new Set([...st.known, ...st.weak]);
  return st.candidates.filter((c) => !done.has(c));
}

export function isFinished(st: DiagnosticState): boolean {
  return st.asked.length >= st.maxQuestions || undetermined(st).length === 0;
}

/** Habilidad a evaluar a continuación: la que mejor divide lo que falta determinar. */
export function nextProbe(st: DiagnosticState): string | null {
  if (isFinished(st)) return null;
  const und = undetermined(st);
  const undSet = new Set(und);
  let best: string | null = null;
  let bestScore = -1;
  for (const s of und) {
    const up = [...ancestors(s)].filter((a) => undSet.has(a)).length;
    const down = [...descendants(s)].filter((d) => undSet.has(d)).length;
    const score = Math.min(up + 1, down + 1) * 10 + up + down;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function recordProbe(st: DiagnosticState, skillId: string, correct: boolean): DiagnosticState {
  const asked = [...st.asked, { skillId, correct }];
  if (correct) {
    const known = new Set([...st.known, skillId, ...ancestors(skillId)]);
    const weak = st.weak.filter((w) => !known.has(w));
    return { ...st, asked, known: [...known], weak };
  }
  const cand = new Set(st.candidates);
  const weak = new Set([...st.weak, skillId, ...[...descendants(skillId)].filter((d) => cand.has(d))]);
  const known = st.known.filter((k) => !weak.has(k));
  return { ...st, asked, known, weak: [...weak] };
}

export interface DiagnosticSummary {
  known: string[];
  weak: string[];
  undetermined: string[];
}

export function finalize(st: DiagnosticState): DiagnosticSummary {
  return { known: st.known, weak: st.weak, undetermined: undetermined(st) };
}

export function skillsInBlocks(blocks: BlockId[]): number {
  const set = new Set(blocks);
  return SKILLS.filter((s) => set.has(s.block)).length;
}
