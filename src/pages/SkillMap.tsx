// Árbol de habilidades (Knowledge Graph): dependencias entre temas y su estado.
import dagre, { Graph } from '@dagrejs/dagre';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ancestors, BLOCK_BY_ID, BLOCKS, descendants, SKILLS, skillsOfBlock } from '../content/curriculum';
import type { BlockId } from '../content/types';
import { Icon } from '../components/Icon';
import { allStates, dueReviews, masteryScore } from '../learning/engine';
import type { SkillState } from '../learning/types';
import { useProgress } from '../store/progress';

const NODE_W = 188;
const NODE_H = 60;

const STATE_LABEL: Record<SkillState, string> = {
  locked: 'Bloqueada',
  available: 'Disponible',
  'in-progress': 'En progreso',
  mastered: 'Dominada',
};

const STATE_ICON: Record<SkillState, string> = { locked: 'lock', available: 'play', 'in-progress': 'target', mastered: 'check' };

function wrapTitle(t: string, max = 24): string[] {
  const words = t.split(' ');
  const lines: string[] = [''];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + ' ' + w).trim();
  }
  if (lines.length > 2) return [lines[0], `${lines.slice(1).join(' ').slice(0, max - 1)}…`];
  return lines;
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
  }
  return d;
}

function useLayout() {
  return useMemo(() => {
    const g = new Graph();
    g.setGraph({ rankdir: 'LR', nodesep: 16, ranksep: 64, marginx: 20, marginy: 20 });
    g.setDefaultEdgeLabel(() => ({}));
    for (const s of SKILLS) g.setNode(s.id, { width: NODE_W, height: NODE_H });
    for (const s of SKILLS) for (const p of s.prereqs) g.setEdge(p, s.id);
    dagre.layout(g);
    const nodes = SKILLS.map((s) => {
      const n = g.node(s.id) as { x: number; y: number };
      return { skill: s, x: n.x, y: n.y };
    });
    const edges = g.edges().map((e: { v: string; w: string }) => ({ from: e.v, to: e.w, points: (g.edge(e) as { points: { x: number; y: number }[] }).points }));
    const gg = g.graph() as { width?: number; height?: number };
    return { nodes, edges, width: gg.width ?? 1000, height: gg.height ?? 800 };
  }, []);
}

