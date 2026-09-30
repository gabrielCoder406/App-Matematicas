// Biblioteca de errores frecuentes («buggy rules»). Cada regla transforma una
// parte de la línea anterior tal como lo haría un estudiante que comete ese
// error. Si el resultado coincide con lo que escribió, sabemos qué falló.
import type { Node, NodeOf } from './ast';
import { add, div, equalNodes, getAt, logic, mul, neg, not, pow, rel, replaceAt, setop, walk } from './ast';
import { toLatex } from './print';

export type BugId =
  | 'sign.term' | 'sign.side' | 'sign.distribute-neg' | 'sign.product'
  | 'distribute.partial'
  | 'pow.sum' | 'pow.product-exp' | 'pow.power-exp' | 'pow.quotient-exp' | 'pow.base-times-exp' | 'pow.neg-base' | 'pow.neg-exp' | 'pow.partial-product'
  | 'root.sum'
  | 'frac.add-num-den' | 'frac.cancel-terms' | 'frac.reciprocal-sum' | 'frac.div-no-invert' | 'frac.mul-cross'
  | 'eq.coef-subtract' | 'eq.coef-sign' | 'eq.div-instead-mul' | 'eq.mul-instead-div' | 'eq.partial-divide'
  | 'ineq.flip'
  | 'logic.demorgan' | 'logic.demorgan-partial' | 'logic.implication' | 'logic.converse' | 'logic.neg-implication'
  | 'logic.double-neg' | 'logic.distributive' | 'logic.connective-swap'
  | 'set.demorgan' | 'set.diff-order' | 'set.op-swap';

export type MutationMode = 'expression' | 'equation' | 'inequality' | 'logic' | 'set';

export interface Mutation {
  bug: BugId;
  /** Línea anterior con el error aplicado. */
  mutated: Node;
  /** Parte de la línea anterior donde se aplicó. */
  at: Node;
  message: string;
}

interface Rule {
  bug: BugId;
  modes: MutationMode[];
  /** 'root' reglas que miran la relación completa (ecuaciones, inecuaciones). */
  scope?: 'root';
  candidates(n: Node): Node[];
  message(at: Node, mode: MutationMode): string;
}

const L = (n: Node) => `$${toLatex(n)}$`;
const isNegLike = (n: Node) => n.type === 'neg' || (n.type === 'num' && n.value < 0);
const numVal = (n: Node): number | null => {
  if (n.type === 'num') return n.value;
  if (n.type === 'neg' && n.arg.type === 'num') return -n.arg.value;
  return null;
};
const negate = (n: Node): Node => (n.type === 'neg' ? n.arg : neg(n));
const ALG: MutationMode[] = ['expression', 'equation', 'inequality'];

function sameBase(a: Node, b: Node): Node | null {
  const ba = a.type === 'pow' ? a.base : a;
  const bb = b.type === 'pow' ? b.base : b;
  if (ba.type === 'num') return null;
  return equalNodes(ba, bb) ? ba : null;
}
const expOf = (n: Node): Node => (n.type === 'pow' ? n.exp : { type: 'num', value: 1 });

/** Separa «coeficiente numérico · resto» en un término. */
function splitCoef(n: Node): { k: number; rest: Node } | null {
  if (n.type === 'mul' && n.factors.length >= 2) {
    const k = numVal(n.factors[0]);
    if (k !== null && k !== 0 && k !== 1) {
      const rest = n.factors.length === 2 ? n.factors[1] : mul(...n.factors.slice(1));
      return { k, rest };
    }
  }
  if (n.type === 'neg') {
    const inner = splitCoef(n.arg);
    if (inner) return { k: -inner.k, rest: inner.rest };
    if (n.arg.type === 'sym') return { k: -1, rest: n.arg };
  }
  return null;
}

