// Bloque 1: lógica matemática y conjuntos.
import type { LogicOp, Node } from '../../math/ast';
import { freeVars, logic, not, setop, sym, walk, compl } from '../../math/ast';
import { assignments } from '../../math/equivalence';
import { evalBool, evalMembership } from '../../math/evaluate';
import { parse } from '../../math/parse';
import { toLatex, toText } from '../../math/print';
import type { Rng } from '../rng';
import type { Generator } from '../types';
import { choices, divisors, isPrime, R } from './util';

const V = (b: boolean) => (b ? R`\mathrm{V}` : R`\mathrm{F}`);
const Vt = (b: boolean) => (b ? 'V' : 'F');
const L = (node: Node) => toLatex(node);

const CONNECTIVE_RULE: Record<string, string> = {
  not: R`la negación $\neg p$ tiene el valor contrario a $p$`,
  and: R`la conjunción $p \land q$ es V solo cuando ambas son V`,
  or: R`la disyunción $p \lor q$ es F solo cuando ambas son F`,
  xor: R`la disyunción exclusiva $p \veebar q$ es V cuando tienen valores distintos`,
  implies: R`la implicación $p \Rightarrow q$ es F solo cuando $p$ es V y $q$ es F`,
  iff: R`el bicondicional $p \Leftrightarrow q$ es V cuando ambas tienen el mismo valor`,
};

function connectivesIn(node: Node): string[] {
  const s = new Set<string>();
  walk(node, (n) => {
    if (n.type === 'not') s.add('not');
    if (n.type === 'logic') s.add(n.op);
  });
  return [...s];
}

/** Subfórmulas compuestas en orden de evaluación (de adentro hacia afuera), sin repetir. */
export function subformulas(node: Node): Node[] {
  const out: Node[] = [];
  const seen = new Set<string>();
  const rec = (n: Node) => {
    if (n.type === 'not') rec(n.arg);
    if (n.type === 'logic') { rec(n.left); rec(n.right); }
    if (n.type === 'not' || n.type === 'logic') {
      const k = toText(n);
      if (!seen.has(k)) { seen.add(k); out.push(n); }
    }
  };
  rec(node);
  return out;
}

function randomFormula(rng: Rng, vars: string[], depth: number, ops: LogicOp[]): Node {
  if (depth <= 0) {
    const v = sym(rng.pick(vars));
    return rng.bool(0.25) ? not(v) : v;
  }
  if (rng.bool(0.18)) {
    const inner = randomFormula(rng, vars, depth - 1, ops);
    if (inner.type !== 'not' && inner.type !== 'sym') return not(inner);
  }
  const op = rng.pick(ops);
  const leftDepth = rng.int(0, depth - 1);
  const rightDepth = depth - 1;
  const [a, b] = rng.bool() ? [leftDepth, rightDepth] : [rightDepth, leftDepth];
  return logic(op, randomFormula(rng, vars, a, ops), randomFormula(rng, vars, b, ops));
}

function formulaWithAllVars(rng: Rng, vars: string[], depth: number, ops: LogicOp[]): Node {
  for (let i = 0; i < 60; i++) {
    const f = randomFormula(rng, vars, depth, ops);
    if (freeVars(f).size === vars.length) return f;
  }
  return logic(ops[0], sym(vars[0]), sym(vars[1] ?? vars[0]));
}

function evaluationChain(node: Node, env: Record<string, boolean>): string {
  return subformulas(node)
    .map((s) => `$${L(s)} = ${V(evalBool(s, env))}$`)
    .join(' → ');
}

// ---------------------------------------------------------------------------

const evalConnectives: Generator = {
  id: 'logic.eval', skillId: 'logic.connectives', title: 'Valor de verdad de una proposición compuesta', levels: [1, 2, 3],
  errorTags: ['logic.connective-swap'],
  generate(rng, level) {
    const vars = level === 3 ? ['p', 'q', 'r'] : ['p', 'q'];
    const ops: LogicOp[] = level === 1 ? ['and', 'or', 'implies', 'iff'] : ['and', 'or', 'implies', 'iff'];
    let f: Node;
    if (level === 1) {
      const op = rng.pick(ops);
      f = rng.bool(0.2) ? not(sym('p')) : logic(op, sym('p'), rng.bool(0.3) ? not(sym('q')) : sym('q'));
    } else f = formulaWithAllVars(rng, vars, level === 2 ? 2 : 3, ops);
    const env: Record<string, boolean> = {};
    vars.forEach((v) => (env[v] = rng.bool()));
    const used = [...freeVars(f)].sort();
    const value = evalBool(f, env);
    const given = used.map((v) => `$${v}$ es ${Vt(env[v])}`).join(', ');
    const conns = connectivesIn(f);
    return {
      prompt: R`Si ${given}, ¿cuál es el valor de verdad de $${L(f)}$?`,
      answer: { kind: 'truefalse', correct: value },
      hints: [
        `Recuerda: ${conns.map((c) => CONNECTIVE_RULE[c]).join('; ')}.`,
        `Evalúa de adentro hacia afuera: primero ${subformulas(f).slice(0, 1).map((s) => `$${L(s)}$`).join('')}.`,
        `Evaluación paso a paso: ${evaluationChain(f, env)}.`,
      ],
      solution: subformulas(f).map((s) => ({ math: R`${L(s)} = ${V(evalBool(s, env))}` })),
      expectedSeconds: 20 + level * 15,
    };
  },
};

const PROPOSITIONS: { text: string; is: boolean; why: string }[] = [
  { text: '7 es un número primo.', is: true, why: 'Es una afirmación que es verdadera.' },
  { text: '¿Qué hora es?', is: false, why: 'Las preguntas no son verdaderas ni falsas.' },
  { text: 'Cerrá la puerta.', is: false, why: 'Una orden no tiene valor de verdad.' },
  { text: R`$x + 3 = 5$`, is: false, why: 'Depende del valor de $x$: es una función proposicional, no una proposición.' },
  { text: 'Buenos Aires es la capital de Chile.', is: true, why: 'Es una afirmación (falsa), así que es una proposición.' },
  { text: '¡Qué lindo día!', is: false, why: 'Las exclamaciones no tienen valor de verdad.' },
  { text: R`$2 + 2 = 5$`, is: true, why: 'Es una afirmación falsa: sigue siendo una proposición.' },
  { text: 'Todo número par es divisible por 2.', is: true, why: 'Es una afirmación verdadera.' },
  { text: 'Él es alto.', is: false, why: 'No se sabe a quién se refiere ni qué es «alto»: no tiene un valor de verdad definido.' },
  { text: 'Ojalá apruebe el examen.', is: false, why: 'Un deseo no es verdadero ni falso.' },
  { text: R`$x > 0$`, is: false, why: 'Su valor depende de $x$.' },
  { text: 'Un triángulo tiene tres lados.', is: true, why: 'Es una afirmación verdadera.' },
  { text: 'Esta oración es falsa.', is: false, why: 'Es una paradoja: no puede ser ni verdadera ni falsa.' },
  { text: 'La Luna es un satélite de la Tierra.', is: true, why: 'Es una afirmación verdadera.' },
  { text: R`$\sqrt{2}$ es un número racional.`, is: true, why: 'Es una afirmación (falsa).' },
];

