// Analizador de expresiones: acepta LaTeX (MathLive, OCR) y texto plano con notación en español.
import type { FnName, LogicOp, Node, RelOp, SetOp } from './ast';
import { add, div, fn, logic, mul, neg, pow, rel, setop } from './ast';

export type ParseMode = 'arith' | 'logic' | 'bool' | 'set';

export interface ParseOptions {
  /** arith: álgebra/aritmética · logic: proposiciones (p, q, V, F) · bool: álgebra de Boole (A·B + C') · set: conjuntos */
  mode?: ParseMode;
  /** Interpreta «3,5» como 3.5 fuera de paréntesis/llaves (por defecto true en modo arith). */
  decimalComma?: boolean;
}

export class ParseError extends Error {
  pos: number;
  constructor(message: string, pos = -1) {
    super(message);
    this.name = 'ParseError';
    this.pos = pos;
  }
}

type TokKind =
  | 'num' | 'ident' | 'func' | 'op' | 'rel' | 'logic' | 'setop' | 'bool' | 'empty' | 'pm'
  | '(' | ')' | '[' | ']' | '{' | '}' | 'grp(' | 'grp)' | '|' | ',' | ';'
  | 'nl' | 'frac' | 'sqrt' | 'cbrt' | 'overline' | 'deg' | 'circ' | 'text' | 'eof';

interface Tok {
  k: TokKind;
  v?: string | number | boolean;
  pos: number;
}

// ---------------------------------------------------------------------------
// Normalización de caracteres Unicode
// ---------------------------------------------------------------------------

const SUPERSCRIPTS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+', 'ⁿ': 'n',
};

const UNICODE_MAP: Record<string, string> = {
  '−': '-', '–': '-', '—': '-', '×': '*', '·': '*', '⋅': '*', '∙': '*', '∗': '*', '÷': ' \\div ',
  '√': '\\sqrt ', '∛': '\\cbrt ', 'π': '\\pi ', '∞': '\\infty ', '≤': '\\le ', '≥': '\\ge ', '≠': '\\ne ',
  '¬': '\\neg ', '∼': '\\neg ', '~': '\\neg ', '∧': '\\land ', '∨': '\\lor ', '⊻': '\\oplus ', '⊕': '\\oplus ',
  '→': '\\Rightarrow ', '⇒': '\\Rightarrow ', '⟹': '\\Rightarrow ', '↔': '\\Leftrightarrow ', '⇔': '\\Leftrightarrow ', '⟺': '\\Leftrightarrow ',
  '∪': '\\cup ', '∩': '\\cap ', '∖': '\\setminus ', '∅': '\\emptyset ', 'Ø': '\\emptyset ', '∈': '\\in ', '∉': '\\notin ',
  '⊂': '\\subset ', '⊆': '\\subseteq ', '±': '\\pm ', '°': '\\degree ', 'º': '\\degree ', '≡': '\\equiv ',
  'θ': '\\theta ', 'α': '\\alpha ', 'β': '\\beta ', 'γ': '\\gamma ', 'φ': '\\phi ', 'λ': '\\lambda ', 'μ': '\\mu ', 'σ': '\\sigma ', 'ω': '\\omega ', 'Δ': '\\Delta ',
  ' ': ' ', ' ': ' ', '​': '',
};