const RULES: Rule[] = [
  // ------------------------- Ecuaciones (reglas de raíz) -------------------------
  {
    bug: 'eq.coef-subtract', modes: ['equation', 'inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const out: Node[] = [];
      const l = splitCoef(n.left);
      if (l) out.push(rel(n.op, l.rest, add(n.right, neg({ type: 'num', value: Math.abs(l.k) }))));
      const r = splitCoef(n.right);
      if (r) out.push(rel(n.op, add(n.left, neg({ type: 'num', value: Math.abs(r.k) })), r.rest));
      return out;
    },
    message: (at) => `El número que multiplica a la incógnita pasa al otro miembro dividiendo, no restando. Revisa ${L(at)}.`,
  },
  {
    bug: 'eq.coef-sign', modes: ['equation'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const out: Node[] = [];
      const l = splitCoef(n.left);
      if (l && l.k < 0) out.push(rel(n.op, l.rest, div(n.right, { type: 'num', value: -l.k })));
      const r = splitCoef(n.right);
      if (r && r.k < 0) out.push(rel(n.op, div(n.left, { type: 'num', value: -r.k }), r.rest));
      return out;
    },
    message: () => 'Al dividir por un número negativo, el resultado cambia de signo. Revisa el signo del coeficiente.',
  },
  {
    bug: 'eq.div-instead-mul', modes: ['equation', 'inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const out: Node[] = [];
      if (n.left.type === 'div' && numVal(n.left.den) !== null) out.push(rel(n.op, n.left.num, div(n.right, n.left.den)));
      if (n.right.type === 'div' && numVal(n.right.den) !== null) out.push(rel(n.op, div(n.left, n.right.den), n.right.num));
      return out;
    },
    message: () => 'Lo que está dividiendo pasa al otro miembro multiplicando.',
  },
  {
    bug: 'eq.mul-instead-div', modes: ['equation', 'inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const out: Node[] = [];
      const l = splitCoef(n.left);
      if (l) out.push(rel(n.op, l.rest, mul(n.right, { type: 'num', value: l.k })));
      const r = splitCoef(n.right);
      if (r) out.push(rel(n.op, mul(n.left, { type: 'num', value: r.k }), r.rest));
      return out;
    },
    message: () => 'Lo que está multiplicando pasa al otro miembro dividiendo.',
  },
  {
    bug: 'eq.partial-divide', modes: ['equation', 'inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const out: Node[] = [];
      const sides: [Node, Node, boolean][] = [[n.left, n.right, true], [n.right, n.left, false]];
      for (const [side, other, isLeft] of sides) {
        if (side.type !== 'add') continue;
        side.terms.forEach((t, i) => {
          const c = splitCoef(t);
          if (!c) return;
          const terms = side.terms.slice();
          terms[i] = c.k < 0 ? neg(c.rest) : c.rest;
          const newSide = add(...terms);
          const newOther = div(other, { type: 'num', value: Math.abs(c.k) });
          out.push(isLeft ? rel(n.op, newSide, newOther) : rel(n.op, newOther, newSide));
        });
      }
      return out;
    },
    message: () => 'Si divides un miembro por un número, tienes que dividir todos sus términos (no solo el que tiene la incógnita).',
  },
  {
    bug: 'ineq.flip', modes: ['inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      const flip: Record<string, NodeOf<'rel'>['op']> = { '<': '>', '>': '<', '<=': '>=', '>=': '<=' };
      return flip[n.op] ? [rel(flip[n.op], n.left, n.right)] : [];
    },
    message: () => 'Al multiplicar o dividir ambos miembros por un número negativo, la desigualdad cambia de sentido.',
  },
  {
    bug: 'sign.side', modes: ['equation', 'inequality'], scope: 'root',
    candidates(n) {
      if (n.type !== 'rel') return [];
      return [rel(n.op, negate(n.left), n.right), rel(n.op, n.left, negate(n.right))];
    },
    message: (at) => `Hay un error de signo al despejar. Revisa ${L(at)}.`,
  },

  // ------------------------- Signos y distributiva -------------------------
  {
    bug: 'sign.distribute-neg', modes: ALG,
    candidates(n) {
      if (n.type === 'neg' && n.arg.type === 'add') {
        const [first, ...rest] = n.arg.terms;
        return [add(negate(first), ...rest)];
      }
      if (n.type === 'mul') {
        const out: Node[] = [];
        const k = numVal(n.factors[0]);
        if (k !== null && k < 0) {
          n.factors.forEach((f, j) => {
            if (j === 0 || f.type !== 'add') return;
            const others = n.factors.filter((_, i) => i !== j);
            const [first, ...rest] = f.terms;
            out.push(add(mul(...others, first), ...rest));
          });
        }
        return out;
      }
      return [];
    },
    message: (at) => `El signo menos delante del paréntesis cambia el signo de todos los términos de adentro. Revisa ${L(at)}.`,
  },
  {
    bug: 'distribute.partial', modes: ALG,
    candidates(n) {
      const out: Node[] = [];
      if (n.type === 'mul' && n.factors.length >= 2) {
        n.factors.forEach((f, j) => {
          if (f.type !== 'add') return;
          const others = n.factors.filter((_, i) => i !== j);
          const [first, ...rest] = f.terms;
          out.push(add(mul(...others, first), ...rest));
          if (rest.length) out.push(add(...f.terms.slice(0, -1), mul(...others, f.terms[f.terms.length - 1])));
        });
      }
      if (n.type === 'div' && n.num.type === 'add') {
        const [first, ...rest] = n.num.terms;
        out.push(add(div(first, n.den), ...rest));
      }
      return out;
    },
    message: (at) => `La propiedad distributiva se aplica a todos los términos: $k(a+b) = ka + kb$. Revisa ${L(at)}.`,
  },

  // ------------------------- Potencias y raíces -------------------------
  {
    bug: 'pow.sum', modes: ALG,
    candidates(n) {
      if (n.type !== 'pow' || n.base.type !== 'add') return [];
      const e = numVal(n.exp);
      if (e === null || !Number.isInteger(e) || e < 2) return [];
      const terms = n.base.terms;
      return [
        add(...terms.map((t) => pow(t, n.exp))),
        add(...terms.map((t) => (t.type === 'neg' ? neg(pow(t.arg, n.exp)) : pow(t, n.exp)))),
      ];
    },
    message: (at) => `La potencia no se distribuye sobre una suma: $(a+b)^2 = a^2 + 2ab + b^2$. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.product-exp', modes: ALG,
    candidates(n) {
      if (n.type !== 'mul') return [];
      const out: Node[] = [];
      for (let i = 0; i < n.factors.length; i++) {
        for (let j = i + 1; j < n.factors.length; j++) {
          const base = sameBase(n.factors[i], n.factors[j]);
          if (!base) continue;
          const merged = pow(base, mul(expOf(n.factors[i]), expOf(n.factors[j])));
          const rest = n.factors.filter((_, k) => k !== i && k !== j);
          out.push(rest.length ? mul(...rest.slice(0, i), merged, ...rest.slice(i)) : merged);
        }
      }
      return out;
    },
    message: (at) => `Al multiplicar potencias de igual base, los exponentes se suman: $x^a \\cdot x^b = x^{a+b}$. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.power-exp', modes: ALG,
    candidates(n) {
      if (n.type !== 'pow') return [];
      if (n.base.type === 'pow') return [pow(n.base.base, add(n.base.exp, n.exp))];
      if (n.base.type === 'mul') {
        const inner = n.base.factors;
        if (!inner.some((f) => f.type === 'pow')) return [];
        return [mul(...inner.map((f) => (f.type === 'pow' ? pow(f.base, add(f.exp, n.exp)) : pow(f, n.exp))))];
      }
      return [];
    },
    message: (at) => `En una potencia de potencia, los exponentes se multiplican: $(x^a)^b = x^{a\\cdot b}$. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.quotient-exp', modes: ALG,
    candidates(n) {
      if (n.type !== 'div') return [];
      const base = sameBase(n.num, n.den);
      if (!base) return [];
      return [pow(base, div(expOf(n.num), expOf(n.den)))];
    },
    message: (at) => `Al dividir potencias de igual base, los exponentes se restan: $x^a : x^b = x^{a-b}$. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.base-times-exp', modes: ALG,
    candidates(n) {
      if (n.type !== 'pow') return [];
      const b = numVal(n.base);
      const e = numVal(n.exp);
      if (b === null || e === null || !Number.isInteger(e) || e < 2) return [];
      return [{ type: 'num', value: b * e }];
    },
    message: (at) => `Una potencia no es multiplicar la base por el exponente: $2^3 = 2\\cdot 2\\cdot 2 = 8$. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.neg-base', modes: ALG,
    candidates(n) {
      if (n.type === 'neg' && n.arg.type === 'pow') return [pow(neg(n.arg.base), n.arg.exp)];
      if (n.type === 'pow' && n.base.type === 'neg') return [neg(pow(n.base.arg, n.exp))];
      return [];
    },
    message: (at) => `Distingue $-a^n$ de $(-a)^n$: el exponente solo afecta a lo que tiene inmediatamente a su izquierda. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.neg-exp', modes: ALG,
    candidates(n) {
      if (n.type !== 'pow' || !isNegLike(n.exp)) return [];
      const posExp = negate(n.exp);
      return [neg(pow(n.base, posExp)), pow(n.base, posExp), mul(neg(n.base), posExp)];
    },
    message: (at) => `Un exponente negativo significa «inverso»: $a^{-n} = \\frac{1}{a^n}$, no un resultado negativo. Revisa ${L(at)}.`,
  },
  {
    bug: 'pow.partial-product', modes: ALG,
    candidates(n) {
      if (n.type !== 'pow' || n.base.type !== 'mul') return [];
      const fs = n.base.factors;
      return [
        mul(...fs.slice(0, -1), pow(fs[fs.length - 1], n.exp)),
        mul(pow(fs[0], n.exp), ...fs.slice(1)),
      ];
    },
    message: (at) => `El exponente afecta a todos los factores del paréntesis: $(ab)^n = a^n b^n$. Revisa ${L(at)}.`,
  },
  {
    bug: 'root.sum', modes: ALG,
    candidates(n) {
      if (n.type !== 'fn' || (n.name !== 'sqrt' && n.name !== 'root') || n.args[0].type !== 'add') return [];
      const terms = n.args[0].terms;
      const mk = (t: Node): Node => (n.name === 'sqrt' ? { type: 'fn', name: 'sqrt', args: [t] } : { type: 'fn', name: 'root', args: [t, n.args[1]] });
      return [add(...terms.map((t) => (t.type === 'neg' ? neg(mk(t.arg)) : mk(t))))];
    },
    message: (at) => `La raíz no se distribuye sobre una suma: $\\sqrt{a+b} \\neq \\sqrt{a} + \\sqrt{b}$. Revisa ${L(at)}.`,
  },

  // ------------------------- Fracciones -------------------------
  {
    bug: 'frac.add-num-den', modes: ALG,
    candidates(n) {
      if (n.type !== 'add') return [];
      const out: Node[] = [];
      const asFrac = (t: Node): { num: Node; den: Node; sign: number } | null => {
        if (t.type === 'div') return { num: t.num, den: t.den, sign: 1 };
        if (t.type === 'neg' && t.arg.type === 'div') return { num: t.arg.num, den: t.arg.den, sign: -1 };
        return null;
      };
      for (let i = 0; i < n.terms.length; i++) {
        for (let j = i + 1; j < n.terms.length; j++) {
          const a = asFrac(n.terms[i]);
          const b = asFrac(n.terms[j]);
          if (!a || !b) continue;
          const numer = add(a.sign < 0 ? neg(a.num) : a.num, b.sign < 0 ? neg(b.num) : b.num);
          const merged = div(numer, add(a.den, b.den));
          const rest = n.terms.filter((_, k) => k !== i && k !== j);
          out.push(rest.length ? add(merged, ...rest) : merged);
        }
      }
      return out;
    },
    message: () => 'Para sumar o restar fracciones no se suman los denominadores: primero busca un denominador común.',
  },
  {
    bug: 'frac.cancel-terms', modes: ALG,
    candidates(n) {
      if (n.type !== 'div') return [];
      const out: Node[] = [];
      const denFactors = n.den.type === 'mul' ? n.den.factors : [n.den];
      if (n.num.type === 'add') {
        n.num.terms.forEach((t, i) => {
          const tf = t.type === 'mul' ? t.factors : [t];
          denFactors.forEach((d, j) => {
            const matchIdx = tf.findIndex((f) => equalNodes(f, d));
            if (matchIdx === -1) return;
            const newTerm = tf.length === 1 ? ({ type: 'num', value: 1 } as Node) : mul(...tf.filter((_, k) => k !== matchIdx));
            const terms = (n.num as NodeOf<'add'>).terms.slice();
            terms[i] = newTerm;
            const newDen = denFactors.length === 1 ? null : mul(...denFactors.filter((_, k) => k !== j));
            out.push(newDen ? div(add(...terms), newDen) : add(...terms));
            // variante: el término desaparece por completo
            const terms2 = (n.num as NodeOf<'add'>).terms.filter((_, k) => k !== i);
            const rest = add(...terms2);
            out.push(newDen ? div(rest, newDen) : rest);
          });
        });
      }
      return out;
    },
    message: () => 'Solo se pueden simplificar factores comunes, no términos de una suma: $\\frac{a+b}{a} \\neq b$.',
  },
  {
    bug: 'frac.reciprocal-sum', modes: ALG,
    candidates(n) {
      if (n.type !== 'div' || n.den.type !== 'add') return [];
      return [add(...n.den.terms.map((t) => (t.type === 'neg' ? neg(div(n.num, t.arg)) : div(n.num, t))))];
    },
    message: () => 'Una fracción con una suma en el denominador no se separa: $\\frac{1}{a+b} \\neq \\frac{1}{a} + \\frac{1}{b}$.',
  },
  {
    bug: 'frac.div-no-invert', modes: ALG,
    candidates(n) {
      if (n.type !== 'div' || n.num.type !== 'div' || n.den.type !== 'div') return [];
      return [div(mul(n.num.num, n.den.num), mul(n.num.den, n.den.den))];
    },
    message: () => 'Para dividir fracciones se multiplica por la inversa de la segunda: $\\frac{a}{b} : \\frac{c}{d} = \\frac{a\\cdot d}{b\\cdot c}$.',
  },
  {
    bug: 'frac.mul-cross', modes: ALG,
    candidates(n) {
      if (n.type !== 'mul' || n.factors.length !== 2) return [];
      const [a, b] = n.factors;
      if (a.type !== 'div' || b.type !== 'div') return [];
      return [div(mul(a.num, b.den), mul(a.den, b.num))];
    },
    message: () => 'Para multiplicar fracciones se multiplican los numeradores entre sí y los denominadores entre sí.',
  },

  // ------------------------- Lógica -------------------------
  {
    bug: 'logic.demorgan', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'not' || n.arg.type !== 'logic' || (n.arg.op !== 'and' && n.arg.op !== 'or')) return [];
      return [logic(n.arg.op, not(n.arg.left), not(n.arg.right))];
    },
    message: () => 'Ley de De Morgan: al negar una conjunción se obtiene una disyunción (y viceversa): $\\neg(p \\land q) \\equiv \\neg p \\lor \\neg q$.',
  },
  {
    bug: 'logic.demorgan-partial', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'not' || n.arg.type !== 'logic' || (n.arg.op !== 'and' && n.arg.op !== 'or')) return [];
      const other = n.arg.op === 'and' ? 'or' : 'and';
      return [logic(other, not(n.arg.left), n.arg.right), logic(other, n.arg.left, not(n.arg.right))];
    },
    message: () => 'Al aplicar De Morgan hay que negar las dos proposiciones y cambiar el conector.',
  },
  {
    bug: 'logic.neg-implication', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'not' || n.arg.type !== 'logic' || n.arg.op !== 'implies') return [];
      const { left: a, right: b } = n.arg;
      return [logic('implies', not(a), not(b)), logic('implies', a, not(b)), logic('and', not(a), not(b)), logic('and', not(a), b)];
    },
    message: () => 'La negación de una implicación no es otra implicación: $\\neg(p \\Rightarrow q) \\equiv p \\land \\neg q$.',
  },
  {
    bug: 'logic.implication', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'logic' || n.op !== 'implies') return [];
      const { left: a, right: b } = n;
      return [logic('or', a, not(b)), logic('and', not(a), b), logic('or', a, b), logic('and', a, b)];
    },
    message: () => 'Recuerda la equivalencia de la implicación: $p \\Rightarrow q \\equiv \\neg p \\lor q$.',
  },
  {
    bug: 'logic.converse', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'logic' || n.op !== 'implies') return [];
      return [logic('implies', n.right, n.left), logic('implies', not(n.left), not(n.right))];
    },
    message: () => 'La recíproca ($q \\Rightarrow p$) y la contraria ($\\neg p \\Rightarrow \\neg q$) no equivalen a $p \\Rightarrow q$; sí la contrarrecíproca ($\\neg q \\Rightarrow \\neg p$).',
  },
  {
    bug: 'logic.double-neg', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'not' || n.arg.type !== 'not') return [];
      return [not(n.arg.arg)];
    },
    message: () => 'Doble negación: $\\neg\\neg p \\equiv p$.',
  },
  {
    bug: 'logic.distributive', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'logic' || (n.op !== 'and' && n.op !== 'or')) return [];
      const other = n.op === 'and' ? 'or' : 'and';
      const out: Node[] = [];
      if (n.right.type === 'logic' && n.right.op === other) {
        out.push(logic(other, logic(n.op, n.left, n.right.left), n.right.right));
      }
      if (n.left.type === 'logic' && n.left.op === other) {
        out.push(logic(other, n.left.left, logic(n.op, n.left.right, n.right)));
      }
      return out;
    },
    message: () => 'Propiedad distributiva: $p \\land (q \\lor r) \\equiv (p \\land q) \\lor (p \\land r)$ — hay que distribuir sobre ambos términos.',
  },
  {
    bug: 'logic.connective-swap', modes: ['logic'],
    candidates(n) {
      if (n.type !== 'logic') return [];
      const swaps: Record<string, NodeOf<'logic'>['op'][]> = { and: ['or'], or: ['and', 'xor'], xor: ['or'], iff: ['implies'], implies: ['iff'] };
      return (swaps[n.op] ?? []).map((op) => logic(op, n.left, n.right));
    },
    message: (at) => `Revisa el conector en ${L(at)}: la conjunción exige que ambas sean verdaderas; la disyunción, al menos una.`,
  },

  // ------------------------- Conjuntos -------------------------
  {
    bug: 'set.demorgan', modes: ['set'],
    candidates(n) {
      if (n.type !== 'compl' || n.arg.type !== 'setop' || (n.arg.op !== 'union' && n.arg.op !== 'inter')) return [];
      return [setop(n.arg.op, { type: 'compl', arg: n.arg.left }, { type: 'compl', arg: n.arg.right })];
    },
    message: () => 'De Morgan para conjuntos: $(A \\cup B)^c = A^c \\cap B^c$ y $(A \\cap B)^c = A^c \\cup B^c$.',
  },
  {
    bug: 'set.diff-order', modes: ['set'],
    candidates(n) {
      if (n.type !== 'setop' || n.op !== 'diff') return [];
      return [setop('diff', n.right, n.left)];
    },
    message: () => 'La diferencia no es conmutativa: $A - B$ son los elementos de $A$ que no están en $B$.',
  },
  {
    bug: 'set.op-swap', modes: ['set'],
    candidates(n) {
      if (n.type !== 'setop') return [];
      if (n.op === 'union') return [setop('inter', n.left, n.right)];
      if (n.op === 'inter') return [setop('union', n.left, n.right)];
      return [];
    },
    message: () => 'Revisa la operación: la unión reúne los elementos de ambos conjuntos; la intersección solo los comunes.',
  },

  // ------------------------- Genéricas (al final) -------------------------
  {
    bug: 'sign.product', modes: ALG,
    candidates(n) {
      if (n.type === 'mul' && n.factors.some(isNegLike)) return [neg(n)];
      if (n.type === 'div' && (isNegLike(n.num) || isNegLike(n.den))) return [neg(n)];
      return [];
    },
    message: (at) => `Revisa la regla de los signos en ${L(at)}: $(-)\\cdot(-) = +$ y $(-)\\cdot(+) = -$.`,
  },
  {
    bug: 'sign.term', modes: ALG,
    candidates(n) {
      if (n.type !== 'add') return [];
      return n.terms.map((t, i) => {
        const terms = n.terms.slice();
        terms[i] = negate(t);
        return add(...terms);
      });
    },
    message: (at, mode) =>
      mode === 'expression'
        ? `Hay un error de signo en un término de ${L(at)}.`
        : `Error de signo en ${L(at)}. Recuerda: al pasar un término al otro miembro, cambia de signo.`,
  },
];

export const BUG_MESSAGES_FALLBACK = 'Este paso no es equivalente al anterior.';

/**
 * Genera las versiones «con error» de `prev`. Cada una indica qué regla la
 * produjo y en qué parte de la expresión.
 */
export function* mutations(prev: Node, mode: MutationMode, limit = 400): Generator<Mutation> {
  let count = 0;
  for (const rule of RULES) {
    if (!rule.modes.includes(mode)) continue;
    if (rule.scope === 'root') {
      for (const cand of rule.candidates(prev)) {
        if (count++ >= limit) return;
        yield { bug: rule.bug, mutated: cand, at: prev, message: rule.message(prev, mode) };
      }
      continue;
    }
    const paths: number[][] = [];
    walk(prev, (_, path) => paths.push(path));
    for (const path of paths) {
      const at = getAt(prev, path);
      for (const cand of rule.candidates(at)) {
        if (count++ >= limit) return;
        yield { bug: rule.bug, mutated: replaceAt(prev, path, cand), at, message: rule.message(at, mode) };
      }
    }
  }
}

export const BUG_IDS: BugId[] = RULES.map((r) => r.bug);
