import { useRef } from 'react';
import type { AnswerInput as AnswerInputValue, AnswerSpec } from '../../content/types';
import { Icon } from '../Icon';
import { RichText, Tex } from '../Math';
import { MathInput, type MathInputHandle } from '../MathInput';
import { VennDiagram } from '../visuals/VennDiagram';
import { SymbolBar } from './SymbolBar';
import { emptyTable, TruthTableInput } from './TruthTableInput';

export interface AnswerState {
  text: string;
  none: boolean;
  choice: number | null;
  multi: number[];
  bool: boolean | null;
  table: (boolean | null)[][];
  cells: string[];
  grid: string[][];
  regions: string[];
}

export function initialAnswer(spec: AnswerSpec): AnswerState {
  return {
    text: '',
    none: false,
    choice: null,
    multi: [],
    bool: null,
    table: spec.kind === 'truth-table' ? emptyTable(spec.vars, spec.columns) : [],
    cells: spec.kind === 'vector' ? spec.values.map(() => '') : [],
    grid: spec.kind === 'matrix' ? spec.rows.map((r) => r.map(() => '')) : [],
    regions: [],
  };
}

const TEXT_KINDS = new Set(['numeric', 'expression', 'equation', 'solutions', 'inequality', 'logic-expr', 'set-expr', 'set', 'predicate']);

export function isTextKind(spec: AnswerSpec): boolean {
  return TEXT_KINDS.has(spec.kind);
}

/** Convierte el estado del formulario en la entrada que evalúa el verificador. */
export function toAnswerInput(spec: AnswerSpec, s: AnswerState): AnswerInputValue | null {
  switch (spec.kind) {
    case 'choice': return s.choice === null ? null : { kind: 'choice', value: s.choice };
    case 'multi': return s.multi.length ? { kind: 'multi', value: s.multi } : null;
    case 'truefalse': return s.bool === null ? null : { kind: 'bool', value: s.bool };
    case 'truth-table': return { kind: 'table', value: s.table };
    case 'vector': return s.cells.some((c) => c.trim()) ? { kind: 'cells', value: s.cells } : null;
    case 'matrix': return s.grid.flat().some((c) => c.trim()) ? { kind: 'grid', value: s.grid } : null;
    case 'venn': return { kind: 'regions', value: s.regions };
    case 'solutions': return s.none ? { kind: 'none' } : s.text.trim() ? { kind: 'text', value: s.text } : null;
    default: return s.text.trim() ? { kind: 'text', value: s.text } : null;
  }
}

function placeholderFor(spec: AnswerSpec): string {
  switch (spec.kind) {
    case 'numeric': case 'predicate': return 'Escribe un número';
    case 'expression': return 'Escribe la expresión';
    case 'equation': return 'Por ejemplo: y = 2x + 1';
    case 'solutions': return `Por ejemplo: ${spec.variable} = 3`;
    case 'inequality': return 'Por ejemplo: x > 2 o [1, 4)';
    case 'logic-expr': return 'Escribe la proposición';
    case 'set-expr': return 'Escribe la expresión de conjuntos';
    case 'set': return 'Por ejemplo: {1, 2, 3}';
    default: return '';
  }
}

interface Props {
  spec: AnswerSpec;
  state: AnswerState;
  onChange(s: AnswerState): void;
  onSubmit(): void;
  disabled?: boolean;
  wrongCells?: [number, number][];
  status?: 'ok' | 'error' | 'warning' | null;
  autoFocus?: boolean;
}

