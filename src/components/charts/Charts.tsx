// Gráficos de una serie: columnas (tiempo diario, histograma), línea (tendencia) y dispersión.
import { useRef, useState } from 'react';
import { ChartTooltip, fmt, niceMax, niceTicks, type TooltipState } from './ChartKit';

const W = 640;

function useTip() {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const show = (e: { clientX: number; clientY: number }, t: Omit<TooltipState, 'x' | 'y'>) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    setTip({ ...t, x: Math.min(e.clientX - r.left + 12, r.width - 170), y: Math.max(0, e.clientY - r.top - 14) });
  };
  return { tip, wrap, show, hide: () => setTip(null) };
}

// ---------------------------------------------------------------------------

export interface ColumnDatum {
  label: string;
  value: number;
  /** Texto del valor para el tooltip. */
  display?: string;
  highlight?: boolean;
}

/**
 * Columnas de una sola serie. `touching` = histograma (clases contiguas separadas
 * solo por el hueco de 2px); si no, columnas de ≤24px con aire entre ellas.
 */
export function ColumnChart({
  data,
  height = 220,
  yLabel,
  xLabel,
  touching = false,
  unit = '',
  labelEvery = 1,
  labelMax = true,
}: {
  data: ColumnDatum[];
  height?: number;
  yLabel?: string;
  xLabel?: string;
  touching?: boolean;
  unit?: string;
  labelEvery?: number;
  labelMax?: boolean;
}) {
  const { tip, wrap, show, hide } = useTip();
  const H = height;
  const m = { l: 44, r: 12, t: 16, b: xLabel ? 44 : 28 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0.0001));
  const ticks = niceTicks(0, max, 4);
  const band = pw / Math.max(1, data.length);
  const bw = touching ? band - 2 : Math.min(24, band * 0.6);
  const y = (v: number) => m.t + ph - (v / max) * ph;
  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div className="chart" ref={wrap} onPointerLeave={hide}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={yLabel ?? 'Gráfico de columnas'}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} className="viz-grid" />
            <text x={m.l - 8} y={y(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">{fmt(t)}</text>
          </g>
        ))}
        <line x1={m.l} x2={W - m.r} y1={y(0)} y2={y(0)} className="viz-axis" />
        {data.map((d, i) => {
          const x0 = m.l + i * band + (band - bw) / 2;
          const h = Math.max(0, y(0) - y(d.value));
          const r = Math.min(4, h, bw / 2);
          const top = y(d.value);
          const path = h <= 0 ? '' : `M${x0},${y(0)} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x0 + bw - r} Q${x0 + bw},${top} ${x0 + bw},${top + r} V${y(0)} Z`;
          return (
            <g key={i}>
              {path && <path d={path} className={`viz-bar ${d.highlight ? 'accent' : ''}`} />}
              {labelMax && i === maxIdx && d.value > 0 && (
                <text x={x0 + bw / 2} y={top - 6} className="viz-value" textAnchor="middle">{d.display ?? fmt(d.value)}</text>
              )}
              {i % labelEvery === 0 && (
                <text x={m.l + i * band + band / 2} y={H - m.b + 16} className="viz-tick" textAnchor="middle">{d.label}</text>
              )}
              <rect
                x={m.l + i * band}
                y={m.t}
                width={band}
                height={ph}
                fill="transparent"
                tabIndex={0}
                onPointerMove={(e) => show(e, { title: d.label, rows: [{ value: d.display ?? `${fmt(d.value)}${unit}`, label: yLabel ?? '' }] })}
                onFocus={(e) => {
                  const r2 = (e.target as SVGRectElement).getBoundingClientRect();
                  show({ clientX: r2.left + r2.width / 2, clientY: r2.top + 20 }, { title: d.label, rows: [{ value: d.display ?? `${fmt(d.value)}${unit}`, label: yLabel ?? '' }] });
                }}
                onBlur={hide}
              />
            </g>
          );
        })}
        {xLabel && <text x={m.l + pw / 2} y={H - 6} className="viz-axis-label" textAnchor="middle">{xLabel}</text>}
        {yLabel && <text x={12} y={m.t + ph / 2} className="viz-axis-label" textAnchor="middle" transform={`rotate(-90 12 ${m.t + ph / 2})`}>{yLabel}</text>}
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  );
}

// ---------------------------------------------------------------------------

export interface LinePoint {
  label: string;
  value: number | null;
}

