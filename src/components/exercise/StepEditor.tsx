// Editor de resolución paso a paso: cada línea se valida mientras se escribe.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { StepsSpec } from '../../content/types';
import { parse } from '../../math/parse';
import { toLatex } from '../../math/print';
import { validateSteps, type LineResult } from '../../math/validate';
import { errorLabel } from '../../content/errorCatalog';
import { Icon } from '../Icon';
import { RichText, Tex } from '../Math';
import { MathInput, type MathInputHandle } from '../MathInput';
import { SymbolBar } from './SymbolBar';

interface Props {
  steps: StepsSpec;
  lines: string[];
  onChange(lines: string[]): void;
  onSubmit(): void;
  disabled?: boolean;
  /** Resultados de la última comprobación completa (tienen prioridad). */
  results?: LineResult[] | null;
}

export function StepEditor({ steps, lines, onChange, onSubmit, disabled, results }: Props) {
  const [live, setLive] = useState<LineResult[] | null>(null);
  const refs = useRef<(MathInputHandle | null)[]>([]);
  const [focusIdx, setFocusIdx] = useState(0);
  const parseMode = steps.parseMode ?? (steps.mode === 'logic' ? 'logic' : steps.mode === 'set' ? 'set' : 'arith');
  const startTex = useMemo(() => {
    try {
      return toLatex(parse(steps.start, { mode: parseMode, decimalComma: false }));
    } catch {
      return steps.start;
    }
  }, [steps.start, parseMode]);

  useEffect(() => {
    const t = setTimeout(() => {
      const filled = lines.map((l) => l.trim());
      if (!filled.some(Boolean)) {
        setLive(null);
        return;
      }
      try {
        const start = parse(steps.start, { mode: parseMode, decimalComma: false });
        setLive(validateSteps(start, filled, { mode: steps.mode, variable: steps.variable, parseMode }));
      } catch {
        setLive(null);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [lines, steps, parseMode]);

  const shown = results ?? live;

  const update = (i: number, v: string) => {
    const next = lines.slice();
    next[i] = v;
    onChange(next);
  };

  const addLine = (after: number) => {
    const next = lines.slice();
    next.splice(after + 1, 0, '');
    onChange(next);
    setTimeout(() => refs.current[after + 1]?.focus(), 30);
  };

  const removeLine = (i: number) => {
    if (lines.length <= 1) {
      onChange(['']);
      return;
    }
    onChange(lines.filter((_, k) => k !== i));
  };

  const bar = steps.mode === 'logic' ? 'logic' : steps.mode === 'set' ? 'set' : 'arith';

  return (
    <div className="step-editor">
      <div className="step-line start">
        <span className="step-num">0</span>
        <div className="step-body">
          <Tex tex={startTex} />
        </div>
        <span className="step-status faint" title="Enunciado"><Icon name="book" size={16} /></span>
      </div>
      {lines.map((line, i) => {
        const r = shown?.[i];
        const status = r?.status;
        return (
          <div key={i} className={`step-line ${status ?? ''}`}>
            <span className="step-num">{i + 1}</span>
            <div className="step-body">
              <MathInput
                ref={(h) => {
                  refs.current[i] = h;
                }}
                value={line}
                onChange={(v) => update(i, v)}
                onFocus={() => setFocusIdx(i)}
                onSubmit={() => (i === lines.length - 1 && line.trim() ? addLine(i) : i < lines.length - 1 ? refs.current[i + 1]?.focus() : onSubmit())}
                placeholder={i === 0 ? 'Escribe el primer paso…' : 'Siguiente paso…'}
                disabled={disabled}
                status={status === 'ok' ? 'ok' : status === 'error' || status === 'parse-error' ? 'error' : status === 'carried' ? 'warning' : null}
                autoFocus={i === 0}
              />
              {r && (status === 'error' || status === 'parse-error' || status === 'carried') && (
                <div className={`step-msg ${status}`}>
                  {r.bug && <span className="badge danger" style={{ marginRight: 6 }}>{errorLabel(r.bug)}</span>}
                  <RichText text={r.message} as="span" />
                </div>
              )}
              {r?.domainWarning && status === 'ok' && (
                <div className="step-msg warning">Cuidado: el paso es correcto donde ambas expresiones existen, pero cambia el dominio.</div>
              )}
            </div>
            <span className="step-status">
              {status === 'ok' && <Icon name="check" size={18} stroke={2.6} style={{ color: 'var(--success)' }} />}
              {(status === 'error' || status === 'parse-error') && <Icon name="x" size={18} stroke={2.6} style={{ color: 'var(--danger)' }} />}
              {status === 'carried' && <Icon name="alert" size={18} style={{ color: 'var(--warning)' }} />}
              {!disabled && (
                <button type="button" className="icon-btn step-del" title="Quitar paso" onClick={() => removeLine(i)}>
                  <Icon name="minus" size={16} />
                </button>
              )}
            </span>
          </div>
        );
      })}
      {!disabled && (
        <div className="row wrap" style={{ marginTop: 6 }}>
          <button type="button" className="btn ghost sm" onClick={() => addLine(lines.length - 1)}>
            <Icon name="plus" size={16} /> Añadir paso
          </button>
          <span className="tiny faint">Enter crea un paso nuevo. La última línea se toma como respuesta.</span>
          <span className="spacer" />
          <SymbolBar kind={bar} onInsert={(l) => refs.current[focusIdx]?.insert(l)} />
        </div>
      )}
    </div>
  );
}
