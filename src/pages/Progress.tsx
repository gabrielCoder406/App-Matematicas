// Analíticas: métricas de estudio, series diarias y mapa de calor de dominio.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BLOCKS, SKILL_BY_ID, skillsOfBlock } from '../content/curriculum';
import { errorLabel } from '../content/errorCatalog';
import { ChartCard } from '../components/charts/ChartKit';
import { ColumnChart, LineChart } from '../components/charts/Charts';
import { Icon } from '../components/Icon';
import { allStates, dayKey, masteryScore } from '../learning/engine';
import { daySeries, formatDuration, streak, totals } from '../learning/metrics';
import type { ProgressData } from '../learning/types';
import { useProgress } from '../store/progress';

type Metric = 'mastery' | 'accuracy' | 'speed';

const BINS = [0.2, 0.4, 0.6, 0.8];
const BIN_LABELS = ['0–20%', '20–40%', '40–60%', '60–80%', '80–100%'];

function bin(v: number): number {
  let i = 0;
  while (i < BINS.length && v >= BINS[i]) i++;
  return i;
}

function metricOf(data: ProgressData, id: string, metric: Metric): number | null {
  const p = data.skills[id];
  if (!p || (p.attempts === 0 && !p.placed)) return null;
  if (metric === 'mastery') return masteryScore(p);
  if (metric === 'accuracy') return p.attempts ? p.correct / p.attempts : p.placed ? 0.9 : null;
  return p.attempts ? p.speed : null;
}