const isProposition: Generator = {
  id: 'logic.is-proposition', skillId: 'logic.connectives', title: '¿Es una proposición?', levels: [1],
  generate(rng) {
    const item = rng.pick(PROPOSITIONS);
    return {
      prompt: `¿Es una proposición? «${item.text}»`,
      answer: {
        kind: 'choice', options: ['Sí, es una proposición', 'No es una proposición'], correct: item.is ? 0 : 1,
        explanations: item.is ? ['¡Correcto! ' + item.why, item.why] : [item.why, '¡Correcto! ' + item.why],
      },
      hints: [
        'Una proposición es una afirmación que es verdadera o falsa (y no ambas a la vez).',
        'Pregúntate: ¿puedo decir si es verdadera o falsa sin información extra?',
        item.why,
      ],
      solution: [{ note: item.why }],
      expectedSeconds: 15,
    };
  },
};

const PHRASES = [
  { p: 'llueve', np: 'no llueve', q: 'salgo a correr', nq: 'no salgo a correr' },
  { p: 'estudio', np: 'no estudio', q: 'apruebo', nq: 'no apruebo' },
  { p: 'hace frío', np: 'no hace frío', q: 'uso abrigo', nq: 'no uso abrigo' },
  { p: 'el número es par', np: 'el número no es par', q: 'es divisible por 2', nq: 'no es divisible por 2' },
  { p: 'tengo tiempo', np: 'no tengo tiempo', q: 'leo un libro', nq: 'no leo un libro' },
];

