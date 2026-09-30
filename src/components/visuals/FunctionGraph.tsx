// Graficador de funciones en SVG: ejes, cuadrícula, varias funciones con parámetros,
// puntos, área sombreada, desplazamiento/zoom y lectura de valores con crosshair.
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { compileNum } from '../../math/evaluate';
import { parse } from '../../math/parse';
import { ChartTooltip, fmt, niceTicks, type TooltipState } from '../charts/ChartKit';

export interface View {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface GraphFn {
  expr: string;
  label?: string;
  dashed?: boolean;
  /** Índice de color (1-3). */
  slot?: number;
}

export interface Scale {
  sx(x: number): number;
  sy(y: number): number;
  view: View;
  W: number;
  H: number;
}

interface Props {
  functions: GraphFn[];
  params?: Record<string, number>;
  points?: { x: number; y: number; label?: string; open?: boolean }[];
  view?: View;
  shade?: { expr: string; from: number; to: number };
  height?: number;
  interactive?: boolean;
  onViewChange?(v: View): void;
  overlay?(s: Scale): ReactNode;
  legend?: boolean;
}

const W = 640;

export function compileExpr(expr: string): ((env: Record<string, number>) => number) | null {
  try {
    const src = expr.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, '');
    return compileNum(parse(src, { decimalComma: false }));
  } catch {
    return null;
  }
}

function autoView(fns: ((env: Record<string, number>) => number)[], params: Record<string, number>): View {
  const xmin = -10, xmax = 10;
  const ys: number[] = [];
  for (const f of fns) {
    for (let i = 0; i <= 200; i++) {
      const x = xmin + ((xmax - xmin) * i) / 200;
      const v = f({ ...params, x });
      if (Number.isFinite(v) && Math.abs(v) < 1e6) ys.push(v);
    }
  }
  if (!ys.length) return { xmin, xmax, ymin: -10, ymax: 10 };
  ys.sort((a, b) => a - b);
  let lo = ys[Math.floor(ys.length * 0.05)], hi = ys[Math.floor(ys.length * 0.95)];
  lo = Math.min(lo, 0);
  hi = Math.max(hi, 0);
  const pad = Math.max(1, (hi - lo) * 0.15);
  return { xmin, xmax, ymin: Math.max(-60, lo - pad), ymax: Math.min(60, hi + pad) };
}

