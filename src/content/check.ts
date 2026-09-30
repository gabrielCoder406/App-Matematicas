// Verificación de respuestas para cada tipo de ejercicio, con diagnóstico del error cuando es posible.
import type { Node } from '../math/ast';
import { containsType, countNodes, freeVars, walk } from '../math/ast';
import { exprEquivalent, equationsEquivalent, logicEquivalent, setExprEquivalent, assignments } from '../math/equivalence';
import { approxEqual, elemKey, evalBool, evalMembership, evalNum } from '../math/evaluate';
import { isReducedFraction } from '../math/fraction';
import { mutations } from '../math/mutations';
import { parse, ParseError, type ParseMode } from '../math/parse';
import { checkFactored, isExpandedForm, Poly } from '../math/polynomial';
import { formatNumber, toLatex } from '../math/print';
import { realSetOf, realSetToLatex, sameRealSet, solveEquation } from '../math/solve';
import { validateSteps, type LineResult } from '../math/validate';
import type { AnswerInput, AnswerSpec, CheckResult, StepsSpec } from './types';

export interface FullCheckResult extends CheckResult {
  lines?: LineResult[];
}

const OK = (message = '¡Correcto!'): FullCheckResult => ({ correct: true, message });
const WRONG = (message: string, extra: Partial<FullCheckResult> = {}): FullCheckResult => ({ correct: false, message, ...extra });

function textOf(input: AnswerInput): string | null {
  return input.kind === 'text' ? input.value : null;
}

const UNIT_RE = /\s*(\\,|\\ |\\;)?\s*(\\text\{[^}]*\}|\\mathrm\{[^}]*\}|cm|mm|km|dm|m|kg|g|ml|l|s|h|min|km\/h|m\/s|u|unidades|personas|días|dias|horas|metros|litros|pesos|grados)\s*(\^\s*\{?\s*[23]\s*\}?|²|³)?\s*$/i;

/**
 * Limpia unidades y signos de moneda antes de interpretar un número. Si se
 * espera un entero grande, «1.500» se lee como mil quinientos (separador de miles).
 */
