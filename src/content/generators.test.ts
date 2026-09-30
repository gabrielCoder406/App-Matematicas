import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { checkAnswer, checkSteps } from './check';
import { SKILLS } from './curriculum';
import { GENERATORS, makeExercise } from './registry';
import { modelAnswer } from './testing';
import type { Exercise } from './types';

/** Extrae los fragmentos $…$ y $$…$$ de un texto enriquecido. */
function mathSegments(raw: string): string[] {
  const out: string[] = [];
  // «\$» es un signo de pesos literal, no un delimitador de fórmula.
  const text = raw.replace(/\\\$/g, '§');
  expect(text.split('$').length % 2, `delimitadores $ desbalanceados en: ${raw}`).toBe(1);
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1] ?? m[2]);
  return out;
}

function allTexts(ex: Exercise): string[] {
  const t: string[] = [ex.prompt, ...ex.hints];
  if (ex.answer.kind === 'choice' || ex.answer.kind === 'multi') t.push(...ex.answer.options);
  if (ex.answer.kind === 'choice' && ex.answer.explanations) t.push(...ex.answer.explanations);
  for (const s of ex.solution) {
    if (s.note) t.push(s.note);
    if (s.math) t.push(`$${s.math}$`);
  }
  return t;
}

const SEEDS = Array.from({ length: 25 }, (_, i) => 1000 + i * 7919);

describe('generadores de ejercicios', () => {
  for (const g of GENERATORS) {
    for (const level of g.levels) {
      it(`${g.id} (nivel ${level})`, () => {
        for (const seed of SEEDS) {
          const ex = makeExercise(g.id, seed, level);
          expect(ex.prompt.length, 'enunciado').toBeGreaterThan(5);
          expect(ex.hints.every((h) => h && h.length > 3), 'pistas').toBe(true);
          for (const text of allTexts(ex)) {
            for (const seg of mathSegments(text)) {
              try {
                katex.renderToString(seg, { throwOnError: true, strict: false });
              } catch (e) {
                throw new Error(`LaTeX inválido en ${ex.id}: «${seg}» → ${(e as Error).message}`);
              }
            }
          }
          const input = modelAnswer(ex.answer);
          if (input) {
            const res = checkAnswer(ex.answer, input);
            if (!res.correct) {
              throw new Error(`La respuesta modelo no es aceptada en ${ex.id}: ${JSON.stringify(input)} → ${res.message}\nEnunciado: ${ex.prompt}`);
            }
          }
          if (ex.steps && input && input.kind === 'text') {
            const res = checkSteps(ex.steps, ex.answer, [input.value]);
            if (!res.correct) throw new Error(`El modo pasos no acepta la respuesta final en ${ex.id}: ${res.message}`);
          }
          if (ex.answer.kind === 'choice') {
            expect(new Set(ex.answer.options).size, `opciones repetidas en ${ex.id}: ${ex.answer.options.join(' | ')}`).toBe(ex.answer.options.length);
          }
        }
      });
    }
  }

  it('cada habilidad del temario tiene al menos un generador', () => {
    const missing = SKILLS.filter((s) => !GENERATORS.some((g) => g.skillId === s.id)).map((s) => s.id);
    expect(missing).toEqual([]);
  });
});
