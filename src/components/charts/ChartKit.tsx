// Piezas comunes de los gráficos: escalas "bonitas", tooltip y vista de tabla.
import { useState, type ReactNode } from 'react';

/** Marcas de eje en números redondos (1, 2, 5 × 10^k). */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const span = max - min;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const start = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 1e-9; v += step) ticks.push(Math.round(v / step) * step);
  return ticks;
}

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  const n = v / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
}

export function fmt(v: number, decimals = 1): string {
  const r = Math.round(v * 10 ** decimals) / 10 ** decimals;
  return r.toLocaleString('es-AR', { maximumFractionDigits: decimals });
}

export interface TooltipState {
  x: number;
  y: number;
  title: string;
  rows: { value: string; label: string; color?: string }[];
}

/** Tooltip: el valor manda, la etiqueta acompaña; claves de serie como trazo corto. */
export function ChartTooltip({ tip }: { tip: TooltipState | null }) {
  if (!tip) return null;
  return (
    <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }} role="status">
      <div className="tt-title">{tip.title}</div>
      {tip.rows.map((r, i) => (
        <div key={i} className="tt-row">
          {r.color && <span className="tt-key" style={{ background: r.color }} />}
          <strong>{r.value}</strong>
          <span className="tt-label">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Tarjeta de gráfico con alternancia gráfico / tabla (la tabla es el equivalente accesible). */
export function ChartCard({
  title,
  subtitle,
  chart,
  table,
  actions,
}: {
  title: string;
  subtitle?: string;
  chart: ReactNode;
  table: { headers: string[]; rows: (string | number)[][] };
  actions?: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <div className="card chart-card">
      <div className="card-title">
        <div>
          <h3>{title}</h3>
          {subtitle && <div className="small muted">{subtitle}</div>}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {actions}
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={view === 'chart'} className={view === 'chart' ? 'active' : ''} onClick={() => setView('chart')}>Gráfico</button>
            <button role="tab" aria-selected={view === 'table'} className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}>Tabla</button>
          </div>
        </div>
      </div>
      {view === 'chart' ? (
        chart
      ) : (
        <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table className="table num">
            <thead>
              <tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
