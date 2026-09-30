// Modelos interactivos de lógica y conjuntos.
import { useMemo, useState } from 'react';
import type { Node } from '../math/ast';
import { children, freeVars, getAt, replaceAt } from '../math/ast';
import { assignments } from '../math/equivalence';
import { evalBool, evalMembership } from '../math/evaluate';
import { parse } from '../math/parse';
import { toLatex, toText } from '../math/print';
import { subformulas } from '../content/gen/logic';
import { regionsOf } from '../content/check';
import { Tex } from '../components/Math';
import { Circuit } from '../components/visuals/Circuit';
import { VennDiagram, regionIds } from '../components/visuals/VennDiagram';

const LOGIC_SYMBOLS = ['¬', '∧', '∨', '⇒', '⇔', '⊻', '(', ')'];

function FormulaInput({ value, onChange, symbols = LOGIC_SYMBOLS, placeholder }: { value: string; onChange(v: string): void; symbols?: string[]; placeholder?: string }) {
  return (
    <div className="formula-input">
      <input className="input mono" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} spellCheck={false} />
      <div className="row wrap" style={{ gap: 4, marginTop: 6 }}>
        {symbols.map((s) => (
          <button key={s} type="button" className="symbol-btn" onClick={() => onChange(`${value}${s === '(' || s === ')' ? s : ` ${s} `}`.replace(/\s+/g, ' '))}>
            {s}
          </button>
        ))}
        <button type="button" className="symbol-btn" onClick={() => onChange('')} title="Borrar">⌫</button>
      </div>
    </div>
  );
}

function safeParse(src: string, mode: 'logic' | 'set' | 'bool'): { node: Node | null; error: string | null } {
  try {
    return { node: parse(src, { mode }), error: null };
  } catch (e) {
    return { node: null, error: e instanceof Error ? e.message : 'Fórmula inválida' };
  }
}

const vf = (b: boolean) => (b ? 'V' : 'F');

// ---------------------------------------------------------------------------

