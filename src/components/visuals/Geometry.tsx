// Figuras geométricas estáticas para los enunciados.
import type { ReactNode } from 'react';

const S = 'var(--ink)';

function Label({ x, y, children, anchor = 'middle', italic = false }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; italic?: boolean }) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" className="geo-label" fontStyle={italic ? 'italic' : undefined}>
      {children}
    </text>
  );
}

function Frame({ w, h, children, max = 300 }: { w: number; h: number; children: ReactNode; max?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxHeight: max }} role="img" className="geo-svg">
      {children}
    </svg>
  );
}

/** Triángulo rectángulo: ángulo recto abajo a la izquierda, cateto A vertical, cateto B horizontal. */
export function RightTriangle({ legA, legB, hyp, angle, angleAt = 'B' }: { legA: string; legB: string; hyp: string; angle?: string; angleAt?: 'A' | 'B' }) {
  const C = [70, 210], A = [70, 50], B = [330, 210];
  return (
    <Frame w={400} h={250}>
      <polygon points={`${A} ${B} ${C}`} className="geo-fill" />
      <polygon points={`${A} ${B} ${C}`} fill="none" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
      <polyline points={`${C[0]},${C[1] - 18} ${C[0] + 18},${C[1] - 18} ${C[0] + 18},${C[1]}`} fill="none" stroke={S} strokeWidth={1.5} />
      {legA && <Label x={C[0] - 22} y={(A[1] + C[1]) / 2} italic>{legA}</Label>}
      {legB && <Label x={(B[0] + C[0]) / 2} y={C[1] + 20} italic>{legB}</Label>}
      {hyp && <Label x={(A[0] + B[0]) / 2 + 18} y={(A[1] + B[1]) / 2 - 16} italic>{hyp}</Label>}
      {angle && angleAt === 'B' && (
        <>
          <path d={`M${B[0] - 46},${B[1]} A46,46 0 0,1 ${B[0] - 46 * Math.cos(Math.atan2(160, 260))},${B[1] - 46 * Math.sin(Math.atan2(160, 260))}`} fill="none" stroke="var(--viz-2)" strokeWidth={2} />
          <Label x={B[0] - 68} y={B[1] - 14}>{angle}</Label>
        </>
      )}
      {angle && angleAt === 'A' && (
        <>
          <path d={`M${A[0]},${A[1] + 40} A40,40 0 0,0 ${A[0] + 40 * Math.sin(Math.atan2(260, 160))},${A[1] + 40 * Math.cos(Math.atan2(260, 160))}`} fill="none" stroke="var(--viz-2)" strokeWidth={2} />
          <Label x={A[0] + 18} y={A[1] + 58}>{angle}</Label>
        </>
      )}
    </Frame>
  );
}

export function Triangle({ sides, angles }: { sides: [string, string, string]; angles?: [string, string, string] }) {
  const A = [60, 220], B = [340, 220], C = [220, 50];
  return (
    <Frame w={400} h={260}>
      <polygon points={`${A} ${B} ${C}`} className="geo-fill" />
      <polygon points={`${A} ${B} ${C}`} fill="none" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
      <Label x={(B[0] + C[0]) / 2 + 20} y={(B[1] + C[1]) / 2} italic>{sides[0]}</Label>
      <Label x={(A[0] + C[0]) / 2 - 20} y={(A[1] + C[1]) / 2} italic>{sides[1]}</Label>
      <Label x={(A[0] + B[0]) / 2} y={A[1] + 20} italic>{sides[2]}</Label>
      <Label x={A[0] - 14} y={A[1] + 8}>A</Label>
      <Label x={B[0] + 14} y={B[1] + 8}>B</Label>
      <Label x={C[0]} y={C[1] - 14}>C</Label>
      {angles && (
        <>
          {angles[0] && <Label x={A[0] + 40} y={A[1] - 14}>{angles[0]}</Label>}
          {angles[1] && <Label x={B[0] - 42} y={B[1] - 14}>{angles[1]}</Label>}
          {angles[2] && <Label x={C[0]} y={C[1] + 30}>{angles[2]}</Label>}
        </>
      )}
    </Frame>
  );
}

