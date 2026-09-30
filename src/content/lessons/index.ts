// Registro de microlecciones. Si una habilidad no tiene lección escrita, se arma una
// lección mínima a partir de su idea clave y de ejercicios de comprobación.
import { SKILL_BY_ID } from '../curriculum';
import { generatorsForSkill } from '../registry';
import type { Lesson } from '../types';
import { LESSONS_LOGIC } from './logic';
import { LESSONS_ARITHMETIC } from './arithmetic';
import { LESSONS_ALGEBRA } from './algebra';
import { LESSONS_GEOMETRY } from './geometry';
import { LESSONS_FUNCTIONS } from './functions';
import { LESSONS_CALCULUS } from './calculus';
import { LESSONS_LINEAR } from './linear';
import { LESSONS_STATISTICS } from './statistics';

const ALL: Lesson[] = [
  ...LESSONS_LOGIC, ...LESSONS_ARITHMETIC, ...LESSONS_ALGEBRA, ...LESSONS_GEOMETRY,
  ...LESSONS_FUNCTIONS, ...LESSONS_CALCULUS, ...LESSONS_LINEAR, ...LESSONS_STATISTICS,
];

const BY_SKILL: Record<string, Lesson> = Object.fromEntries(ALL.map((l) => [l.skillId, l]));

export function lessonFor(skillId: string): Lesson & { minutes: number; authored: boolean } {
  const skill = SKILL_BY_ID[skillId];
  const authored = BY_SKILL[skillId];
  if (authored) return { ...authored, minutes: skill?.minutes ?? 5, authored: true };
  const gens = generatorsForSkill(skillId);
  return {
    skillId,
    intro: skill?.summary ?? '',
    minutes: skill?.minutes ?? 5,
    authored: false,
    sections: [
      { type: 'text', title: 'Idea clave', body: skill?.concept ?? '' },
      ...gens.slice(0, 2).map((g) => ({ type: 'check' as const, generatorId: g.id, level: 1 })),
      { type: 'summary', points: [skill?.concept ?? ''] },
    ],
  };
}

export function allLessons(): Lesson[] {
  return ALL;
}
