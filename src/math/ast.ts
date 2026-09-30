// Árbol sintáctico común para aritmética, álgebra, lógica y conjuntos.

export type RelOp = '=' | '<' | '>' | '<=' | '>=' | '!=' | 'in' | 'notin' | 'subset' | 'subseteq';
export type LogicOp = 'and' | 'or' | 'xor' | 'implies' | 'iff';
export type SetOp = 'union' | 'inter' | 'diff' | 'symdiff';

export type FnName =
  | 'sin' | 'cos' | 'tan' | 'sec' | 'csc' | 'cot'
  | 'asin' | 'acos' | 'atan'
  | 'ln' | 'log' | 'exp' | 'sqrt' | 'root' | 'abs';

export type Node =
  | { type: 'num'; value: number }
  | { type: 'sym'; name: string }
  | { type: 'bool'; value: boolean }
  | { type: 'add'; terms: Node[] }
  | { type: 'neg'; arg: Node }
  | { type: 'mul'; factors: Node[] }
  | { type: 'div'; num: Node; den: Node }
  | { type: 'pow'; base: Node; exp: Node }
  | { type: 'fn'; name: FnName; args: Node[] }
  | { type: 'fact'; arg: Node }
  | { type: 'deg'; arg: Node }
  | { type: 'pm'; left: Node | null; right: Node }
  | { type: 'rel'; op: RelOp; left: Node; right: Node }
  | { type: 'chain'; ops: RelOp[]; items: Node[] }
  | { type: 'not'; arg: Node }
  | { type: 'logic'; op: LogicOp; left: Node; right: Node }
  | { type: 'setop'; op: SetOp; left: Node; right: Node }
  | { type: 'compl'; arg: Node }
  | { type: 'set'; items: Node[] }
  | { type: 'tuple'; items: Node[]; open: '(' | '['; close: ')' | ']' }
  | { type: 'list'; items: Node[] };

export type NodeOf<T extends Node['type']> = Extract<Node, { type: T }>;

// ---------- Constructores ----------

export const num = (value: number): Node => (value < 0 ? neg({ type: 'num', value: -value }) : { type: 'num', value });
export const sym = (name: string): Node => ({ type: 'sym', name });
export const bool = (value: boolean): Node => ({ type: 'bool', value });
export const neg = (arg: Node): Node => ({ type: 'neg', arg });
export const add = (...terms: Node[]): Node => (terms.length === 1 ? terms[0] : { type: 'add', terms });
export const sub = (a: Node, b: Node): Node => add(a, neg(b));
export const mul = (...factors: Node[]): Node => (factors.length === 1 ? factors[0] : { type: 'mul', factors });
export const div = (n: Node, d: Node): Node => ({ type: 'div', num: n, den: d });
export const pow = (base: Node, exp: Node): Node => ({ type: 'pow', base, exp });
export const fn = (name: FnName, ...args: Node[]): Node => ({ type: 'fn', name, args });
export const rel = (op: RelOp, left: Node, right: Node): Node => ({ type: 'rel', op, left, right });
export const not = (arg: Node): Node => ({ type: 'not', arg });
export const logic = (op: LogicOp, left: Node, right: Node): Node => ({ type: 'logic', op, left, right });
export const setop = (op: SetOp, left: Node, right: Node): Node => ({ type: 'setop', op, left, right });
export const compl = (arg: Node): Node => ({ type: 'compl', arg });

// ---------- Utilidades ----------

export function children(node: Node): Node[] {
  switch (node.type) {
    case 'num': case 'sym': case 'bool': return [];
    case 'add': return node.terms;
    case 'mul': return node.factors;
    case 'neg': case 'fact': case 'deg': case 'not': case 'compl': return [node.arg];
    case 'div': return [node.num, node.den];
    case 'pow': return [node.base, node.exp];
    case 'fn': return node.args;
    case 'pm': return node.left ? [node.left, node.right] : [node.right];
    case 'rel': case 'logic': case 'setop': return [node.left, node.right];
    case 'chain': case 'set': case 'tuple': case 'list': return node.items;
  }
}

/** Reconstruye un nodo con nuevos hijos (en el mismo orden que `children`). */
export function withChildren(node: Node, kids: Node[]): Node {
  switch (node.type) {
    case 'num': case 'sym': case 'bool': return node;
    case 'add': return { ...node, terms: kids };
    case 'mul': return { ...node, factors: kids };
    case 'neg': case 'fact': case 'deg': case 'not': case 'compl': return { ...node, arg: kids[0] };
    case 'div': return { ...node, num: kids[0], den: kids[1] };
    case 'pow': return { ...node, base: kids[0], exp: kids[1] };
    case 'fn': return { ...node, args: kids };
    case 'pm': return node.left ? { ...node, left: kids[0], right: kids[1] } : { ...node, right: kids[0] };
    case 'rel': case 'logic': case 'setop': return { ...node, left: kids[0], right: kids[1] };
    case 'chain': case 'set': case 'tuple': case 'list': return { ...node, items: kids };
  }
}