const translate: Generator = {
  id: 'logic.translate', skillId: 'logic.connectives', title: 'Del lenguaje natural al simbólico', levels: [1, 2, 3],
  errorTags: ['logic.converse'],
  generate(rng, level) {
    const ph = rng.pick(PHRASES);
    const p = sym('p');
    const q = sym('q');
    const templates: { text: string; f: Node; lv: number }[] = [
      { text: `Si ${ph.p}, entonces ${ph.q}.`, f: logic('implies', p, q), lv: 1 },
      { text: `${cap(ph.p)} y ${ph.nq}.`, f: logic('and', p, not(q)), lv: 1 },
      { text: `${cap(ph.p)} o ${ph.q}.`, f: logic('or', p, q), lv: 1 },
      { text: `${cap(ph.p)} si y solo si ${ph.q}.`, f: logic('iff', p, q), lv: 2 },
      { text: `Si ${ph.np}, entonces ${ph.nq}.`, f: logic('implies', not(p), not(q)), lv: 2 },
      { text: `No es cierto que ${ph.p} y ${ph.q}.`, f: not(logic('and', p, q)), lv: 2 },
      { text: `Ni ${ph.p} ni ${ph.q}.`, f: logic('and', not(p), not(q)), lv: 3 },
      { text: `${cap(ph.q)} si ${ph.p}.`, f: logic('implies', p, q), lv: 3 },
      { text: `${cap(ph.p)} solo si ${ph.q}.`, f: logic('implies', p, q), lv: 3 },
    ];
    const pool = templates.filter((t) => t.lv <= level && t.lv >= level - 1);
    const t = rng.pick(pool);
    const correct = `$${L(t.f)}$`;
    const alts: Node[] = [];
    if (t.f.type === 'logic') {
      alts.push(logic(t.f.op, t.f.right, t.f.left));
      alts.push(logic(t.f.op === 'and' ? 'or' : t.f.op === 'or' ? 'and' : 'and', t.f.left, t.f.right));
      alts.push(logic('implies', t.f.right, t.f.left));
      alts.push(not(t.f));
      alts.push(logic(t.f.op, t.f.left.type === 'not' ? t.f.left.arg : not(t.f.left), t.f.right));
    } else {
      alts.push(logic('and', not(p), not(q)), logic('or', not(p), q), logic('and', not(p), q), logic('and', p, q));
    }
    const { options, correct: ci } = choices(rng, correct, alts.map((a) => `$${L(a)}$`).filter((o) => o !== correct));
    return {
      prompt: `Siendo $p$: «${ph.p}» y $q$: «${ph.q}», ¿cuál es la forma simbólica de: «${t.text}»?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: [
        R`«y» se traduce $\land$, «o» $\lor$, «si… entonces…» $\Rightarrow$, «si y solo si» $\Leftrightarrow$, «no» $\neg$. «$q$ si $p$» y «$p$ solo si $q$» significan $p \Rightarrow q$.`,
        'Identifica primero el conector principal de la oración y luego qué afirma cada parte.',
        `La traducción es ${correct}.`,
      ],
      solution: [{ math: L(t.f), note: 'Traducción directa de la oración.' }],
      expectedSeconds: 30,
    };
  },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------

const truthTableFill: Generator = {
  id: 'tt.fill', skillId: 'logic.truth-tables', title: 'Completar una tabla de verdad', levels: [1, 2, 3],
  errorTags: ['logic.connective-swap'],
  generate(rng, level) {
    const vars = level === 3 ? ['p', 'q', 'r'] : ['p', 'q'];
    const f = level === 1 ? formulaWithAllVars(rng, vars, 1, ['and', 'or', 'implies', 'iff']) : formulaWithAllVars(rng, vars, 2, ['and', 'or', 'implies', 'iff']);
    const cols = subformulas(f);
    const firstCol = cols[0];
    const rows = assignments(vars);
    return {
      prompt: R`Completa la tabla de verdad de $${L(f)}$.`,
      answer: { kind: 'truth-table', formula: toText(f), mode: 'logic', vars, columns: cols.map((c) => toText(c)) },
      hints: [
        `Con ${vars.length} variables la tabla tiene $2^{${vars.length}} = ${rows.length}$ filas. Recuerda: ${connectivesIn(f).map((c) => CONNECTIVE_RULE[c]).join('; ')}.`,
        R`Completa las columnas de izquierda a derecha: empieza por $${L(firstCol)}$, usando solo los valores de las columnas anteriores.`,
        `La columna $${L(firstCol)}$ es: ${rows.map((r) => Vt(evalBool(firstCol, r))).join(', ')} (de arriba hacia abajo).`,
      ],
      solution: cols.map((c) => ({ math: L(c), note: rows.map((r) => Vt(evalBool(c, r))).join(' ') })),
      expectedSeconds: 60 + 40 * level,
    };
  },
};

const TAUTOLOGIES = ['p ∨ ¬p', '(p ∧ q) ⇒ p', 'p ⇒ (p ∨ q)', '((p ⇒ q) ∧ p) ⇒ q', '(p ⇒ q) ⇔ (¬q ⇒ ¬p)', '¬(p ∧ ¬p)', '((p ⇒ q) ∧ ¬q) ⇒ ¬p', '¬(p ∨ q) ⇔ (¬p ∧ ¬q)'];
const CONTRADICTIONS = ['p ∧ ¬p', '(p ∨ q) ∧ (¬p ∧ ¬q)', '¬(p ⇒ p)', '(p ⇔ q) ∧ (p ⇔ ¬q)', '¬(p ∨ ¬p)', '(p ⇒ q) ∧ (p ∧ ¬q)'];

function classify(f: Node, vars: string[]): 0 | 1 | 2 {
  const vals = assignments(vars).map((r) => evalBool(f, r));
  if (vals.every(Boolean)) return 0;
  if (vals.every((v) => !v)) return 1;
  return 2;
}

const truthTableClassify: Generator = {
  id: 'tt.classify', skillId: 'logic.truth-tables', title: 'Tautología, contradicción o contingencia', levels: [1, 2, 3],
  generate(rng, level) {
    const kind = rng.int(0, 2);
    let f: Node;
    if (kind === 0) f = parse(rng.pick(TAUTOLOGIES), { mode: 'logic' });
    else if (kind === 1) f = parse(rng.pick(CONTRADICTIONS), { mode: 'logic' });
    else f = formulaWithAllVars(rng, level === 3 ? ['p', 'q', 'r'] : ['p', 'q'], 2, ['and', 'or', 'implies', 'iff']);
    const vars = [...freeVars(f)].sort();
    const cls = classify(f, vars);
    const labels = ['Tautología', 'Contradicción', 'Contingencia'];
    const rows = assignments(vars);
    const vals = rows.map((r) => Vt(evalBool(f, r)));
    return {
      prompt: R`Clasifica la fórmula $${L(f)}$.`,
      answer: { kind: 'choice', options: labels, correct: cls },
      hints: [
        'Tautología: V en todas las filas. Contradicción: F en todas. Contingencia: tiene filas V y filas F.',
        `Arma la tabla de verdad (${rows.length} filas) y mira solo la última columna.`,
        `La última columna es: ${vals.join(', ')}. Por lo tanto es una ${labels[cls].toLowerCase()}.`,
      ],
      solution: [{ math: L(f), note: `Valores: ${vals.join(' ')} → ${labels[cls]}.` }],
      expectedSeconds: 60 + 20 * level,
    };
  },
};

// ---------------------------------------------------------------------------

const lawsSimplify: Generator = {
  id: 'laws.simplify', skillId: 'logic.laws', title: 'Aplicar De Morgan y eliminar negaciones', levels: [1, 2, 3],
  errorTags: ['logic.demorgan', 'logic.demorgan-partial', 'logic.neg-implication', 'logic.double-neg'],
  generate(rng, level) {
    const [a, b, c] = rng.shuffle(['p', 'q', 'r']);
    const A = sym(a), B = sym(b), C = sym(c);
    const pool: Node[][] = [
      [not(logic('and', A, B)), not(logic('or', A, B)), not(logic('and', A, not(B))), not(logic('or', not(A), B))],
      [not(logic('implies', A, B)), not(logic('and', not(A), not(B))), not(logic('or', A, logic('and', B, not(A))))],
      [not(logic('or', A, logic('and', B, not(C)))), not(logic('implies', logic('and', A, B), C)), not(logic('and', logic('or', A, B), not(C)))],
    ];
    const start = rng.pick(pool[level - 1]);
    const target = pushNegations(start);
    return {
      prompt: R`Escribe una proposición equivalente a $${L(start)}$ en la que las negaciones afecten solo a letras (sin $\neg$ delante de paréntesis). Puedes resolverlo paso a paso.`,
      answer: { kind: 'logic-expr', target: toText(target), constraint: 'no-neg-parens', diagnoseFrom: toText(start) },
      steps: { start: toText(start), mode: 'logic' },
      hints: [
        R`De Morgan: $\neg(p\land q)\equiv\neg p\lor\neg q$ y $\neg(p\lor q)\equiv\neg p\land\neg q$. Además $\neg(p\Rightarrow q)\equiv p\land\neg q$ y $\neg\neg p\equiv p$.`,
        'Aplica la ley correspondiente al conector más externo que está negado y luego simplifica las dobles negaciones.',
        `Resultado: $${L(target)}$.`,
      ],
      solution: [{ math: L(start) }, { math: R`\equiv ${L(target)}`, note: 'De Morgan y doble negación.' }],
      expectedSeconds: 60 + 30 * level,
    };
  },
};

/** Lleva las negaciones hasta las letras (forma normal de negación). */
export function pushNegations(f: Node): Node {
  if (f.type === 'sym' || f.type === 'bool') return f;
  if (f.type === 'logic') {
    if (f.op === 'implies') return logic('or', pushNegations(not(f.left)), pushNegations(f.right));
    return logic(f.op, pushNegations(f.left), pushNegations(f.right));
  }
  if (f.type === 'not') {
    const g = f.arg;
    if (g.type === 'sym' || g.type === 'bool') return f;
    if (g.type === 'not') return pushNegations(g.arg);
    if (g.type === 'logic') {
      if (g.op === 'and') return logic('or', pushNegations(not(g.left)), pushNegations(not(g.right)));
      if (g.op === 'or') return logic('and', pushNegations(not(g.left)), pushNegations(not(g.right)));
      if (g.op === 'implies') return logic('and', pushNegations(g.left), pushNegations(not(g.right)));
      if (g.op === 'iff') return logic('iff', pushNegations(g.left), pushNegations(not(g.right)));
      if (g.op === 'xor') return logic('iff', pushNegations(g.left), pushNegations(g.right));
    }
  }
  return f;
}

const LAWS: { name: string; make: (a: Node, b: Node, c: Node) => [Node, Node] }[] = [
  { name: 'Ley de De Morgan', make: (a, b) => [not(logic('and', a, b)), logic('or', not(a), not(b))] },
  { name: 'Ley de De Morgan', make: (a, b) => [not(logic('or', a, b)), logic('and', not(a), not(b))] },
  { name: 'Doble negación', make: (a) => [not(not(a)), a] },
  { name: 'Contrarrecíproca', make: (a, b) => [logic('implies', a, b), logic('implies', not(b), not(a))] },
  { name: 'Equivalencia de la implicación', make: (a, b) => [logic('implies', a, b), logic('or', not(a), b)] },
  { name: 'Propiedad distributiva', make: (a, b, c) => [logic('and', a, logic('or', b, c)), logic('or', logic('and', a, b), logic('and', a, c))] },
  { name: 'Propiedad conmutativa', make: (a, b) => [logic('or', a, b), logic('or', b, a)] },
  { name: 'Propiedad asociativa', make: (a, b, c) => [logic('and', logic('and', a, b), c), logic('and', a, logic('and', b, c))] },
  { name: 'Absorción', make: (a, b) => [logic('or', a, logic('and', a, b)), a] },
  { name: 'Idempotencia', make: (a) => [logic('and', a, a), a] },
];

const whichLaw: Generator = {
  id: 'laws.which', skillId: 'logic.laws', title: '¿Qué ley se aplicó?', levels: [1, 2],
  generate(rng) {
    const [a, b, c] = rng.shuffle(['p', 'q', 'r']).map(sym);
    const law = rng.pick(LAWS);
    const [before, after] = law.make(a, b, c);
    const names = [...new Set(LAWS.map((l) => l.name))];
    const { options, correct } = choices(rng, law.name, rng.shuffle(names.filter((n) => n !== law.name)));
    return {
      prompt: R`¿Qué ley justifica la equivalencia $${L(before)} \equiv ${L(after)}$?`,
      answer: { kind: 'choice', options, correct },
      hints: [
        'Compara la forma de ambos lados: ¿se cambió el conector?, ¿se negó algo?, ¿se reordenó?',
        'Si aparece una negación que «entra» en un paréntesis y cambia el conector, es De Morgan; si se invierte y niega una implicación, es la contrarrecíproca.',
        `Es la ${law.name.toLowerCase()}.`,
      ],
      solution: [{ math: R`${L(before)} \equiv ${L(after)}`, note: law.name }],
      expectedSeconds: 25,
    };
  },
};

const inference: Generator = {
  id: 'laws.inference', skillId: 'logic.laws', title: 'Reglas de inferencia', levels: [1, 2, 3],
  errorTags: ['logic.converse'],
  generate(rng, level) {
    const ph = rng.pick(PHRASES);
    type Case = { premises: string[]; answer: string; wrong: string[]; rule: string };
    const cases: Case[] = [
      { premises: [`Si ${ph.p}, entonces ${ph.q}.`, `${cap(ph.p)}.`], answer: `${cap(ph.q)}.`, wrong: [`${cap(ph.nq)}.`, `${cap(ph.np)}.`, 'No se puede concluir nada.'], rule: 'Modus Ponens: de $p \\Rightarrow q$ y $p$ se deduce $q$.' },
      { premises: [`Si ${ph.p}, entonces ${ph.q}.`, `${cap(ph.nq)}.`], answer: `${cap(ph.np)}.`, wrong: [`${cap(ph.p)}.`, `${cap(ph.q)}.`, 'No se puede concluir nada.'], rule: 'Modus Tollens: de $p \\Rightarrow q$ y $\\neg q$ se deduce $\\neg p$.' },
      { premises: [`${cap(ph.p)} o ${ph.q}.`, `${cap(ph.np)}.`], answer: `${cap(ph.q)}.`, wrong: [`${cap(ph.nq)}.`, `${cap(ph.p)}.`, 'No se puede concluir nada.'], rule: 'Silogismo disyuntivo: de $p \\lor q$ y $\\neg p$ se deduce $q$.' },
      { premises: [`Si ${ph.p}, entonces ${ph.q}.`, `${cap(ph.q)}.`], answer: `No se puede concluir nada sobre si ${ph.p}.`, wrong: [`${cap(ph.p)}.`, `${cap(ph.np)}.`, `${cap(ph.nq)}.`], rule: 'Falacia de afirmar el consecuente: de $p\\Rightarrow q$ y $q$ no se deduce $p$.' },
      { premises: [`Si ${ph.p}, entonces ${ph.q}.`, `${cap(ph.np)}.`], answer: `No se puede concluir nada sobre si ${ph.q}.`, wrong: [`${cap(ph.nq)}.`, `${cap(ph.q)}.`, `${cap(ph.p)}.`], rule: 'Falacia de negar el antecedente: de $p\\Rightarrow q$ y $\\neg p$ no se deduce $\\neg q$.' },
    ];
    const pool = level === 1 ? cases.slice(0, 2) : level === 2 ? cases.slice(0, 3) : cases;
    const c = rng.pick(pool);
    const { options, correct } = choices(rng, c.answer, c.wrong);
    return {
      prompt: `Premisas:\n- ${c.premises.join('\n- ')}\n\n¿Qué conclusión es válida?`,
      answer: { kind: 'choice', options, correct },
      hints: [
        R`Modus Ponens: $p\Rightarrow q,\ p \vdash q$. Modus Tollens: $p\Rightarrow q,\ \neg q \vdash \neg p$. Cuidado con las falacias: afirmar el consecuente o negar el antecedente no permiten concluir.`,
        'Escribe las premisas en forma simbólica e identifica qué regla encaja.',
        c.rule,
      ],
      solution: [{ note: c.rule }],
      expectedSeconds: 35,
    };
  },
};

// ---------------------------------------------------------------------------
// Conjuntos
// ---------------------------------------------------------------------------

const setTex = (xs: (number | string)[]) => (xs.length ? R`\{${xs.join(',\ ')}\}` : R`\emptyset`);
const sortNums = (xs: number[]) => [...xs].sort((a, b) => a - b);

const membership: Generator = {
  id: 'sets.membership', skillId: 'sets.basics', title: 'Pertenencia e inclusión', levels: [1, 2],
  generate(rng, level) {
    const A = sortNums(rng.sample([1, 2, 3, 4, 5, 6, 7, 8, 9], 5));
    const isSub = rng.bool();
    const B = isSub ? sortNums(rng.sample(A, 2)) : sortNums([rng.pick(A), rng.pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => !A.includes(x)))]);
    const inA = rng.pick(A);
    const notInA = rng.pick([10, 11, 12, ...[1, 2, 3, 4, 5, 6, 7, 8, 9].filter((x) => !A.includes(x))]);
    const statements: { s: string; v: boolean; why: string }[] = [
      { s: R`${inA} \in A`, v: true, why: `${inA} es un elemento de A.` },
      { s: R`${notInA} \in A`, v: false, why: `${notInA} no aparece en A.` },
      { s: R`${notInA} \notin A`, v: true, why: `${notInA} no aparece en A.` },
      { s: R`B \subseteq A`, v: isSub, why: isSub ? 'Todos los elementos de B están en A.' : 'B tiene un elemento que no está en A.' },
      { s: R`\{${inA}\} \subseteq A`, v: true, why: `El conjunto {${inA}} tiene un único elemento y está en A.` },
    ];
    if (level === 2) {
      statements.push(
        { s: R`\emptyset \subseteq A`, v: true, why: 'El conjunto vacío está incluido en todo conjunto.' },
        { s: R`A \subseteq A`, v: true, why: 'Todo conjunto está incluido en sí mismo.' },
        { s: R`\{${inA}\} \in A`, v: false, why: `Los elementos de A son números, no conjuntos: lo correcto es ${inA} ∈ A o {${inA}} ⊆ A.` },
      );
    }
    const st = rng.pick(statements);
    return {
      prompt: R`Sean $A = ${setTex(A)}$ y $B = ${setTex(B)}$. ¿Es verdadera la afirmación $${st.s}$?`,
      answer: { kind: 'truefalse', correct: st.v },
      hints: [
        R`$\in$ se usa entre un elemento y un conjunto; $\subseteq$ entre dos conjuntos.`,
        'Revisa elemento por elemento.',
        st.why,
      ],
      solution: [{ note: st.why }],
      expectedSeconds: 20,
    };
  },
};

const extension: Generator = {
  id: 'sets.extension', skillId: 'sets.basics', title: 'De comprensión a extensión', levels: [1, 2, 3],
  generate(rng, level) {
    type Def = { tex: string; els: number[]; hint: string };
    const k = rng.int(5, 9);
    const n12 = rng.pick([12, 18, 20, 24, 30]);
    const a = rng.int(2, 4);
    const b = rng.int(2, 5);
    const sq = rng.pick([10, 17, 26]);
    const defs: Def[][] = [
      [
        { tex: R`\{x \in \mathbb{N} : x < ${k}\}`, els: range(1, k - 1), hint: `Los naturales menores que ${k}.` },
        { tex: R`\{x \in \mathbb{N} : x \le ${k} \land x \text{ es par}\}`, els: range(1, k).filter((x) => x % 2 === 0), hint: 'Los pares hasta ese número.' },
      ],
      [
        { tex: R`\{x \in \mathbb{Z} : -${a} \le x < ${b}\}`, els: range(-a, b - 1), hint: `Los enteros desde −${a} (incluido) hasta ${b} (excluido).` },
        { tex: R`\{x \in \mathbb{N} : x \text{ divide a } ${n12}\}`, els: divisors(n12), hint: `Los divisores de ${n12}.` },
      ],
      [
        { tex: R`\{x \in \mathbb{Z} : x^2 < ${sq}\}`, els: range(-Math.floor(Math.sqrt(sq - 1)), Math.floor(Math.sqrt(sq - 1))), hint: `Los enteros cuyo cuadrado es menor que ${sq}.` },
        { tex: R`\{x \in \mathbb{N} : x \text{ es primo} \land x < ${k + 10}\}`, els: range(2, k + 9).filter(isPrime), hint: 'Los primos menores que ese número.' },
      ],
    ];
    const d = rng.pick(defs[level - 1]);
    return {
      prompt: R`Escribe por extensión el conjunto $${d.tex}$. (Consideramos $\mathbb{N} = \{1, 2, 3, \dots\}$.)`,
      answer: { kind: 'set', elements: d.els.map(String) },
      hints: [
        'Por extensión significa listar todos los elementos entre llaves, separados por comas.',
        d.hint,
        R`El conjunto es $${setTex(d.els)}$.`,
      ],
      solution: [{ math: setTex(d.els) }],
      expectedSeconds: 40 + 15 * level,
    };
  },
};

function range(a: number, b: number): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i++) out.push(i);
  return out;
}

const subsetsCount: Generator = {
  id: 'sets.subsets', skillId: 'sets.basics', title: 'Cantidad de subconjuntos', levels: [1, 2],
  generate(rng, level) {
    const nEl = rng.int(2, level === 1 ? 4 : 6);
    const els = rng.sample(['a', 'b', 'c', 'd', 'e', 'f', 'g'], nEl).sort();
    const proper = level === 2 && rng.bool();
    const value = 2 ** nEl - (proper ? 1 : 0);
    return {
      prompt: R`¿Cuántos subconjuntos ${proper ? 'propios ' : ''}tiene $A = ${setTex(els)}$?${proper ? ' (Un subconjunto propio es distinto de $A$.)' : ''}`,
      answer: { kind: 'numeric', value },
      hints: [
        R`Un conjunto de $n$ elementos tiene $2^n$ subconjuntos (incluyendo $\emptyset$ y el propio conjunto).`,
        `A tiene ${nEl} elementos.`,
        R`$2^{${nEl}} = ${2 ** nEl}$${proper ? `; sin contar al propio $A$: $${value}$` : ''}.`,
      ],
      solution: [{ math: R`2^{${nEl}}${proper ? ' - 1' : ''} = ${value}` }],
      expectedSeconds: 25,
    };
  },
};

const setOps: Generator = {
  id: 'sets.ops', skillId: 'sets.operations', title: 'Operaciones con conjuntos', levels: [1, 2, 3],
  errorTags: ['set.diff-order', 'set.op-swap', 'set.demorgan'],
  generate(rng, level) {
    const U = range(1, 10);
    const A = sortNums(rng.sample(U, 5));
    const B = sortNums([...rng.sample(A, 2), ...rng.sample(U.filter((x) => !A.includes(x)), rng.int(2, 3))]);
    const Au = sym('A'), Bu = sym('B');
    const exprs: Node[][] = [
      [setop('union', Au, Bu), setop('inter', Au, Bu)],
      [setop('diff', Au, Bu), setop('diff', Bu, Au), compl(Au), compl(Bu)],
      [compl(setop('union', Au, Bu)), setop('inter', Au, compl(Bu)), setop('symdiff', Au, Bu), compl(setop('inter', Au, Bu))],
    ];
    const e = rng.pick(exprs[level - 1]);
    const inA = new Set(A.map(String));
    const inB = new Set(B.map(String));
    const res = U.filter((x) => evalMembership(e, { A: inA.has(String(x)), B: inB.has(String(x)) }));
    return {
      prompt: R`Sean $U = \{1, 2, \dots, 10\}$, $A = ${setTex(A)}$ y $B = ${setTex(B)}$. Calcula $${L(e)}$.`,
      visual: level === 1 ? { type: 'venn', sets: ['A', 'B'], elements: vennElements(U, A, B) } : undefined,
      answer: { kind: 'set', elements: res.map(String) },
      hints: [
        R`$A\cup B$: en A o en B. $A\cap B$: en ambos. $A-B$: en A pero no en B. $A^c$: en U pero no en A. $A\triangle B$: en uno solo de los dos.`,
        'Recorre los números del 1 al 10 y decide para cada uno si cumple la condición.',
        R`El resultado es $${setTex(res)}$.`,
      ],
      solution: [{ math: R`${L(e)} = ${setTex(res)}` }],
      expectedSeconds: 40 + 20 * level,
    };
  },
};

function vennElements(U: number[], A: number[], B: number[]): Record<string, string[]> {
  const out: Record<string, string[]> = { A: [], B: [], AB: [], '': [] };
  for (const x of U) {
    const a = A.includes(x), b = B.includes(x);
    const key = (a ? 'A' : '') + (b ? 'B' : '');
    out[key].push(String(x));
  }
  return out;
}

const vennShade: Generator = {
  id: 'sets.venn', skillId: 'sets.operations', title: 'Sombrear en el diagrama de Venn', levels: [1, 2, 3],
  errorTags: ['set.demorgan', 'set.diff-order', 'set.op-swap'],
  generate(rng, level) {
    const pools = [
      ['A ∪ B', 'A ∩ B', 'A - B', 'B - A'],
      ["(A ∪ B)'", "A' ∩ B", "(A ∩ B)'", 'A \\triangle B'],
      ['A ∩ B ∩ C', '(A ∪ B) - C', 'A ∩ (B ∪ C)', "(A ∩ B)' ∩ C", 'A - (B ∪ C)', '(A ∩ B) ∪ (A ∩ C)'],
    ];
    const src = rng.pick(pools[level - 1]);
    const node = parse(src, { mode: 'set' });
    const sets = level === 3 ? ['A', 'B', 'C'] : ['A', 'B'];
    return {
      prompt: R`Sombrea en el diagrama la región que representa $${L(node)}$.`,
      answer: { kind: 'venn', sets, target: src },
      hints: [
        R`Unión: todo lo de ambos conjuntos. Intersección: solo lo común. Diferencia $A-B$: lo de $A$ que no está en $B$. Complemento: lo que queda fuera.`,
        'Analiza región por región: ¿un elemento de esa región pertenece a la expresión?',
        `Pista final: ${describeRegions(node, sets)}.`,
      ],
      solution: [{ note: describeRegions(node, sets) }],
      expectedSeconds: 30 + 15 * level,
    };
  },
};

function describeRegions(node: Node, sets: string[]): string {
  const regs = assignments(sets).filter((r) => evalMembership(node, r));
  const desc = regs.map((r) => {
    const ins = sets.filter((s) => r[s]);
    if (!ins.length) return 'fuera de todos los conjuntos';
    if (ins.length === sets.length) return sets.length === 2 ? 'la intersección de A y B' : 'la zona común a los tres';
    return `la parte que está solo en ${ins.join(' y ')}`;
  });
  return `hay que sombrear ${regs.length} ${regs.length === 1 ? 'región' : 'regiones'}: ${desc.join('; ')}`;
}

const setCount: Generator = {
  id: 'sets.count', skillId: 'sets.operations', title: 'Problemas de conteo con Venn', levels: [1, 2, 3],
  generate(rng, level) {
    const both = rng.int(3, 10);
    const onlyA = rng.int(4, 15);
    const onlyB = rng.int(4, 15);
    const none = rng.int(2, 10);
    const total = both + onlyA + onlyB + none;
    const a = onlyA + both;
    const b = onlyB + both;
    const [x, y] = rng.pick([['fútbol', 'vóley'], ['inglés', 'francés'], ['Matemática', 'Física']]);
    const questions = [
      { q: `¿Cuántos practican ${x} o ${y} (al menos uno)?`, v: onlyA + onlyB + both, lv: 1, how: R`$|A\cup B| = |A| + |B| - |A\cap B| = ${a} + ${b} - ${both} = ${onlyA + onlyB + both}$` },
      { q: `¿Cuántos practican solo ${x}?`, v: onlyA, lv: 1, how: R`$|A - B| = |A| - |A\cap B| = ${a} - ${both} = ${onlyA}$` },
      { q: `¿Cuántos no practican ninguno?`, v: none, lv: 2, how: R`$${total} - |A\cup B| = ${total} - ${onlyA + onlyB + both} = ${none}$` },
      { q: `¿Cuántos practican exactamente uno de los dos?`, v: onlyA + onlyB, lv: 3, how: R`$(${a} - ${both}) + (${b} - ${both}) = ${onlyA + onlyB}$` },
    ].filter((qq) => qq.lv <= level);
    const Q = rng.pick(questions);
    return {
      prompt: `En un grupo de ${total} estudiantes, ${a} practican ${x}, ${b} practican ${y} y ${both} practican ambos. ${Q.q}`,
      answer: { kind: 'numeric', value: Q.v },
      hints: [
        R`Principio de inclusión-exclusión: $|A\cup B| = |A| + |B| - |A\cap B|$. Conviene dibujar el diagrama de Venn.`,
        `Empieza por la intersección (${both}) y completa cada región del diagrama.`,
        Q.how,
      ],
      solution: [{ note: Q.how }],
      expectedSeconds: 60,
    };
  },
};

// ---------------------------------------------------------------------------
// Cuantificadores
// ---------------------------------------------------------------------------

type Pred = { tex: (v: string) => string; neg: (v: string) => string; f: (x: number) => boolean };

function randomPred(rng: Rng): Pred {
  const k = rng.int(1, 12);
  const m = rng.pick([2, 3]);
  const preds: Pred[] = [
    { tex: (v) => R`${v}^2 > ${k}`, neg: (v) => R`${v}^2 \le ${k}`, f: (x) => x * x > k },
    { tex: (v) => R`${v} + ${m} < ${k}`, neg: (v) => R`${v} + ${m} \ge ${k}`, f: (x) => x + m < k },
    { tex: (v) => R`${v} \text{ es múltiplo de } ${m}`, neg: (v) => R`${v} \text{ no es múltiplo de } ${m}`, f: (x) => x % m === 0 },
    { tex: (v) => R`2${v} - 1 > ${k}`, neg: (v) => R`2${v} - 1 \le ${k}`, f: (x) => 2 * x - 1 > k },
    { tex: (v) => R`${v} \le ${k}`, neg: (v) => R`${v} > ${k}`, f: (x) => x <= k },
  ];
  return rng.pick(preds);
}

const quantTruth: Generator = {
  id: 'quant.truth', skillId: 'logic.quantifiers', title: 'Valor de verdad con cuantificadores', levels: [1, 2],
  generate(rng) {
    const D = sortNums(rng.sample(range(1, 9), rng.int(4, 6)));
    const P = randomPred(rng);
    const universal = rng.bool();
    const vals = D.map(P.f);
    const value = universal ? vals.every(Boolean) : vals.some(Boolean);
    const witness = universal ? D.find((x) => !P.f(x)) : D.find((x) => P.f(x));
    const why = universal
      ? value ? 'Todos los elementos de D cumplen la condición.' : `Falla para x = ${witness}: es un contraejemplo.`
      : value ? `Basta con x = ${witness}, que la cumple.` : 'Ningún elemento de D la cumple.';
    return {
      prompt: R`Sea $D = ${setTex(D)}$. ¿Es verdadera la proposición $${universal ? R`\forall` : R`\exists`} x \in D: ${P.tex('x')}$?`,
      answer: { kind: 'truefalse', correct: value },
      hints: [
        R`$\forall$ exige que **todos** cumplan (un contraejemplo la hace falsa); $\exists$ exige que **al menos uno** cumpla.`,
        'Prueba la condición con cada elemento de D.',
        why,
      ],
      solution: [{ note: why }],
      expectedSeconds: 30,
    };
  },
};

const SENTENCES = [
  { s: 'Todos los alumnos aprobaron.', neg: 'Algún alumno no aprobó.', wrong: ['Ningún alumno aprobó.', 'Todos los alumnos desaprobaron.', 'Algún alumno aprobó.'] },
  { s: 'Algún número primo es par.', neg: 'Ningún número primo es par.', wrong: ['Algún número primo es impar.', 'Todos los números primos son pares.', 'Algún número primo no es par.'] },
  { s: 'Todos los días llueve.', neg: 'Hay al menos un día en que no llueve.', wrong: ['Nunca llueve.', 'Todos los días no llueve.', 'Algún día llueve.'] },
  { s: 'Existe un triángulo con dos ángulos rectos.', neg: 'Ningún triángulo tiene dos ángulos rectos.', wrong: ['Existe un triángulo sin ángulos rectos.', 'Todos los triángulos tienen dos ángulos rectos.', 'Existe un triángulo que no tiene dos ángulos rectos.'] },
];

const quantNegation: Generator = {
  id: 'quant.negation', skillId: 'logic.quantifiers', title: 'Negar proposiciones cuantificadas', levels: [1, 2],
  generate(rng, level) {
    if (level === 1 || rng.bool(0.4)) {
      const s = rng.pick(SENTENCES);
      const { options, correct } = choices(rng, s.neg, s.wrong);
      return {
        prompt: `¿Cuál es la negación de «${s.s}»?`,
        answer: { kind: 'choice', options, correct },
        hints: [
          R`$\neg(\forall x: P(x)) \equiv \exists x: \neg P(x)$ y $\neg(\exists x: P(x)) \equiv \forall x: \neg P(x)$.`,
          '«Todos» se convierte en «alguno… no»; «alguno» se convierte en «ninguno».',
          `La negación es: «${s.neg}».`,
        ],
        solution: [{ note: s.neg }],
        expectedSeconds: 25,
      };
    }
    const P = randomPred(rng);
    const universal = rng.bool();
    const q = universal ? R`\forall` : R`\exists`;
    const nq = universal ? R`\exists` : R`\forall`;
    const correct = `$${nq} x: ${P.neg('x')}$`;
    const wrong = [`$${q} x: ${P.neg('x')}$`, `$${nq} x: ${P.tex('x')}$`, `$${q} x: ${P.tex('x')}$`];
    const { options, correct: ci } = choices(rng, correct, wrong);
    return {
      prompt: R`¿Cuál es la negación de $${q} x: ${P.tex('x')}$?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: [
        R`Al negar, el cuantificador cambia ($\forall \leftrightarrow \exists$) y se niega la condición.`,
        R`Cambia primero el cuantificador y después niega la relación (por ejemplo, $>$ pasa a $\le$).`,
        `La negación es ${correct}.`,
      ],
      solution: [{ math: R`\neg\left(${q} x: ${P.tex('x')}\right) \equiv ${nq} x: ${P.neg('x')}` }],
      expectedSeconds: 30,
    };
  },
};