export function AnswerInput({ spec, state, onChange, onSubmit, disabled, wrongCells, status, autoFocus }: Props) {
  const mathRef = useRef<MathInputHandle>(null);
  const patch = (p: Partial<AnswerState>) => onChange({ ...state, ...p });

  if (TEXT_KINDS.has(spec.kind)) {
    const bar = spec.kind === 'logic-expr' ? 'logic' : spec.kind === 'set-expr' || spec.kind === 'set' ? 'set' : 'arith';
    return (
      <div className="answer-text">
        <div className="row" style={{ alignItems: 'stretch' }}>
          <MathInput
            ref={mathRef}
            value={state.text}
            onChange={(v) => patch({ text: v, none: false })}
            onSubmit={onSubmit}
            placeholder={placeholderFor(spec)}
            disabled={disabled || state.none}
            status={status}
            autoFocus={autoFocus}
            size="lg"
          />
          {spec.kind === 'numeric' && spec.unit && spec.unit !== '$' && <span className="unit">{spec.unit === '°' ? '°' : spec.unit}</span>}
        </div>
        {!disabled && <SymbolBar kind={bar} onInsert={(l) => mathRef.current?.insert(l)} />}
        {spec.kind === 'solutions' && !disabled && (
          <button type="button" className={`chip ${state.none ? 'active' : ''}`} onClick={() => patch({ none: !state.none, text: '' })} style={{ marginTop: 8 }}>
            <Tex tex="\emptyset" /> No tiene solución real
          </button>
        )}
      </div>
    );
  }

  switch (spec.kind) {
    case 'choice':
      return (
        <div className="options" role="radiogroup">
          {spec.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={state.choice === i}
              className={`option ${state.choice === i ? 'selected' : ''}`}
              disabled={disabled}
              onClick={() => patch({ choice: i })}
              onDoubleClick={onSubmit}
            >
              <span className="option-key">{String.fromCharCode(65 + i)}</span>
              <RichText text={opt} as="span" />
            </button>
          ))}
        </div>
      );
    case 'multi':
      return (
        <div className="options">
          {spec.options.map((opt, i) => {
            const on = state.multi.includes(i);
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={on}
                className={`option ${on ? 'selected' : ''}`}
                disabled={disabled}
                onClick={() => patch({ multi: on ? state.multi.filter((x) => x !== i) : [...state.multi, i].sort() })}
              >
                <span className="option-key check">{on ? <Icon name="check" size={14} stroke={3} /> : ''}</span>
                <RichText text={opt} as="span" />
              </button>
            );
          })}
        </div>
      );
    case 'truefalse':
      return (
        <div className="row" style={{ gap: 12 }}>
          {[true, false].map((b) => (
            <button key={String(b)} type="button" className={`option tf ${state.bool === b ? 'selected' : ''}`} disabled={disabled} onClick={() => patch({ bool: b })}>
              <span className="option-key">{b ? 'V' : 'F'}</span>
              {b ? 'Verdadero' : 'Falso'}
            </button>
          ))}
        </div>
      );
    case 'truth-table':
      return <TruthTableInput vars={spec.vars} columns={spec.columns} mode={spec.mode} value={state.table} onChange={(t) => patch({ table: t })} wrongCells={wrongCells} disabled={disabled} />;
    case 'vector':
      return (
        <div className="cells">
          {spec.values.map((_, i) => (
            <label key={i} className="cell-field">
              <span className="cell-label"><Tex tex={spec.labels?.[i] ?? `v_{${i + 1}}`} /></span>
              <input
                className="input"
                inputMode="decimal"
                value={state.cells[i] ?? ''}
                disabled={disabled}
                onChange={(e) => {
                  const cells = state.cells.slice();
                  cells[i] = e.target.value;
                  patch({ cells });
                }}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                autoFocus={autoFocus && i === 0}
              />
            </label>
          ))}
        </div>
      );
    case 'matrix':
      return (
        <div className="matrix-input" style={{ gridTemplateColumns: `repeat(${spec.rows[0].length}, 72px)` }}>
          {spec.rows.map((row, i) =>
            row.map((_, j) => (
              <input
                key={`${i}-${j}`}
                className="input center"
                inputMode="decimal"
                value={state.grid[i]?.[j] ?? ''}
                disabled={disabled}
                aria-label={`Fila ${i + 1}, columna ${j + 1}`}
                onChange={(e) => {
                  const grid = state.grid.map((r) => r.slice());
                  grid[i][j] = e.target.value;
                  patch({ grid });
                }}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              />
            )),
          )}
        </div>
      );
    case 'venn':
      return (
        <div className="venn-input">
          <VennDiagram
            sets={spec.sets}
            selected={new Set(state.regions)}
            onToggle={disabled ? undefined : (r) => patch({ regions: state.regions.includes(r) ? state.regions.filter((x) => x !== r) : [...state.regions, r] })}
          />
          <div className="tiny faint center">Toca una región para sombrearla o quitarle el sombreado.</div>
        </div>
      );
    default:
      return null;
  }
}
