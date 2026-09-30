// Registro de generadores de ejercicios.
import type { BugId } from '../math/mutations';
import { ALGEBRA_GENERATORS } from './gen/algebra';
import { ARITHMETIC_GENERATORS } from './gen/arithmetic';
import { CALCULUS_GENERATORS } from './gen/calculus';
import { FUNCTION_GENERATORS } from './gen/functions';
import { GEOMETRY_GENERATORS } from './gen/geometry';
import { LINEAR_GENERATORS } from './gen/linear';
import { LOGIC_GENERATORS } from './gen/logic';
import { STATISTICS_GENERATORS } from './gen/statistics';
import { Rng, randomSeed } from './rng';
import type { Exercise, Generator } from './types';

export const GENERATORS: Generator[] = [
  ...LOGIC_GENERATORS, ...ARITHMETIC_GENERATORS, ...ALGEBRA_GENERATORS, ...GEOMETRY_GENERATORS,
  ...FUNCTION_GENERATORS, ...CALCULUS_GENERATORS, ...LINEAR_GENERATORS, ...STATISTICS_GENERATORS,
];

export const GENERATOR_BY_ID: Record<string, Generator> = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));

export function generatorsForSkill(skillId: string): Generator[] {
  return GENERATORS.filter((g) => g.skillId === skillId);
}

/** Nivel soportado más cercano al pedido. */
function clampLevel(g: Generator, level: number): number {
  if (g.levels.includes(level)) return level;
  return g.levels.reduce((best, l) => (Math.abs(l - level) < Math.abs(best - level) ? l : best), g.levels[0]);
}

export function makeExercise(generatorId: string, seed: number, level: number): Exercise {
  const g = GENERATOR_BY_ID[generatorId];
  if (!g) throw new Error(`Generador desconocido: ${generatorId}`);
  const lv = clampLevel(g, level);
  const content = g.generate(new Rng(seed), lv);
  return {
    ...content,
    id: `${g.id}:${lv}:${seed}`,
    skillId: g.skillId,
    generatorId: g.id,
    seed,
    difficulty: lv,
    expectedSeconds: content.expectedSeconds ?? 60,
    errorTags: content.errorTags ?? g.errorTags,
  };
}

/** Ejercicio aleatorio de una habilidad (opcionalmente priorizando un tipo de error). */
export function randomExercise(skillId: string, level: number, opts: { seed?: number; bug?: BugId | string; avoid?: string[] } = {}): Exercise {
  const seed = opts.seed ?? randomSeed();
  const rng = new Rng(seed);
  let pool = generatorsForSkill(skillId);
  if (!pool.length) throw new Error(`No hay ejercicios para ${skillId}`);
  if (opts.bug) {
    const tagged = pool.filter((g) => g.errorTags?.includes(opts.bug as BugId));
    if (tagged.length) pool = tagged;
  }
  const fitting = pool.filter((g) => g.levels.includes(level));
  const candidates = fitting.length ? fitting : pool;
  const fresh = candidates.filter((g) => !opts.avoid?.includes(g.id));
  const g = rng.pick(fresh.length ? fresh : candidates);
  return makeExercise(g.id, rng.int(1, 2 ** 30), level);
}

/** Generadores que pueden provocar/entrenar un error concreto. */
export function generatorsForBug(bug: string): Generator[] {
  return GENERATORS.filter((g) => g.errorTags?.includes(bug as BugId));
}