// ---------------------------------------------------------------------------
// Demostraciones
// ---------------------------------------------------------------------------

const METHODS = ['Demostración directa', 'Reducción al absurdo', 'Contraejemplo', 'Inducción matemática'];
const PROOFS: { text: string; m: number }[] = [
  { text: R`Para probar que «si $n$ es par, entonces $n^2$ es par», se escribe $n = 2k$ y se calcula $n^2 = 4k^2 = 2(2k^2)$, que es par.`, m: 0 },
  { text: R`Para probar que $\sqrt{2}$ es irracional, se supone que $\sqrt{2} = \frac{a}{b}$ con la fracción irreducible y se llega a que $a$ y $b$ son ambos pares, lo cual es imposible.`, m: 1 },
  { text: R`Para refutar «todo número impar es primo» se muestra el número 9, que es impar y no es primo.`, m: 2 },
  { text: R`Para probar que $1 + 3 + \dots + (2n-1) = n^2$ se verifica para $n = 1$ y luego se muestra que si vale para $k$, vale para $k+1$.`, m: 3 },
  { text: R`Para probar que hay infinitos primos, se supone que hay finitos, se los multiplica y se suma 1, obteniendo un número que no es divisible por ninguno de ellos: contradicción.`, m: 1 },
  { text: R`Para probar que la suma de dos pares es par se escribe $2a + 2b = 2(a+b)$.`, m: 0 },
  { text: R`Para mostrar que «$x^2 > x$ para todo real $x$» es falso, se toma $x = \frac{1}{2}$: $\frac14 > \frac12$ es falso.`, m: 2 },
  { text: R`Para probar que $2^n > n$ para todo $n \ge 1$, se verifica $2^1 > 1$ y se muestra que $2^k > k$ implica $2^{k+1} > k + 1$.`, m: 3 },
];

