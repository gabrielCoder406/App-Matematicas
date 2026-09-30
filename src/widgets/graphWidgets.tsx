// Gráficos dinámicos: graficador con parámetros, recta tangente/secante y sumas de Riemann.
import { useMemo, useState } from 'react';
import { freeVars } from '../math/ast';
import { parse } from '../math/parse';
import { findRoots } from '../math/solve';
import { Tex } from '../components/Math';
import { compileExpr, FunctionGraph, type View } from '../components/visuals/FunctionGraph';
import { fmt } from '../components/charts/ChartKit';

function paramsOf(exprs: string[]): string[] {
  const s = new Set<string>();
  for (const e of exprs) {
    try {
      freeVars(parse(e.replace(/^\s*(y|f\s*\(\s*x\s*\))\s*=\s*/i, ''), { decimalComma: false })).forEach((v) => {
        if (v !== 'x') s.add(v);
      });
    } catch {
      /* se ignora mientras se escribe */
    }
  }
  return [...s].sort();
}

function Slider({ name, value, onChange, min = -10, max = 10, step = 0.1 }: { name: string; value: number; onChange(v: number): void; min?: number; max?: number; step?: number }) {
  return (
    <label className="slider-row">
      <span className="mono">{name}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <b className="mono">{fmt(value, 2)}</b>
    </label>
  );
}

function derivative(f: (env: Record<string, number>) => number, params: Record<string, number>, x: number): number {
  const h = 1e-4;
  return (f({ ...params, x: x + h }) - f({ ...params, x: x - h })) / (2 * h);
}

interface GrapherProps {
  functions?: string[];
  params?: Record<string, number>;
  view?: View;
  showRoots?: boolean;
  showVertex?: boolean;
  showIntersections?: boolean;
  points?: { x: number; y: number; open?: boolean; label?: string }[];
}