/** Línea de una serie (2px) con crosshair que se ajusta al punto más cercano. */
export function LineChart({ data, height = 200, max = 1, format = (v: number) => `${Math.round(v * 100)}%`, label = '' }: { data: LinePoint[]; height?: number; max?: number; format?: (v: number) => string; label?: string }) {
  const { tip, wrap, show, hide } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const H = height;
  const m = { l: 44, r: 16, t: 16, b: 28 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const n = data.length;
  const x = (i: number) => m.l + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const y = (v: number) => m.t + ph - (v / max) * ph;
  const ticks = niceTicks(0, max, 4);
  const segs: string[] = [];
  let cur = '';
  data.forEach((d, i) => {
    if (d.value === null) {
      if (cur) segs.push(cur);
      cur = '';
      return;
    }
    cur += `${cur ? 'L' : 'M'}${x(i)},${y(d.value)}`;
  });
  if (cur) segs.push(cur);
  const lastIdx = [...data.keys()].reverse().find((i) => data[i].value !== null);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / pw) * (n - 1))));
    setHover(i);
    const d = data[i];
    show(e, { title: d.label, rows: [{ value: d.value === null ? 'sin datos' : format(d.value), label, color: 'var(--viz-1)' }] });
  };

  return (
    <div className="chart" ref={wrap} onPointerLeave={() => { hide(); setHover(null); }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} className="viz-grid" />
            <text x={m.l - 8} y={y(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">{format(t)}</text>
          </g>
        ))}
        {data.map((d, i) => (i % Math.ceil(n / 7) === 0 || i === n - 1 ? <text key={i} x={x(i)} y={H - 8} className="viz-tick" textAnchor="middle">{d.label}</text> : null))}
        {segs.map((d, i) => <path key={i} d={d} className="viz-line" />)}
        {data.map((d, i) => (d.value !== null && (segs.length > 1 || i === lastIdx) ? <circle key={i} cx={x(i)} cy={y(d.value)} r={i === lastIdx ? 4.5 : 3} className="viz-dot" /> : null))}
        {lastIdx !== undefined && data[lastIdx].value !== null && (
          <text x={x(lastIdx) - 8} y={y(data[lastIdx].value!) - 10} className="viz-value" textAnchor="end">{format(data[lastIdx].value!)}</text>
        )}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={m.t + ph} className="viz-crosshair" />}
        <rect x={m.l} y={m.t} width={pw} height={ph} fill="transparent" onPointerMove={onMove} />
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  );
}

// ---------------------------------------------------------------------------

/** Diagrama de dispersión de una serie: puntos r=4.5 con anillo de superficie y zona de toque de 24px. */
export function ScatterChart({ points, height = 260, xLabel, yLabel }: { points: [number, number][]; height?: number; xLabel?: string; yLabel?: string }) {
  const { tip, wrap, show, hide } = useTip();
  const H = height;
  const m = { l: 48, r: 16, t: 14, b: 42 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const xmin = Math.min(0, ...xs), xmax = niceMax(Math.max(...xs, 1));
  const ymin = Math.min(0, ...ys), ymax = niceMax(Math.max(...ys, 1));
  const sx = (v: number) => m.l + ((v - xmin) / (xmax - xmin)) * pw;
  const sy = (v: number) => m.t + ph - ((v - ymin) / (ymax - ymin)) * ph;
  return (
    <div className="chart" ref={wrap} onPointerLeave={hide}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Diagrama de dispersión">
        {niceTicks(ymin, ymax, 4).map((t) => (
          <g key={`y${t}`}>
            <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} className="viz-grid" />
            <text x={m.l - 8} y={sy(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">{fmt(t)}</text>
          </g>
        ))}
        {niceTicks(xmin, xmax, 6).map((t) => (
          <text key={`x${t}`} x={sx(t)} y={m.t + ph + 16} className="viz-tick" textAnchor="middle">{fmt(t)}</text>
        ))}
        <line x1={m.l} x2={W - m.r} y1={m.t + ph} y2={m.t + ph} className="viz-axis" />
        {points.map(([px, py], i) => (
          <g key={i}>
            <circle cx={sx(px)} cy={sy(py)} r={4.5} className="viz-dot" />
            <circle
              cx={sx(px)}
              cy={sy(py)}
              r={12}
              fill="transparent"
              tabIndex={0}
              onPointerMove={(e) => show(e, { title: `Punto ${i + 1}`, rows: [{ value: `(${fmt(px)}; ${fmt(py)})`, label: `${xLabel ?? 'x'}; ${yLabel ?? 'y'}` }] })}
              onBlur={hide}
            />
          </g>
        ))}
        {xLabel && <text x={m.l + pw / 2} y={H - 6} className="viz-axis-label" textAnchor="middle">{xLabel}</text>}
        {yLabel && <text x={12} y={m.t + ph / 2} className="viz-axis-label" textAnchor="middle" transform={`rotate(-90 12 ${m.t + ph / 2})`}>{yLabel}</text>}
      </svg>
      <ChartTooltip tip={tip} />
    </div>
  );
}