function normalize(src: string): string {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (SUPERSCRIPTS[ch] !== undefined) {
      let sup = '';
      while (i < src.length && SUPERSCRIPTS[src[i]] !== undefined) sup += SUPERSCRIPTS[src[i++]];
      i--;
      out += `^(${sup})`;
      continue;
    }
    out += UNICODE_MAP[ch] ?? ch;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Tabla de comandos y palabras
// ---------------------------------------------------------------------------

const FUNC_WORDS: Record<string, FnName | 'cbrt'> = {
  sin: 'sin', sen: 'sin', cos: 'cos', tan: 'tan', tg: 'tan', sec: 'sec', csc: 'csc', cosec: 'csc', cot: 'cot', cotg: 'cot', ctg: 'cot',
  arcsin: 'asin', arcsen: 'asin', asin: 'asin', arccos: 'acos', acos: 'acos', arctan: 'atan', arctg: 'atan', atan: 'atan',
  ln: 'ln', log: 'log', exp: 'exp', sqrt: 'sqrt', raiz: 'sqrt', cbrt: 'cbrt', abs: 'abs',
};

const CONST_WORDS: Record<string, string> = { pi: 'pi', inf: 'infinity', infinity: 'infinity' };

// Palabras reconocidas dentro de texto plano (se prueba la más larga primero).
const PLAIN_WORDS = [...Object.keys(FUNC_WORDS), ...Object.keys(CONST_WORDS)].sort((a, b) => b.length - a.length);

const GREEK = new Set([
  'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'theta', 'vartheta', 'lambda', 'mu', 'nu', 'rho', 'sigma', 'tau', 'phi', 'varphi', 'omega', 'Delta', 'Omega', 'Sigma',
]);

const SKIP_COMMANDS = new Set([
  'left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr', 'biggl', 'biggr', 'middle',
  'displaystyle', 'textstyle', 'scriptstyle', 'limits', 'nolimits', 'quad', 'qquad', 'hfill', ',', ';', ':', '!', ' ', 'enspace', 'thinspace', 'space', 'nobreak',
]);

type CmdTok = { k: TokKind; v?: string | number | boolean };

const COMMANDS: Record<string, CmdTok> = {
  frac: { k: 'frac' }, dfrac: { k: 'frac' }, tfrac: { k: 'frac' }, cfrac: { k: 'frac' },
  sqrt: { k: 'sqrt' }, cbrt: { k: 'cbrt' }, overline: { k: 'overline' }, bar: { k: 'overline' },
  cdot: { k: 'op', v: '*' }, times: { k: 'op', v: '*' }, ast: { k: 'op', v: '*' }, div: { k: 'op', v: '÷' },
  pm: { k: 'pm' }, mp: { k: 'pm' },
  infty: { k: 'ident', v: 'infinity' }, pi: { k: 'ident', v: 'pi' },
  emptyset: { k: 'empty' }, varnothing: { k: 'empty' }, O: { k: 'empty' },
  land: { k: 'logic', v: 'and' }, wedge: { k: 'logic', v: 'and' },
  lor: { k: 'logic', v: 'or' }, vee: { k: 'logic', v: 'or' },
  lnot: { k: 'logic', v: 'not' }, neg: { k: 'logic', v: 'not' }, sim: { k: 'logic', v: 'not' },
  oplus: { k: 'logic', v: 'xor' }, veebar: { k: 'logic', v: 'xor' }, underline: { k: 'text', v: '' },
  Rightarrow: { k: 'logic', v: 'implies' }, rightarrow: { k: 'logic', v: 'implies' }, to: { k: 'logic', v: 'implies' },
  implies: { k: 'logic', v: 'implies' }, Longrightarrow: { k: 'logic', v: 'implies' }, longrightarrow: { k: 'logic', v: 'implies' },
  Leftrightarrow: { k: 'logic', v: 'iff' }, leftrightarrow: { k: 'logic', v: 'iff' }, iff: { k: 'logic', v: 'iff' },
  Longleftrightarrow: { k: 'logic', v: 'iff' }, longleftrightarrow: { k: 'logic', v: 'iff' },
  cup: { k: 'setop', v: 'union' }, cap: { k: 'setop', v: 'inter' }, setminus: { k: 'setop', v: 'diff' }, backslash: { k: 'setop', v: 'diff' },
  triangle: { k: 'setop', v: 'symdiff' }, vartriangle: { k: 'setop', v: 'symdiff' }, ominus: { k: 'setop', v: 'symdiff' },
  complement: { k: 'setop', v: 'compl' },
  in: { k: 'rel', v: 'in' }, notin: { k: 'rel', v: 'notin' }, subset: { k: 'rel', v: 'subset' }, subsetneq: { k: 'rel', v: 'subset' },
  subseteq: { k: 'rel', v: 'subseteq' },
  le: { k: 'rel', v: '<=' }, leq: { k: 'rel', v: '<=' }, leqslant: { k: 'rel', v: '<=' },
  ge: { k: 'rel', v: '>=' }, geq: { k: 'rel', v: '>=' }, geqslant: { k: 'rel', v: '>=' },
  ne: { k: 'rel', v: '!=' }, neq: { k: 'rel', v: '!=' }, lt: { k: 'rel', v: '<' }, gt: { k: 'rel', v: '>' },
  approx: { k: 'rel', v: '=' }, simeq: { k: 'rel', v: '=' },
  lvert: { k: '|' }, rvert: { k: '|' }, vert: { k: '|' }, mid: { k: '|' }, '|': { k: '|' },
  lbrace: { k: '{' }, rbrace: { k: '}' }, '{': { k: '{' }, '}': { k: '}' },
  langle: { k: '(' }, rangle: { k: ')' }, lbrack: { k: '[' }, rbrack: { k: ']' },
  degree: { k: 'deg' }, circ: { k: 'circ' },
  '%': { k: 'op', v: '%' }, '\\': { k: 'nl' }, newline: { k: 'nl' }, cr: { k: 'nl' },
};

const TEXT_COMMANDS = new Set(['operatorname', 'mathrm', 'text', 'textrm', 'mathit', 'textit', 'mathbf', 'textbf', 'mbox', 'textup', 'mathsf']);

// ---------------------------------------------------------------------------
// Analizador léxico
// ---------------------------------------------------------------------------

function lex(raw: string, mode: ParseMode, decimalComma: boolean): Tok[] {
  const src = normalize(raw);
  const latex = /\\|\^\{|_\{/.test(src);
  const toks: Tok[] = [];
  let depth = 0;
  let i = 0;
  const push = (k: TokKind, pos: number, v?: Tok['v']) => toks.push({ k, v, pos });

  const readBraced = (): string => {
    // Lee el contenido crudo de {…} a partir de la posición actual.
    while (src[i] === ' ') i++;
    if (src[i] !== '{') {
      // Argumento de un solo carácter (ej. \frac12 no llega aquí; \text x sí).
      return src[i++] ?? '';
    }
    let level = 0;
    const start = i + 1;
    for (; i < src.length; i++) {
      if (src[i] === '{') level++;
      else if (src[i] === '}') {
        level--;
        if (level === 0) break;
      }
    }
    const content = src.slice(start, i);
    i++;
    return content;
  };

  while (i < src.length) {
    const ch = src[i];
    const pos = i;

    if (ch === '\n') { push('nl', pos); i++; continue; }
    if (/\s/.test(ch)) { i++; continue; }

    // Números (con coma decimal opcional y el «{,}» de MathLive).
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let s = '';
      while (i < src.length && /[0-9]/.test(src[i])) s += src[i++];
      const decimalHere = () => {
        if (src[i] === '.' && /[0-9]/.test(src[i + 1] ?? '')) { i += 1; return true; }
        if (src.startsWith('{,}', i) && /[0-9]/.test(src[i + 3] ?? '')) { i += 3; return true; }
        if (!latex && decimalComma && depth === 0 && src[i] === ',' && /[0-9]/.test(src[i + 1] ?? '')) { i += 1; return true; }
        return false;
      };
      if (ch === '.') { i++; s = '0'; s += '.'; while (i < src.length && /[0-9]/.test(src[i])) s += src[i++]; }
      else if (decimalHere()) {
        s += '.';
        while (i < src.length && /[0-9]/.test(src[i])) s += src[i++];
      }
      push('num', pos, parseFloat(s));
      continue;
    }

    // Letras: separar en variables de una letra salvo palabras conocidas.
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      while (i < src.length && /[a-zA-Z]/.test(src[i])) word += src[i++];
      let j = 0;
      while (j < word.length) {
        const rest = word.slice(j);
        const w = mode === 'arith' ? PLAIN_WORDS.find((p) => rest.toLowerCase().startsWith(p)) : undefined;
        if (w) {
          const lw = w.toLowerCase();
          if (FUNC_WORDS[lw]) push('func', pos + j, FUNC_WORDS[lw]);
          else push('ident', pos + j, CONST_WORDS[lw]);
          j += w.length;
        } else {
          push('ident', pos + j, word[j]);
          j++;
        }
      }
      continue;
    }

    if (ch === '\\') {
      i++;
      let name = '';
      if (/[a-zA-Z]/.test(src[i] ?? '')) {
        while (i < src.length && /[a-zA-Z]/.test(src[i])) name += src[i++];
      } else {
        name = src[i] ?? '';
        i++;
      }
      if (SKIP_COMMANDS.has(name)) {
        // \left. y \right. no aportan nada
        if ((name === 'left' || name === 'right') && src[i] === '.') i++;
        continue;
      }
      if (name === 'begin' || name === 'end') {
        const env = readBraced();
        if (name === 'begin' && env === 'array') readBraced();
        continue;
      }
      if (name === 'mathbb' || name === 'mathcal') {
        const content = readBraced();
        push('ident', pos, content);
        continue;
      }
      if (name === 'phantom' || name === 'hphantom' || name === 'vphantom') { readBraced(); continue; }
      if (name === 'dots' || name === 'ldots' || name === 'cdots') throw new ParseError('Los puntos suspensivos no se pueden evaluar: escribe todos los elementos.', pos);
      if (TEXT_COMMANDS.has(name)) {
        const content = readBraced().replace(/\\,|\\ |\\;/g, ' ').trim();
        const lc = content.toLowerCase();
        if (lc === '') continue;
        if (FUNC_WORDS[lc]) { push('func', pos, FUNC_WORDS[lc]); continue; }
        if (lc === 'o' || lc === 'ó' || lc === 'or' || lc === 'u') { push('logic', pos, 'or'); continue; }
        if (lc === 'y' || lc === 'and' || lc === 'e') { push('logic', pos, 'and'); continue; }
        if (/^[a-zA-Z]$/.test(content)) { push('ident', pos, content); continue; }
        if (/no tiene|sin soluci|ninguna|vac[ií]o/.test(lc)) { push('empty', pos); continue; }
        // Texto libre (unidades, comentarios del OCR…): se ignora.
        continue;
      }
      if (FUNC_WORDS[name] && !COMMANDS[name]) { push('func', pos, FUNC_WORDS[name]); continue; }
      if (GREEK.has(name)) { push('ident', pos, name.replace(/^var/, '')); continue; }
      if (name === 'equiv') { push(mode === 'logic' || mode === 'bool' ? 'logic' : 'rel', pos, mode === 'logic' || mode === 'bool' ? 'iff' : '='); continue; }
      if (name === 'not') {
        // \not\subset, \not= …
        continue;
      }
      const cmd = COMMANDS[name];
      if (!cmd) throw new ParseError(`No reconozco el comando \\${name}`, pos);
      if (cmd.k === '{' || cmd.k === '(' || cmd.k === '[') depth++;
      if (cmd.k === '}' || cmd.k === ')' || cmd.k === ']') depth = Math.max(0, depth - 1);
      push(cmd.k, pos, cmd.v);
      continue;
    }

    i++;
    switch (ch) {
      case '{':
        if (latex) push('grp(', pos);
        else { depth++; push('{', pos); }
        break;
      case '}':
        if (latex) push('grp)', pos);
        else { depth = Math.max(0, depth - 1); push('}', pos); }
        break;
      case '(': depth++; push('(', pos); break;
      case ')': depth = Math.max(0, depth - 1); push(')', pos); break;
      case '[': depth++; push('[', pos); break;
      case ']': depth = Math.max(0, depth - 1); push(']', pos); break;
      case ',': push(',', pos); break;
      case ';': push(';', pos); break;
      case '|':
        if (src[i] === '|') { i++; push('logic', pos, 'or'); }
        else push('|', pos);
        break;
      case '+': push('op', pos, '+'); break;
      case '-':
        if (src[i] === '>') { i++; push('logic', pos, 'implies'); }
        else push('op', pos, '-');
        break;
      case '*':
        if (src[i] === '*') { i++; push('op', pos, '^'); }
        else push('op', pos, '*');
        break;
      case '/': push('op', pos, '/'); break;
      case ':': push('op', pos, '÷'); break;
      case '^': push('op', pos, '^'); break;
      case '_': push('op', pos, '_'); break;
      case "'": push('op', pos, "'"); break;
      case '%': push('op', pos, '%'); break;
      case '&':
        if (!latex) push('logic', pos, 'and');
        break;
      case '!':
        if (src[i] === '=') { i++; push('rel', pos, '!='); }
        else push('op', pos, '!');
        break;
      case '=':
        if (src[i] === '>') { i++; push('logic', pos, 'implies'); }
        else if (src[i] === '=') { i++; push('rel', pos, '='); }
        else push('rel', pos, '=');
        break;
      case '<':
        if (src.startsWith('=>', i)) { i += 2; push('logic', pos, 'iff'); }
        else if (src.startsWith('->', i)) { i += 2; push('logic', pos, 'iff'); }
        else if (src[i] === '=') { i++; push('rel', pos, '<='); }
        else if (src[i] === '>') { i++; push('rel', pos, '!='); }
        else push('rel', pos, '<');
        break;
      case '>':
        if (src[i] === '=') { i++; push('rel', pos, '>='); }
        else push('rel', pos, '>');
        break;
      default:
        throw new ParseError(`No reconozco el símbolo «${ch}»`, pos);
    }
  }
  push('eof', src.length);
  return toks;
}

// ---------------------------------------------------------------------------
// Analizador sintáctico (Pratt)
// ---------------------------------------------------------------------------

const BP = {
  iff: 10, implies: 20, or: 30, xor: 30, and: 40, not: 45, rel: 50, union: 55, diff: 55, symdiff: 55, inter: 57,
  add: 60, mul: 70, slash: 72, unary: 75, pow: 80, postfix: 90,
};

class Parser {
  private toks: Tok[];
  private p = 0;
  private absDepth = 0;
  private mode: ParseMode;

  constructor(toks: Tok[], mode: ParseMode) {
    this.toks = toks;
    this.mode = mode;
  }

  peek(offset = 0): Tok {
    return this.toks[Math.min(this.p + offset, this.toks.length - 1)];
  }

  next(): Tok {
    const t = this.toks[this.p];
    if (this.p < this.toks.length - 1) this.p++;
    return t;
  }

  expect(k: TokKind, msg: string): Tok {
    const t = this.peek();
    if (t.k !== k) throw new ParseError(msg, t.pos);
    return this.next();
  }

  parseTop(): Node {
    const items: Node[] = [this.parseExpr(0)];
    while (this.peek().k === ',' || this.peek().k === ';') {
      this.next();
      if (this.peek().k === 'eof') break;
      items.push(this.parseExpr(0));
    }
    const t = this.peek();
    if (t.k !== 'eof') {
      if (t.k === ')' || t.k === ']' || t.k === 'grp)') throw new ParseError('Hay un paréntesis de cierre de más.', t.pos);
      throw new ParseError('No entiendo la expresión a partir de este punto.', t.pos);
    }
    return items.length === 1 ? items[0] : { type: 'list', items };
  }

  private startsPrimary(t: Tok): boolean {
    switch (t.k) {
      case 'num': case 'ident': case 'func': case '(': case 'grp(': case 'frac': case 'sqrt': case 'cbrt': case 'overline':
        return true;
      case '|':
        return this.absDepth === 0 && this.mode !== 'logic';
      default:
        return false;
    }
  }

  /** Poder de enlace por la izquierda del token (0 = termina la expresión). */
  private lbp(t: Tok): number {
    const m = this.mode;
    switch (t.k) {
      case 'logic':
        if (t.v === 'not') return 0;
        return BP[t.v as Exclude<LogicOp, never>] ?? 0;
      case 'rel': return BP.rel;
      case 'setop':
        if (t.v === 'compl') return 0;
        return BP[t.v as 'union' | 'inter' | 'diff' | 'symdiff'];
      case 'pm': return BP.add;
      case 'deg': return BP.postfix;
      case 'op':
        switch (t.v) {
          case '+': return m === 'bool' ? BP.or : BP.add;
          case '-': return m === 'set' ? BP.diff : BP.add;
          case '*': return m === 'bool' ? BP.and : BP.mul;
          case '÷': return BP.mul;
          case '/': return BP.slash;
          case '^': return BP.pow;
          case '!': return m === 'arith' ? BP.postfix : 0;
          case "'": case '%': return BP.postfix;
          default: return 0;
        }
      case 'ident':
        if (m === 'logic' && t.v === 'v') return BP.or;
        return m === 'arith' || m === 'bool' ? BP.mul : 0;
      case '|':
        if (m === 'logic') return BP.or;
        return this.absDepth === 0 && m !== 'set' ? BP.mul : 0;
      default:
        if ((m === 'arith' || m === 'bool') && this.startsPrimary(t)) return BP.mul;
        return 0;
    }
  }

  parseExpr(rbp: number): Node {
    let left = this.nud(this.next());
    for (;;) {
      const t = this.peek();
      const lbp = this.lbp(t);
      if (lbp <= rbp) break;
      left = this.led(t, left);
    }
    return left;
  }

  private nud(t: Tok): Node {
    const m = this.mode;
    switch (t.k) {
      case 'num':
        if (m === 'bool') {
          if (t.v !== 0 && t.v !== 1) throw new ParseError('En álgebra de Boole solo se usan 0 y 1.', t.pos);
          return { type: 'bool', value: t.v === 1 };
        }
        return { type: 'num', value: t.v as number };
      case 'ident':
        return this.identifier(t);
      case 'bool':
        return { type: 'bool', value: t.v as boolean };
      case 'func':
        return this.func(t.v as FnName | 'cbrt');
      case 'empty':
        return { type: 'set', items: [] };
      case 'op':
        if (t.v === '-') {
          if (m === 'logic' || m === 'bool') throw new ParseError('Signo «-» fuera de lugar.', t.pos);
          return neg(this.parseExpr(BP.unary));
        }
        if (t.v === '+') return this.parseExpr(BP.unary);
        if (t.v === '!' && (m === 'logic' || m === 'bool')) return { type: 'not', arg: this.parseExpr(BP.not) };
        throw new ParseError('Falta un número o expresión antes de este operador.', t.pos);
      case 'pm':
        return { type: 'pm', left: null, right: this.parseExpr(BP.unary) };
      case 'logic':
        if (t.v === 'not') return { type: 'not', arg: this.parseExpr(m === 'bool' ? BP.postfix - 1 : BP.not) };
        throw new ParseError('Falta la proposición antes del conector.', t.pos);
      case 'setop':
        if (t.v === 'compl') return { type: 'compl', arg: this.parseExpr(BP.postfix) };
        throw new ParseError('Falta un conjunto antes de la operación.', t.pos);
      case '(': case '[':
        return this.bracketed(t);
      case ']':
        // Notación de intervalo abierto ]a, b[
        return this.bracketed(t);
      case 'grp(': {
        if (this.peek().k === 'grp)') { this.next(); return { type: 'list', items: [] }; }
        const inner = this.parseExpr(0);
        if (this.peek().k === ',' || this.peek().k === ';') {
          const items = [inner];
          while (this.peek().k === ',' || this.peek().k === ';') { this.next(); items.push(this.parseExpr(0)); }
          this.expect('grp)', 'Falta cerrar una llave «}».');
          return { type: 'list', items };
        }
        this.expect('grp)', 'Falta cerrar una llave «}».');
        return inner;
      }
      case '{': {
        const items: Node[] = [];
        if (this.peek().k !== '}') {
          items.push(this.parseExpr(0));
          while (this.peek().k === ',' || this.peek().k === ';') { this.next(); items.push(this.parseExpr(0)); }
        }
        this.expect('}', 'Falta cerrar la llave del conjunto.');
        return { type: 'set', items };
      }
      case '|': {
        this.absDepth++;
        const inner = this.parseExpr(0);
        this.absDepth--;
        this.expect('|', 'Falta cerrar el valor absoluto «|».');
        return fn('abs', inner);
      }
      case 'frac': {
        const n = this.groupArg('Falta el numerador de la fracción.');
        const d = this.groupArg('Falta el denominador de la fracción.');
        return div(n, d);
      }
      case 'sqrt': {
        let index: Node | null = null;
        if (this.peek().k === '[') {
          this.next();
          index = this.parseExpr(0);
          this.expect(']', 'Falta cerrar el índice de la raíz.');
        }
        const arg = this.groupArg('Falta el radicando.', BP.pow - 1);
        if (!index) return fn('sqrt', arg);
        if (index.type === 'num' && index.value === 2) return fn('sqrt', arg);
        return fn('root', arg, index);
      }
      case 'cbrt':
        return fn('root', this.groupArg('Falta el radicando.', BP.pow - 1), { type: 'num', value: 3 });
      case 'overline': {
        const arg = this.groupArg('Falta el contenido de la barra.');
        if (m === 'set') return { type: 'compl', arg };
        if (m === 'bool' || m === 'logic') return { type: 'not', arg };
        return arg;
      }
      case 'text':
        throw new ParseError(`No sé interpretar el texto «${t.v}».`, t.pos);
      case 'eof':
        throw new ParseError('La expresión está incompleta.', t.pos);
      case ')': case 'grp)': case '}':
        throw new ParseError('Hay un paréntesis de cierre sin abrir.', t.pos);
      case 'rel':
        throw new ParseError('Falta el miembro izquierdo de la relación.', t.pos);
      default:
        throw new ParseError('Símbolo inesperado.', t.pos);
    }
  }

  private identifier(t: Tok): Node {
    let name = String(t.v);
    if (this.mode === 'logic' && (name === 'V' || name === 'T')) return { type: 'bool', value: true };
    if (this.mode === 'logic' && name === 'F') return { type: 'bool', value: false };
    if (this.peek().k === 'op' && this.peek().v === '_') {
      this.next();
      name += '_' + this.subscriptText();
    }
    return { type: 'sym', name };
  }

  private subscriptText(): string {
    const t = this.next();
    if (t.k === 'grp(') {
      let s = '';
      while (this.peek().k !== 'grp)' && this.peek().k !== 'eof') {
        const x = this.next();
        s += x.v === undefined ? '' : String(x.v);
      }
      this.expect('grp)', 'Falta cerrar el subíndice.');
      return s;
    }
    if (t.k === 'num' || t.k === 'ident') return String(t.v);
    throw new ParseError('Subíndice inválido.', t.pos);
  }

  /** Argumento de \frac, \sqrt…: un grupo {…} o un único token. */
  private groupArg(msg: string, bp = BP.postfix): Node {
    const t = this.peek();
    if (t.k === 'grp(') {
      this.next();
      const inner = this.parseExpr(0);
      this.expect('grp)', 'Falta cerrar una llave «}».');
      return inner;
    }
    if (t.k === 'eof') throw new ParseError(msg, t.pos);
    if (t.k === 'num' && Number.isInteger(t.v) && String(t.v).length > 1 && this.toks[this.p - 1]?.k === 'frac') {
      // \frac12 → 1/2 : LaTeX toma un dígito por argumento.
      const digits = String(t.v);
      this.toks.splice(this.p, 1, { k: 'num', v: Number(digits[0]), pos: t.pos }, { k: 'num', v: Number(digits.slice(1)), pos: t.pos + 1 });
      return { type: 'num', value: Number(this.next().v) };
    }
    return this.parseExpr(bp);
  }

  private bracketed(open: Tok): Node {
    const items: Node[] = [];
    const closers: TokKind[] = open.k === ']' ? ['['] : [')', ']'];
    if (!closers.includes(this.peek().k)) {
      items.push(this.parseExpr(0));
      while (this.peek().k === ',' || this.peek().k === ';') { this.next(); items.push(this.parseExpr(0)); }
    }
    const close = this.peek();
    if (!closers.includes(close.k)) throw new ParseError('Falta cerrar un paréntesis.', close.pos);
    this.next();
    if (items.length === 1 && open.k !== ']' && !(open.k === '[' && close.k === ')') && !(open.k === '(' && close.k === ']')) {
      return items[0];
    }
    if (items.length === 0) throw new ParseError('Paréntesis vacíos.', open.pos);
    return {
      type: 'tuple',
      items,
      open: open.k === '[' ? '[' : '(',
      close: close.k === ']' ? ']' : ')',
    };
  }

  private func(name: FnName | 'cbrt'): Node {
    let power: Node | null = null;
    let base: Node | null = null;
    // \sin^2 x, \log_2 x
    for (let k = 0; k < 2; k++) {
      const t = this.peek();
      if (t.k === 'op' && t.v === '^' && !power) {
        this.next();
        power = this.groupArg('Falta el exponente.', BP.pow);
      } else if (t.k === 'op' && t.v === '_' && name === 'log' && !base) {
        this.next();
        base = this.groupArg('Falta la base del logaritmo.', BP.pow);
      }
    }
    let args: Node[];
    const t = this.peek();
    if (t.k === '(') {
      this.next();
      args = [this.parseExpr(0)];
      while (this.peek().k === ',' || this.peek().k === ';') { this.next(); args.push(this.parseExpr(0)); }
      this.expect(')', 'Falta cerrar el paréntesis de la función.');
    } else if (t.k === 'grp(') {
      args = [this.groupArg('Falta el argumento de la función.')];
    } else {
      if (t.k === 'eof') throw new ParseError('Falta el argumento de la función.', t.pos);
      args = [this.parseExpr(BP.mul - 1)];
    }
    let node: Node;
    if (name === 'cbrt') node = fn('root', args[0], { type: 'num', value: 3 });
    else if (name === 'log' && (base || args.length > 1)) node = fn('log', args[0], base ?? args[1]);
    else if (name === 'root' && args.length > 1) node = fn('root', args[0], args[1]);
    else node = fn(name, args[0]);

    if (power) {
      const isMinusOne = power.type === 'neg' && power.arg.type === 'num' && power.arg.value === 1;
      if (isMinusOne && (name === 'sin' || name === 'cos' || name === 'tan')) {
        node = fn(name === 'sin' ? 'asin' : name === 'cos' ? 'acos' : 'atan', args[0]);
      } else node = pow(node, power);
    }
    return node;
  }

  private led(t: Tok, left: Node): Node {
    const m = this.mode;
    // Multiplicación implícita (2x, (x+1)(x-1), AB en álgebra de Boole)
    if (t.k !== 'op' && t.k !== 'rel' && t.k !== 'logic' && t.k !== 'setop' && t.k !== 'pm' && t.k !== 'deg' && !(t.k === 'ident' && m === 'logic') && !(t.k === '|' && m === 'logic')) {
      const right = this.parseExpr(BP.mul);
      return m === 'bool' ? logic('and', left, right) : mul(...flatMul(left), ...flatMul(right));
    }
    this.next();
    switch (t.k) {
      case 'ident': // «v» como disyunción en lógica
      case '|':
        return logic('or', left, this.parseExpr(BP.or));
      case 'pm':
        return { type: 'pm', left, right: this.parseExpr(BP.add) };
      case 'deg':
        return { type: 'deg', arg: left };
      case 'rel': {
        const right = this.parseExpr(BP.rel);
        if (this.peek().k === 'rel') {
          const items = [left, right];
          const ops: RelOp[] = [t.v as RelOp];
          while (this.peek().k === 'rel') {
            ops.push(this.next().v as RelOp);
            items.push(this.parseExpr(BP.rel));
          }
          return { type: 'chain', ops, items };
        }
        return rel(t.v as RelOp, left, right);
      }
      case 'logic': {
        const op = t.v as LogicOp;
        const bp = op === 'implies' ? BP.implies - 1 : BP[op];
        return logic(op, left, this.parseExpr(bp));
      }
      case 'setop': {
        const op = t.v as SetOp;
        return setop(op, left, this.parseExpr(BP[op as 'union'] ?? BP.union));
      }
      case 'op':
        switch (t.v) {
          case '+':
            if (m === 'bool') return logic('or', left, this.parseExpr(BP.or));
            return add(...flatAdd(left), this.parseExpr(BP.add));
          case '-':
            if (m === 'set') return setop('diff', left, this.parseExpr(BP.diff));
            return add(...flatAdd(left), neg(this.parseExpr(BP.add)));
          case '*':
            if (m === 'bool') return logic('and', left, this.parseExpr(BP.and));
            return mul(...flatMul(left), ...flatMul(this.parseExpr(BP.mul)));
          case '÷':
            return div(left, this.parseExpr(BP.mul));
          case '/':
            return div(left, this.parseExpr(BP.slash));
          case '^': {
            const nt = this.peek();
            if (nt.k === 'circ') { this.next(); return { type: 'deg', arg: left }; }
            if (nt.k === 'grp(' && this.peek(1).k === 'circ' && this.peek(2).k === 'grp)') {
              this.next(); this.next(); this.next();
              return { type: 'deg', arg: left };
            }
            if (m === 'set') {
              const e = this.groupArgRaw();
              if (e && (e === 'c' || e === 'C' || e === 'compl')) return { type: 'compl', arg: left };
              throw new ParseError('En conjuntos, el exponente solo puede ser c (complemento).', nt.pos);
            }
            const exp = this.groupArg('Falta el exponente.', BP.pow - 1);
            return pow(left, exp);
          }
          case '!':
            return { type: 'fact', arg: left };
          case "'":
            if (m === 'set') return { type: 'compl', arg: left };
            if (m === 'bool' || m === 'logic') return { type: 'not', arg: left };
            throw new ParseError('No sé interpretar el apóstrofo en esta expresión.', t.pos);
          case '%':
            return div(left, { type: 'num', value: 100 });
          default:
            throw new ParseError('Operador inesperado.', t.pos);
        }
      default:
        throw new ParseError('Símbolo inesperado.', t.pos);
    }
  }

  /** Para A^c / A^{c} / A^{\complement} en conjuntos. */
  private groupArgRaw(): string | null {
    const t = this.next();
    if (t.k === 'ident') return String(t.v);
    if (t.k === 'setop' && t.v === 'compl') return 'compl';
    if (t.k === 'grp(') {
      const inner = this.next();
      this.expect('grp)', 'Falta cerrar una llave «}».');
      if (inner.k === 'ident') return String(inner.v);
      if (inner.k === 'setop' && inner.v === 'compl') return 'compl';
    }
    return null;
  }
}

function flatAdd(n: Node): Node[] {
  return n.type === 'add' ? n.terms : [n];
}

function flatMul(n: Node): Node[] {
  return n.type === 'mul' ? n.factors : [n];
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

export function parse(src: string, opts: ParseOptions = {}): Node {
  const mode = opts.mode ?? 'arith';
  const decimalComma = opts.decimalComma ?? mode === 'arith';
  const trimmed = src.trim();
  if (!trimmed) throw new ParseError('Escribe una expresión.', 0);
  const toks = lex(trimmed, mode, decimalComma).filter((t) => t.k !== 'nl');
  return new Parser(toks, mode).parseTop();
}

/** Intenta analizar; devuelve null (y el error) si no se puede. */
export function tryParse(src: string, opts: ParseOptions = {}): { node: Node | null; error: string | null } {
  try {
    return { node: parse(src, opts), error: null };
  } catch (e) {
    if (e instanceof ParseError) return { node: null, error: e.message };
    return { node: null, error: 'No se pudo interpretar la expresión.' };
  }
}

/**
 * Separa una entrada de varias líneas (texto o LaTeX con \\, aligned, &) en líneas individuales.
 */
export function splitLines(src: string): string[] {
  const cleaned = src
    .replace(/\\begin\{(aligned|align\*?|gathered|array|cases|split)\}(\{[^}]*\})?/g, '')
    .replace(/\\end\{(aligned|align\*?|gathered|array|cases|split)\}/g, '')
    .replace(/&/g, '');
  return cleaned
    .split(/\\\\|\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
