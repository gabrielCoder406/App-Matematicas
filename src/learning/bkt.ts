// Bayesian Knowledge Tracing: estima la probabilidad de que una habilidad esté dominada.

export interface BktParams {
  pInit: number;
  pTransit: number;
  pSlip: number;
  pGuess: number;
}

export const BKT: BktParams = { pInit: 0.12, pTransit: 0.1, pSlip: 0.1, pGuess: 0.2 };

/** Umbral de dominio. */
export const MASTERY_P = 0.9;
/** Intentos mínimos para dar por dominada una habilidad practicada. */
export const MASTERY_MIN_ATTEMPTS = 3;

export type Evidence = 'correct' | 'assisted' | 'incorrect';

function posterior(pL: number, correct: boolean, p: BktParams): number {
  if (correct) {
    const num = pL * (1 - p.pSlip);
    return num / (num + (1 - pL) * p.pGuess);
  }
  const num = pL * p.pSlip;
  return num / (num + (1 - pL) * (1 - p.pGuess));
}

/**
 * Actualiza la probabilidad de dominio tras una respuesta.
 * - correct: sin pistas.
 * - assisted: correcta con pistas o con forma incompleta (evidencia débil).
 * - incorrect.
 * En preguntas de opción múltiple la probabilidad de adivinar es mayor.
 */
export function bktUpdate(pL: number, evidence: Evidence, guess = BKT.pGuess, params: BktParams = BKT): number {
  const p = { ...params, pGuess: guess };
  let post: number;
  if (evidence === 'correct') post = posterior(pL, true, p);
  else if (evidence === 'incorrect') post = posterior(pL, false, p);
  else post = 0.35 * posterior(pL, true, p) + 0.65 * posterior(pL, false, p);
  const next = post + (1 - post) * p.pTransit * (evidence === 'incorrect' ? 0.5 : 1);
  return Math.min(0.995, Math.max(0.01, next));
}

/** Probabilidad de adivinar según el tipo de respuesta. */
export function guessFor(kind: string, options = 0): number {
  if (kind === 'truefalse') return 0.5;
  if (kind === 'choice') return options > 0 ? Math.max(0.2, 1 / options) : 0.33;
  if (kind === 'multi') return 0.15;
  return 0.08;
}