function KnowledgeGraph({ filter }: { filter: BlockId | null }) {
  const data = useProgress();
  const states = allStates(data);
  const due = new Set(dueReviews(data));
  const { nodes, edges, width, height } = useLayout();
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState({ x: 0, y: 0, w: width, h: height });
  const drag = useRef<{ x: number; y: number; vb: typeof vb; moved: boolean } | null>(null);

  useEffect(() => {
    // Encuadre inicial: mostrar la primera parte del grafo a una escala legible
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = Math.max(rect.width / width, 0.62);
    const w = rect.width / scale;
    const h = rect.height / scale;
    setVb({ x: 0, y: Math.max(0, (height - h) / 2), w, h });
  }, [width, height]);

  const related = useMemo(() => {
    if (!hover) return null;
    return new Set([hover, ...ancestors(hover), ...descendants(hover)]);
  }, [hover]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = svgRef.current!.getBoundingClientRect();
    const mx = vb.x + ((e.clientX - rect.left) / rect.width) * vb.w;
    const my = vb.y + ((e.clientY - rect.top) / rect.height) * vb.h;
    const k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
    const w = Math.min(width * 1.6, Math.max(300, vb.w * k));
    const h = w * (vb.h / vb.w);
    setVb({ x: mx - (mx - vb.x) * (w / vb.w), y: my - (my - vb.y) * (h / vb.h), w, h });
  };

  return (
    <div className="kgraph">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        onWheel={onWheel}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, vb, moved: false };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const rect = svgRef.current!.getBoundingClientRect();
          const dx = ((e.clientX - d.x) / rect.width) * d.vb.w;
          const dy = ((e.clientY - d.y) / rect.height) * d.vb.h;
          if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) {
            d.moved = true;
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          }
          setVb({ ...d.vb, x: d.vb.x - dx, y: d.vb.y - dy });
        }}
        onPointerUp={() => {
          setTimeout(() => (drag.current = null), 0);
        }}
        role="img"
        aria-label="Grafo de habilidades y sus dependencias"
      >
        <defs>
          <marker id="kg-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" className="kg-arrowhead" />
          </marker>
        </defs>
        {edges.map((e) => {
          const dim = (filter && SKILLS.find((s) => s.id === e.to)?.block !== filter) || (related && !(related.has(e.from) && related.has(e.to)));
          const active = states[e.from] === 'mastered';
          return <path key={`${e.from}-${e.to}`} d={smoothPath(e.points)} className={`kg-edge ${active ? 'active' : ''} ${dim ? 'dim' : ''}`} markerEnd="url(#kg-arrow)" />;
        })}
        {nodes.map(({ skill, x, y }) => {
          const st = states[skill.id];
          const b = BLOCK_BY_ID[skill.block];
          const dim = (filter && skill.block !== filter) || (related && !related.has(skill.id));
          const p = data.skills[skill.id];
          const score = masteryScore(p);
          const lines = wrapTitle(skill.title);
          return (
            <g
              key={skill.id}
              transform={`translate(${x - NODE_W / 2},${y - NODE_H / 2})`}
              className={`kg-node ${st} ${dim ? 'dim' : ''}`}
              style={{ ['--h' as string]: String(b.hue) }}
              tabIndex={0}
              role="link"
              aria-label={`${skill.title}: ${STATE_LABEL[st]}`}
              onPointerEnter={() => setHover(skill.id)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(skill.id)}
              onBlur={() => setHover(null)}
              onClick={() => {
                if (!drag.current?.moved) navigate(`/habilidad/${skill.id}`);
              }}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/habilidad/${skill.id}`)}
            >
              <rect width={NODE_W} height={NODE_H} rx={12} className="kg-box" />
              <rect width={6} height={NODE_H - 16} x={8} y={8} rx={3} className="kg-stripe" />
              {lines.map((l, i) => (
                <text key={i} x={22} y={lines.length === 1 ? 26 : 19 + i * 16} className="kg-title">{l}</text>
              ))}
              <text x={22} y={NODE_H - 9} className="kg-sub">
                {STATE_LABEL[st]}{due.has(skill.id) ? ' · repasar' : ''}
              </text>
              {st === 'in-progress' && p && (
                <g>
                  <rect x={NODE_W - 58} y={NODE_H - 15} width={44} height={5} rx={2.5} className="kg-track" />
                  <rect x={NODE_W - 58} y={NODE_H - 15} width={44 * Math.min(1, p.pL / 0.9)} height={5} rx={2.5} className="kg-fill" />
                </g>
              )}
              <g transform={`translate(${NODE_W - 30},${10})`} className="kg-icon">
                <circle cx={10} cy={10} r={11} />
                <foreignObject x={1} y={1} width={18} height={18}>
                  <Icon name={STATE_ICON[st]} size={16} stroke={2.2} />
                </foreignObject>
              </g>
              {due.has(skill.id) && <circle cx={NODE_W - 6} cy={6} r={5} className="kg-due" />}
              <title>{`${skill.title} — ${STATE_LABEL[st]}${score !== null ? ` · dominio ${Math.round(score * 100)}%` : ''}`}</title>
            </g>
          );
        })}
      </svg>
      <div className="kgraph-hint tiny faint">Arrastra para moverte · rueda para acercar · pasa el mouse por un tema para ver sus requisitos y lo que desbloquea</div>
    </div>
  );
}

function ListView({ filter }: { filter: BlockId | null }) {
  const data = useProgress();
  const states = allStates(data);
  return (
    <div className="stack lg">
      {BLOCKS.filter((b) => !filter || b.id === filter).map((b) => (
        <div key={b.id} className="card" style={{ ['--h' as string]: String(b.hue) }}>
          <div className="card-title">
            <div className="row">
              <span className="block-tag">Bloque {b.number}</span>
              <h3>{b.title}</h3>
            </div>
          </div>
          <div className="skill-list">
            {skillsOfBlock(b.id).map((s) => {
              const st = states[s.id];
              const p = data.skills[s.id];
              return (
                <Link key={s.id} to={`/habilidad/${s.id}`} className={`skill-row ${st}`}>
                  <span className={`state-icon ${st}`}><Icon name={STATE_ICON[st]} size={16} stroke={2.2} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="skill-row-title">{s.title}</div>
                    <div className="tiny faint">{s.summary}</div>
                  </div>
                  <div className="skill-row-meta">
                    <span className="badge">{STATE_LABEL[st]}</span>
                    {st === 'in-progress' && p && (
                      <div className="progress" style={{ width: 80, marginTop: 6 }}><div style={{ width: `${Math.min(100, (p.pL / 0.9) * 100)}%` }} /></div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SkillMap() {
  const [params, setParams] = useSearchParams();
  const filter = (params.get('bloque') as BlockId | null) ?? null;
  const [view, setView] = useState<'graph' | 'list'>(params.get('vista') === 'lista' ? 'list' : 'graph');
  const data = useProgress();
  const states = allStates(data);
  const counts = Object.values(states).reduce((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {} as Record<SkillState, number>);

  return (
    <div className="page wide">
      <div className="page-header">
        <div>
          <h1>Temario</h1>
          <p>Cada tema se desbloquea al dominar sus requisitos. {counts.mastered ?? 0} dominados · {counts['in-progress'] ?? 0} en progreso · {counts.available ?? 0} disponibles · {counts.locked ?? 0} bloqueados.</p>
        </div>
        <div className="tabs">
          <button className={view === 'graph' ? 'active' : ''} onClick={() => setView('graph')}><Icon name="map" size={16} /> Grafo</button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}><Icon name="list" size={16} /> Lista</button>
        </div>
      </div>
      <div className="row wrap" style={{ marginBottom: 14, gap: 6 }}>
        <button className={`chip ${!filter ? 'active' : ''}`} onClick={() => setParams({})}>Todos</button>
        {BLOCKS.map((b) => (
          <button key={b.id} className={`chip ${filter === b.id ? 'active' : ''}`} onClick={() => setParams({ bloque: b.id })} style={{ ['--h' as string]: String(b.hue) }}>
            <span className="block-dot" /> {b.short}
          </button>
        ))}
      </div>
      {view === 'graph' ? <KnowledgeGraph filter={filter} /> : <ListView filter={filter} />}
      <div className="row wrap small muted" style={{ marginTop: 12, gap: 16 }}>
        {(['mastered', 'in-progress', 'available', 'locked'] as SkillState[]).map((s) => (
          <span key={s} className="row" style={{ gap: 6 }}>
            <span className={`state-icon ${s}`}><Icon name={STATE_ICON[s]} size={14} stroke={2.2} /></span>
            {STATE_LABEL[s]}
          </span>
        ))}
        <span className="row" style={{ gap: 6 }}><span className="kg-due-dot" /> Repaso pendiente</span>
      </div>
    </div>
  );
}