export function FunctionGraph({ functions, params = {}, points, view, shade, height = 360, interactive = false, onViewChange, overlay, legend = true }: Props) {
  const compiled = useMemo(() => functions.map((f) => compileExpr(f.expr)), [functions]);
  const valid = compiled.filter((c): c is NonNullable<typeof c> => !!c);
  const [internalView, setInternalView] = useState<View | null>(null);
  const baseView = useMemo(() => view ?? autoView(valid, params), [view, valid.length, JSON.stringify(params), functions.map((f) => f.expr).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const v = internalView ?? baseView;
  const H = height;
  const svgRef = useRef<SVGSVGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; id: number } | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const sx = (x: number) => ((x - v.xmin) / (v.xmax - v.xmin)) * W;
  const sy = (y: number) => H - ((y - v.ymin) / (v.ymax - v.ymin)) * H;
  const ix = (px: number) => v.xmin + (px / W) * (v.xmax - v.xmin);
  const iy = (py: number) => v.ymin + ((H - py) / H) * (v.ymax - v.ymin);

  const setView = (nv: View) => {
    setInternalView(nv);
    onViewChange?.(nv);
  };

  const paths = useMemo(() => {
    return compiled.map((f) => {
      if (!f) return '';
      const N = 520;
      const range = v.ymax - v.ymin;
      let d = '';
      let prev: number | null = null;
      for (let i = 0; i <= N; i++) {
        const x = v.xmin + ((v.xmax - v.xmin) * i) / N;
        const y = f({ ...params, x });
        if (!Number.isFinite(y) || y < v.ymin - range * 4 || y > v.ymax + range * 4) {
          prev = null;
          continue;
        }
        if (prev !== null && Math.abs(y - prev) > range * 1.5) {
          prev = null;
        }
        d += `${prev === null ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`;
        prev = y;
      }
      return d;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compiled, v.xmin, v.xmax, v.ymin, v.ymax, JSON.stringify(params)]);

  const shadePath = useMemo(() => {
    if (!shade) return '';
    const f = compileExpr(shade.expr);
    if (!f) return '';
    const N = 200;
    let d = `M${sx(shade.from)},${sy(0)}`;
    for (let i = 0; i <= N; i++) {
      const x = shade.from + ((shade.to - shade.from) * i) / N;
      const y = f({ ...params, x });
      d += `L${sx(x)},${sy(Number.isFinite(y) ? Math.max(v.ymin - 1, Math.min(v.ymax + 1, y)) : 0)}`;
    }
    return `${d}L${sx(shade.to)},${sy(0)}Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shade?.expr, shade?.from, shade?.to, v.xmin, v.xmax, v.ymin, v.ymax, JSON.stringify(params)]);

  const xt = niceTicks(v.xmin, v.xmax, 10);
  const yt = niceTicks(v.ymin, v.ymax, 7);
  const axisY = v.ymin <= 0 && v.ymax >= 0 ? sy(0) : H - 1;
  const axisX = v.xmin <= 0 && v.xmax >= 0 ? sx(0) : 1;

  const toSvg = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { px: ((e.clientX - r.left) / r.width) * W, py: ((e.clientY - r.top) / r.height) * H };
  };

  const onMove = (e: React.PointerEvent) => {
    const { px, py } = toSvg(e);
    if (interactive && drag.current && drag.current.id === e.pointerId) {
      const r = svgRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - drag.current.x) / r.width) * (drag.current.view.xmax - drag.current.view.xmin);
      const dy = ((e.clientY - drag.current.y) / r.height) * (drag.current.view.ymax - drag.current.view.ymin);
      const b = drag.current.view;
      setView({ xmin: b.xmin - dx, xmax: b.xmax - dx, ymin: b.ymin + dy, ymax: b.ymax + dy });
      return;
    }
    const x = ix(px);
    setHoverX(x);
    const rows = functions
      .map((f, i) => {
        const c = compiled[i];
        if (!c) return null;
        const val = c({ ...params, x });
        return { value: Number.isFinite(val) ? fmt(val, 3) : 'no definida', label: f.label ?? `f${i + 1}(x)`, color: `var(--viz-${f.slot ?? i + 1})` };
      })
      .filter((r): r is NonNullable<typeof r> => !!r);
    const rect = wrap.current!.getBoundingClientRect();
    setTip({ x: Math.min(e.clientX - rect.left + 14, rect.width - 170), y: Math.max(0, e.clientY - rect.top - 10), title: `x = ${fmt(x, 3)}`, rows });
    void py;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (!interactive) return;
    e.preventDefault();
    const { px, py } = toSvg(e);
    const cx = ix(px), cy = iy(py);
    const k = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    setView({ xmin: cx + (v.xmin - cx) * k, xmax: cx + (v.xmax - cx) * k, ymin: cy + (v.ymin - cy) * k, ymax: cy + (v.ymax - cy) * k });
  };

  const zoom = (k: number) => {
    const cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
    setView({ xmin: cx + (v.xmin - cx) * k, xmax: cx + (v.xmax - cx) * k, ymin: cy + (v.ymin - cy) * k, ymax: cy + (v.ymax - cy) * k });
  };

  return (
    <div className="function-graph" ref={wrap} onPointerLeave={() => { setHoverX(null); setTip(null); }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        className={interactive ? 'interactive' : ''}
        onPointerDown={(e) => {
          if (!interactive) return;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, view: v, id: e.pointerId };
        }}
        onPointerMove={onMove}
        onPointerUp={() => { drag.current = null; }}
        onWheel={onWheel}
        role="img"
        aria-label={`Gráfico de ${functions.map((f) => f.label ?? f.expr).join(', ')}`}
      >
        <rect x="0" y="0" width={W} height={H} className="graph-bg" />
        {xt.map((t) => <line key={`gx${t}`} x1={sx(t)} x2={sx(t)} y1={0} y2={H} className="viz-grid" />)}
        {yt.map((t) => <line key={`gy${t}`} x1={0} x2={W} y1={sy(t)} y2={sy(t)} className="viz-grid" />)}
        <line x1={0} x2={W} y1={axisY} y2={axisY} className="graph-axis" />
        <line x1={axisX} x2={axisX} y1={0} y2={H} className="graph-axis" />
        {xt.filter((t) => Math.abs(t) > 1e-9).map((t) => (
          <text key={`tx${t}`} x={sx(t)} y={Math.min(H - 4, axisY + 15)} className="viz-tick" textAnchor="middle">{fmt(t, 2)}</text>
        ))}
        {yt.filter((t) => Math.abs(t) > 1e-9).map((t) => (
          <text key={`ty${t}`} x={Math.max(4, Math.min(W - 30, axisX + 6))} y={sy(t)} className="viz-tick" dominantBaseline="middle">{fmt(t, 2)}</text>
        ))}
        {shadePath && <path d={shadePath} className="graph-shade" />}
        {paths.map((d, i) => d && <path key={i} d={d} className={`graph-fn ${functions[i].dashed ? 'dashed' : ''}`} style={{ stroke: `var(--viz-${functions[i].slot ?? i + 1})` }} />)}
        {overlay?.({ sx, sy, view: v, W, H })}
        {points?.map((p, i) => (
          <g key={i}>
            <circle cx={sx(p.x)} cy={sy(p.y)} r={5} className={p.open ? 'graph-point open' : 'graph-point'} />
            {p.label && <text x={sx(p.x) + 8} y={sy(p.y) - 8} className="viz-value">{p.label}</text>}
          </g>
        ))}
        {hoverX !== null && <line x1={sx(hoverX)} x2={sx(hoverX)} y1={0} y2={H} className="viz-crosshair" />}
        {hoverX !== null && compiled.map((c, i) => {
          if (!c) return null;
          const val = c({ ...params, x: hoverX });
          if (!Number.isFinite(val) || val < v.ymin || val > v.ymax) return null;
          return <circle key={`h${i}`} cx={sx(hoverX)} cy={sy(val)} r={4.5} className="viz-dot" style={{ fill: `var(--viz-${functions[i].slot ?? i + 1})` }} />;
        })}
      </svg>
      {legend && functions.length > 1 && (
        <div className="graph-legend">
          {functions.map((f, i) => (
            <span key={i} className="legend-item">
              <span className={`legend-line ${f.dashed ? 'dashed' : ''}`} style={{ background: `var(--viz-${f.slot ?? i + 1})` }} />
              {f.label ?? f.expr}
            </span>
          ))}
        </div>
      )}
      {interactive && (
        <div className="graph-controls">
          <button type="button" className="icon-btn" onClick={() => zoom(1 / 1.4)} aria-label="Acercar">+</button>
          <button type="button" className="icon-btn" onClick={() => zoom(1.4)} aria-label="Alejar">−</button>
          <button type="button" className="icon-btn" onClick={() => { setInternalView(null); onViewChange?.(baseView); }} aria-label="Restablecer vista">⟲</button>
        </div>
      )}
      <ChartTooltip tip={tip} />
    </div>
  );
}