export function TruthTableWidget({ formula = '(p ⇒ q) ∧ p' }: { formula?: string }) {
  const [src, setSrc] = useState(formula);
  const { node, error } = useMemo(() => safeParse(src, 'logic'), [src]);
  const vars = node ? [...freeVars(node)].sort() : [];
  const cols = node ? subformulas(node) : [];
  const rows = assignments(vars);
  const last = node ? rows.map((r) => evalBool(node, r)) : [];
  const cls = last.length ? (last.every(Boolean) ? 'Tautología' : last.every((v) => !v) ? 'Contradicción' : 'Contingencia') : '';
  return (
    <div className="widget">
      <FormulaInput value={src} onChange={setSrc} placeholder="Ej.: (p ⇒ q) ∧ ¬q" />
      {error && <div className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
      {node && vars.length > 5 && <div className="small muted">Usa como máximo 5 variables.</div>}
      {node && vars.length <= 5 && (
        <>
          <div className="row wrap" style={{ margin: '10px 0' }}>
            <Tex tex={toLatex(node)} />
            <span className={`badge ${cls === 'Tautología' ? 'success' : cls === 'Contradicción' ? 'danger' : 'info'}`}>{cls}</span>
          </div>
          <div className="table-wrap">
            <table className="truth-table readonly">
              <thead>
                <tr>
                  {vars.map((v) => <th key={v} className="var-col"><Tex tex={v} /></th>)}
                  {cols.map((c, i) => <th key={i}><Tex tex={toLatex(c)} /></th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {vars.map((v) => <td key={v} className={`var-col ${r[v] ? 't' : 'f'}`}>{vf(r[v])}</td>)}
                    {cols.map((c, j) => {
                      const val = evalBool(c, r);
                      return <td key={j} className={`${val ? 't' : 'f'} ${j === cols.length - 1 ? 'final' : ''}`}>{vf(val)}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

interface TreeNode {
  node: Node;
  label: string;
  kids: TreeNode[];
  x: number;
  depth: number;
}

function buildTree(node: Node): { root: TreeNode; leaves: number; depth: number } {
  let leaf = 0;
  let maxDepth = 0;
  const rec = (n: Node, depth: number): TreeNode => {
    maxDepth = Math.max(maxDepth, depth);
    const kids = n.type === 'not' ? [n.arg] : n.type === 'logic' ? [n.left, n.right] : [];
    const label = n.type === 'not' ? '¬' : n.type === 'logic' ? { and: '∧', or: '∨', xor: '⊻', implies: '⇒', iff: '⇔' }[n.op] : toText(n);
    const kt = kids.map((k) => rec(k, depth + 1));
    const x = kt.length ? kt.reduce((a, k) => a + k.x, 0) / kt.length : leaf++;
    return { node: n, label, kids: kt, x, depth };
  };
  const root = rec(node, 0);
  return { root, leaves: Math.max(1, leaf), depth: maxDepth };
}

/** Árbol de una proposición con nodos reactivos: cada nodo muestra su valor de verdad. */
export function PropTreeWidget({ formula = '(p ∧ q) ⇒ ¬r' }: { formula?: string }) {
  const [src, setSrc] = useState(formula);
  const { node, error } = useMemo(() => safeParse(src, 'logic'), [src]);
  const vars = node ? [...freeVars(node)].sort() : [];
  const [env, setEnv] = useState<Record<string, boolean>>({});
  const values: Record<string, boolean> = Object.fromEntries(vars.map((v) => [v, env[v] ?? true]));
  const tree = useMemo(() => (node ? buildTree(node) : null), [node]);
  const W = Math.max(320, (tree?.leaves ?? 1) * 90);
  const H = ((tree?.depth ?? 0) + 1) * 78 + 20;
  const X = (x: number) => 45 + x * ((W - 90) / Math.max(1, (tree?.leaves ?? 1) - 1 || 1));
  const Y = (d: number) => 36 + d * 78;

  const renderNode = (t: TreeNode): React.ReactNode[] => {
    let val = false;
    try {
      val = evalBool(t.node, values);
    } catch {
      /* sin valor */
    }
    const out: React.ReactNode[] = [];
    for (const k of t.kids) {
      out.push(<line key={`e${t.depth}-${t.x}-${k.x}`} x1={X(t.x)} y1={Y(t.depth)} x2={X(k.x)} y2={Y(k.depth)} className="tree-edge" />);
      out.push(...renderNode(k));
    }
    const isLeaf = t.kids.length === 0;
    out.push(
      <g
        key={`n${t.depth}-${t.x}`}
        className={`tree-node ${val ? 't' : 'f'} ${isLeaf ? 'leaf' : ''}`}
        onClick={() => isLeaf && t.node.type === 'sym' && setEnv({ ...values, [t.node.name]: !values[t.node.name] })}
      >
        <circle cx={X(t.x)} cy={Y(t.depth)} r={24} />
        <text x={X(t.x)} y={Y(t.depth) - 4} textAnchor="middle" className="tree-label">{t.label}</text>
        <text x={X(t.x)} y={Y(t.depth) + 13} textAnchor="middle" className="tree-value">{vf(val)}</text>
      </g>,
    );
    return out;
  };

  return (
    <div className="widget">
      <FormulaInput value={src} onChange={setSrc} placeholder="Ej.: ¬(p ∨ q) ⇔ (¬p ∧ ¬q)" />
      {error && <div className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
      {node && (
        <>
          <div className="row wrap" style={{ margin: '10px 0' }}>
            {vars.map((v) => (
              <button key={v} type="button" className={`toggle-pill ${values[v] ? 't' : 'f'}`} onClick={() => setEnv({ ...values, [v]: !values[v] })}>
                <Tex tex={v} /> = {vf(values[v])}
              </button>
            ))}
            <span className="small muted">Toca una variable (o una hoja del árbol) para cambiar su valor.</span>
          </div>
          <div className="table-wrap">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 360, minWidth: Math.min(W, 560) }}>
              {tree && renderNode(tree.root)}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

const VENN2_NAMES: { src: string; regions: string[] }[] = [
  '∅', 'U', 'A', 'B', "A'", "B'", 'A ∪ B', 'A ∩ B', 'A - B', 'B - A', 'A \\triangle B', "(A ∪ B)'", "(A ∩ B)'", "A' ∪ B", "A ∪ B'", "(A \\triangle B)'",
].map((src) => ({ src, regions: src === '∅' ? [] : src === 'U' ? regionIds(['A', 'B']) : regionsOf(parse(src, { mode: 'set' }), ['A', 'B']) }));

function describeSelection(regs: Set<string>, sets: string[]): string {
  if (sets.length === 2) {
    const found = VENN2_NAMES.find((c) => c.regions.length === regs.size && c.regions.every((r) => regs.has(r)));
    if (found) return found.src === '∅' ? '\\emptyset' : found.src === 'U' ? 'U' : toLatex(parse(found.src, { mode: 'set' }));
  }
  if (regs.size === 0) return '\\emptyset';
  if (regs.size === 1 << sets.length) return 'U';
  const term = (r: string) => sets.map((s) => (r.includes(s) ? s : `${s}^{c}`)).join(' \\cap ');
  return [...regs].map((r) => `(${term(r)})`).join(' \\cup ');
}

export function VennWidget({ sets = 2, expr = 'A ∩ B' }: { sets?: number; expr?: string }) {
  const names = sets === 3 ? ['A', 'B', 'C'] : ['A', 'B'];
  const [src, setSrc] = useState(expr);
  const [custom, setCustom] = useState<Set<string> | null>(null);
  const { node, error } = useMemo(() => safeParse(src, 'set'), [src]);
  let shaded = new Set<string>();
  if (custom) shaded = custom;
  else if (node) {
    try {
      shaded = new Set(regionIds(names).filter((r) => evalMembership(node, Object.fromEntries(names.map((s) => [s, r.includes(s)])))));
    } catch {
      /* expresión con conjuntos no dibujables */
    }
  }
  return (
    <div className="widget">
      <FormulaInput value={src} onChange={(v) => { setSrc(v); setCustom(null); }} symbols={['∪', '∩', '-', "'", '(', ')']} placeholder="Ej.: (A ∪ B)'" />
      {error && !custom && <div className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>{error}</div>}
      <VennDiagram
        sets={names}
        selected={shaded}
        onToggle={(r) => {
          const next = new Set(shaded);
          if (next.has(r)) next.delete(r);
          else next.add(r);
          setCustom(next);
        }}
      />
      <div className="row wrap center" style={{ justifyContent: 'center' }}>
        <span className="small muted">{custom ? 'Tu selección corresponde a:' : 'Región de:'}</span>
        <Tex tex={custom ? describeSelection(custom, names) : node ? toLatex(node) : ''} />
        {custom && <button className="btn sm ghost" onClick={() => setCustom(null)}>Volver a la fórmula</button>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function preorderPaths(node: Node, path: number[] = [], out: number[][] = []): number[][] {
  out.push(path);
  children(node).forEach((c, i) => preorderPaths(c, [...path, i], out));
  return out;
}

const CYCLE: Record<string, 'and' | 'or' | 'xor'> = { and: 'or', or: 'xor', xor: 'and', implies: 'and', iff: 'and' };

/** Circuito con entradas conmutables y compuertas intercambiables. */
export function CircuitWidget({ expr = '(A ∧ B) ∨ ¬C' }: { expr?: string }) {
  const [ast, setAst] = useState<Node>(() => parse(expr, { mode: 'logic' }));
  const vars = [...freeVars(ast)].sort();
  const [inputs, setInputs] = useState<Record<string, boolean>>(() => Object.fromEntries(vars.map((v, i) => [v, i % 2 === 0])));
  const values = Object.fromEntries(vars.map((v) => [v, inputs[v] ?? false]));
  const paths = preorderPaths(ast);
  const out = evalBool(ast, values);
  const rows = assignments(vars);

  const onGate = (i: number) => {
    const path = paths[i];
    const n = getAt(ast, path);
    if (n.type !== 'logic') return;
    setAst(replaceAt(ast, path, { ...n, op: CYCLE[n.op] }));
  };

  return (
    <div className="widget">
      <div className="row wrap between">
        <Tex tex={toLatex(ast, { boolAlgebra: true, boolStyle: '10' })} />
        <span className={`badge ${out ? 'success' : ''}`}>Salida: {out ? '1 (encendida)' : '0 (apagada)'}</span>
      </div>
      <Circuit expr={toText(ast)} inputs={values} onToggle={(v) => setInputs({ ...values, [v]: !values[v] })} onGateClick={onGate} />
      <div className="small muted">Toca una entrada para alternar 0/1 y una compuerta para cambiarla (AND → OR → XOR).</div>
      <details style={{ marginTop: 8 }}>
        <summary className="small">Ver tabla del circuito</summary>
        <table className="truth-table readonly" style={{ marginTop: 8 }}>
          <thead>
            <tr>{vars.map((v) => <th key={v}>{v}</th>)}<th>Salida</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const o = evalBool(ast, r);
              const cur = vars.every((v) => r[v] === values[v]);
              return (
                <tr key={i} className={cur ? 'current' : ''}>
                  {vars.map((v) => <td key={v}>{r[v] ? 1 : 0}</td>)}
                  <td className={o ? 't' : 'f'}>{o ? 1 : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </div>
  );
}