export function cleanNumeric(raw: string, unit?: string, expected?: number): string {
  let s = raw.trim();
  s = s.replace(/^\$\s*/, '').replace(/^\\\$\s*/, '');
  for (let i = 0; i < 2; i++) s = s.replace(UNIT_RE, '');
  if (unit === '%') s = s.replace(/\s*\\?%\s*$/, '');
  if (unit === '°') s = s.replace(/\s*(\^\{?\\circ\}?|°|º|\\degree)\s*$/, '');
  const bigInteger = expected !== undefined && Number.isInteger(expected) && Math.abs(expected) >= 1000;
  if (bigInteger && /^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  return s.trim();
}

function parseSafe(src: string, mode: ParseMode = 'arith', decimalComma?: boolean): { node?: Node; error?: string } {
  try {
    return { node: parse(src, { mode, decimalComma }) };
  } catch (e) {
    return { error: e instanceof ParseError ? e.message : 'No pude interpretar tu respuesta.' };
  }
}

/** ¿Quedan cuentas sin hacer entre números (3+4, 2·5, 2^3)? */
function hasUnevaluatedArithmetic(node: Node): boolean {
  const plain = (n: Node) => n.type === 'num' || (n.type === 'neg' && n.arg.type === 'num');
  let found = false;
  walk(node, (n) => {
    if (n.type === 'add' && n.terms.filter(plain).length >= 2) found = true;
    if (n.type === 'mul' && n.factors.filter(plain).length >= 2) found = true;
    if (n.type === 'pow' && plain(n.base) && plain(n.exp)) found = true;
    if (n.type === 'fact') found = true;
    if (n.type === 'div' && (n.num.type === 'div' || n.den.type === 'div')) found = true;
  });
  return found;
}

function stripDegree(node: Node): Node {
  return node.type === 'deg' ? node.arg : node;
}

// ---------------------------------------------------------------------------

function checkNumeric(spec: Extract<AnswerSpec, { kind: 'numeric' }>, input: AnswerInput): FullCheckResult {
  const raw = textOf(input);
  if (raw === null || !raw.trim()) return WRONG('Escribe un número.');
  const { node, error } = parseSafe(cleanNumeric(raw, spec.unit, spec.value));
  if (!node) return WRONG(error!, { parseError: true });
  const n = spec.unit === '°' ? stripDegree(node) : node;
  if (freeVars(n).size > 0) return WRONG('La respuesta debe ser un número (sin letras).');
  const v = evalNum(n);
  if (!Number.isFinite(v)) return WRONG('No pude calcular un valor numérico con lo que escribiste.', { parseError: true });
  const tol = spec.tolerance ?? Math.max(1e-9, 1e-7 * Math.abs(spec.value));
  if (Math.abs(v - spec.value) <= tol) {
    let hasFn = false;
    walk(n, (x) => {
      if (x.type === 'fn' && !['sqrt', 'root', 'abs'].includes(x.name)) hasFn = true;
    });
    if (hasFn && !spec.allowFunctions) {
      return { correct: false, partial: true, message: 'El valor es correcto, pero calcúlalo: no dejes funciones (sen, cos, log…) sin resolver.' };
    }
    if (spec.tolerance === undefined && hasUnevaluatedArithmetic(n)) {
      return { correct: false, partial: true, message: 'Tu expresión da el valor correcto, pero termina de calcularla.' };
    }
    if (spec.requireReduced && !isReducedFraction(n) && !Number.isInteger(v)) {
      return { correct: false, partial: true, message: 'El valor es correcto, pero exprésalo como fracción irreducible.', bug: undefined };
    }
    if (spec.requireReduced && n.type === 'div' && Number.isInteger(v)) {
      return { correct: false, partial: true, message: `El valor es correcto, pero simplifica: es $${formatNumber(v)}$.` };
    }
    return OK();
  }
  // ¿Redondeo?
  if (spec.tolerance === undefined && Math.abs(v - spec.value) < 0.01 * Math.max(1, Math.abs(spec.value))) {
    return WRONG('Estás muy cerca: revisa el redondeo o usa el valor exacto (por ejemplo, como fracción).');
  }
  if (spec.diagnoseFrom) {
    const d = diagnoseNumeric(spec.diagnoseFrom, v);
    if (d) return WRONG(d.message, { bug: d.bug });
  }
  return WRONG('No es correcto. Revisa tus cálculos.');
}

function diagnoseNumeric(from: string, value: number): { bug: FullCheckResult['bug']; message: string } | null {
  const { node } = parseSafe(from);
  if (!node) return null;
  for (const m of mutations(node, 'expression')) {
    const mv = evalNum(m.mutated);
    if (Number.isFinite(mv) && approxEqual(mv, value, 1e-9, 1e-9)) return { bug: m.bug, message: m.message };
  }
  return null;
}

function checkExpression(spec: Extract<AnswerSpec, { kind: 'expression' }>, input: AnswerInput): FullCheckResult {
  const raw = textOf(input);
  if (raw === null || !raw.trim()) return WRONG('Escribe tu respuesta.');
  let { node, error } = parseSafe(raw);
  if (!node) return WRONG(error!, { parseError: true });
  const target = parse(spec.target);
  if (node.type === 'rel' && node.op === '=' && node.left.type === 'sym' && /^[fgyFP]|^f'$/.test(node.left.name)) node = node.right;
  if (node.type === 'rel') return WRONG('Escribe solo la expresión, sin el signo igual.');
  if (spec.upToConstant) {
    const withoutC = replaceSym(node, ['C', 'K', 'k'], 0);
    const diffOk = constantDifference(withoutC, target);
    if (diffOk) return OK(containsSym(node, ['C', 'K', 'k']) ? '¡Correcto!' : '¡Correcto! Recuerda agregar la constante de integración $+C$.');
    return WRONG('No es una primitiva: si derivas tu resultado no obtienes la función original.');
  }
  const eq = exprEquivalent(target, node, spec.vars ?? []);
  if (!eq.equivalent) {
    if (spec.diagnoseFrom) {
      const from = parseSafe(spec.diagnoseFrom).node;
      if (from) {
        for (const m of mutations(from, 'expression')) {
          if (exprEquivalent(m.mutated, node).equivalent) return WRONG(m.message, { bug: m.bug });
        }
      }
    }
    const c = eq.counterexample;
    if (c && Object.keys(c.env).length) {
      const env = Object.entries(c.env).map(([k, v]) => `${k} = ${formatNumber(Number(v))}`).join(', ');
      return WRONG(`No es equivalente a la respuesta correcta: por ejemplo, con $${env}$ tu expresión vale $${formatNumber(Number(c.b))}$ pero debería valer $${formatNumber(Number(c.a))}$.`);
    }
    return WRONG('No es correcto.');
  }
  if (spec.form === 'expanded' && !isExpandedForm(node)) {
    return { correct: false, partial: true, bug: undefined, message: 'Es equivalente, pero falta desarrollar y reducir los términos semejantes.' };
  }
  if (spec.form === 'monomial' && !isSimpleMonomial(node)) {
    return { correct: false, partial: true, message: 'Es equivalente, pero todavía se puede simplificar: aplica las propiedades hasta que cada letra aparezca una sola vez.' };
  }
  if (spec.form === 'radical' && !radicalsSimplified(node)) {
    return { correct: false, partial: true, message: 'Es equivalente, pero los radicales se pueden simplificar más (extrae los factores cuadrados y agrupa radicales semejantes).' };
  }
  if (spec.form === 'rationalized' && (!denominatorsRational(node) || !radicalsSimplified(node))) {
    return { correct: false, partial: true, message: 'Es equivalente, pero el denominador todavía tiene raíces (o se puede simplificar más): racionalízalo.' };
  }
  if (spec.form === 'simplified' && countNodes(node) > countNodes(target) + 2) {
    return { correct: false, partial: true, message: 'Es equivalente, pero todavía se puede simplificar más.' };
  }
  if (spec.form === 'vertex' && !isVertexForm(node)) {
    return { correct: false, partial: true, message: 'Es equivalente, pero no está en forma canónica: escríbela como $a(x - x_v)^2 + y_v$.' };
  }
  if (spec.form === 'factored') {
    const v = [...freeVars(target)][0] ?? 'x';
    const f = checkFactored(node, v);
    if (!f.ok) {
      const msg =
        f.reason === 'reducible-factor' ? `Es equivalente, pero el factor $${toLatex(f.factor!)}$ todavía se puede factorizar.`
        : f.reason === 'common-factor' ? `Es equivalente, pero en $${toLatex(f.factor!)}$ todavía hay un factor común.`
        : 'Es equivalente, pero no está factorizado: escríbelo como un producto.';
      return { correct: false, partial: true, message: msg };
    }
  }
  return OK();
}

const intExp = (e: Node) => (e.type === 'num' && Number.isInteger(e.value)) || (e.type === 'neg' && e.arg.type === 'num' && Number.isInteger(e.arg.value));

/** Monomio simplificado: a lo sumo un número y cada letra una sola vez (admite cociente). */
export function isSimpleMonomial(node: Node): boolean {
  const base = node.type === 'neg' ? node.arg : node;
  if (base.type === 'div') {
    if (!isSimpleMonomial(base.num) || !isSimpleMonomial(base.den)) return false;
    const a = freeVars(base.num);
    return [...freeVars(base.den)].every((v) => !a.has(v));
  }
  const factors = base.type === 'mul' ? base.factors : [base];
  let nums = 0;
  const syms = new Set<string>();
  for (const f of factors) {
    if (f.type === 'num') { nums++; continue; }
    const name = f.type === 'sym' ? f.name : f.type === 'pow' && f.base.type === 'sym' && intExp(f.exp) ? f.base.name : null;
    if (!name || syms.has(name)) return false;
    syms.add(name);
  }
  return nums <= 1;
}

function radicalKey(term: Node): string | null {
  const t = term.type === 'neg' ? term.arg : term;
  const r = t.type === 'mul' ? t.factors.find((f) => f.type === 'fn' && f.name === 'sqrt') : t.type === 'fn' && t.name === 'sqrt' ? t : null;
  if (!r || r.type !== 'fn') return null;
  if (t.type === 'mul' && t.factors.length > 2) return null;
  return JSON.stringify(r.args[0]);
}

/** Radicales simplificados: sin factores cuadrados dentro de √ y sin radicales semejantes sin agrupar. */
export function radicalsSimplified(node: Node): boolean {
  let ok = true;
  walk(node, (n) => {
    if (n.type === 'fn' && n.name === 'sqrt') {
      const a = n.args[0];
      if (a.type !== 'num' || !Number.isInteger(a.value)) { if (freeVars(a).size === 0) ok = false; return; }
      if (a.value <= 1) ok = false;
      for (let k = 2; k * k <= a.value; k++) if (a.value % (k * k) === 0) ok = false;
    }
    if (n.type === 'add') {
      const keys = n.terms.map(radicalKey).filter((k): k is string => k !== null);
      if (new Set(keys).size < keys.length) ok = false;
    }
  });
  return ok;
}

/** Forma canónica de una cuadrática: a·(x − h)² + k (un único término con x, que es un cuadrado de binomio). */
export function isVertexForm(node: Node, v = 'x'): boolean {
  const terms = node.type === 'add' ? node.terms : [node];
  const withX = terms.filter((t) => freeVars(t).has(v));
  if (withX.length !== 1) return false;
  let t = withX[0];
  if (t.type === 'neg') t = t.arg;
  let sq: Node | undefined = t;
  if (t.type === 'mul') {
    const others = t.factors.filter((f) => freeVars(f).size > 0);
    if (others.length !== 1) return false;
    sq = others[0];
  }
  if (!sq || sq.type !== 'pow' || !(sq.exp.type === 'num' && sq.exp.value === 2)) return false;
  const base = sq.base;
  if (base.type === 'sym') return base.name === v;
  if (base.type !== 'add') return false;
  const p = Poly.fromNode(base);
  return !!p && p.degree(v) === 1;
}

function denominatorsRational(node: Node): boolean {
  let ok = true;
  walk(node, (n) => {
    if (n.type === 'div') {
      walk(n.den, (d) => {
        if (d.type === 'fn' && (d.name === 'sqrt' || d.name === 'root')) ok = false;
        if (d.type === 'pow' && d.exp.type === 'div') ok = false;
      });
    }
  });
  return ok;
}

function replaceSym(node: Node, names: string[], value: number): Node {
  const rec = (n: Node): Node => {
    if (n.type === 'sym' && names.includes(n.name)) return { type: 'num', value };
    switch (n.type) {
      case 'add': return { ...n, terms: n.terms.map(rec) };
      case 'mul': return { ...n, factors: n.factors.map(rec) };
      case 'neg': return { ...n, arg: rec(n.arg) };
      case 'div': return { ...n, num: rec(n.num), den: rec(n.den) };
      case 'pow': return { ...n, base: rec(n.base), exp: rec(n.exp) };
      case 'fn': return { ...n, args: n.args.map(rec) };
      default: return n;
    }
  };
  return rec(node);
}

function containsSym(node: Node, names: string[]): boolean {
  let found = false;
  walk(node, (n) => {
    if (n.type === 'sym' && names.includes(n.name)) found = true;
  });
  return found;
}

/** ¿a − b es constante? (para primitivas) */
function constantDifference(a: Node, b: Node): boolean {
  const xs = [0.37, 1.21, 2.13, 2.71, 1.73, 3.07, 0.53, 0.91];
  const v = [...new Set([...freeVars(a), ...freeVars(b)])];
  const x = v[0] ?? 'x';
  let first: number | null = null;
  let checked = 0;
  for (const t of xs) {
    const d = evalNum(a, { [x]: t }) - evalNum(b, { [x]: t });
    if (!Number.isFinite(d)) continue;
    if (first === null) first = d;
    else if (!approxEqual(d, first, 1e-7, 1e-8)) return false;
    checked++;
  }
  return checked >= 4;
}

/** Valores numéricos de una respuesta del tipo «x = 2 ∨ x = 3», «2, 3», «{2; 3}», «x_1 = 2, x_2 = 3». */
export function extractValues(node: Node, variable: string): number[] | null {
  const numLike = (n: Node) => !containsType(n, ['rel', 'logic', 'list', 'set', 'tuple']) && freeVars(n).size === 0;
  if (numLike(node)) {
    if (containsType(node, ['pm'])) {
      const s = solveEquation({ type: 'rel', op: '=', left: { type: 'sym', name: variable }, right: node }, variable);
      return s.kind === 'finite' ? s.roots : null;
    }
    const v = evalNum(node);
    return Number.isFinite(v) ? [v] : null;
  }
  if (node.type === 'list' && node.items.every(numLike)) {
    const vals = node.items.map((it) => evalNum(it));
    return vals.every(Number.isFinite) ? [...new Set(vals)].sort((a, b) => a - b) : null;
  }
  // Admite subíndices x_1, x_2 como la misma incógnita
  const renamed = renameIndexed(node, variable);
  const s = solveEquation(renamed, variable);
  if (s.kind === 'finite') return s.roots;
  return null;
}

function renameIndexed(node: Node, variable: string): Node {
  const rec = (n: Node): Node => {
    if (n.type === 'sym' && n.name.startsWith(`${variable}_`)) return { type: 'sym', name: variable };
    switch (n.type) {
      case 'rel': return { ...n, left: rec(n.left), right: rec(n.right) };
      case 'logic': return { ...n, left: rec(n.left), right: rec(n.right) };
      case 'list': return { ...n, items: n.items.map(rec) };
      default: return n;
    }
  };
  return rec(node);
}

function sameValues(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((x, i) => Math.abs(x - sb[i]) <= 1e-6 * Math.max(1, Math.abs(x)));
}

function valuesLatex(vals: number[], v: string): string {
  return vals.map((x) => `$${v} = ${formatNumber(x)}$`).join(' y ');
}

function checkSolutions(spec: Extract<AnswerSpec, { kind: 'solutions' }>, input: AnswerInput): FullCheckResult {
  const expected = spec.values;
  let got: number[];
  if (input.kind === 'none') got = [];
  else {
    const raw = textOf(input);
    if (raw === null || !raw.trim()) return WRONG('Escribe la solución (por ejemplo, x = 3) o indica que no tiene solución.');
    const { node, error } = parseSafe(raw);
    if (!node) return WRONG(error!, { parseError: true });
    const vals = extractValues(node, spec.variable);
    if (!vals) return WRONG(`Escribe la solución despejada, por ejemplo $${spec.variable} = 3$.`);
    got = vals;
  }
  if (sameValues(got, expected)) return OK();
  if (!expected.length) return WRONG('Revisa: esta ecuación no tiene solución real.');
  if (!got.length) return WRONG('Sí tiene solución: revisa tus cálculos.');
  const missing = expected.filter((e) => !got.some((g) => Math.abs(g - e) < 1e-6 * Math.max(1, Math.abs(e))));
  const extra = got.filter((g) => !expected.some((e) => Math.abs(g - e) < 1e-6 * Math.max(1, Math.abs(e))));
  if (!extra.length && missing.length) {
    return WRONG(`Lo que encontraste es correcto, pero ${missing.length > 1 ? 'faltan soluciones' : 'falta una solución'}. ¿Consideraste ambos signos de la raíz?`, { bug: undefined, partial: true });
  }
  if (spec.diagnoseFrom) {
    const from = parseSafe(spec.diagnoseFrom).node;
    if (from) {
      const mode = from.type === 'rel' && from.op !== '=' ? 'inequality' : 'equation';
      if (mode === 'equation') {
        for (const m of mutations(from, 'equation')) {
          const s = solveEquation(m.mutated, spec.variable, [-60, 60], {}, true);
          if (s.kind === 'finite' && sameValues(s.roots, got)) return WRONG(m.message, { bug: m.bug });
        }
      }
    }
  }
  if (!missing.length && extra.length) return WRONG(`Sobran soluciones: ${valuesLatex(extra, spec.variable)} no ${extra.length > 1 ? 'verifican' : 'verifica'} la ecuación.`);
  return WRONG('No es correcto. Puedes verificar reemplazando tu solución en la ecuación original.');
}

function checkInequality(spec: Extract<AnswerSpec, { kind: 'inequality' }>, input: AnswerInput): FullCheckResult {
  const raw = textOf(input);
  if (raw === null || !raw.trim()) return WRONG('Escribe la solución como desigualdad (x > 3) o como intervalo.');
  const { node, error } = parseSafe(raw, 'arith', false);
  if (!node) return WRONG(error!, { parseError: true });
  const got = realSetOf(node, spec.variable);
  const target = realSetOf(parse(spec.target, { decimalComma: false }), spec.variable);
  if (!got) return WRONG('No pude interpretar tu respuesta como un conjunto de números. Usa, por ejemplo, $x \\ge 2$ o $[2, +\\infty)$.');
  if (!target) return WRONG('No se pudo verificar el ejercicio.');
  if (sameRealSet(got, target)) return OK();
  if (spec.diagnoseFrom) {
    const from = parseSafe(spec.diagnoseFrom).node;
    if (from) {
      for (const m of mutations(from, 'inequality')) {
        const s = realSetOf(m.mutated, spec.variable);
        if (s && sameRealSet(s, got)) return WRONG(m.message, { bug: m.bug });
      }
    }
  }
  const endpointsMatch = got.length === target.length && got.every((iv, i) => approxEqual(iv.lo, target[i].lo) && approxEqual(iv.hi, target[i].hi));
  if (endpointsMatch) return WRONG('Los extremos son correctos, pero revisa si están incluidos o no (corchete o paréntesis, $<$ o $\\le$).');
  return WRONG(`No es correcto: tu respuesta corresponde a $${realSetToLatex(got)}$.`);
}

// ---------------------------------------------------------------------------
// Tablas de verdad
// ---------------------------------------------------------------------------

const CONNECTIVE_HELP: Record<string, string> = {
  not: 'la negación invierte el valor de verdad',
  and: 'la conjunción es V solo si ambas son V',
  or: 'la disyunción es F solo si ambas son F',
  xor: 'la disyunción exclusiva es V cuando los valores son distintos',
  implies: 'la implicación solo es F cuando el antecedente es V y el consecuente F',
  iff: 'el bicondicional es V cuando ambos lados tienen el mismo valor',
};

function topConnective(n: Node): string | null {
  if (n.type === 'not') return 'not';
  if (n.type === 'logic') return n.op;
  return null;
}

function checkTruthTable(spec: Extract<AnswerSpec, { kind: 'truth-table' }>, input: AnswerInput): FullCheckResult {
  if (input.kind !== 'table') return WRONG('Completa la tabla.');
  const cols = spec.columns.map((c) => parse(c, { mode: spec.mode }));
  const rows = assignments(spec.vars);
  const wrong: [number, number][] = [];
  let empty = 0;
  const expected = rows.map((row) => cols.map((c) => evalBool(c, row)));
  rows.forEach((_, r) => {
    cols.forEach((_, c) => {
      const v = input.value[r]?.[c];
      if (v === null || v === undefined) empty++;
      else if (v !== expected[r][c]) wrong.push([r, c]);
    });
  });
  if (empty) return WRONG(`Faltan completar ${empty} ${empty === 1 ? 'celda' : 'celdas'}.`);
  if (!wrong.length) return OK('¡Tabla correcta!');
  // Busca un error de evaluación de un conector (operandos correctos, resultado incorrecto)
  const val = (b: boolean) => (spec.mode === 'bool' ? (b ? '1' : '0') : b ? 'V' : 'F');
  for (const [r, c] of wrong) {
    const node = cols[c];
    const kids = node.type === 'not' ? [node.arg] : node.type === 'logic' ? [node.left, node.right] : [];
    const operandCols = kids.map((k) => cols.findIndex((cc) => JSON.stringify(cc) === JSON.stringify(k)));
    const operandsRight = kids.every((k, i) => {
      const ci = operandCols[i];
      if (ci === -1) return k.type === 'sym' || k.type === 'bool';
      return input.value[r][ci] === expected[r][ci];
    });
    const conn = topConnective(node);
    if (operandsRight && conn) {
      const assign = spec.vars.map((v) => `${v} = ${val(rows[r][v])}`).join(', ');
      return WRONG(
        `Fila ${r + 1} ($${assign}$), columna $${toLatex(node, { boolStyle: spec.mode === 'bool' ? '10' : 'VF', boolAlgebra: spec.mode === 'bool' })}$: debería ser ${val(expected[r][c])}. Recuerda que ${CONNECTIVE_HELP[conn]}.`,
        { wrongCells: wrong },
      );
    }
  }
  return WRONG(`Hay ${wrong.length} ${wrong.length === 1 ? 'celda incorrecta' : 'celdas incorrectas'}. Revisa las marcadas en rojo.`, { wrongCells: wrong });
}

/** Conector mal evaluado en una tabla (para el banco de errores). */
export function truthTableConnectiveError(spec: Extract<AnswerSpec, { kind: 'truth-table' }>, input: AnswerInput): string | null {
  if (input.kind !== 'table') return null;
  const cols = spec.columns.map((c) => parse(c, { mode: spec.mode }));
  const rows = assignments(spec.vars);
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const exp = evalBool(cols[c], rows[r]);
      if (input.value[r]?.[c] === null || input.value[r]?.[c] === exp) continue;
      const node = cols[c];
      const kids = node.type === 'not' ? [node.arg] : node.type === 'logic' ? [node.left, node.right] : [];
      const ok = kids.every((k) => {
        const ci = cols.findIndex((cc) => JSON.stringify(cc) === JSON.stringify(k));
        return ci === -1 ? k.type === 'sym' : input.value[r][ci] === evalBool(cols[ci], rows[r]);
      });
      const conn = topConnective(node);
      if (ok && conn) return `connective.${conn}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------

function checkSet(spec: Extract<AnswerSpec, { kind: 'set' }>, input: AnswerInput): FullCheckResult {
  const raw = textOf(input);
  if (raw === null) return WRONG('Escribe los elementos del conjunto.');
  const trimmed = raw.trim();
  let keys: string[];
  if (!trimmed || /^(\\emptyset|∅|\{\s*\}|\\varnothing|\\\{\s*\\\})$/.test(trimmed)) keys = [];
  else {
    const src = /^(\\\{|\{|\\left\\\{|\\lbrace)/.test(trimmed) ? trimmed : `{${trimmed}}`;
    const { node, error } = parseSafe(src, 'set', false);
    if (!node) return WRONG(error!, { parseError: true });
    if (node.type !== 'set') return WRONG('Escribe los elementos entre llaves, separados por comas: {1, 2, 3}.');
    keys = node.items.map(elemKey);
  }
  const got = new Set(keys);
  const exp = new Set(spec.elements);
  const missing = [...exp].filter((e) => !got.has(e));
  const extra = [...got].filter((e) => !exp.has(e));
  if (!missing.length && !extra.length) return OK();
  const parts: string[] = [];
  if (missing.length) parts.push(`faltan ${missing.length} ${missing.length === 1 ? 'elemento' : 'elementos'}`);
  if (extra.length) parts.push(`sobran: $${extra.join(',\\ ')}$`);
  return WRONG(`Casi: ${parts.join('; ')}.`);
}

function checkCells(values: number[], cells: string[], tolerance = 1e-6, labels?: string[]): FullCheckResult {
  const wrongIdx: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const raw = cells[i] ?? '';
    if (!raw.trim()) return WRONG('Completa todas las componentes.');
    const { node, error } = parseSafe(cleanNumeric(raw, undefined, values[i]));
    if (!node) return WRONG(error!, { parseError: true });
    const v = evalNum(node);
    if (!Number.isFinite(v) || Math.abs(v - values[i]) > Math.max(tolerance, 1e-9 * Math.abs(values[i]))) wrongIdx.push(i);
  }
  if (!wrongIdx.length) return OK();
  const names = wrongIdx.map((i) => (labels ? labels[i] : `${i + 1}ª`));
  return WRONG(`${wrongIdx.length === 1 ? 'La componente' : 'Las componentes'} ${names.join(', ')} no ${wrongIdx.length === 1 ? 'es correcta' : 'son correctas'}.`);
}

function checkLogicExpr(spec: Extract<AnswerSpec, { kind: 'logic-expr' }>, input: AnswerInput): FullCheckResult {
  const raw = textOf(input);
  if (raw === null || !raw.trim()) return WRONG('Escribe una proposición.');
  const { node, error } = parseSafe(raw, 'logic');
  if (!node) return WRONG(error!, { parseError: true });
  const target = parse(spec.target, { mode: 'logic' });
  const eq = logicEquivalent(target, node);
  if (!eq.equivalent) {
    if (spec.diagnoseFrom) {
      const from = parseSafe(spec.diagnoseFrom, 'logic').node;
      if (from) {
        for (const m of mutations(from, 'logic')) {
          if (logicEquivalent(m.mutated, node).equivalent) return WRONG(m.message, { bug: m.bug });
        }
      }
    }
    const c = eq.counterexample;
    if (c) {
      const env = Object.entries(c.env).map(([k, v]) => `${k} = ${v ? 'V' : 'F'}`).join(', ');
      return WRONG(`No es equivalente: con $${env}$ tu proposición es ${c.b ? 'V' : 'F'} y debería ser ${c.a ? 'V' : 'F'}.`);
    }
    return WRONG('No es equivalente.');
  }
  if (spec.constraint === 'no-neg-parens') {
    let bad = false;
    walk(node, (n) => {
      if (n.type === 'not' && (n.arg.type === 'logic' || n.arg.type === 'not')) bad = true;
    });
    if (bad) return { correct: false, partial: true, message: 'Es equivalente, pero todavía hay negaciones delante de paréntesis o dobles negaciones: aplica De Morgan hasta que las negaciones afecten solo a letras.' };
  }
  if (spec.constraint === 'no-implication') {
    let bad = false;
    walk(node, (n) => {
      if (n.type === 'logic' && (n.op === 'implies' || n.op === 'iff')) bad = true;
    });
    if (bad) return { correct: false, partial: true, message: 'Es equivalente, pero debes expresarla sin implicaciones: usa $p \\Rightarrow q \\equiv \\neg p \\lor q$.' };
  }
  return OK();
}

/** Regiones de Venn: id = nombres de los conjuntos a los que pertenece ('' = fuera de todos). */
export function vennRegions(sets: string[]): { id: string; member: Record<string, boolean> }[] {
  return assignments(sets).map((row) => ({ id: sets.filter((s) => row[s]).join(''), member: row }));
}

export function regionsOf(expr: Node, sets: string[]): string[] {
  return vennRegions(sets).filter((r) => evalMembership(expr, r.member)).map((r) => r.id);
}

function checkVenn(spec: Extract<AnswerSpec, { kind: 'venn' }>, input: AnswerInput): FullCheckResult {
  if (input.kind !== 'regions') return WRONG('Sombrea las regiones en el diagrama.');
  const target = parse(spec.target, { mode: 'set' });
  const expected = new Set(regionsOf(target, spec.sets));
  const got = new Set(input.value);
  const missing = [...expected].filter((r) => !got.has(r));
  const extra = [...got].filter((r) => !expected.has(r));
  if (!missing.length && !extra.length) return OK();
  for (const m of mutations(target, 'set')) {
    const regs = new Set(regionsOf(m.mutated, spec.sets));
    if (regs.size === got.size && [...regs].every((r) => got.has(r))) return WRONG(m.message, { bug: m.bug });
  }
  const parts: string[] = [];
  if (missing.length) parts.push(`falta sombrear ${missing.length} ${missing.length === 1 ? 'región' : 'regiones'}`);
  if (extra.length) parts.push(`sombreaste ${extra.length} ${extra.length === 1 ? 'región que no corresponde' : 'regiones que no corresponden'}`);
  return WRONG(`No coincide: ${parts.join(' y ')}.`);
}

// ---------------------------------------------------------------------------

export function checkAnswer(spec: AnswerSpec, input: AnswerInput): FullCheckResult {
  try {
    switch (spec.kind) {
      case 'numeric': return checkNumeric(spec, input);
      case 'expression': return checkExpression(spec, input);
      case 'equation': {
        const raw = textOf(input);
        if (raw === null || !raw.trim()) return WRONG('Escribe la ecuación.');
        const { node, error } = parseSafe(raw);
        if (!node) return WRONG(error!, { parseError: true });
        if (node.type !== 'rel' || node.op !== '=') return WRONG('Escribe una ecuación, por ejemplo $y = 2x + 1$.');
        return equationsEquivalent(parse(spec.target), node, spec.variable).equivalent ? OK() : WRONG('La ecuación no es correcta.');
      }
      case 'solutions': return checkSolutions(spec, input);
      case 'inequality': return checkInequality(spec, input);
      case 'choice': {
        if (input.kind !== 'choice') return WRONG('Elige una opción.');
        if (input.value === spec.correct) return OK(spec.explanations?.[input.value] ?? '¡Correcto!');
        return WRONG(spec.explanations?.[input.value] ?? 'No es la opción correcta.');
      }
      case 'multi': {
        if (input.kind !== 'multi') return WRONG('Marca las opciones correctas.');
        const a = new Set(input.value);
        const b = new Set(spec.correct);
        const ok = a.size === b.size && [...a].every((x) => b.has(x));
        if (ok) return OK();
        const missing = [...b].filter((x) => !a.has(x)).length;
        const extra = [...a].filter((x) => !b.has(x)).length;
        return WRONG(extra ? `Marcaste ${extra} ${extra === 1 ? 'opción incorrecta' : 'opciones incorrectas'}.` : `Te ${missing === 1 ? 'falta marcar una opción' : `faltan marcar ${missing} opciones`}.`);
      }
      case 'truefalse':
        if (input.kind !== 'bool') return WRONG('Elige verdadero o falso.');
        return input.value === spec.correct ? OK() : WRONG('No es correcto.');
      case 'truth-table': return checkTruthTable(spec, input);
      case 'set': return checkSet(spec, input);
      case 'vector':
        if (input.kind !== 'cells') return WRONG('Completa las componentes.');
        return checkCells(spec.values, input.value, spec.tolerance, spec.labels);
      case 'matrix': {
        if (input.kind !== 'grid') return WRONG('Completa la matriz.');
        const flat = spec.rows.flat();
        const cells = input.value.flat();
        const labels = spec.rows.flatMap((row, i) => row.map((_, j) => `(${i + 1},${j + 1})`));
        return checkCells(flat, cells, spec.tolerance, labels);
      }
      case 'logic-expr': return checkLogicExpr(spec, input);
      case 'set-expr': {
        const raw = textOf(input);
        if (raw === null || !raw.trim()) return WRONG('Escribe una expresión de conjuntos.');
        const { node, error } = parseSafe(raw, 'set');
        if (!node) return WRONG(error!, { parseError: true });
        return setExprEquivalent(parse(spec.target, { mode: 'set' }), node).equivalent ? OK() : WRONG('No representa el mismo conjunto.');
      }
      case 'venn': return checkVenn(spec, input);
      case 'predicate': {
        const raw = textOf(input);
        if (raw === null || !raw.trim()) return WRONG('Escribe un número.');
        const { node, error } = parseSafe(cleanNumeric(raw));
        if (!node) return WRONG(error!, { parseError: true });
        const v = evalNum(node);
        if (!Number.isFinite(v)) return WRONG('Escribe un número.');
        return spec.check(v) ? OK() : WRONG('Ese valor no sirve como contraejemplo: para él la afirmación se cumple.');
      }
    }
  } catch (e) {
    return WRONG(e instanceof Error ? `No pude verificar la respuesta: ${e.message}` : 'No pude verificar la respuesta.');
  }
}

/** Valida una resolución de varias líneas; la última se comprueba como respuesta final. */
export function checkSteps(steps: StepsSpec, answer: AnswerSpec, rawLines: string[]): FullCheckResult {
  const lines = rawLines.filter((l) => l.trim());
  if (!lines.length) return WRONG('Escribe al menos una línea.');
  try {
    const parseMode = steps.parseMode ?? (steps.mode === 'logic' ? 'logic' : steps.mode === 'set' ? 'set' : 'arith');
    const start = parse(steps.start, { mode: parseMode });
    const results = validateSteps(start, lines, { mode: steps.mode, variable: steps.variable, parseMode });
    const firstBad = results.find((r) => r.status === 'error' || r.status === 'parse-error' || r.status === 'carried');
    if (firstBad) {
      return { correct: false, message: `Línea ${firstBad.index + 1}: ${firstBad.message}`, bug: firstBad.bug, parseError: firstBad.status === 'parse-error', lines: results };
    }
    const fin = checkAnswer(answer, { kind: 'text', value: lines[lines.length - 1] });
    if (fin.correct) return { correct: true, message: '¡Correcto! Todos los pasos son válidos.', lines: results };
    const lastRes = results[results.length - 1];
    if (!lastRes?.isFinal && (steps.mode === 'equation' || steps.mode === 'inequality')) {
      return { correct: false, partial: true, message: 'Vas bien: todos los pasos son válidos. Sigue hasta despejar la incógnita.', lines: results };
    }
    if (fin.partial) return { ...fin, lines: results };
    return { correct: false, partial: true, message: 'Todos los pasos son válidos, pero todavía no llegaste a la forma pedida. Continúa simplificando.', lines: results };
  } catch (e) {
    return WRONG(e instanceof Error ? `No pude verificar los pasos: ${e.message}` : 'No pude verificar los pasos.');
  }
}