const proofMethod: Generator = {
  id: 'proofs.method', skillId: 'logic.proofs', title: 'Identificar el método de demostración', levels: [1, 2],
  generate(rng) {
    const p = rng.pick(PROOFS);
    return {
      prompt: `¿Qué método de demostración se usa?\n\n${p.text}`,
      answer: { kind: 'choice', options: METHODS, correct: p.m },
      hints: [
        'Directa: se parte de la hipótesis. Absurdo: se supone lo contrario. Contraejemplo: un caso concreto que refuta. Inducción: caso base + paso inductivo.',
        '¿Se supone algo contrario a lo que se quiere probar? ¿Se muestra un solo caso? ¿Hay un «caso base»?',
        `Es ${METHODS[p.m].toLowerCase()}.`,
      ],
      solution: [{ note: METHODS[p.m] }],
      expectedSeconds: 30,
    };
  },
};

const COUNTEREXAMPLES: { claim: string; check: (v: number) => boolean; hint: string; example: string }[] = [
  { claim: 'Todo número primo es impar.', check: (v) => isPrime(v) && v % 2 === 0, hint: 'Piensa en el primo más pequeño.', example: '2' },
  { claim: R`Para todo número natural $n$, $n^2 + n + 41$ es primo.`, check: (v) => Number.isInteger(v) && v >= 1 && !isPrime(v * v + v + 41), hint: R`Prueba con un $n$ que haga que $n^2+n+41$ tenga un factor evidente, como $n = 41$ o $n = 40$.`, example: '40' },
  { claim: R`Para todo número real $x$, $x^2 > x$.`, check: (v) => v * v <= v, hint: 'Prueba con números entre 0 y 1.', example: '0,5' },
  { claim: 'Todo múltiplo de 4 es múltiplo de 8.', check: (v) => Number.isInteger(v) && v !== 0 && v % 4 === 0 && v % 8 !== 0, hint: 'Prueba con los primeros múltiplos de 4.', example: '4' },
  { claim: R`Para todo natural $n$, $2^n > n^2$.`, check: (v) => Number.isInteger(v) && v >= 1 && 2 ** v <= v * v, hint: 'Prueba con valores pequeños de n.', example: '2' },
  { claim: 'Todo número natural mayor que 1 es primo o es par.', check: (v) => Number.isInteger(v) && v > 1 && !isPrime(v) && v % 2 === 1, hint: 'Busca un impar que no sea primo.', example: '9' },
  { claim: R`Para todo número real $x$, $\sqrt{x^2} = x$.`, check: (v) => v < 0, hint: 'Prueba con un número negativo.', example: '-3' },
  { claim: 'Todo múltiplo de 3 es impar.', check: (v) => Number.isInteger(v) && v !== 0 && v % 3 === 0 && v % 2 === 0, hint: 'Busca un múltiplo de 3 que sea par.', example: '6' },
];