export function Shape({ shape, labels }: { shape: string; labels: Record<string, string> }) {
  const L = labels;
  switch (shape) {
    case 'rectangle':
    case 'square': {
      const w = shape === 'square' ? 170 : 240, h = shape === 'square' ? 170 : 140;
      const x = (400 - w) / 2, y = 30;
      return (
        <Frame w={400} h={h + 80}>
          <rect x={x} y={y} width={w} height={h} className="geo-fill" stroke={S} strokeWidth={2.2} />
          {L.d && <line x1={x} y1={y + h} x2={x + w} y2={y} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="6 5" />}
          {L.d && <Label x={x + w / 2 + 16} y={y + h / 2 - 12} italic>{L.d}</Label>}
          <Label x={x + w / 2} y={y + h + 22} italic>{L.b ?? L.l ?? ''}</Label>
          <Label x={x - 12} y={y + h / 2} anchor="end" italic>{L.h ?? L.l ?? ''}</Label>
        </Frame>
      );
    }
    case 'circle':
      return (
        <Frame w={400} h={250}>
          <circle cx={200} cy={125} r={100} className="geo-fill" stroke={S} strokeWidth={2.2} />
          <line x1={200} y1={125} x2={300} y2={125} stroke="var(--viz-2)" strokeWidth={2} />
          <circle cx={200} cy={125} r={3.5} fill={S} />
          <Label x={250} y={110} italic>{L.r ?? 'r'}</Label>
        </Frame>
      );
    case 'triangle':
      return (
        <Frame w={400} h={250}>
          <polygon points="60,200 340,200 240,40" className="geo-fill" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
          <line x1={240} y1={40} x2={240} y2={200} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="6 5" />
          <polyline points="240,188 252,188 252,200" fill="none" stroke={S} strokeWidth={1.4} />
          <Label x={200} y={222} italic>{L.b ?? ''}</Label>
          <Label x={262} y={120} anchor="start" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    case 'trapezoid':
      return (
        <Frame w={400} h={240}>
          <polygon points="50,190 350,190 280,50 120,50" className="geo-fill" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
          <line x1={120} y1={50} x2={120} y2={190} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="6 5" />
          <Label x={200} y={212} italic>{L.B ?? ''}</Label>
          <Label x={200} y={32} italic>{L.b ?? ''}</Label>
          <Label x={108} y={120} anchor="end" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    case 'parallelogram':
      return (
        <Frame w={400} h={230}>
          <polygon points="50,180 290,180 350,50 110,50" className="geo-fill" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
          <line x1={110} y1={50} x2={110} y2={180} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="6 5" />
          <Label x={170} y={202} italic>{L.b ?? ''}</Label>
          <Label x={98} y={115} anchor="end" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    case 'rhombus':
      return (
        <Frame w={400} h={250}>
          <polygon points="200,25 330,125 200,225 70,125" className="geo-fill" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
          <line x1={70} y1={125} x2={330} y2={125} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="6 5" />
          <line x1={200} y1={25} x2={200} y2={225} stroke="var(--viz-1)" strokeWidth={2} strokeDasharray="6 5" />
          <Label x={265} y={112} italic>{L.D ?? ''}</Label>
          <Label x={214} y={185} anchor="start" italic>{L.d ?? ''}</Label>
        </Frame>
      );
    case 'L':
      return (
        <Frame w={400} h={250}>
          <path d="M80,30 H320 V110 H220 V220 H80 Z" className="geo-fill" stroke={S} strokeWidth={2.2} strokeLinejoin="round" />
          <path d="M220,110 H320 V220 H220" fill="none" stroke="var(--text-3)" strokeWidth={1.5} strokeDasharray="6 5" />
          <Label x={200} y={16} italic>{L.W ?? ''}</Label>
          <Label x={64} y={125} anchor="end" italic>{L.H ?? ''}</Label>
          <Label x={270} y={236} italic>{L.w ?? ''}</Label>
          <Label x={336} y={165} anchor="start" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    default:
      return null;
  }
}

export function Solid({ shape, labels }: { shape: string; labels: Record<string, string> }) {
  const L = labels;
  const hidden = { stroke: 'var(--text-3)', strokeDasharray: '6 5', strokeWidth: 1.5, fill: 'none' };
  const edge = { stroke: S, strokeWidth: 2, fill: 'none', strokeLinejoin: 'round' as const };
  switch (shape) {
    case 'cube':
    case 'prism': {
      const w = shape === 'cube' ? 150 : 200, h = shape === 'cube' ? 150 : 120, d = 60;
      const x = 90, y = 90;
      return (
        <Frame w={400} h={290}>
          <polygon points={`${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`} className="geo-fill" />
          <polygon points={`${x},${y} ${x + d},${y - d * 0.6} ${x + w + d},${y - d * 0.6} ${x + w},${y}`} className="geo-fill top" />
          <polygon points={`${x + w},${y} ${x + w + d},${y - d * 0.6} ${x + w + d},${y + h - d * 0.6} ${x + w},${y + h}`} className="geo-fill side" />
          <path d={`M${x},${y + h} L${x + d},${y + h - d * 0.6} L${x + w + d},${y + h - d * 0.6} M${x + d},${y + h - d * 0.6} L${x + d},${y - d * 0.6}`} {...hidden} />
          <path d={`M${x},${y} H${x + w} V${y + h} H${x} Z M${x},${y} L${x + d},${y - d * 0.6} H${x + w + d} L${x + w},${y} M${x + w + d},${y - d * 0.6} V${y + h - d * 0.6} L${x + w},${y + h}`} {...edge} />
          <Label x={x + w / 2} y={y + h + 20} italic>{L.a ?? ''}</Label>
          {shape === 'prism' && <Label x={x - 12} y={y + h / 2} anchor="end" italic>{L.c ?? ''}</Label>}
          {shape === 'prism' && <Label x={x + w + d / 2 + 16} y={y + h - d * 0.3 + 6} anchor="start" italic>{L.b ?? ''}</Label>}
        </Frame>
      );
    }
    case 'cylinder':
      return (
        <Frame w={400} h={300}>
          <path d="M110,70 V230 A90,26 0 0,0 290,230 V70" className="geo-fill" />
          <ellipse cx={200} cy={70} rx={90} ry={26} className="geo-fill top" />
          <path d="M110,230 A90,26 0 0,1 290,230" {...hidden} />
          <path d="M110,70 V230 A90,26 0 0,0 290,230 V70" {...edge} />
          <ellipse cx={200} cy={70} rx={90} ry={26} {...edge} />
          <line x1={200} y1={230} x2={290} y2={230} stroke="var(--viz-2)" strokeWidth={2} />
          <Label x={245} y={218} italic>{L.r ?? ''}</Label>
          <Label x={304} y={150} anchor="start" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    case 'cone':
      return (
        <Frame w={400} h={300}>
          <path d="M110,240 L200,40 L290,240 A90,26 0 0,1 110,240" className="geo-fill" />
          <path d="M110,240 A90,26 0 0,1 290,240" {...hidden} />
          <path d="M110,240 L200,40 L290,240 A90,26 0 0,1 110,240" {...edge} />
          <line x1={200} y1={40} x2={200} y2={240} {...hidden} />
          <line x1={200} y1={240} x2={290} y2={240} stroke="var(--viz-2)" strokeWidth={2} />
          <Label x={245} y={228} italic>{L.r ?? ''}</Label>
          <Label x={212} y={140} anchor="start" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    case 'sphere':
      return (
        <Frame w={400} h={280}>
          <circle cx={200} cy={140} r={110} className="geo-fill" />
          <path d="M90,140 A110,32 0 0,1 310,140" {...hidden} />
          <path d="M90,140 A110,32 0 0,0 310,140" {...edge} />
          <circle cx={200} cy={140} r={110} {...edge} />
          <line x1={200} y1={140} x2={310} y2={140} stroke="var(--viz-2)" strokeWidth={2} />
          <circle cx={200} cy={140} r={3} fill={S} />
          <Label x={255} y={126} italic>{L.r ?? ''}</Label>
        </Frame>
      );
    case 'pyramid':
      return (
        <Frame w={400} h={290}>
          <polygon points="100,240 260,240 320,200 200,40" className="geo-fill" />
          <path d="M100,240 L160,200 L320,200 M160,200 L200,40" {...hidden} />
          <line x1={200} y1={40} x2={210} y2={220} {...hidden} />
          <path d="M100,240 H260 L320,200 L200,40 Z M260,240 L200,40" {...edge} />
          <Label x={180} y={260} italic>{L.l ?? ''}</Label>
          <Label x={218} y={140} anchor="start" italic>{L.h ?? ''}</Label>
        </Frame>
      );
    default:
      return null;
  }
}

/** Teorema de Tales: tres paralelas cortadas por dos transversales. */
export function Thales({ a, b, c, d }: { a: string; b: string; c: string; d: string }) {
  const ys = [50, 130, 230];
  const t1 = (y: number) => 110 + (y - 50) * 0.18;
  const t2 = (y: number) => 230 + (y - 50) * 0.55;
  return (
    <Frame w={420} h={270}>
      {ys.map((y) => <line key={y} x1={30} x2={400} y1={y} y2={y} stroke="var(--text-3)" strokeWidth={1.5} />)}
      <line x1={t1(20)} y1={20} x2={t1(255)} y2={255} stroke={S} strokeWidth={2.2} />
      <line x1={t2(20)} y1={20} x2={t2(255)} y2={255} stroke={S} strokeWidth={2.2} />
      {ys.map((y) => (
        <g key={`p${y}`}>
          <circle cx={t1(y)} cy={y} r={3.5} fill={S} />
          <circle cx={t2(y)} cy={y} r={3.5} fill={S} />
        </g>
      ))}
      <Label x={t1(90) - 16} y={90} anchor="end" italic>{a}</Label>
      <Label x={t1(180) - 16} y={180} anchor="end" italic>{b}</Label>
      <Label x={t2(90) + 16} y={90} anchor="start" italic>{c}</Label>
      <Label x={t2(180) + 16} y={180} anchor="start" italic>{d}</Label>
    </Frame>
  );
}

/** Círculo unitario con el ángulo marcado y sus proyecciones. */
export function UnitCircleStatic({ angleDeg }: { angleDeg: number }) {
  const R = 110, cx = 160, cy = 150;
  const a = (angleDeg * Math.PI) / 180;
  const px = cx + R * Math.cos(a), py = cy - R * Math.sin(a);
  const large = angleDeg % 360 > 180 ? 1 : 0;
  const arcR = 30;
  return (
    <Frame w={320} h={300} max={260}>
      <line x1={20} x2={300} y1={cy} y2={cy} className="graph-axis" />
      <line x1={cx} x2={cx} y1={20} y2={280} className="graph-axis" />
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--text-3)" strokeWidth={1.5} />
      <line x1={cx} y1={cy} x2={px} y2={py} stroke={S} strokeWidth={2.2} />
      <line x1={px} y1={py} x2={px} y2={cy} stroke="var(--viz-1)" strokeWidth={2} strokeDasharray="5 4" />
      <line x1={cx} y1={py} x2={px} y2={py} stroke="var(--viz-2)" strokeWidth={2} strokeDasharray="5 4" />
      {angleDeg % 360 !== 0 && (
        <path d={`M${cx + arcR},${cy} A${arcR},${arcR} 0 ${large},0 ${cx + arcR * Math.cos(a)},${cy - arcR * Math.sin(a)}`} fill="none" stroke="var(--viz-2)" strokeWidth={2} />
      )}
      <circle cx={px} cy={py} r={5} className="graph-point" />
      <Label x={cx + 42} y={cy - 14} anchor="start">{`${angleDeg}°`}</Label>
      <Label x={R + cx + 12} y={cy + 14} anchor="start">1</Label>
    </Frame>
  );
}

export function NumberLine({ points, ranges, min, max }: { points: { x: number; open?: boolean; label?: string }[]; ranges?: { from: number; to: number }[]; min: number; max: number }) {
  const W = 480, y = 50;
  const sx = (v: number) => 30 + ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (W - 60);
  const ticks: number[] = [];
  for (let t = Math.ceil(min); t <= max; t++) ticks.push(t);
  return (
    <Frame w={W} h={90} max={110}>
      <line x1={14} x2={W - 14} y1={y} y2={y} stroke={S} strokeWidth={1.8} markerEnd="url(#nl-arrow)" />
      <defs>
        <marker id="nl-arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6" fill="none" stroke={S} strokeWidth={1.5} />
        </marker>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={y - 5} y2={y + 5} stroke={S} strokeWidth={1.2} />
          <text x={sx(t)} y={y + 22} className="viz-tick" textAnchor="middle">{t}</text>
        </g>
      ))}
      {ranges?.map((r, i) => (
        <line key={i} x1={Number.isFinite(r.from) ? sx(r.from) : 14} x2={Number.isFinite(r.to) ? sx(r.to) : W - 14} y1={y} y2={y} stroke="var(--viz-1)" strokeWidth={6} strokeLinecap="round" opacity={0.85} />
      ))}
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={y} r={7} className={p.open ? 'graph-point open' : 'graph-point'} />
      ))}
    </Frame>
  );
}

