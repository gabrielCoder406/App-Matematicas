import { useMemo } from 'react';
import { assignments } from '../../math/equivalence';
import { parse } from '../../math/parse';
import { toLatex } from '../../math/print';
import { Tex } from '../Math';

interface Props {
  vars: string[];
  columns: string[];
  mode: 'logic' | 'bool';
  value: (boolean | null)[][];
  onChange(v: (boolean | null)[][]): void;
  wrongCells?: [number, number][];
  disabled?: boolean;
}

export function TruthTableInput({ vars, columns, mode, value, onChange, wrongCells, disabled }: Props) {
  const rows = useMemo(() => assignments(vars), [vars]);
  const heads = useMemo(() => columns.map((c) => toLatex(parse(c, { mode }), { boolStyle: mode === 'bool' ? '10' : 'VF', boolAlgebra: mode === 'bool' })), [columns, mode]);
  const wrong = new Set((wrongCells ?? []).map(([r, c]) => `${r}:${c}`));
  const label = (b: boolean) => (mode === 'bool' ? (b ? '1' : '0') : b ? 'V' : 'F');

  const set = (r: number, c: number, v: boolean | null) => {
    const next = value.map((row) => row.slice());
    next[r][c] = v;
    onChange(next);
  };

  const onKey = (e: React.KeyboardEvent, r: number, c: number) => {
    const k = e.key.toLowerCase();
    if (k === 'v' || k === '1' || k === 't') set(r, c, true);
    else if (k === 'f' || k === '0') set(r, c, false);
    else if (k === 'backspace' || k === 'delete') set(r, c, null);
    else return;
    e.preventDefault();
    const next = document.querySelector<HTMLButtonElement>(`[data-tt="${r + 1}:${c}"]`) ?? document.querySelector<HTMLButtonElement>(`[data-tt="0:${c + 1}"]`);
    next?.focus();
  };

  return (
    <div className="table-wrap">
      <table className="truth-table">
        <thead>
          <tr>
            {vars.map((v) => (
              <th key={v} className="var-col"><Tex tex={v} /></th>
            ))}
            {heads.map((h, i) => (
              <th key={i}><Tex tex={h} /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r}>
              {vars.map((v) => (
                <td key={v} className={`var-col ${row[v] ? 't' : 'f'}`}>{label(row[v])}</td>
              ))}
              {columns.map((_, c) => {
                const v = value[r]?.[c] ?? null;
                return (
                  <td key={c}>
                    <button
                      type="button"
                      data-tt={`${r}:${c}`}
                      className={`tt-cell ${v === null ? 'empty' : v ? 't' : 'f'} ${wrong.has(`${r}:${c}`) ? 'wrong' : ''}`}
                      disabled={disabled}
                      onClick={() => set(r, c, v === null ? true : v === true ? false : true)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        set(r, c, null);
                      }}
                      onKeyDown={(e) => onKey(e, r, c)}
                      aria-label={`Fila ${r + 1}, columna ${c + 1}`}
                    >
                      {v === null ? '·' : label(v)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="tiny faint" style={{ marginTop: 6 }}>
        Haz clic para alternar {mode === 'bool' ? '1/0' : 'V/F'} · también puedes usar el teclado ({mode === 'bool' ? '1 / 0' : 'V / F'}).
      </div>
    </div>
  );
}

export function emptyTable(vars: string[], columns: string[]): (boolean | null)[][] {
  return Array.from({ length: 1 << vars.length }, () => columns.map(() => null));
}
