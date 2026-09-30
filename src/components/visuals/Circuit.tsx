// Circuito de compuertas lógicas dibujado a partir de una expresión booleana.
import { useMemo } from 'react';
import type { Node } from '../../math/ast';
import { evalBool } from '../../math/evaluate';
import { parse } from '../../math/parse';

interface GateNode {
  id: number;
  kind: 'input' | 'not' | 'and' | 'or' | 'xor' | 'implies' | 'iff' | 'const';
  name?: string;
  node: Node;
  children: GateNode[];
  col: number;
  y: number;
}

const COL_W = 118;
const ROW_H = 58;
const GATE_W = 58;

function build(node: Node, counter: { n: number }): GateNode {
  const id = counter.n++;
  if (node.type === 'sym') return { id, kind: 'input', name: node.name, node, children: [], col: 0, y: 0 };
  if (node.type === 'bool') return { id, kind: 'const', name: node.value ? '1' : '0', node, children: [], col: 0, y: 0 };
  if (node.type === 'not') return { id, kind: 'not', node, children: [build(node.arg, counter)], col: 0, y: 0 };
  if (node.type === 'logic') return { id, kind: node.op, node, children: [build(node.left, counter), build(node.right, counter)], col: 0, y: 0 };
  throw new Error('Expresión no soportada en el circuito');
}

function depth(g: GateNode): number {
  return g.children.length ? 1 + Math.max(...g.children.map(depth)) : 0;
}

function layout(root: GateNode): { nodes: GateNode[]; cols: number; rows: number } {
  const maxD = depth(root);
  const nodes: GateNode[] = [];
  let leaf = 0;
  const rec = (g: GateNode, d: number) => {
    g.children.forEach((c) => rec(c, d + 1));
    if (!g.children.length) {
      g.col = 0;
      g.y = leaf++;
    } else {
      g.col = maxD - d;
      g.y = g.children.reduce((a, c) => a + c.y, 0) / g.children.length;
    }
    nodes.push(g);
  };
  rec(root, 0);
  return { nodes, cols: maxD + 1, rows: Math.max(1, leaf) };
}

function gatePath(kind: GateNode['kind'], x: number, y: number): string {
  const h = 20;
  switch (kind) {
    case 'and':
      return `M${x},${y - h} H${x + 28} A${h},${h} 0 0 1 ${x + 28},${y + h} H${x} Z`;
    case 'or':
      return `M${x},${y - h} Q${x + 34},${y - h} ${x + GATE_W - 8},${y} Q${x + 34},${y + h} ${x},${y + h} Q${x + 14},${y} ${x},${y - h} Z`;
    case 'xor':
      return `M${x + 6},${y - h} Q${x + 38},${y - h} ${x + GATE_W - 4},${y} Q${x + 38},${y + h} ${x + 6},${y + h} Q${x + 20},${y} ${x + 6},${y - h} Z M${x - 2},${y - h} Q${x + 12},${y} ${x - 2},${y + h}`;
    case 'not':
      return `M${x + 8},${y - 15} L${x + 40},${y} L${x + 8},${y + 15} Z`;
    default:
      return `M${x},${y - h} H${x + GATE_W - 8} V${y + h} H${x} Z`;
  }
}

const SYMBOL: Record<string, string> = { implies: '⇒', iff: '⇔' };

export function Circuit({ expr, inputs, onToggle, onGateClick, showValues = true }: { expr: string; inputs?: Record<string, boolean>; onToggle?(name: string): void; onGateClick?(preorderIndex: number): void; showValues?: boolean }) {
  const data = useMemo(() => {
    try {
      const root = build(parse(expr, { mode: 'logic' }), { n: 0 });
      return { root, ...layout(root) };
    } catch {
      return null;
    }
  }, [expr]);
  if (!data) return <div className="small muted">No se pudo dibujar el circuito.</div>;
  const { root, nodes, cols, rows } = data;
  const W = cols * COL_W + 110;
  const H = rows * ROW_H + 30;
  const X = (g: GateNode) => 70 + g.col * COL_W;
  const Y = (g: GateNode) => 30 + g.y * ROW_H;
  const val = (g: GateNode): boolean | null => {
    if (!inputs) return null;
    try {
      return evalBool(g.node, inputs);
    } catch {
      return null;
    }
  };
  const outX = (g: GateNode) => (g.kind === 'input' || g.kind === 'const' ? X(g) + 18 : g.kind === 'not' ? X(g) + 48 : X(g) + GATE_W - 6);
  const wireClass = (v: boolean | null) => (v === null ? 'wire' : v ? 'wire on' : 'wire off');
  const outVal = val(root);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 340 }} role="img" aria-label={`Circuito para ${expr}`} className="circuit">
      {nodes.map((g) =>
        g.children.map((c, i) => {
          const x1 = outX(c), y1 = Y(c);
          const inY = g.children.length === 1 ? Y(g) : Y(g) + (i === 0 ? -10 : 10);
          const x2 = X(g) + (g.kind === 'or' || g.kind === 'xor' ? 8 : 2);
          const mid = (x1 + x2) / 2;
          return <path key={`${g.id}-${c.id}`} d={`M${x1},${y1} H${mid} V${inY} H${x2}`} className={wireClass(val(c))} />;
        }),
      )}
      {nodes.map((g) => {
        const v = val(g);
        if (g.kind === 'input' || g.kind === 'const') {
          return (
            <g key={g.id} className={onToggle && g.kind === 'input' ? 'circuit-input clickable' : 'circuit-input'} onClick={() => g.kind === 'input' && onToggle?.(g.name!)}>
              <rect x={X(g) - 26} y={Y(g) - 14} width={44} height={28} rx={8} className={v === null ? 'switch-box' : v ? 'switch-box on' : 'switch-box off'} />
              <text x={X(g) - 4} y={Y(g) + 1} textAnchor="middle" dominantBaseline="middle" className="circuit-label">
                {g.name}
                {showValues && v !== null ? `=${v ? 1 : 0}` : ''}
              </text>
            </g>
          );
        }
        return (
          <g key={g.id} className={onGateClick && g.kind !== 'not' ? 'clickable' : undefined} onClick={() => g.kind !== 'not' && onGateClick?.(g.id)}>
            <path d={gatePath(g.kind, X(g), Y(g))} className={`gate ${v ? 'on' : ''}`} />
            {g.kind === 'not' && <circle cx={X(g) + 44} cy={Y(g)} r={4} className={`gate ${v ? 'on' : ''}`} />}
            <text x={X(g) + (g.kind === 'not' ? 20 : 24)} y={Y(g) + 1} textAnchor="middle" dominantBaseline="middle" className="gate-label">
              {g.kind === 'not' ? '' : SYMBOL[g.kind] ?? g.kind.toUpperCase()}
            </text>
          </g>
        );
      })}
      <path d={`M${outX(root)},${Y(root)} H${W - 40}`} className={wireClass(outVal)} />
      <circle cx={W - 26} cy={Y(root)} r={13} className={`lamp ${outVal ? 'on' : ''}`} />
      <text x={W - 26} y={Y(root) + 26} textAnchor="middle" className="viz-tick">{outVal === null ? 'salida' : outVal ? 'encendida' : 'apagada'}</text>
    </svg>
  );
}