/** Graficador con sliders automáticos para los parámetros (letras distintas de x). */
export function GrapherWidget({ functions = ['a*x^2 + b*x + c'], params: initial = {}, view, showRoots = false, showVertex = false, showIntersections = false, points = [] }: GrapherProps) {
  const [exprs, setExprs] = useState<string[]>(functions);
  const [vals, setVals] = useState<Record<string, number>>(initial);
  const [roots, setRoots] = useState(showRoots);
  const [extrema, setExtrema] = useState(showVertex);
  const [inter, setInter] = useState(showIntersections);
  const [curView, setCurView] = useState<View | undefined>(view);
  const names = useMemo(() => paramsOf(exprs), [exprs]);
  const params = Object.fromEntries(names.map((n) => [n, vals[n] ?? 1]));
  const compiled = exprs.map((e) => compileExpr(e));
  const range = curView ?? view ?? { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };

  const marks: { x: number; y: number; label?: string; open?: boolean }[] = [...points];
  compiled.forEach((f, i) => {
    if (!f) return;
    const g = (x: number) => f({ ...params, x });
    if (roots) findRoots(g, range.xmin, range.xmax, 1500, true).slice(0, 6).forEach((r) => marks.push({ x: r, y: 0, label: `${fmt(r, 2)}` }));
    if (extrema) {
      const d = (x: number) => derivative(f, params, x);
      findRoots(d, range.xmin, range.xmax, 1500, true).slice(0, 4).forEach((r) => {
        const y = g(r);
        if (Number.isFinite(y)) marks.push({ x: r, y, label: `(${fmt(r, 2)}; ${fmt(y, 2)})` });
      });
    }
    if (inter && i === 1 && compiled[0]) {
      const f0 = compiled[0];
      findRoots((x) => f0({ ...params, x }) - g(x), range.xmin, range.xmax, 1500, true).slice(0, 4).forEach((r) => marks.push({ x: r, y: g(r), label: `(${fmt(r, 2)}; ${fmt(g(r), 2)})` }));
    }
  });

  return (
    <div className="widget">
      <div className="stack" style={{ gap: 6 }}>
        {exprs.map((e, i) => (
          <div key={i} className="row">
            <span className="legend-line" style={{ background: `var(--viz-${i + 1})` }} />
            <span className="mono small">f{i + 1}(x) =</span>
            <input className="input mono" value={e} onChange={(ev) => setExprs(exprs.map((x, k) => (k === i ? ev.target.value : x)))} spellCheck={false} />
            {exprs.length > 1 && (
              <button className="icon-btn" onClick={() => setExprs(exprs.filter((_, k) => k !== i))} aria-label="Quitar función">×</button>
            )}
          </div>
        ))}
        {exprs.length < 3 && (
          <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setExprs([...exprs, 'x'])}>+ Agregar función</button>
        )}
      </div>
      {names.length > 0 && (
        <div className="sliders">
          {names.map((n) => (
            <Slider key={n} name={n} value={params[n]} onChange={(v) => setVals({ ...vals, [n]: v })} />
          ))}
        </div>
      )}
      <div className="row wrap small" style={{ gap: 14, margin: '6px 0' }}>
        <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={roots} onChange={(e) => setRoots(e.target.checked)} /> Raíces</label>
        <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={extrema} onChange={(e) => setExtrema(e.target.checked)} /> Máximos y mínimos</label>
        {exprs.length > 1 && <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={inter} onChange={(e) => setInter(e.target.checked)} /> Intersecciones</label>}
      </div>
      <FunctionGraph
        functions={exprs.map((e, i) => ({ expr: e, label: `f${i + 1}(x) = ${e}`, slot: i + 1 }))}
        params={params}
        view={view}
        points={marks}
        interactive
        onViewChange={setCurView}
        height={360}
        legend={false}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

export function TangentWidget({ expr = 'x^2', a: a0 = 1, secant = true }: { expr?: string; a?: number; secant?: boolean }) {
  const [src, setSrc] = useState(expr);
  const [a, setA] = useState(a0);
  const [h, setH] = useState(1.5);
  const [showSecant, setShowSecant] = useState(secant);
  const f = compileExpr(src);
  const fa = f ? f({ x: a }) : NaN;
  const m = f ? derivative(f, {}, a) : NaN;
  const fb = f ? f({ x: a + h }) : NaN;
  const ms = (fb - fa) / h;
  const ok = Number.isFinite(fa) && Number.isFinite(m);
  const tangentExpr = ok ? `${m}*(x - (${a})) + (${fa})` : '0';
  const secantExpr = `${ms}*(x - (${a})) + (${fa})`;
  return (
    <div className="widget">
      <div className="row">
        <span className="mono small">f(x) =</span>
        <input className="input mono" value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} />
      </div>
      <div className="sliders">
        <Slider name="a" value={a} onChange={setA} min={-4} max={4} step={0.05} />
        {showSecant && <Slider name="h" value={h} onChange={setH} min={0.01} max={3} step={0.01} />}
      </div>
      <label className="row small" style={{ gap: 6, margin: '4px 0 8px' }}>
        <input type="checkbox" checked={showSecant} onChange={(e) => setShowSecant(e.target.checked)} /> Mostrar recta secante (definición de derivada)
      </label>
      <FunctionGraph
        functions={[
          { expr: src, label: 'f(x)', slot: 1 },
          ...(ok ? [{ expr: tangentExpr, label: 'tangente', slot: 2, dashed: false }] : []),
          ...(ok && showSecant && Number.isFinite(ms) ? [{ expr: secantExpr, label: 'secante', slot: 3, dashed: true }] : []),
        ]}
        points={ok ? [{ x: a, y: fa }, ...(showSecant && Number.isFinite(fb) ? [{ x: a + h, y: fb }] : [])] : []}
        view={{ xmin: -5, xmax: 5, ymin: -5, ymax: 12 }}
        interactive
        height={340}
      />
      {ok && (
        <div className="row wrap" style={{ justifyContent: 'center', gap: 18 }}>
          <Tex tex={`f(${fmt(a, 2)}) = ${fmt(fa, 3)}`} />
          <Tex tex={`f'(${fmt(a, 2)}) \\approx ${fmt(m, 3)}`} />
          {showSecant && <Tex tex={`\\frac{f(a + h) - f(a)}{h} = ${fmt(ms, 3)}`} />}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function RiemannWidget({ expr = 'x^2', a: a0 = 0, b: b0 = 2, n: n0 = 6 }: { expr?: string; a?: number; b?: number; n?: number }) {
  const [src, setSrc] = useState(expr);
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [n, setN] = useState(n0);
  const [rule, setRule] = useState<'left' | 'mid' | 'right'>('left');
  const f = compileExpr(src);
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const dx = (hi - lo) / n;
  let sum = 0;
  const rects: { x: number; h: number }[] = [];
  if (f) {
    for (let i = 0; i < n; i++) {
      const x0 = lo + i * dx;
      const xs = rule === 'left' ? x0 : rule === 'right' ? x0 + dx : x0 + dx / 2;
      const hgt = f({ x: xs });
      if (Number.isFinite(hgt)) {
        sum += hgt * dx;
        rects.push({ x: x0, h: hgt });
      }
    }
  }
  let exact = NaN;
  if (f) {
    const N = 2000;
    const hh = (hi - lo) / N;
    let s = f({ x: lo }) + f({ x: hi });
    for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * f({ x: lo + i * hh });
    exact = (s * hh) / 3;
  }
  return (
    <div className="widget">
      <div className="row">
        <span className="mono small">f(x) =</span>
        <input className="input mono" value={src} onChange={(e) => setSrc(e.target.value)} spellCheck={false} />
      </div>
      <div className="sliders">
        <Slider name="a" value={a} onChange={setA} min={-5} max={5} step={0.5} />
        <Slider name="b" value={b} onChange={setB} min={-5} max={5} step={0.5} />
        <Slider name="n" value={n} onChange={(v) => setN(Math.round(v))} min={1} max={60} step={1} />
      </div>
      <div className="tabs" style={{ margin: '6px 0' }}>
        {(['left', 'mid', 'right'] as const).map((r) => (
          <button key={r} className={rule === r ? 'active' : ''} onClick={() => setRule(r)}>{r === 'left' ? 'Izquierda' : r === 'mid' ? 'Punto medio' : 'Derecha'}</button>
        ))}
      </div>
      <FunctionGraph
        functions={[{ expr: src, label: 'f(x)', slot: 1 }]}
        view={{ xmin: Math.min(lo - 1, -1), xmax: Math.max(hi + 1, 1), ymin: -2, ymax: Math.max(4, ...rects.map((r) => r.h + 1)) }}
        height={330}
        overlay={({ sx, sy }) => (
          <g>
            {rects.map((r, i) => (
              <rect key={i} x={sx(r.x)} y={Math.min(sy(r.h), sy(0))} width={Math.max(0, sx(r.x + dx) - sx(r.x) - 1)} height={Math.abs(sy(r.h) - sy(0))} className={`riemann-rect ${r.h < 0 ? 'neg' : ''}`} />
            ))}
          </g>
        )}
      />
      <div className="row wrap" style={{ justifyContent: 'center', gap: 18 }}>
        <Tex tex={`\\text{Suma con } ${n} \\text{ rectángulos} \\approx ${fmt(sum, 4)}`} />
        <Tex tex={`\\int_{${fmt(lo, 2)}}^{${fmt(hi, 2)}} f(x)\\,dx \\approx ${fmt(exact, 4)}`} />
      </div>
    </div>
  );
}
