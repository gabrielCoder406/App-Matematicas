import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { SKILLS } from './curriculum';
import { allLessons, lessonFor } from './lessons';
import { GENERATOR_BY_ID } from './registry';
import type { WidgetId } from './types';

const WIDGETS: WidgetId[] = ['truth-table', 'prop-tree', 'venn', 'circuit', 'balance', 'fraction-bars', 'grapher', 'unit-circle', 'pythagoras', 'thales', 'vectors', 'histogram', 'number-line', 'triangle-solver', 'riemann', 'tangent', 'matrix', 'dice'];

function segments(raw: string): string[] {
  const text = raw.replace(/\\\$/g, '§');
  const out: string[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1] ?? m[2]);
  expect(text.split('$').length % 2, `delimitadores $ desbalanceados: ${raw}`).toBe(1);
  return out;
}

function renders(tex: string, where: string) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: false, macros: { '\\sen': '\\operatorname{sen}' } });
  } catch (e) {
    throw new Error(`LaTeX inválido en ${where}: «${tex}» → ${(e as Error).message}`);
  }
}

describe('microlecciones', () => {
  it('todas las habilidades tienen una lección escrita', () => {
    const missing = SKILLS.filter((s) => !lessonFor(s.id).authored).map((s) => s.id);
    expect(missing).toEqual([]);
  });

  for (const lesson of allLessons()) {
    it(`lección ${lesson.skillId}`, () => {
      const texts: string[] = [lesson.intro];
      for (const s of lesson.sections) {
        if (s.type === 'text' || s.type === 'tip') texts.push(s.body, s.type === 'text' ? s.title ?? '' : s.title ?? '');
        if (s.type === 'example') {
          texts.push(s.title, s.problem);
          for (const st of s.steps) {
            if (st.note) texts.push(st.note);
            if (st.math) renders(st.math, `${lesson.skillId} (ejemplo)`);
          }
        }
        if (s.type === 'widget') {
          expect(WIDGETS).toContain(s.widget);
          if (s.caption) texts.push(s.caption);
        }
        if (s.type === 'check') expect(GENERATOR_BY_ID[s.generatorId], `generador ${s.generatorId}`).toBeDefined();
        if (s.type === 'summary') texts.push(...s.points);
      }
      for (const t of texts) for (const seg of segments(t)) renders(seg, lesson.skillId);
    });
  }
});