const counterexample: Generator = {
  id: 'proofs.counterexample', skillId: 'logic.proofs', title: 'Encontrar un contraejemplo', levels: [1, 2],
  generate(rng) {
    const c = rng.pick(COUNTEREXAMPLES);
    return {
      prompt: `La siguiente afirmación es falsa: «${c.claim}» Escribe un número que sirva como contraejemplo.`,
      answer: { kind: 'predicate', check: c.check, describe: `Por ejemplo, ${c.example}.` },
      hints: [
        'Un contraejemplo es un caso concreto que cumple las hipótesis pero no la conclusión.',
        c.hint,
        `Por ejemplo, ${c.example} funciona.`,
      ],
      solution: [{ note: `Un contraejemplo posible: ${c.example}.` }],
      expectedSeconds: 45,
    };
  },
};

const INDUCTIONS = [
  { sum: R`1 + 2 + \dots + n`, rhs: (k: string) => R`\frac{${k}(${k}+1)}{2}`, next: R`\frac{(k+1)(k+2)}{2}`, term: R`(k+1)` },
  { sum: R`1 + 3 + \dots + (2n-1)`, rhs: (k: string) => R`${k}^2`, next: R`(k+1)^2`, term: R`(2k+1)` },
  { sum: R`1 + 2 + 4 + \dots + 2^{n-1}`, rhs: (k: string) => R`2^{${k}} - 1`, next: R`2^{k+1} - 1`, term: R`2^{k}` },
];

