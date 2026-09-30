// Conversión del árbol a LaTeX (para KaTeX/MathLive) y a texto plano.
import type { Node, RelOp } from './ast';

export interface PrintOptions {
  /** Muestra los decimales con coma (convención hispana). Por defecto true. */
  decimalComma?: boolean;
  /** Cómo mostrar los valores de verdad: V/F (lógica) o 1/0 (álgebra de Boole). */
  boolStyle?: 'VF' | '10';
  /** Notación de álgebra de Boole: A·B, A + B, A̅, A ⊕ B. */
  boolAlgebra?: boolean;
}

const GREEK = new Set(['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'nu', 'rho', 'sigma', 'tau', 'phi', 'omega', 'Delta', 'Omega', 'Sigma']);

export function formatNumber(value: number, decimalComma = true, latex = true): string {
  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return latex ? '\\text{indefinido}' : 'indefinido';
    return (value < 0 ? '-' : '') + (latex ? '\\infty' : '∞');
  }
  let s: string;
  if (Number.isInteger(value) && Math.abs(value) < 1e15) s = String(value);
  else {
    s = Number(value.toPrecision(10)).toString();
    if (s.includes('e')) {
      const [m, e] = Number(value.toPrecision(6)).toExponential().split('e');
      const mant = m.replace('.', decimalComma ? (latex ? '{,}' : ',') : '.');
      return latex ? `${mant} \\cdot 10^{${Number(e)}}` : `${mant}·10^${Number(e)}`;
    }
  }
  if (decimalComma) s = s.replace('.', latex ? '{,}' : ',');
  return s;
}

function symLatex(name: string): string {
  if (name === 'pi') return '\\pi';
  if (name === 'infinity') return '\\infty';
  const [base, subscript] = name.split('_');
  const b = GREEK.has(base) ? `\\${base}` : base.length > 1 ? `\\mathrm{${base}}` : base;
  return subscript !== undefined ? `${b}_{${subscript}}` : b;
}

const REL_LATEX: Record<RelOp, string> = {
  '=': '=', '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge', '!=': '\\neq', in: '\\in', notin: '\\notin', subset: '\\subset', subseteq: '\\subseteq',
};

const FN_LATEX: Record<string, string> = {
  sin: '\\operatorname{sen}', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot',
  asin: '\\operatorname{arcsen}', acos: '\\arccos', atan: '\\arctan', ln: '\\ln', log: '\\log',
};

/** Precedencia para decidir paréntesis (mayor = liga más fuerte). */
function prec(n: Node): number {
  switch (n.type) {
    case 'list': return 0;
    case 'logic':
      return { iff: 1, implies: 2, or: 3, xor: 3, and: 4 }[n.op];
    case 'not': return 5;
    case 'rel': case 'chain': return 6;
    case 'setop': return n.op === 'inter' ? 8 : 7;
    case 'add': case 'pm': return 9;
    case 'neg': return 10;
    case 'mul': return 11;
    case 'div': return 11;
    case 'pow': return 12;
    case 'fact': case 'deg': case 'compl': return 13;
    case 'num': return n.value < 0 ? 10 : 14;
    default: return 14;
  }
}

function startsWithDigit(latex: string): boolean {
  return /^[0-9]/.test(latex) || latex.startsWith('\\frac') || latex.startsWith('{,}');
}

/** Un factor de un producto que empieza con signo negativo. */
function leadingNegative(n: Node): boolean {
  if (n.type === 'neg') return true;
  if (n.type === 'num') return n.value < 0;
  if (n.type === 'mul') return leadingNegative(n.factors[0]);
  return false;
}

function stripLeadingNegative(n: Node): Node {
  if (n.type === 'neg') return n.arg;
  if (n.type === 'num') return { type: 'num', value: -n.value };
  if (n.type === 'mul') {
    const [first, ...rest] = n.factors;
    const s = stripLeadingNegative(first);
    if (s.type === 'num' && s.value === 1 && rest.length > 0) return rest.length === 1 ? rest[0] : { type: 'mul', factors: rest };
    return { type: 'mul', factors: [s, ...rest] };
  }
  return n;
}

export function toLatex(node: Node, opts: PrintOptions = {}): string {
  const dc = opts.decimalComma ?? true;
  const boolStyle = opts.boolStyle ?? 'VF';

  const wrap = (s: string) => `\\left(${s}\\right)`;
  const p = (n: Node, minPrec: number): string => {
    const s = go(n);
    return prec(n) < minPrec ? wrap(s) : s;
  };

  const fnArg = (arg: Node): string => {
    if (arg.type === 'sym' || (arg.type === 'num' && arg.value >= 0)) return ` ${go(arg)}`;
    if (arg.type === 'deg') return ` ${go(arg)}`;
    return wrap(go(arg));
  };

  const go = (n: Node): string => {
    switch (n.type) {
      case 'num':
        return formatNumber(n.value, dc);
      case 'sym':
        return symLatex(n.name);
      case 'bool':
        return boolStyle === 'VF' ? (n.value ? '\\mathrm{V}' : '\\mathrm{F}') : n.value ? '1' : '0';
      case 'add': {
        let s = go(n.terms[0]);
        if (prec(n.terms[0]) < 9 && n.terms[0].type !== 'neg') s = wrap(s);
        for (const t of n.terms.slice(1)) {
          if (leadingNegative(t)) {
            const inner = stripLeadingNegative(t);
            s += ' - ' + p(inner, 10);
          } else {
            s += ' + ' + p(t, 10);
          }
        }
        return s;
      }
      case 'neg':
        return '-' + p(n.arg, 11);
      case 'mul': {
        let s = '';
        n.factors.forEach((f, i) => {
          let fs: string;
          if (i === 0 && leadingNegative(f) && f.type !== 'mul') fs = go(f);
          else fs = p(f, 11);
          if (i === 0) {
            s = fs;
            return;
          }
          const prev = n.factors[i - 1];
          const prevIsFnNoParens = prev.type === 'fn' && !['sqrt', 'root', 'abs'].includes(prev.name) && (prev.args[0].type === 'sym' || prev.args[0].type === 'num');
          const needDot =
            startsWithDigit(fs) ||
            f.type === 'div' ||
            (prev.type === 'div' && f.type === 'num') ||
            prevIsFnNoParens ||
            (prev.type === 'pow' && f.type === 'num') ||
            (prev.type === 'fact') ||
            fs.startsWith('-');
          s += needDot ? ` \\cdot ${fs}` : fs;
        });
        return s;
      }
      case 'div':
        return `\\frac{${go(n.num)}}{${go(n.den)}}`;
      case 'pow': {
        const b = n.base;
        const e = go(n.exp);
        if (b.type === 'fn' && ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'].includes(b.name) && (b.args[0].type === 'sym' || b.args[0].type === 'num')) {
          return `${FN_LATEX[b.name]}^{${e}}${fnArg(b.args[0])}`;
        }
        const needParens = prec(b) <= 12 || b.type === 'div' || (b.type === 'fn' && !['sqrt', 'root', 'abs'].includes(b.name)) || b.type === 'fact' || b.type === 'deg';
        const bs = needParens ? wrap(go(b)) : go(b);
        return `${bs}^{${e}}`;
      }
      case 'fn': {
        const [a, b] = n.args;
        switch (n.name) {
          case 'sqrt': return `\\sqrt{${go(a)}}`;
          case 'root': return `\\sqrt[${go(b)}]{${go(a)}}`;
          case 'abs': return `\\left|${go(a)}\\right|`;
          case 'exp': return `e^{${go(a)}}`;
          case 'log':
            if (b) return `\\log_{${go(b)}}${fnArg(a)}`;
            return `\\log${fnArg(a)}`;
          default:
            return `${FN_LATEX[n.name]}${fnArg(a)}`;
        }
      }
      case 'fact':
        return `${p(n.arg, 14)}!`;
      case 'deg':
        return `${p(n.arg, 14)}^{\\circ}`;
      case 'pm':
        return n.left ? `${go(n.left)} \\pm ${p(n.right, 10)}` : `\\pm ${p(n.right, 10)}`;
      case 'rel':
        return `${go(n.left)} ${REL_LATEX[n.op]} ${go(n.right)}`;
      case 'chain':
        return n.items.map((it, i) => (i === 0 ? go(it) : `${REL_LATEX[n.ops[i - 1]]} ${go(it)}`)).join(' ');
      case 'not': {
        const inner = go(n.arg);
        if (opts.boolAlgebra) return `\\overline{${inner}}`;
        return prec(n.arg) < 13 && n.arg.type !== 'not' ? `\\neg ${wrap(inner)}` : `\\neg ${inner}`;
      }
      case 'logic': {
        if (opts.boolAlgebra) {
          const bop = { and: ' \\cdot ', or: ' + ', xor: ' \\oplus ', implies: ' \\Rightarrow ', iff: ' \\Leftrightarrow ' }[n.op];
          const bside = (c: Node) => {
            const s = go(c);
            if (c.type === 'logic' && c.op !== n.op && !(n.op === 'or' && c.op === 'and')) return wrap(s);
            return s;
          };
          return `${bside(n.left)}${bop}${bside(n.right)}`;
        }
        const op = { and: '\\land', or: '\\lor', xor: '\\veebar', implies: '\\Rightarrow', iff: '\\Leftrightarrow' }[n.op];
        const side = (c: Node, isLeft: boolean) => {
          const s = go(c);
          if (c.type === 'logic') {
            if (c.op !== n.op) return wrap(s);
            if (n.op === 'implies' && isLeft) return wrap(s);
            if (n.op === 'iff' && !isLeft) return wrap(s);
            return s;
          }
          return prec(c) < prec(n) ? wrap(s) : s;
        };
        return `${side(n.left, true)} ${op} ${side(n.right, false)}`;
      }
      case 'setop': {
        const op = { union: '\\cup', inter: '\\cap', diff: '\\setminus', symdiff: '\\triangle' }[n.op];
        const side = (c: Node) => {
          const s = go(c);
          if (c.type === 'setop' && (c.op !== n.op || n.op === 'diff')) return wrap(s);
          return s;
        };
        return `${side(n.left)} ${op} ${side(n.right)}`;
      }
      case 'compl':
        if (n.arg.type === 'sym') return `${go(n.arg)}^{c}`;
        return `${wrap(go(n.arg))}^{c}`;
      case 'set': {
        if (n.items.length === 0) return '\\emptyset';
        const parts = n.items.map(go);
        const sep = parts.some((x) => x.includes('{,}')) ? ';\\ ' : ',\\ ';
        return `\\{${parts.join(sep)}\\}`;
      }
      case 'tuple': {
        const parts = n.items.map(go);
        const sep = parts.some((x) => x.includes('{,}')) ? ';\\ ' : ',\\ ';
        return `\\left${n.open}${parts.join(sep)}\\right${n.close}`;
      }
      case 'list':
        return n.items.map(go).join(',\\; ');
    }
  };

  return go(node);
}

// ---------------------------------------------------------------------------
// Texto plano (depuración, almacenamiento y entradas del usuario)
// ---------------------------------------------------------------------------

export function toText(node: Node): string {
  const wrap = (s: string) => `(${s})`;
  const p = (n: Node, minPrec: number): string => (prec(n) < minPrec ? wrap(go(n)) : go(n));
  const go = (n: Node): string => {
    switch (n.type) {
      case 'num': return formatNumber(n.value, false, false);
      case 'sym': return n.name;
      case 'bool': return n.value ? 'V' : 'F';
      case 'add': {
        let s = p(n.terms[0], 9);
        for (const t of n.terms.slice(1)) {
          if (leadingNegative(t)) s += ' - ' + p(stripLeadingNegative(t), 10);
          else s += ' + ' + p(t, 10);
        }
        return s;
      }
      case 'neg': return '-' + p(n.arg, 11);
      case 'mul': return n.factors.map((f, i) => (i === 0 && leadingNegative(f) ? go(f) : p(f, 11))).join('*');
      case 'div': return `${p(n.num, 12)}/${p(n.den, 12)}`;
      case 'pow': return `${p(n.base, 13)}^${p(n.exp, 13)}`;
      case 'fn': {
        const args = n.args.map(go).join(', ');
        return `${n.name}(${args})`;
      }
      case 'fact': return `${p(n.arg, 14)}!`;
      case 'deg': return `${p(n.arg, 14)}°`;
      case 'pm': return n.left ? `${go(n.left)} ± ${p(n.right, 10)}` : `±${p(n.right, 10)}`;
      case 'rel': return `${go(n.left)} ${n.op} ${go(n.right)}`;
      case 'chain': return n.items.map((it, i) => (i === 0 ? go(it) : `${n.ops[i - 1]} ${go(it)}`)).join(' ');
      case 'not': return `¬${p(n.arg, 13)}`;
      case 'logic': {
        const op = { and: '∧', or: '∨', xor: '⊻', implies: '⇒', iff: '⇔' }[n.op];
        const side = (c: Node) => (c.type === 'logic' && c.op !== n.op ? wrap(go(c)) : p(c, prec(n)));
        return `${side(n.left)} ${op} ${side(n.right)}`;
      }
      case 'setop': {
        const op = { union: '∪', inter: '∩', diff: '−', symdiff: 'Δ' }[n.op];
        const side = (c: Node) => (c.type === 'setop' && c.op !== n.op ? wrap(go(c)) : go(c));
        return `${side(n.left)} ${op} ${side(n.right)}`;
      }
      case 'compl': return n.arg.type === 'sym' ? `${go(n.arg)}'` : `(${go(n.arg)})'`;
      case 'set': return n.items.length ? `{${n.items.map(go).join(', ')}}` : '∅';
      case 'tuple': return `${n.open}${n.items.map(go).join(', ')}${n.close}`;
      case 'list': return n.items.map(go).join(', ');
    }
  };
  return go(node);
}

export function relSymbol(op: RelOp): string {
  return REL_LATEX[op];
}
