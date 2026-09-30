// Modelos concretos: balanza de ecuaciones, barras de fracciones y recta numérica.
import { useMemo, useState } from 'react';
import { gcd, lcm } from '../math/fraction';
import { parse } from '../math/parse';
import { realSetOf, realSetToLatex } from '../math/solve';
import { Icon } from '../components/Icon';
import { Tex } from '../components/Math';
import { NumberLine } from '../components/visuals/Geometry';

interface Pan {
  x: number;
  u: number;
}

function sideTex(p: Pan): string {
  const parts: string[] = [];
  if (p.x) parts.push(p.x === 1 ? 'x' : `${p.x}x`);
  if (p.u || !p.x) parts.push(String(p.u));
  return parts.join(' + ');
}

/** Balanza: la ecuación ax + b = cx + d con cajas (x) y pesas (1). */
export function BalanceWidget({ a = 3, b = 2, c = 1, d = 8 }: { a?: number; b?: number; c?: number; d?: number }) {
  const solution = (d - b) / (a - c);
  const [left, setLeft] = useState<Pan>({ x: a, u: b });
  const [right, setRight] = useState<Pan>({ x: c, u: d });
  const [history, setHistory] = useState<{ l: Pan; r: Pan; msg: string }[]>([]);
  const [msg, setMsg] = useState('Objetivo: dejar una sola caja x en un plato y solo pesas en el otro.');
  const weight = (p: Pan) => p.x * solution + p.u;
  const diff = weight(left) - weight(right);
  const tilt = Math.max(-14, Math.min(14, -diff * 2.2));
  const balanced = Math.abs(diff) < 1e-9;
  const solved = balanced && ((left.x === 1 && right.x === 0 && left.u === 0) || (right.x === 1 && left.x === 0 && right.u === 0));

  const act = (l: Pan, r: Pan, m: string) => {
    setHistory((h) => [...h, { l: left, r: right, msg }]);
    setLeft(l);
    setRight(r);
    setMsg(m);
  };

  const k = left.u === 0 && right.x === 0 && left.x > 1 && right.u % left.x === 0 ? left.x : right.u === 0 && left.x === 0 && right.x > 1 && left.u % right.x === 0 ? right.x : 0;

  const renderPan = (p: Pan) => (
    <div className="pan-items">
      {Array.from({ length: p.x }, (_, i) => <span key={`x${i}`} className="box-x">x</span>)}
      {Array.from({ length: p.u }, (_, i) => <span key={`u${i}`} className="weight-1">1</span>)}
    </div>
  );

  return (
    <div className="widget balance-widget">
      <div className="center" style={{ marginBottom: 6 }}>
        <Tex tex={`${sideTex(left)} ${balanced ? '=' : diff > 0 ? '>' : '<'} ${sideTex(right)}`} display />
      </div>
      <div className="balance">
        <div className="beam" style={{ transform: `rotate(${tilt}deg)` }}>
          <div className="pan left">{renderPan(left)}</div>
          <div className="pan right">{renderPan(right)}</div>
        </div>
        <div className="fulcrum" />
      </div>
      <div className={`callout ${solved ? 'success' : balanced ? 'info' : 'warning'} small`} style={{ marginTop: 10 }}>
        <Icon className="callout-icon" name={solved ? 'trophy' : balanced ? 'check' : 'alert'} size={16} />
        <div>{solved ? `¡Resuelto! x = ${solution}. Cada caja pesa lo mismo que ${solution} ${solution === 1 ? 'pesa' : 'pesas'}.` : balanced ? msg : 'La balanza se desequilibró: hiciste una operación en un solo plato. Deshaz el paso.'}</div>
      </div>
      <div className="row wrap" style={{ marginTop: 10 }}>
        <button className="btn sm" disabled={!(left.u > 0 && right.u > 0)} onClick={() => act({ ...left, u: left.u - 1 }, { ...right, u: right.u - 1 }, 'Quitaste una pesa de cada plato: sigue en equilibrio.')}>
          − 1 en ambos platos
        </button>
        <button className="btn sm" disabled={!(left.x > 0 && right.x > 0)} onClick={() => act({ ...left, x: left.x - 1 }, { ...right, x: right.x - 1 }, 'Quitaste una caja de cada plato: sigue en equilibrio.')}>
          − x en ambos platos
        </button>
        <button className="btn sm" disabled={!k} onClick={() => act({ x: left.x / (k || 1), u: left.u / (k || 1) }, { x: right.x / (k || 1), u: right.u / (k || 1) }, `Dividiste ambos platos en ${k} grupos iguales.`)}>
          ÷ {k || 'k'} en ambos platos
        </button>
        <button className="btn sm ghost" disabled={left.u === 0} onClick={() => act({ ...left, u: left.u - 1 }, right, 'Quitaste solo de un plato.')}>
          − 1 solo a la izquierda
        </button>
        <span className="spacer" />
        <button className="btn sm ghost" disabled={!history.length} onClick={() => {
          const h = history[history.length - 1];
          setLeft(h.l);
          setRight(h.r);
          setMsg(h.msg);
          setHistory(history.slice(0, -1));
        }}>
          <Icon name="undo" size={15} /> Deshacer
        </button>
        <button className="btn sm ghost" onClick={() => { setLeft({ x: a, u: b }); setRight({ x: c, u: d }); setHistory([]); }}>
          <Icon name="refresh" size={15} /> Reiniciar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Bar({ n, d, parts, label }: { n: number; d: number; parts: number; label: string }) {
  const factor = parts / d;
  const filled = n * factor;
  const wholes = Math.max(1, Math.ceil(filled / parts));
  return (
    <div className="fbar-row">
      <div className="fbar-group">
        {Array.from({ length: wholes }, (_, w) => (
          <div key={w} className="fbar">
            {Array.from({ length: parts }, (_, i) => (
              <div key={i} className={`fcell ${w * parts + i < filled ? 'on' : ''} ${(i + 1) % factor === 0 ? 'major' : ''}`} />
            ))}
          </div>
        ))}
      </div>
      <div className="fbar-label"><Tex tex={label} /></div>
    </div>
  );
}

export function FractionBarsWidget({ a = [1, 2], b = [1, 3] }: { a?: [number, number]; b?: [number, number] }) {
  const [n1, setN1] = useState(a[0]);
  const [d1, setD1] = useState(a[1]);
  const [n2, setN2] = useState(b[0]);
  const [d2, setD2] = useState(b[1]);
  const [common, setCommon] = useState(false);
  const L = lcm(d1, d2);
  const cmp = n1 * d2 - n2 * d1;
  const sn = n1 * (L / d1) + n2 * (L / d2);
  const g = gcd(sn, L);
  return (
    <div className="widget">
      <div className="grid cols-2" style={{ gap: 12 }}>
        {[
          { n: n1, d: d1, sn: setN1, sd: setD1, name: 'Primera' },
          { n: n2, d: d2, sn: setN2, sd: setD2, name: 'Segunda' },
        ].map((f) => (
          <div key={f.name} className="slider-box">
            <div className="small muted">{f.name}: <Tex tex={`\\frac{${f.n}}{${f.d}}`} /></div>
            <label className="slider-row">Numerador <input type="range" min={0} max={f.d * 2} value={f.n} onChange={(e) => f.sn(Number(e.target.value))} /><b>{f.n}</b></label>
            <label className="slider-row">Denominador <input type="range" min={1} max={12} value={f.d} onChange={(e) => { const v = Number(e.target.value); f.sd(v); if (f.n > v * 2) f.sn(v * 2); }} /><b>{f.d}</b></label>
          </div>
        ))}
      </div>
      <label className="row small" style={{ margin: '10px 0' }}>
        <button type="button" className={`switch ${common ? 'on' : ''}`} onClick={() => setCommon(!common)} aria-pressed={common} />
        Dividir en el denominador común ({L} partes)
      </label>
      <Bar n={n1} d={d1} parts={common ? L : d1} label={common ? `\\frac{${n1}}{${d1}} = \\frac{${n1 * (L / d1)}}{${L}}` : `\\frac{${n1}}{${d1}}`} />
      <Bar n={n2} d={d2} parts={common ? L : d2} label={common ? `\\frac{${n2}}{${d2}} = \\frac{${n2 * (L / d2)}}{${L}}` : `\\frac{${n2}}{${d2}}`} />
      <div className="row wrap" style={{ marginTop: 8, justifyContent: 'center' }}>
        <Tex tex={`\\frac{${n1}}{${d1}} ${cmp > 0 ? '>' : cmp < 0 ? '<' : '='} \\frac{${n2}}{${d2}}`} />
        <span className="muted">·</span>
        <Tex tex={`\\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}} = \\frac{${sn}}{${L}}${g > 1 ? ` = \\frac{${sn / g}}{${L / g}}` : ''}`} />
      </div>
      {common && <Bar n={sn} d={L} parts={L} label={`\\text{suma: }\\frac{${sn}}{${L}}`} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function NumberLineWidget({ inequality = 'x > -2' }: { inequality?: string }) {
  const [src, setSrc] = useState(inequality);
  const result = useMemo(() => {
    try {
      const node = parse(src, { decimalComma: false });
      const set = realSetOf(node, 'x');
      return set ? { set, error: null } : { set: null, error: 'Escribe una inecuación en x, por ejemplo 2x - 1 < 5.' };
    } catch (e) {
      return { set: null, error: e instanceof Error ? e.message : 'Expresión inválida' };
    }
  }, [src]);
  const set = result.set;
  const finite = set ? set.flatMap((iv) => [iv.lo, iv.hi]).filter(Number.isFinite) : [];
  const center = finite.length ? (Math.min(...finite) + Math.max(...finite)) / 2 : 0;
  const span = finite.length ? Math.max(6, Math.max(...finite) - Math.min(...finite) + 4) : 10;
  const min = Math.floor(center - span / 2);
  const max = Math.ceil(center + span / 2);
  const points = set ? set.flatMap((iv) => [
    ...(Number.isFinite(iv.lo) ? [{ x: iv.lo, open: !iv.loClosed }] : []),
    ...(Number.isFinite(iv.hi) && iv.hi !== iv.lo ? [{ x: iv.hi, open: !iv.hiClosed }] : []),
  ]) : [];
  return (
    <div className="widget">
      <input className="input mono" value={src} onChange={(e) => setSrc(e.target.value)} placeholder="Ej.: 5 - 3x >= 11" spellCheck={false} />
      {result.error && <div className="small" style={{ color: 'var(--danger)', marginTop: 6 }}>{result.error}</div>}
      {set && (
        <>
          <NumberLine points={points} ranges={set.filter((iv) => iv.lo !== iv.hi).map((iv) => ({ from: iv.lo, to: iv.hi }))} min={min} max={max} />
          <div className="center">
            <span className="small muted">Solución: </span>
            <Tex tex={set.length ? `x \\in ${realSetToLatex(set)}` : '\\text{no tiene solución}'} />
          </div>
        </>
      )}
    </div>
  );
}
