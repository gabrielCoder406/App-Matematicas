// Geometría dinámica: círculo unitario, Pitágoras, Tales, triángulos, vectores y matrices.
import { useRef, useState, type ReactNode } from 'react';
import { Frac } from '../math/fraction';
import { Tex } from '../components/Math';
import { fmt } from '../components/charts/ChartKit';

/** Arrastre de puntos dentro de un SVG (coordenadas del viewBox). */
function useDrag(onMove: (id: string, x: number, y: number) => void) {
  const svg = useRef<SVGSVGElement>(null);
  const active = useRef<string | null>(null);
  const toSvg = (e: { clientX: number; clientY: number }) => {
    const s = svg.current!;
    const pt = s.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(s.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  };
  const handle = (id: string) => ({
    onPointerDown: (e: React.PointerEvent) => {
      active.current = id;
      (e.target as Element).setPointerCapture?.(e.pointerId);
      e.preventDefault();
    },
    style: { cursor: 'grab', touchAction: 'none' as const },
  });
  const svgProps = {
    ref: svg,
    onPointerMove: (e: React.PointerEvent) => {
      if (!active.current) return;
      const p = toSvg(e);
      onMove(active.current, p.x, p.y);
    },
    onPointerUp: () => { active.current = null; },
    onPointerCancel: () => { active.current = null; },
    style: { touchAction: 'none' as const },
  };
  return { svgProps, handle, toSvg };
}

function Handle({ x, y, h, label }: { x: number; y: number; h: ReturnType<ReturnType<typeof useDrag>['handle']>; label?: string }) {
  return (
    <g {...h}>
      <circle cx={x} cy={y} r={16} fill="transparent" />
      <circle cx={x} cy={y} r={7} className="drag-handle" />
      {label && <text x={x + 12} y={y - 12} className="geo-label">{label}</text>}
    </g>
  );
}

// ---------------------------------------------------------------------------

const NOTABLE = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
const EXACT: Record<number, [string, string]> = {
  0: ['0', '1'], 30: ['\\frac{1}{2}', '\\frac{\\sqrt{3}}{2}'], 45: ['\\frac{\\sqrt{2}}{2}', '\\frac{\\sqrt{2}}{2}'], 60: ['\\frac{\\sqrt{3}}{2}', '\\frac{1}{2}'], 90: ['1', '0'],
};

function exactTrig(deg: number): { s: string; c: string } | null {
  if (!NOTABLE.includes(deg)) return null;
  const ref = deg % 90 === 0 ? (deg % 180 === 0 ? 0 : 90) : [30, 45, 60].find((r) => [r, 180 - r, 180 + r, 360 - r].includes(deg))!;
  const [s, c] = EXACT[ref];
  const sv = Math.sin((deg * Math.PI) / 180), cv = Math.cos((deg * Math.PI) / 180);
  const sign = (v: number, t: string) => (Math.abs(v) < 1e-9 ? '0' : v < 0 ? `-${t}` : t);
  return { s: sign(sv, s), c: sign(cv, c) };
}

function radTex(deg: number): string {
  const f = new Frac(deg, 180);
  if (f.n === 0) return '0';
  if (f.d === 1) return `${f.n === 1 ? '' : f.n}\\pi`;
  return `\\frac{${f.n === 1 ? '' : f.n}\\pi}{${f.d}}`;
}

export function UnitCircleWidget({ angle = 30 }: { angle?: number }) {
  const [deg, setDeg] = useState(angle);
  const R = 120, cx = 170, cy = 160;
  const { svgProps, handle } = useDrag((_id, x, y) => {
    let d = (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
    if (d < 0) d += 360;
    const snap = NOTABLE.find((n) => Math.abs(n - d) < 4 || Math.abs(n + 360 - d) < 4);
    setDeg(snap !== undefined ? snap : Math.round(d));
  });
  const a = (deg * Math.PI) / 180;
  const px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
  const s = Math.sin(a), c = Math.cos(a);
  const t = Math.abs(c) < 1e-9 ? null : s / c;
  const ex = exactTrig(deg);
  const quadrant = deg % 90 === 0 ? 'sobre un eje' : deg < 90 ? 'I' : deg < 180 ? 'II' : deg < 270 ? 'III' : 'IV';
  const large = deg > 180 ? 1 : 0;
  return (
    <div className="widget">
      <div className="grid cols-2" style={{ alignItems: 'center' }}>
        <svg viewBox="0 0 340 320" width="100%" {...svgProps} style={{ ...svgProps.style, maxHeight: 320 }}>
          <line x1={20} x2={320} y1={cy} y2={cy} className="graph-axis" />
          <line x1={cx} x2={cx} y1={20} y2={300} className="graph-axis" />
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--text-3)" strokeWidth={1.5} />
          {deg % 360 !== 0 && <path d={`M${cx + 34},${cy} A34,34 0 ${large},0 ${cx + 34 * Math.cos(a)},${cy - 34 * Math.sin(a)}`} fill="none" stroke="var(--viz-2)" strokeWidth={2} />}
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="var(--ink)" strokeWidth={2.2} />
          <line x1={cx} y1={cy} x2={px} y2={cy} stroke="var(--viz-1)" strokeWidth={4} strokeLinecap="round" />
          <line x1={px} y1={cy} x2={px} y2={py} stroke="var(--viz-2)" strokeWidth={4} strokeLinecap="round" />
          <text x={(cx + px) / 2} y={cy + (py < cy ? 18 : -8)} className="geo-label" textAnchor="middle">cos</text>
          <text x={px + (px > cx ? 8 : -8)} y={(cy + py) / 2} className="geo-label" textAnchor={px > cx ? 'start' : 'end'}>sen</text>
          <Handle x={px} y={py} h={handle('p')} />
        </svg>
        <div className="stack" style={{ gap: 8 }}>
          <div><Tex tex={`\\alpha = ${deg}^\\circ = ${NOTABLE.includes(deg) ? radTex(deg) : fmt(a, 3)}\\ \\text{rad}`} /></div>
          <div className="row"><span className="legend-line" style={{ background: 'var(--viz-1)' }} /><Tex tex={`\\cos\\alpha = ${ex ? `${ex.c} \\approx ` : ''}${fmt(c, 3)}`} /></div>
          <div className="row"><span className="legend-line" style={{ background: 'var(--viz-2)' }} /><Tex tex={`\\operatorname{sen}\\alpha = ${ex ? `${ex.s} \\approx ` : ''}${fmt(s, 3)}`} /></div>
          <div className="row"><span style={{ width: 18 }} /><Tex tex={`\\tan\\alpha = ${t === null ? '\\text{no definida}' : fmt(t, 3)}`} /></div>
          <div className="small muted">Cuadrante: {quadrant}. Arrastra el punto; se ajusta a los ángulos notables.</div>
          <input type="range" min={0} max={359} value={deg} onChange={(e) => setDeg(Number(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function PythagorasWidget({ a: a0 = 3, b: b0 = 4 }: { a?: number; b?: number }) {
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const U = 22;
  const ox = 170, oy = 200;
  const { svgProps, handle } = useDrag((id, x, y) => {
    if (id === 'a') setA(Math.max(1, Math.min(7, Math.round(((x - ox) / U) * 2) / 2)));
    if (id === 'b') setB(Math.max(1, Math.min(7, Math.round(((oy - y) / U) * 2) / 2)));
  });
  const A = [ox + a * U, oy], B = [ox, oy - b * U], C = [ox, oy];
  const c = Math.hypot(a, b);
  // Cuadrado sobre la hipotenusa, del lado opuesto al ángulo recto
  const hyp = [A, B, [B[0] + b * U, B[1] - a * U], [A[0] + b * U, A[1] - a * U]];
  return (
    <div className="widget">
      <svg viewBox="0 0 440 360" width="100%" {...svgProps} style={{ ...svgProps.style, maxHeight: 360 }}>
        <rect x={ox} y={oy} width={a * U} height={a * U} className="sq sq-a" />
        <rect x={ox - b * U} y={oy - b * U} width={b * U} height={b * U} className="sq sq-b" />
        <polygon points={hyp.map((p) => p.join(',')).join(' ')} className="sq sq-c" />
        <polygon points={`${A} ${B} ${C}`} className="geo-fill" stroke="var(--ink)" strokeWidth={2.2} />
        <text x={ox + (a * U) / 2} y={oy + (a * U) / 2 + 5} textAnchor="middle" className="geo-label">{`a² = ${fmt(a * a)}`}</text>
        <text x={ox - (b * U) / 2} y={oy - (b * U) / 2 + 5} textAnchor="middle" className="geo-label">{`b² = ${fmt(b * b)}`}</text>
        <text x={(A[0] + B[0]) / 2 + (b * U) / 2} y={(A[1] + B[1]) / 2 - (a * U) / 2 + 5} textAnchor="middle" className="geo-label">{`c² = ${fmt(c * c)}`}</text>
        <Handle x={A[0]} y={A[1]} h={handle('a')} />
        <Handle x={B[0]} y={B[1]} h={handle('b')} />
      </svg>
      <div className="center">
        <Tex tex={`a^2 + b^2 = ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(a * a + b * b)} = c^2 \\Rightarrow c = ${Number.isInteger(c) ? c : `\\sqrt{${fmt(a * a + b * b)}} \\approx ${fmt(c, 3)}`}`} />
      </div>
      <div className="small muted center">Arrastra los vértices marcados para cambiar los catetos.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function ThalesWidget() {
  const [ys, setYs] = useState([70, 150, 260]);
  const [t1, setT1] = useState({ top: 120, bottom: 170 });
  const [t2, setT2] = useState({ top: 240, bottom: 380 });
  const Y0 = 30, Y1 = 300;
  const { svgProps, handle } = useDrag((id, x, y) => {
    if (id.startsWith('p')) {
      const i = Number(id.slice(1));
      const next = ys.slice();
      next[i] = Math.max(Y0 + 10, Math.min(Y1 - 10, y));
      next.sort((p, q) => p - q);
      setYs(next);
    }
    if (id === 't1top') setT1({ ...t1, top: x });
    if (id === 't1bot') setT1({ ...t1, bottom: x });
    if (id === 't2top') setT2({ ...t2, top: x });
    if (id === 't2bot') setT2({ ...t2, bottom: x });
  });
  const at = (t: { top: number; bottom: number }, y: number) => t.top + ((t.bottom - t.top) * (y - Y0)) / (Y1 - Y0);
  const len = (t: { top: number; bottom: number }, ya: number, yb: number) => Math.hypot(at(t, yb) - at(t, ya), yb - ya);
  const a = len(t1, ys[0], ys[1]), b = len(t1, ys[1], ys[2]);
  const c = len(t2, ys[0], ys[1]), d = len(t2, ys[1], ys[2]);
  return (
    <div className="widget">
      <svg viewBox="0 0 460 330" width="100%" {...svgProps} style={{ ...svgProps.style, maxHeight: 330 }}>
        {ys.map((y, i) => (
          <g key={i}>
            <line x1={20} x2={440} y1={y} y2={y} stroke="var(--text-3)" strokeWidth={1.6} />
            <Handle x={30} y={y} h={handle(`p${i}`)} />
          </g>
        ))}
        {[t1, t2].map((t, k) => (
          <line key={k} x1={t.top} y1={Y0} x2={t.bottom} y2={Y1} stroke="var(--ink)" strokeWidth={2.2} />
        ))}
        {[t1, t2].map((t, k) => ys.map((y, i) => <circle key={`${k}${i}`} cx={at(t, y)} cy={y} r={4} fill="var(--ink)" />))}
        <text x={at(t1, (ys[0] + ys[1]) / 2) - 12} y={(ys[0] + ys[1]) / 2} textAnchor="end" className="geo-label">a</text>
        <text x={at(t1, (ys[1] + ys[2]) / 2) - 12} y={(ys[1] + ys[2]) / 2} textAnchor="end" className="geo-label">b</text>
        <text x={at(t2, (ys[0] + ys[1]) / 2) + 12} y={(ys[0] + ys[1]) / 2} className="geo-label">c</text>
        <text x={at(t2, (ys[1] + ys[2]) / 2) + 12} y={(ys[1] + ys[2]) / 2} className="geo-label">d</text>
        <Handle x={t1.top} y={Y0} h={handle('t1top')} />
        <Handle x={t1.bottom} y={Y1} h={handle('t1bot')} />
        <Handle x={t2.top} y={Y0} h={handle('t2top')} />
        <Handle x={t2.bottom} y={Y1} h={handle('t2bot')} />
      </svg>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 18 }}>
        <Tex tex={`\\frac{a}{b} = \\frac{${fmt(a, 1)}}{${fmt(b, 1)}} = ${fmt(a / b, 3)}`} />
        <Tex tex={`\\frac{c}{d} = \\frac{${fmt(c, 1)}}{${fmt(d, 1)}} = ${fmt(c / d, 3)}`} />
      </div>
      <div className="small muted center">Arrastra las paralelas (puntos de la izquierda) y los extremos de las transversales.</div>
    </div>
  );
}

// ---------------------------------------------------------------------------

export function TriangleSolverWidget({ mode = 'right' }: { mode?: 'right' | 'general' }) {
  const [alpha, setAlpha] = useState(35);
  const [hyp, setHyp] = useState(8);
  const [pts, setPts] = useState<[number, number][]>([[60, 250], [380, 250], [240, 70]]);
  const { svgProps, handle } = useDrag((id, x, y) => {
    const i = Number(id);
    const next = pts.slice() as [number, number][];
    next[i] = [Math.max(15, Math.min(425, x)), Math.max(15, Math.min(285, y))];
    setPts(next);
  });

  if (mode === 'right') {
    const a = (alpha * Math.PI) / 180;
    const op = hyp * Math.sin(a), ady = hyp * Math.cos(a);
    const S = 300 / Math.max(hyp, 1);
    const B = [70 + ady * S, 260], C = [70, 260], A = [70, 260 - op * S];
    return (
      <div className="widget">
        <div className="sliders">
          <label className="slider-row"><span>ángulo α</span><input type="range" min={5} max={85} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} /><b>{alpha}°</b></label>
          <label className="slider-row"><span>hipotenusa</span><input type="range" min={2} max={12} step={0.5} value={hyp} onChange={(e) => setHyp(Number(e.target.value))} /><b>{fmt(hyp)}</b></label>
        </div>
        <svg viewBox="0 0 440 290" width="100%" style={{ maxHeight: 290 }}>
          <polygon points={`${A} ${B} ${C}`} className="geo-fill" stroke="var(--ink)" strokeWidth={2.2} />
          <polyline points={`${C[0]},${C[1] - 14} ${C[0] + 14},${C[1] - 14} ${C[0] + 14},${C[1]}`} fill="none" stroke="var(--ink)" strokeWidth={1.4} />
          <path d={`M${B[0] - 40},${B[1]} A40,40 0 0,1 ${B[0] - 40 * Math.cos(a)},${B[1] - 40 * Math.sin(a)}`} fill="none" stroke="var(--viz-2)" strokeWidth={2} />
          <text x={B[0] - 58} y={B[1] - 10} className="geo-label">α</text>
          <text x={C[0] - 10} y={(A[1] + C[1]) / 2} textAnchor="end" className="geo-label">{`op = ${fmt(op, 2)}`}</text>
          <text x={(B[0] + C[0]) / 2} y={C[1] + 20} textAnchor="middle" className="geo-label">{`ady = ${fmt(ady, 2)}`}</text>
          <text x={(A[0] + B[0]) / 2 + 10} y={(A[1] + B[1]) / 2 - 10} className="geo-label">{`hip = ${fmt(hyp, 2)}`}</text>
        </svg>
        <div className="row wrap" style={{ justifyContent: 'center', gap: 18 }}>
          <Tex tex={`\\operatorname{sen}\\alpha = \\frac{${fmt(op, 2)}}{${fmt(hyp, 2)}} = ${fmt(Math.sin(a), 3)}`} />
          <Tex tex={`\\cos\\alpha = \\frac{${fmt(ady, 2)}}{${fmt(hyp, 2)}} = ${fmt(Math.cos(a), 3)}`} />
          <Tex tex={`\\tan\\alpha = \\frac{${fmt(op, 2)}}{${fmt(ady, 2)}} = ${fmt(Math.tan(a), 3)}`} />
        </div>
      </div>
    );
  }

  const [P, Q, Rr] = pts;
  const dist = (u: number[], v: number[]) => Math.hypot(u[0] - v[0], u[1] - v[1]) / 30;
  const a = dist(Q, Rr), b = dist(P, Rr), c = dist(P, Q);
  const ang = (x: number, y: number, z: number) => (Math.acos(Math.max(-1, Math.min(1, (y * y + z * z - x * x) / (2 * y * z)))) * 180) / Math.PI;
  const A = ang(a, b, c), B = ang(b, a, c), C = 180 - A - B;
  const sinR = (s: number, t: number) => s / Math.sin((t * Math.PI) / 180);
  return (
    <div className="widget">
      <svg viewBox="0 0 440 300" width="100%" {...svgProps} style={{ ...svgProps.style, maxHeight: 300 }}>
        <polygon points={pts.map((p) => p.join(',')).join(' ')} className="geo-fill" stroke="var(--ink)" strokeWidth={2.2} />
        <text x={(Q[0] + Rr[0]) / 2 + 10} y={(Q[1] + Rr[1]) / 2} className="geo-label">{`a = ${fmt(a, 2)}`}</text>
        <text x={(P[0] + Rr[0]) / 2 - 10} y={(P[1] + Rr[1]) / 2} textAnchor="end" className="geo-label">{`b = ${fmt(b, 2)}`}</text>
        <text x={(P[0] + Q[0]) / 2} y={(P[1] + Q[1]) / 2 + 22} textAnchor="middle" className="geo-label">{`c = ${fmt(c, 2)}`}</text>
        {pts.map((p, i) => <Handle key={i} x={p[0]} y={p[1]} h={handle(String(i))} label={`${'ABC'[i]} = ${fmt([A, B, C][i], 1)}°`} />)}
      </svg>
      <div className="row wrap" style={{ justifyContent: 'center', gap: 16 }}>
        <Tex tex={`\\frac{a}{\\operatorname{sen}A} = ${fmt(sinR(a, A), 3)}`} />
        <Tex tex={`\\frac{b}{\\operatorname{sen}B} = ${fmt(sinR(b, B), 3)}`} />
        <Tex tex={`\\frac{c}{\\operatorname{sen}C} = ${fmt(sinR(c, C), 3)}`} />
      </div>
      <div className="center small muted">Teorema del coseno: <Tex tex={`c^2 = ${fmt(c * c, 2)} \\quad a^2 + b^2 - 2ab\\cos C = ${fmt(a * a + b * b - 2 * a * b * Math.cos((C * Math.PI) / 180), 2)}`} /></div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Plane({ lim = 6, size = 340, children, svgProps }: { lim?: number; size?: number; children: (s: (x: number) => number, t: (y: number) => number) => ReactNode; svgProps?: Record<string, unknown> }) {
  const sx = (x: number) => size / 2 + (x / lim) * (size / 2 - 10);
  const sy = (y: number) => size / 2 - (y / lim) * (size / 2 - 10);
  const ticks: number[] = [];
  for (let i = -lim; i <= lim; i++) ticks.push(i);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" {...svgProps} style={{ ...(svgProps?.style as object | undefined), maxHeight: size }}>
      <defs>
        {[1, 2, 3].map((i) => (
          <marker key={i} id={`w-arrow-${i}`} markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" fill={`var(--viz-${i})`} />
          </marker>
        ))}
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={0} y2={size} className="viz-grid" />
          <line x1={0} x2={size} y1={sy(t)} y2={sy(t)} className="viz-grid" />
        </g>
      ))}
      <line x1={0} x2={size} y1={sy(0)} y2={sy(0)} className="graph-axis" />
      <line x1={sx(0)} x2={sx(0)} y1={0} y2={size} className="graph-axis" />
      {children(sx, sy)}
    </svg>
  );
}

export function VectorsWidget({ u: u0 = [3, 1], v: v0 = [1, 2] }: { u?: [number, number]; v?: [number, number]; showAngle?: boolean }) {
  const [u, setU] = useState(u0);
  const [v, setV] = useState(v0);
  const lim = 6, size = 340;
  const inv = (px: number, py: number): [number, number] => {
    const x = ((px - size / 2) / (size / 2 - 10)) * lim;
    const y = ((size / 2 - py) / (size / 2 - 10)) * lim;
    return [Math.max(-lim, Math.min(lim, Math.round(x))), Math.max(-lim, Math.min(lim, Math.round(y)))];
  };
  const { svgProps, handle } = useDrag((id, px, py) => (id === 'u' ? setU(inv(px, py)) : setV(inv(px, py))));
  const sum = [u[0] + v[0], u[1] + v[1]];
  const dot = u[0] * v[0] + u[1] * v[1];
  const mu = Math.hypot(u[0], u[1]), mv = Math.hypot(v[0], v[1]);
  const ang = mu && mv ? (Math.acos(Math.max(-1, Math.min(1, dot / (mu * mv)))) * 180) / Math.PI : NaN;
  return (
    <div className="widget">
      <div className="grid cols-2" style={{ alignItems: 'center' }}>
        <Plane lim={lim} size={size} svgProps={svgProps}>
          {(sx, sy) => (
            <>
              <path d={`M${sx(u[0])},${sy(u[1])} L${sx(sum[0])},${sy(sum[1])} L${sx(v[0])},${sy(v[1])}`} fill="none" stroke="var(--text-3)" strokeDasharray="5 4" strokeWidth={1.4} />
              <line x1={sx(0)} y1={sy(0)} x2={sx(sum[0])} y2={sy(sum[1])} stroke="var(--viz-3)" strokeWidth={2.5} markerEnd="url(#w-arrow-3)" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(u[0])} y2={sy(u[1])} stroke="var(--viz-1)" strokeWidth={3} markerEnd="url(#w-arrow-1)" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(v[0])} y2={sy(v[1])} stroke="var(--viz-2)" strokeWidth={3} markerEnd="url(#w-arrow-2)" />
              <Handle x={sx(u[0])} y={sy(u[1])} h={handle('u')} label="u" />
              <Handle x={sx(v[0])} y={sy(v[1])} h={handle('v')} label="v" />
              <text x={sx(sum[0]) + 8} y={sy(sum[1]) - 8} className="geo-label">u+v</text>
            </>
          )}
        </Plane>
        <div className="stack" style={{ gap: 6 }}>
          <div className="row"><span className="legend-line" style={{ background: 'var(--viz-1)' }} /><Tex tex={`\\vec u = (${u[0]};\\ ${u[1]}),\\ |\\vec u| = ${fmt(mu, 3)}`} /></div>
          <div className="row"><span className="legend-line" style={{ background: 'var(--viz-2)' }} /><Tex tex={`\\vec v = (${v[0]};\\ ${v[1]}),\\ |\\vec v| = ${fmt(mv, 3)}`} /></div>
          <div className="row"><span className="legend-line" style={{ background: 'var(--viz-3)' }} /><Tex tex={`\\vec u + \\vec v = (${sum[0]};\\ ${sum[1]})`} /></div>
          <div className="row"><span style={{ width: 18 }} /><Tex tex={`\\vec u\\cdot\\vec v = ${dot}`} />{dot === 0 && mu > 0 && mv > 0 && <span className="badge success">perpendiculares</span>}</div>
          {Number.isFinite(ang) && <div className="row"><span style={{ width: 18 }} /><Tex tex={`\\theta = ${fmt(ang, 1)}^\\circ`} /></div>}
          <div className="small muted">Arrastra las puntas de los vectores (se ajustan a la cuadrícula).</div>
        </div>
      </div>
    </div>
  );
}

export function MatrixWidget({ m = [[1, 1], [0, 1]], showDet = true }: { m?: number[][]; showDet?: boolean }) {
  const [M, setM] = useState(m.map((r) => r.slice()));
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  const T = (x: number, y: number): [number, number] => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
  const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1)];
  return (
    <div className="widget">
      <div className="grid cols-2" style={{ alignItems: 'center' }}>
        <Plane lim={4}>
          {(sx, sy) => (
            <>
              <polygon points={[[0, 0], [1, 0], [1, 1], [0, 1]].map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} fill="none" stroke="var(--text-3)" strokeDasharray="5 4" />
              <polygon points={sq.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')} className="matrix-area" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(sq[1][0])} y2={sy(sq[1][1])} stroke="var(--viz-1)" strokeWidth={3} markerEnd="url(#w-arrow-1)" />
              <line x1={sx(0)} y1={sy(0)} x2={sx(sq[3][0])} y2={sy(sq[3][1])} stroke="var(--viz-2)" strokeWidth={3} markerEnd="url(#w-arrow-2)" />
            </>
          )}
        </Plane>
        <div className="stack">
          <div className="matrix-edit">
            {M.map((row, i) => row.map((val, j) => (
              <label key={`${i}${j}`} className="slider-row">
                <span className="mono">{`m${i + 1}${j + 1}`}</span>
                <input type="range" min={-3} max={3} step={0.5} value={val} onChange={(e) => { const next = M.map((r) => r.slice()); next[i][j] = Number(e.target.value); setM(next); }} />
                <b className="mono">{fmt(val)}</b>
              </label>
            )))}
          </div>
          <Tex tex={`A = \\begin{pmatrix} ${fmt(M[0][0])} & ${fmt(M[0][1])} \\\\ ${fmt(M[1][0])} & ${fmt(M[1][1])} \\end{pmatrix}`} display />
          {showDet && <Tex tex={`\\det A = ${fmt(M[0][0])}\\cdot ${fmt(M[1][1])} - ${fmt(M[0][1])}\\cdot ${fmt(M[1][0])} = ${fmt(det)}`} />}
          <div className="small muted">El cuadrado unidad (punteado) se transforma en el paralelogramo; su área (con signo) es el determinante. {det === 0 ? 'Con det = 0 el plano se aplasta: la matriz no es invertible.' : ''}</div>
        </div>
      </div>
    </div>
  );
}