export function FractionBars({ fractions }: { fractions: [number, number][] }) {
  const W = 420, bh = 34, gap = 22;
  return (
    <Frame w={W} h={fractions.length * (bh + gap) + 10} max={220}>
      {fractions.map(([n, d], k) => {
        const y = 10 + k * (bh + gap);
        const cw = (W - 90) / d;
        return (
          <g key={k}>
            {Array.from({ length: d }, (_, i) => (
              <rect key={i} x={10 + i * cw + 1} y={y} width={cw - 2} height={bh} rx={4} className={i < n % (d + 1) || (n > d && i < d) ? 'frac-on' : 'frac-off'} />
            ))}
            <text x={W - 70} y={y + bh / 2} className="geo-label" dominantBaseline="middle">{`${n}/${d}`}</text>
          </g>
        );
      })}
    </Frame>
  );
}

export function VectorsStatic({ vectors }: { vectors: { x: number; y: number; label: string; from?: [number, number] }[] }) {
  const all = vectors.flatMap((v) => [v.from?.[0] ?? 0, (v.from?.[0] ?? 0) + v.x, v.from?.[1] ?? 0, (v.from?.[1] ?? 0) + v.y]);
  const lim = Math.max(4, Math.ceil(Math.max(...all.map(Math.abs)) + 1));
  const W = 320, H = 320;
  const sx = (x: number) => W / 2 + (x / lim) * (W / 2 - 16);
  const sy = (y: number) => H / 2 - (y / lim) * (H / 2 - 16);
  const ticks: number[] = [];
  for (let t = -lim; t <= lim; t++) ticks.push(t);
  return (
    <Frame w={W} h={H} max={280}>
      <defs>
        {[1, 2, 3].map((i) => (
          <marker key={i} id={`arrow-${i}`} markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L8,4 L0,8 Z" fill={`var(--viz-${i})`} />
          </marker>
        ))}
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={sx(t)} x2={sx(t)} y1={0} y2={H} className="viz-grid" />
          <line x1={0} x2={W} y1={sy(t)} y2={sy(t)} className="viz-grid" />
        </g>
      ))}
      <line x1={0} x2={W} y1={sy(0)} y2={sy(0)} className="graph-axis" />
      <line x1={sx(0)} x2={sx(0)} y1={0} y2={H} className="graph-axis" />
      {vectors.map((v, i) => {
        const fx = v.from?.[0] ?? 0, fy = v.from?.[1] ?? 0;
        const slot = (i % 3) + 1;
        return (
          <g key={i}>
            <line x1={sx(fx)} y1={sy(fy)} x2={sx(fx + v.x)} y2={sy(fy + v.y)} stroke={`var(--viz-${slot})`} strokeWidth={2.5} markerEnd={`url(#arrow-${slot})`} />
            <text x={sx(fx + v.x) + 6} y={sy(fy + v.y) - 6} className="geo-label">{v.label}</text>
          </g>
        );
      })}
    </Frame>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table className="table num data-visual">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