function Heatmap({ data }: { data: ProgressData }) {
  const [metric, setMetric] = useState<Metric>('mastery');
  const [tip, setTip] = useState<{ x: number; y: number; id: string } | null>(null);
  const navigate = useNavigate();
  const states = allStates(data);
  const label = { mastery: 'Dominio', accuracy: 'Precisión', speed: 'Rapidez' }[metric];
  const rows = BLOCKS.map((b) => ({ b, skills: skillsOfBlock(b.id) }));
  const table = {
    headers: ['Bloque', 'Habilidad', 'Dominio', 'Precisión', 'Rapidez', 'Ejercicios'],
    rows: rows.flatMap(({ b, skills }) =>
      skills.map((s) => {
        const p = data.skills[s.id];
        const f = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
        return [b.short, s.title, f(metricOf(data, s.id, 'mastery')), f(metricOf(data, s.id, 'accuracy')), f(metricOf(data, s.id, 'speed')), p?.attempts ?? 0];
      }),
    ),
  };

  const chart = (
    <div className="heatmap-wrap" onPointerLeave={() => setTip(null)}>
      <div className="heatmap">
        {rows.map(({ b, skills }) => (
          <div key={b.id} className="heat-row">
            <div className="heat-label" title={b.title}>{b.short}</div>
            <div className="heat-cells">
              {skills.map((s) => {
                const v = metricOf(data, s.id, metric);
                const cls = v === null ? 'heat-none' : `heat-${bin(v)}`;
                return (
                  <button
                    key={s.id}
                    className={`heat-cell ${cls} ${states[s.id] === 'locked' ? 'locked' : ''}`}
                    aria-label={`${s.title}: ${v === null ? 'sin datos' : `${Math.round(v * 100)}%`}`}
                    onPointerMove={(e) => {
                      const r = (e.currentTarget.closest('.heatmap-wrap') as HTMLElement).getBoundingClientRect();
                      setTip({ x: Math.min(e.clientX - r.left + 12, r.width - 200), y: e.clientY - r.top + 12, id: s.id });
                    }}
                    onFocus={(e) => {
                      const r = (e.currentTarget.closest('.heatmap-wrap') as HTMLElement).getBoundingClientRect();
                      const c = e.currentTarget.getBoundingClientRect();
                      setTip({ x: Math.min(c.left - r.left, r.width - 200), y: c.bottom - r.top + 6, id: s.id });
                    }}
                    onBlur={() => setTip(null)}
                    onClick={() => navigate(`/habilidad/${s.id}`)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {tip && (() => {
        const s = SKILL_BY_ID[tip.id];
        const p = data.skills[tip.id];
        const v = metricOf(data, tip.id, metric);
        return (
          <div className="chart-tooltip" style={{ left: tip.x, top: tip.y }}>
            <div className="tt-title">{s.title}</div>
            <div className="tt-row"><strong>{v === null ? 'sin datos' : `${Math.round(v * 100)}%`}</strong><span className="tt-label">{label}</span></div>
            {p && <div className="tt-row"><strong>{p.attempts}</strong><span className="tt-label">ejercicios</span></div>}
          </div>
        );
      })()}
      <div className="heat-legend">
        <span className="small muted">{label}:</span>
        {BIN_LABELS.map((l, i) => (
          <span key={l} className="row" style={{ gap: 4 }}><span className={`heat-swatch heat-${i}`} />{l}</span>
        ))}
        <span className="row" style={{ gap: 4 }}><span className="heat-swatch heat-none" />Sin datos</span>
      </div>
    </div>
  );

  return (
    <ChartCard
      title="Mapa de calor de dominio"
      subtitle="Cada casilla es una habilidad; el color combina precisión, rapidez y probabilidad de dominio. Toca una casilla para ver el detalle."
      chart={chart}
      table={table}
      actions={
        <div className="tabs">
          {(['mastery', 'accuracy', 'speed'] as Metric[]).map((m) => (
            <button key={m} className={metric === m ? 'active' : ''} onClick={() => setMetric(m)}>{{ mastery: 'Dominio', accuracy: 'Precisión', speed: 'Rapidez' }[m]}</button>
          ))}
        </div>
      }
    />
  );
}

const RANGES = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
];

export default function Progress() {
  const data = useProgress();
  const [range, setRange] = useState(14);
  const days = RANGES.find((r) => r.days === range)?.days ?? range;
  const t = totals(data, days);
  const prev = useMemo(() => {
    // Periodo anterior de igual longitud (para la variación): últimos 2d días menos los últimos d
    const both = totals(data, days * 2);
    return { activeMs: both.activeMs - t.activeMs };
  }, [data, days, t.activeMs]);
  const st = streak(data);
  const series = daySeries(data, days);
  const states = allStates(data);
  const mastered = Object.values(states).filter((s) => s === 'mastered').length;
  const delta = (cur: number, before: number) => (before > 0 ? Math.round(((cur - before) / before) * 100) : null);
  const dT = delta(t.activeMs, prev.activeMs);
  const bugCounts = new Map<string, number>();
  const minKey = dayKey(Date.now() - (days - 1) * 86400000);
  for (const e of data.errors) if (dayKey(e.t) >= minKey) bugCounts.set(e.bug, (bugCounts.get(e.bug) ?? 0) + 1);
  const topBugs = [...bugCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const labelEvery = days > 30 ? 7 : days > 14 ? 3 : 1;

  return (
    <div className="page wide">
      <div className="page-header">
        <div>
          <h1>Progreso</h1>
          <p>Tiempo efectivo de cálculo (sin contar el tiempo en reposo), constancia y precisión.</p>
        </div>
      </div>

      <section>
        <div className="filter-row">
          {[{ days: 14, label: '14 días' }, ...RANGES].sort((a, b) => a.days - b.days).map((r) => (
            <button key={r.days} className={`chip ${range === r.days ? 'active' : ''}`} onClick={() => setRange(r.days)}>
              {range === r.days && <Icon name="check" size={14} stroke={2.6} />} Últimos {r.label}
            </button>
          ))}
        </div>
        <div className="grid cols-4">
          <div className="card">
            <div className="stat">
              <span className="stat-label">Tiempo efectivo</span>
              <span className="stat-value">{formatDuration(t.activeMs)}</span>
              <span className="stat-sub">
                {dT === null ? 'Sin datos del periodo anterior' : <><span className={dT >= 0 ? 'delta-up' : 'delta-down'}>{dT >= 0 ? '▲' : '▼'} {Math.abs(dT)}%</span> vs. periodo anterior</>}
              </span>
            </div>
          </div>
          <div className="card">
            <div className="stat">
              <span className="stat-label">Ejercicios resueltos</span>
              <span className="stat-value">{t.exercises}</span>
              <span className="stat-sub">{t.correct} correctos</span>
            </div>
          </div>
          <div className="card">
            <div className="stat">
              <span className="stat-label">Aciertos sin pistas</span>
              <span className="stat-value">{t.exercises ? `${Math.round(t.accuracyNoHint * 100)}%` : '—'}</span>
              <span className="stat-sub">Precisión total {t.exercises ? `${Math.round(t.accuracy * 100)}%` : '—'}</span>
            </div>
          </div>
          <div className="card">
            <div className="stat">
              <span className="stat-label">Racha</span>
              <span className="stat-value">{st.current} {st.current === 1 ? 'día' : 'días'}</span>
              <span className="stat-sub">Mejor racha: {st.best} · {mastered} habilidades dominadas</span>
            </div>
          </div>
        </div>
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <ChartCard
            title="Minutos de estudio efectivo por día"
            chart={<ColumnChart data={series.map((p) => ({ label: p.label, value: Math.round(p.minutes * 10) / 10, display: `${Math.round(p.minutes)} min` }))} yLabel="minutos" unit=" min" labelEvery={labelEvery} />}
            table={{ headers: ['Día', 'Minutos', 'Ejercicios'], rows: series.map((p) => [p.label, Math.round(p.minutes), p.exercises]) }}
          />
          <ChartCard
            title="Aciertos sin pistas por día"
            chart={<LineChart data={series.map((p) => ({ label: p.label, value: p.accuracyNoHint }))} label="aciertos sin pistas" />}
            table={{ headers: ['Día', 'Aciertos sin pistas', 'Ejercicios'], rows: series.map((p) => [p.label, p.accuracyNoHint === null ? '—' : `${Math.round(p.accuracyNoHint * 100)}%`, p.exercises]) }}
          />
        </div>
        {topBugs.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">
              <h3>Errores más frecuentes del periodo</h3>
              <Link to="/errores">Ver banco de errores →</Link>
            </div>
            <div className="bar-list">
              {topBugs.map(([bug, c]) => (
                <Link key={bug} to={`/errores/repasar/${encodeURIComponent(bug)}`} className="bar-list-row">
                  <span className="bar-list-label">{errorLabel(bug)}</span>
                  <span className="bar-list-track"><span className="bar-list-fill" style={{ width: `${(c / topBugs[0][1]) * 100}%` }} /></span>
                  <span className="bar-list-value">{c}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="section-title">
          <h2>Estado actual por tema</h2>
          <Link to="/temario">Ver árbol de habilidades →</Link>
        </div>
        <Heatmap data={data} />
      </section>
    </div>
  );
}