const induction: Generator = {
  id: 'proofs.induction', skillId: 'logic.proofs', title: 'El paso inductivo', levels: [2, 3],
  generate(rng) {
    const f = rng.pick(INDUCTIONS);
    const sumK = f.sum.replace('n', 'k').replace('(2n-1)', '(2k-1)').replace('2^{n-1}', '2^{k-1}');
    const correct = R`Si $${sumK} = ${f.rhs('k')}$, entonces $${sumK} + ${f.term} = ${f.next}$.`;
    const wrong = [
      R`Que la fórmula vale para $n = 1$.`,
      R`Que la fórmula vale para $n = k$.`,
      R`Que $${f.rhs('k')} = ${f.next}$.`,
    ];
    const { options, correct: ci } = choices(rng, correct, wrong);
    return {
      prompt: R`Se quiere demostrar por inducción que $${f.sum} = ${f.rhs('n')}$. ¿Qué hay que probar en el **paso inductivo**?`,
      answer: { kind: 'choice', options, correct: ci },
      hints: [
        R`Inducción: (1) caso base, (2) paso inductivo: suponer que vale para $k$ (hipótesis inductiva) y probar que vale para $k+1$.`,
        'El caso base es otra parte de la demostración; el paso inductivo es una implicación.',
        `Hay que probar: ${correct}`,
      ],
      solution: [{ note: correct }],
      expectedSeconds: 40,
    };
  },
};

