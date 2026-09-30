import { describe, expect, it } from 'vitest';
import { ancestors } from '../content/curriculum';
import { finalize, isFinished, nextProbe, recordProbe, startDiagnostic } from './diagnostic';
import {
  applyAttempt, applyPlacement, dayKey, emptyProgress, isMastered, nextLevel, pendingRemediationFor, recommendNext, skillState,
  type AttemptInput,
} from './engine';
import { streak, totals } from './metrics';
import type { ProgressData } from './types';

const base = (skillId: string, correct: boolean, extra: Partial<AttemptInput> = {}): AttemptInput => ({
  skillId, generatorId: 'g', seed: 1, level: 1, correct, hintsUsed: 0, activeMs: 20000, expectedMs: 30000,
  reason: 'practice', answerKind: 'numeric', ...extra,
});

function run(data: ProgressData, inputs: AttemptInput[], t0 = 1_700_000_000_000) {
  let d = data;
  const events = [];
  let t = t0;
  for (const i of inputs) {
    const r = applyAttempt(d, i, t);
    d = r.data;
    events.push(...r.events);
    t += 60_000;
  }
  return { data: d, events };
}

describe('estados y desbloqueos', () => {
  it('al empezar solo están disponibles las raíces', () => {
    const d = emptyProgress();
    expect(skillState(d, 'logic.connectives')).toBe('available');
    expect(skillState(d, 'arith.number-sets')).toBe('available');
    expect(skillState(d, 'arith.signs')).toBe('locked');
    expect(recommendNext(d)?.kind).toBe('new');
  });

  it('dominar una habilidad desbloquea las siguientes', () => {
    const { data, events } = run(emptyProgress(), Array.from({ length: 8 }, () => base('arith.number-sets', true)));
    expect(isMastered(data, 'arith.number-sets')).toBe(true);
    expect(events.some((e) => e.type === 'mastered')).toBe(true);
    const unlocked = events.find((e) => e.type === 'unlocked');
    expect(unlocked && unlocked.type === 'unlocked' && unlocked.skillIds).toContain('arith.signs');
    expect(data.skills['arith.number-sets'].srs).toBeDefined();
  });

  it('la dificultad sube con aciertos seguidos y baja con errores', () => {
    const { data } = run(emptyProgress(), [base('arith.number-sets', true), base('arith.number-sets', true)]);
    expect(data.skills['arith.number-sets'].level).toBe(2);
    const r = applyAttempt(data, base('arith.number-sets', false));
    expect(r.data.skills['arith.number-sets'].level).toBe(1);
    expect(nextLevel(r.data.skills['arith.number-sets'])).toBeGreaterThanOrEqual(1);
  });
});

describe('detección de baches', () => {
  const prepared = () => applyPlacement(emptyProgress(), [...ancestors('alg.linear-equations')], []);

  it('errores de signo repetidos inyectan refuerzo de «operaciones con signos»', () => {
    const d0 = prepared();
    expect(skillState(d0, 'alg.linear-equations')).toBe('available');
    const { data, events } = run(d0, [
      base('alg.linear-equations', false, { bug: 'sign.term' }),
      base('alg.linear-equations', false, { bug: 'sign.term' }),
    ]);
    const gap = events.find((e) => e.type === 'gap');
    expect(gap && gap.type === 'gap' && gap.remediation.skillId).toBe('arith.signs');
    expect(pendingRemediationFor(data, 'alg.linear-equations')).toHaveLength(1);
    expect(recommendNext(data)?.kind).toBe('remedial');
  });

  it('el refuerzo pendiente bloquea el dominio hasta completarse', () => {
    let { data } = run(prepared(), [
      base('alg.linear-equations', false, { bug: 'sign.term' }),
      base('alg.linear-equations', false, { bug: 'sign.term' }),
      ...Array.from({ length: 12 }, () => base('alg.linear-equations', true)),
    ]);
    expect(data.skills['alg.linear-equations'].pL).toBeGreaterThan(0.9);
    expect(isMastered(data, 'alg.linear-equations')).toBe(false);
    expect(skillState(data, 'alg.linear-inequalities')).toBe('locked');
    const rem = pendingRemediationFor(data, 'alg.linear-equations')[0];
    const r = run(data, Array.from({ length: 3 }, () => base('arith.signs', true, { reason: 'remedial', remediationId: rem.id })));
    data = r.data;
    expect(r.events.some((e) => e.type === 'remediation-done')).toBe(true);
    expect(isMastered(data, 'alg.linear-equations')).toBe(true);
    expect(skillState(data, 'alg.linear-inequalities')).toBe('available');
  });

  it('tres fallos seguidos sin diagnóstico refuerzan el prerrequisito más débil', () => {
    let d = prepared();
    d = { ...d, skills: { ...d.skills, 'arith.fractions': { ...d.skills['arith.fractions'], pL: 0.5, placed: true } } };
    const { events } = run(d, Array.from({ length: 3 }, () => base('alg.linear-equations', false)));
    const gap = events.find((e) => e.type === 'gap');
    expect(gap && gap.type === 'gap' && gap.cause).toBe('streak');
  });
});

describe('repasos y métricas', () => {
  it('programa repasos con intervalos crecientes', () => {
    const { data } = run(emptyProgress(), Array.from({ length: 8 }, () => base('arith.number-sets', true)));
    const srs = data.skills['arith.number-sets'].srs!;
    const r = applyAttempt(data, base('arith.number-sets', true, { reason: 'review' }), srs.due);
    expect(r.data.skills['arith.number-sets'].srs!.due).toBeGreaterThan(srs.due);
    expect(r.events.some((e) => e.type === 'review')).toBe(true);
  });

  it('calcula rachas y totales', () => {
    const now = new Date(2026, 8, 29, 12).getTime();
    const d = emptyProgress();
    for (const off of [0, 1, 2, 5]) {
      const k = dayKey(now - off * 86400000);
      d.days[k] = { activeMs: 5 * 60000, exercises: 4, correct: 3, correctNoHint: 2 };
    }
    const s = streak(d, now);
    expect(s.current).toBe(3);
    expect(s.best).toBe(3);
    const t = totals(d);
    expect(t.exercises).toBe(16);
    expect(t.accuracyNoHint).toBeCloseTo(0.5);
  });
});

describe('evaluación diagnóstica', () => {
  it('con todo correcto marca el bloque como conocido', () => {
    let st = startDiagnostic(['aritmetica']);
    while (!isFinished(st)) st = recordProbe(st, nextProbe(st)!, true);
    const f = finalize(st);
    expect(f.undetermined).toEqual([]);
    expect(f.known).toContain('arith.roots');
    expect(st.asked.length).toBeLessThan(st.candidates.length);
  });

  it('con todo incorrecto marca debilidades', () => {
    let st = startDiagnostic(['aritmetica']);
    while (!isFinished(st)) st = recordProbe(st, nextProbe(st)!, false);
    expect(finalize(st).weak).toContain('arith.number-sets');
  });
});