export function walk(node: Node, visit: (n: Node, path: number[]) => void, path: number[] = []): void {
  visit(node, path);
  children(node).forEach((c, i) => walk(c, visit, [...path, i]));
}

export function getAt(node: Node, path: number[]): Node {
  let cur = node;
  for (const i of path) cur = children(cur)[i];
  return cur;
}

export function replaceAt(node: Node, path: number[], replacement: Node): Node {
  if (path.length === 0) return replacement;
  const kids = children(node).slice();
  kids[path[0]] = replaceAt(kids[path[0]], path.slice(1), replacement);
  return withChildren(node, kids);
}

export function mapNode(node: Node, f: (n: Node) => Node): Node {
  const kids = children(node);
  const mapped = kids.length ? withChildren(node, kids.map((k) => mapNode(k, f))) : node;
  return f(mapped);
}

export const CONSTANTS = new Set(['pi', 'e', 'infinity']);

/** Variables libres (símbolos que no son constantes conocidas). */
export function freeVars(node: Node, out: Set<string> = new Set()): Set<string> {
  walk(node, (n) => {
    if (n.type === 'sym' && !CONSTANTS.has(n.name)) out.add(n.name);
  });
  return out;
}

export function equalNodes(a: Node, b: Node): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case 'num': return a.value === (b as NodeOf<'num'>).value;
    case 'sym': return a.name === (b as NodeOf<'sym'>).name;
    case 'bool': return a.value === (b as NodeOf<'bool'>).value;
    case 'fn': if (a.name !== (b as NodeOf<'fn'>).name) return false; break;
    case 'rel': if (a.op !== (b as NodeOf<'rel'>).op) return false; break;
    case 'logic': if (a.op !== (b as NodeOf<'logic'>).op) return false; break;
    case 'setop': if (a.op !== (b as NodeOf<'setop'>).op) return false; break;
    case 'chain': if (a.ops.join() !== (b as NodeOf<'chain'>).ops.join()) return false; break;
    case 'tuple': {
      const t = b as NodeOf<'tuple'>;
      if (a.open !== t.open || a.close !== t.close) return false;
      break;
    }
    case 'pm': if ((a.left === null) !== ((b as NodeOf<'pm'>).left === null)) return false; break;
    default: break;
  }
  const ca = children(a);
  const cb = children(b);
  return ca.length === cb.length && ca.every((c, i) => equalNodes(c, cb[i]));
}

export function isNumeric(node: Node): boolean {
  return freeVars(node).size === 0 && !containsType(node, ['rel', 'logic', 'setop', 'set', 'bool', 'not', 'chain', 'list', 'tuple', 'compl']);
}

export function containsType(node: Node, types: Node['type'][]): boolean {
  let found = false;
  walk(node, (n) => {
    if (types.includes(n.type)) found = true;
  });
  return found;
}

export function countNodes(node: Node): number {
  let c = 0;
  walk(node, () => c++);
  return c;
}

/** Aplana sumas y productos anidados y elimina dobles negaciones triviales. */
export function flatten(node: Node): Node {
  return mapNode(node, (n) => {
    if (n.type === 'add') {
      const terms: Node[] = [];
      for (const t of n.terms) {
        if (t.type === 'add') terms.push(...t.terms);
        else terms.push(t);
      }
      return terms.length === 1 ? terms[0] : { type: 'add', terms };
    }
    if (n.type === 'mul') {
      const factors: Node[] = [];
      for (const f of n.factors) {
        if (f.type === 'mul') factors.push(...f.factors);
        else factors.push(f);
      }
      return factors.length === 1 ? factors[0] : { type: 'mul', factors };
    }
    if (n.type === 'neg' && n.arg.type === 'neg') return n.arg.arg;
    return n;
  });
}

/** Expande los ± en todas sus combinaciones. */
export function expandPm(node: Node): Node[] {
  const found: { path: number[] | null } = { path: null };
  walk(node, (n, path) => {
    if (!found.path && n.type === 'pm') found.path = path;
  });
  const pmPath = found.path;
  if (!pmPath) return [node];
  const target = getAt(node, pmPath) as NodeOf<'pm'>;
  const plus = target.left ? add(target.left, target.right) : target.right;
  const minus = target.left ? add(target.left, neg(target.right)) : neg(target.right);
  return [...expandPm(replaceAt(node, pmPath, plus)), ...expandPm(replaceAt(node, pmPath, minus))];
}