// ---------------------------------------------------------------------------
// Álgebra de Boole
// ---------------------------------------------------------------------------

function randomCircuit(rng: Rng, level: number): Node {
  const vars = level === 1 ? ['A', 'B'] : ['A', 'B', 'C'];
  return formulaWithAllVars(rng, vars, level === 1 ? 1 : 2, ['and', 'or', 'xor']);
}

const boolTex = (n: Node) => toLatex(n, { boolAlgebra: true, boolStyle: '10' });

const circuitEval: Generator = {
  id: 'bool.eval', skillId: 'logic.boolean', title: 'Salida de un circuito lógico', levels: [1, 2, 3],
  generate(rng, level) {
    const f = randomCircuit(rng, level);
    const vars = [...freeVars(f)].sort();
    const env: Record<string, boolean> = {};
    vars.forEach((v) => (env[v] = rng.bool()));
    const out = evalBool(f, env);
    const inputs = vars.map((v) => `$${v} = ${env[v] ? 1 : 0}$`).join(', ');
    const chain = subformulas(f).map((s) => `$${boolTex(s)} = ${evalBool(s, env) ? 1 : 0}$`).join(' → ');
    return {
      prompt: `Con las entradas ${inputs}, ¿cuál es la salida del circuito $${boolTex(f)}$?`,
      visual: { type: 'circuit', expr: toText(f), inputs: env },
      answer: { kind: 'choice', options: ['0', '1'], correct: out ? 1 : 0 },
      hints: [
        'AND da 1 si ambas entradas son 1; OR da 1 si alguna es 1; XOR da 1 si son distintas; NOT invierte.',
        'Calcula la salida de cada compuerta empezando por las que reciben directamente las entradas.',
        chain,
      ],
      solution: subformulas(f).map((s) => ({ math: R`${boolTex(s)} = ${evalBool(s, env) ? 1 : 0}` })),
      expectedSeconds: 30 + 15 * level,
    };
  },
};

const circuitTable: Generator = {
  id: 'bool.table', skillId: 'logic.boolean', title: 'Tabla de un circuito', levels: [1, 2],
  generate(rng, level) {
    const f = randomCircuit(rng, level);
    const vars = [...freeVars(f)].sort();
    const cols = subformulas(f);
    const rows = assignments(vars);
    return {
      prompt: R`Completa la tabla del circuito $${boolTex(f)}$ (1 = encendido, 0 = apagado).`,
      visual: { type: 'circuit', expr: toText(f) },
      answer: { kind: 'truth-table', formula: toText(f), mode: 'bool', vars, columns: cols.map((c) => toText(c)) },
      hints: [
        R`AND ($\cdot$): 1 solo si ambas son 1. OR ($+$): 1 si alguna es 1. XOR ($\oplus$): 1 si son distintas.`,
        `Empieza por la columna $${boolTex(cols[0])}$.`,
        `La columna $${boolTex(cols[0])}$ es: ${rows.map((r) => (evalBool(cols[0], r) ? 1 : 0)).join(', ')}.`,
      ],
      solution: cols.map((c) => ({ math: boolTex(c), note: rows.map((r) => (evalBool(c, r) ? 1 : 0)).join(' ') })),
      expectedSeconds: 90,
    };
  },
};

const BOOL_SIMPLIFY: { from: string; to: string; law: string; wrong: string[] }[] = [
  { from: R`A\cdot B + A\cdot \overline{B}`, to: 'A', law: R`Factor común: $A(B + \overline{B}) = A\cdot 1 = A$.`, wrong: ['B', R`A\cdot B`, '1'] },
  { from: R`A + A\cdot B`, to: 'A', law: R`Absorción: $A + AB = A(1 + B) = A$.`, wrong: ['B', R`A\cdot B`, R`A + B`] },
  { from: R`\overline{\overline{A}}`, to: 'A', law: 'Doble negación.', wrong: [R`\overline{A}`, '0', '1'] },
  { from: R`A\cdot \overline{A}`, to: '0', law: R`Complemento: $A\cdot\overline{A} = 0$.`, wrong: ['1', 'A', R`\overline{A}`] },
  { from: R`A + \overline{A}`, to: '1', law: R`Complemento: $A + \overline{A} = 1$.`, wrong: ['0', 'A', R`\overline{A}`] },
  { from: R`\overline{A + B}`, to: R`\overline{A}\cdot\overline{B}`, law: 'De Morgan.', wrong: [R`\overline{A} + \overline{B}`, R`A\cdot B`, R`\overline{A}\cdot B`] },
  { from: R`(A + B)\cdot(A + \overline{B})`, to: 'A', law: R`Distributiva: $A + B\overline{B} = A + 0 = A$.`, wrong: ['B', '1', R`A + B`] },
];

const boolSimplify: Generator = {
  id: 'bool.simplify', skillId: 'logic.boolean', title: 'Simplificar expresiones booleanas', levels: [2, 3],
  generate(rng) {
    const s = rng.pick(BOOL_SIMPLIFY);
    const { options, correct } = choices(rng, `$${s.to}$`, s.wrong.map((w) => `$${w}$`));
    return {
      prompt: R`Simplifica la expresión booleana $${s.from}$.`,
      answer: { kind: 'choice', options, correct },
      hints: [
        R`Propiedades útiles: $A + \overline{A} = 1$, $A\cdot\overline{A} = 0$, $A + 1 = 1$, $A\cdot 1 = A$, $A + AB = A$, De Morgan.`,
        'Busca un factor común o un par variable/negación.',
        s.law,
      ],
      solution: [{ note: s.law }],
      expectedSeconds: 40,
    };
  },
};

export const LOGIC_GENERATORS: Generator[] = [
  evalConnectives, isProposition, translate,
  truthTableFill, truthTableClassify,
  lawsSimplify, whichLaw, inference,
  membership, extension, subsetsCount,
  setOps, vennShade, setCount,
  quantTruth, quantNegation,
  proofMethod, counterexample, induction,
  circuitEval, circuitTable, boolSimplify,
];
