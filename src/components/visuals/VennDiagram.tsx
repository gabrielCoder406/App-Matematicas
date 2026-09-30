// Diagrama de Venn de 2 o 3 conjuntos con regiones seleccionables.
import { useId, useRef } from 'react';

interface Circle { name: string; cx: number; cy: number; r: number; hue: number }

const LAYOUT2: Circle[] = [
  { name: 'A', cx: 150, cy: 135, r: 88, hue: 250 },
  { name: 'B', cx: 250, cy: 135, r: 88, hue: 20 },
];
const LAYOUT3: Circle[] = [
  { name: 'A', cx: 160, cy: 108, r: 82, hue: 250 },
  { name: 'B', cx: 240, cy: 108, r: 82, hue: 20 },
  { name: 'C', cx: 200, cy: 178, r: 82, hue: 150 },
];

/** Punto de anclaje (para etiquetas y elementos) de cada región. */
const ANCHORS2: Record<string, [number, number]> = { A: [108, 135], AB: [200, 135], B: [292, 135], '': [30, 30] };
const ANCHORS3: Record<string, [number, number]> = {
  A: [128, 88], B: [272, 88], C: [200, 222], AB: [200, 76], AC: [158, 160], BC: [242, 160], ABC: [200, 132], '': [28, 26],
};

export function regionIds(sets: string[]): string[] {
  const out: string[] = [];
  const n = sets.length;
  for (let mask = 0; mask < 1 << n; mask++) out.push(sets.filter((_, i) => mask & (1 << i)).join(''));
  return out;
}

interface Props {
  sets: string[];
  selected?: Set<string>;
  onToggle?(region: string): void;
  elements?: Record<string, string[]>;
  universe?: boolean;
  height?: number;
  highlightColor?: string;
  wrongRegions?: Set<string>;
}

export function VennDiagram({ sets, selected, onToggle, elements, universe = true, height = 260, highlightColor, wrongRegions }: Props) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const circles = (sets.length === 3 ? LAYOUT3 : LAYOUT2).map((c, i) => ({ ...c, name: sets[i] ?? c.name }));
  const anchors = sets.length === 3 ? ANCHORS3 : ANCHORS2;
  const W = 400, H = 270;

  const regionAt = (x: number, y: number): string | null => {
    if (x < 6 || y < 6 || x > W - 6 || y > H - 6) return null;
    return circles.filter((c) => (x - c.cx) ** 2 + (y - c.cy) ** 2 <= c.r ** 2).map((c) => c.name).join('');
  };

  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onToggle || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svgRef.current.getScreenCTM()!.inverse());
    const r = regionAt(p.x, p.y);
    if (r !== null) onToggle(r);
  };

  const fill = highlightColor ?? 'var(--primary)';
  const regions = regionIds(sets);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ maxHeight: height, cursor: onToggle ? 'pointer' : 'default', touchAction: 'manipulation' }}
      onClick={onClick}
      role={onToggle ? 'application' : 'img'}
      aria-label={`Diagrama de Venn de ${sets.join(', ')}`}
    >
      <defs>
        {circles.map((c) => (
          <clipPath key={c.name} id={`${uid}-clip-${c.name}`}>
            <circle cx={c.cx} cy={c.cy} r={c.r} />
          </clipPath>
        ))}
        {regions.map((reg) => {
          const excluded = circles.filter((c) => !reg.includes(c.name));
          return (
            <mask key={reg || 'out'} id={`${uid}-mask-${reg || 'out'}`}>
              <rect x="0" y="0" width={W} height={H} fill="white" />
              {excluded.map((c) => (
                <circle key={c.name} cx={c.cx} cy={c.cy} r={c.r} fill="black" />
              ))}
            </mask>
          );
        })}
      </defs>
      <rect x="4" y="4" width={W - 8} height={H - 8} rx="14" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      {universe && (
        <text x={W - 22} y={26} fontSize="15" fill="var(--text-3)" fontWeight="600" textAnchor="middle">U</text>
      )}
      {regions.map((reg) => {
        const isSel = selected?.has(reg);
        const isWrong = wrongRegions?.has(reg);
        if (!isSel && !isWrong) return null;
        const included = circles.filter((c) => reg.includes(c.name));
        let shape = <rect x="4" y="4" width={W - 8} height={H - 8} rx="14" fill={isWrong ? 'var(--danger)' : fill} opacity={isWrong ? 0.35 : 0.42} />;
        for (const c of included) shape = <g clipPath={`url(#${uid}-clip-${c.name})`}>{shape}</g>;
        return (
          <g key={reg || 'out'} mask={`url(#${uid}-mask-${reg || 'out'})`} style={{ pointerEvents: 'none' }}>
            {shape}
          </g>
        );
      })}
      {circles.map((c) => (
        <g key={c.name} style={{ pointerEvents: 'none' }}>
          <circle cx={c.cx} cy={c.cy} r={c.r} fill={`hsl(${c.hue} 80% 60% / 0.06)`} stroke={`hsl(${c.hue} 65% 52%)`} strokeWidth="2.2" />
        </g>
      ))}
      {circles.map((c, i) => {
        const lx = sets.length === 3 ? (i === 0 ? c.cx - 78 : i === 1 ? c.cx + 78 : c.cx + 86) : i === 0 ? c.cx - 70 : c.cx + 70;
        const ly = sets.length === 3 ? (i === 2 ? c.cy + 74 : c.cy - 70) : c.cy - 76;
        return (
          <text key={`l${c.name}`} x={lx} y={ly} fontSize="19" fontWeight="700" fill={`hsl(${c.hue} 60% 48%)`} textAnchor="middle" style={{ pointerEvents: 'none' }}>
            {c.name}
          </text>
        );
      })}
      {elements &&
        Object.entries(elements).map(([reg, els]) => {
          const a = anchors[reg];
          if (!a || !els.length) return null;
          const perRow = 3;
          return (
            <g key={`e${reg}`} style={{ pointerEvents: 'none' }}>
              {els.map((el, i) => (
                <text
                  key={i}
                  x={a[0] + ((i % perRow) - (Math.min(els.length, perRow) - 1) / 2) * 20 + (reg === '' ? 10 : 0)}
                  y={a[1] + Math.floor(i / perRow) * 19 - ((Math.ceil(els.length / perRow) - 1) * 19) / 2 + (reg === '' ? 6 : 0)}
                  fontSize="14"
                  fill="var(--text)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {el}
                </text>
              ))}
            </g>
          );
        })}
    </svg>
  );
}
