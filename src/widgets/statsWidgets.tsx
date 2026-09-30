// Estadística y probabilidad: histograma editable y simulador de dados.
import { useMemo, useState } from 'react';
import { Tex } from '../components/Math';
import { fmt, niceMax, niceTicks } from '../components/charts/ChartKit';

function stats(xs: number[]) {
  const n = xs.length;
  const s = [...xs].sort((a, b) => a - b);
  const mean = n ? xs.reduce((a, b) => a + b, 0) / n : NaN;
  const median = n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : NaN;
  const counts = new Map<number, number>();
  xs.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
  const maxC = Math.max(0, ...counts.values());
  const modes = maxC > 1 ? [...counts.entries()].filter(([, c]) => c === maxC).map(([v]) => v).sort((a, b) => a - b) : [];
  const variance = n ? xs.reduce((a, x) => a + (x - mean) ** 2, 0) / n : NaN;
  return { n, mean, median, modes, variance, sd: Math.sqrt(variance), min: s[0], max: s[n - 1] };
}

export function HistogramWidget({ data = [2, 3, 3, 4, 5, 5, 5, 6, 7, 10], bins: bins0, showSd = false }: { data?: number[]; bins?: number; showSd?: boolean }) {
  const [xs, setXs] = useState<number[]>(data);
  const [bins, setBins] = useState(bins0 ?? Math.min(8, Math.max(3, Math.round(Math.sqrt(data.length)))));
  const [draft, setDraft] = useState('');
  const st = stats(xs);
  const W = 640, H = 240, m = { l: 40, r: 14, t: 18, b: 34 };
  const lo = Math.floor(Math.min(...xs, 0));
  const hi = Math.ceil(Math.max(...xs, 1)) + 1;
  const width = (hi - lo) / bins;
  const counts = Array.from({ length: bins }, (_, i) => xs.filter((x) => x >= lo + i * width && (i === bins - 1 ? x <= hi : x < lo + (i + 1) * width)).length);
  const ymax = niceMax(Math.max(1, ...counts));
  const sx = (v: number) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
  const sy = (v: number) => m.t + (H - m.t - m.b) - (v / ymax) * (H - m.t - m.b);
  const add = () => {
    const vals = draft.split(/[;\s]+/).map((s) => Number(s.replace(',', '.'))).filter((v) => Number.isFinite(v));
    if (vals.length) setXs([...xs, ...vals]);
    setDraft('');
  };
  return (
    <div className="widget">
      <div className="row wrap">
        <input className="input" style={{ maxWidth: 220 }} value={draft} placeholder="Agregar dato(s): 4; 7" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn sm" onClick={add}>Agregar</button>
        <button className="btn sm ghost" onClick={() => setXs(data)}>Restablecer</button>
        <label className="slider-row" style={{ minWidth: 220 }}><span>clases</span><input type="range" min={2} max={12} value={bins} onChange={(e) => setBins(Number(e.target.value))} /><b>{bins}</b></label>
      </div>
      <div className="chips-data">
        {xs.map((x, i) => (
          <button key={i} className="chip" title="Quitar" onClick={() => setXs(xs.filter((_, k) => k !== i))}>{fmt(x, 2)} ×</button>
        ))}
      </div>
      {xs.length > 0 && (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Histograma de los datos">
          {niceTicks(0, ymax, 4).map((t) => (
            <g key={t}>
              <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} className="viz-grid" />
              <text x={m.l - 6} y={sy(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">{t}</text>
            </g>
          ))}
          {counts.map((c, i) => {
            const x0 = sx(lo + i * width) + 1, x1 = sx(lo + (i + 1) * width) - 1;
            const top = sy(c), base = sy(0);
            const r = Math.min(4, base - top, (x1 - x0) / 2);
            return c > 0 ? (
              <path key={i} className="viz-bar" d={`M${x0},${base} V${top + r} Q${x0},${top} ${x0 + r},${top} H${x1 - r} Q${x1},${top} ${x1},${top + r} V${base} Z`}>
                <title>{`[${fmt(lo + i * width, 2)}; ${fmt(lo + (i + 1) * width, 2)}): ${c}`}</title>
              </path>
            ) : null;
          })}
          <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} className="viz-axis" />
          {Array.from({ length: bins + 1 }, (_, i) => (
            <text key={i} x={sx(lo + i * width)} y={H - m.b + 16} className="viz-tick" textAnchor="middle">{fmt(lo + i * width, 1)}</text>
          ))}
          {showSd && (
            <rect x={sx(st.mean - st.sd)} y={m.t} width={Math.max(0, sx(st.mean + st.sd) - sx(st.mean - st.sd))} height={H - m.t - m.b} className="sd-band" />
          )}
          <line x1={sx(st.mean)} x2={sx(st.mean)} y1={m.t - 6} y2={sy(0)} className="ref-line mean" />
          <text x={sx(st.mean) + 4} y={m.t + 2} className="viz-value">media</text>
          <line x1={sx(st.median)} x2={sx(st.median)} y1={m.t + 12} y2={sy(0)} className="ref-line median" />
          <text x={sx(st.median) + 4} y={m.t + 20} className="viz-value">mediana</text>
        </svg>
      )}
      <div className="row wrap" style={{ gap: 16, justifyContent: 'center' }}>
        <span className="row" style={{ gap: 6 }}><span className="legend-line" style={{ background: 'var(--viz-2)' }} /><Tex tex={`\\bar x = ${fmt(st.mean, 2)}`} /></span>
        <span className="row" style={{ gap: 6 }}><span className="legend-line" style={{ background: 'var(--viz-3)' }} /><Tex tex={`\\text{Me} = ${fmt(st.median, 2)}`} /></span>
        <Tex tex={`\\text{Mo} = ${st.modes.length ? st.modes.map((x) => fmt(x, 2)).join(',\\ ') : '\\text{no hay}'}`} />
        <Tex tex={`\\sigma = ${fmt(st.sd, 2)}`} />
        <Tex tex={`n = ${st.n}`} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function DiceWidget({ dice = 2 }: { dice?: number }) {
  const [n, setN] = useState(dice === 1 ? 1 : 2);
  const [rolls, setRolls] = useState<number[]>([]);
  const outcomes = n === 1 ? [1, 2, 3, 4, 5, 6] : Array.from({ length: 11 }, (_, i) => i + 2);
  const theo = (v: number) => (n === 1 ? 1 / 6 : (6 - Math.abs(v - 7)) / 36);
  const counts = useMemo(() => {
    const c = new Map<number, number>();
    rolls.forEach((r) => c.set(r, (c.get(r) ?? 0) + 1));
    return c;
  }, [rolls]);
  const roll = (k: number) => {
    const out: number[] = [];
    for (let i = 0; i < k; i++) {
      let s = 0;
      for (let d = 0; d < n; d++) s += 1 + Math.floor(Math.random() * 6);
      out.push(s);
    }
    setRolls((r) => [...r, ...out]);
  };
  const W = 640, H = 240, m = { l: 44, r: 12, t: 16, b: 30 };
  const band = (W - m.l - m.r) / outcomes.length;
  const ymax = Math.max(0.2, niceMax(Math.max(...outcomes.map((o) => Math.max(theo(o), rolls.length ? (counts.get(o) ?? 0) / rolls.length : 0)))));
  const sy = (v: number) => m.t + (H - m.t - m.b) - (v / ymax) * (H - m.t - m.b);
  const bw = Math.min(24, band * 0.6);
  return (
    <div className="widget">
      <div className="row wrap">
        <div className="tabs">
          <button className={n === 1 ? 'active' : ''} onClick={() => { setN(1); setRolls([]); }}>1 dado</button>
          <button className={n === 2 ? 'active' : ''} onClick={() => { setN(2); setRolls([]); }}>2 dados (suma)</button>
        </div>
        {[1, 10, 100, 1000].map((k) => <button key={k} className="btn sm" onClick={() => roll(k)}>Lanzar ×{k}</button>)}
        <button className="btn sm ghost" onClick={() => setRolls([])}>Reiniciar</button>
        <span className="small muted">{rolls.length} lanzamientos{rolls.length ? ` · último: ${rolls[rolls.length - 1]}` : ''}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Frecuencia relativa de cada resultado comparada con la probabilidad teórica">
        {niceTicks(0, ymax, 4).map((t) => (
          <g key={t}>
            <line x1={m.l} x2={W - m.r} y1={sy(t)} y2={sy(t)} className="viz-grid" />
            <text x={m.l - 6} y={sy(t)} className="viz-tick" textAnchor="end" dominantBaseline="middle">{fmt(t, 2)}</text>
          </g>
        ))}
        {outcomes.map((o, i) => {
          const f = rolls.length ? (counts.get(o) ?? 0) / rolls.length : 0;
          const cx = m.l + i * band + band / 2;
          const top = sy(f), base = sy(0);
          const r = Math.min(4, Math.max(0, base - top), bw / 2);
          return (
            <g key={o}>
              {f > 0 && <path className="viz-bar" d={`M${cx - bw / 2},${base} V${top + r} Q${cx - bw / 2},${top} ${cx - bw / 2 + r},${top} H${cx + bw / 2 - r} Q${cx + bw / 2},${top} ${cx + bw / 2},${top + r} V${base} Z`}><title>{`${o}: ${fmt(f, 3)} (teórica ${fmt(theo(o), 3)})`}</title></path>}
              <line x1={cx - bw / 2 - 5} x2={cx + bw / 2 + 5} y1={sy(theo(o))} y2={sy(theo(o))} className="theory-mark" />
              <text x={cx} y={H - m.b + 16} className="viz-tick" textAnchor="middle">{o}</text>
            </g>
          );
        })}
        <line x1={m.l} x2={W - m.r} y1={sy(0)} y2={sy(0)} className="viz-axis" />
      </svg>
      <div className="row wrap small" style={{ justifyContent: 'center', gap: 16 }}>
        <span className="row" style={{ gap: 6 }}><span className="legend-swatch" style={{ background: 'var(--viz-1)' }} /> Frecuencia relativa observada</span>
        <span className="row" style={{ gap: 6 }}><span className="legend-line" style={{ background: 'var(--text)' }} /> Probabilidad teórica</span>
      </div>
    </div>
  );
}
