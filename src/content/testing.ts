// Utilidades para pruebas y para la «respuesta modelo» de cada ejercicio.
import { parse } from '../math/parse';
import { evalBool } from '../math/evaluate';
import { assignments } from '../math/equivalence';
import { Frac } from '../math/fraction';
import { formatNumber } from '../math/print';
import { regionsOf } from './check';
import type { AnswerInput, AnswerSpec } from './types';

/** Entrada que el verificador debería aceptar como correcta (null si no se puede construir). */
export function modelAnswer(spec: AnswerSpec): AnswerInput | null {
  switch (spec.kind) {
    case 'numeric': {
      if (spec.requireReduced) return { kind: 'text', value: Frac.fromNumber(spec.value).toText() };
      return { kind: 'text', value: formatNumber(spec.value, false, false) };
    }
    case 'expression': case 'equation': case 'inequality': case 'logic-expr': case 'set-expr':
      return { kind: 'text', value: spec.target };
    case 'solutions':
      if (!spec.values.length) return { kind: 'none' };
      return { kind: 'text', value: spec.values.map((v) => `${spec.variable} = ${Frac.fromNumber(v, 1e6).toNumber() === v ? Frac.fromNumber(v).toText() : formatNumber(v, false, false)}`).join(' ∨ ') };
    case 'choice': return { kind: 'choice', value: spec.correct };
    case 'multi': return { kind: 'multi', value: spec.correct };
    case 'truefalse': return { kind: 'bool', value: spec.correct };
    case 'truth-table': {
      const cols = spec.columns.map((c) => parse(c, { mode: spec.mode }));
      return { kind: 'table', value: assignments(spec.vars).map((row) => cols.map((c) => evalBool(c, row))) };
    }
    case 'set': return { kind: 'text', value: `{${spec.elements.join(', ')}}` };
    case 'vector': return { kind: 'cells', value: spec.values.map((v) => formatNumber(v, false, false)) };
    case 'matrix': return { kind: 'grid', value: spec.rows.map((r) => r.map((v) => formatNumber(v, false, false))) };
    case 'venn': return { kind: 'regions', value: regionsOf(parse(spec.target, { mode: 'set' }), spec.sets) };
    case 'predicate': {
      for (const c of [2, 4, 6, 9, 40, 41, -3, 0.5, 3, 1, 12]) if (spec.check(c)) return { kind: 'text', value: String(c) };
      return null;
    }
  }
}
