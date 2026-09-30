// Banco de errores frecuentes: agrupados por tipo, con ejemplos y repaso dirigido.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SKILL_BY_ID } from '../content/curriculum';
import { errorLabel, errorSkill, ERROR_CATALOG } from '../content/errorCatalog';
import { Icon } from '../components/Icon';
import { RichText, Tex } from '../components/Math';
import type { BugId } from '../math/mutations';
import type { ErrorEntry } from '../learning/types';
import { useProgress } from '../store/progress';

function looksLatex(s: string): boolean {
  return /[\\^_{}=]|\d/.test(s) && !/[áéíóú]/i.test(s) && s.length < 160;
}

function Entry({ e }: { e: ErrorEntry }) {
  return (
    <div className="error-entry">
      <div className="row between wrap tiny faint">
        <span>{new Date(e.t).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })} · {SKILL_BY_ID[e.skillId]?.title}</span>
        {e.line && <span>Línea {e.line} del desarrollo</span>}
      </div>
      <RichText text={e.prompt} className="small" />
      <div className="row wrap small" style={{ gap: 6, marginTop: 4 }}>
        <span className="muted">Tu respuesta:</span>
        {e.student ? (looksLatex(e.student) ? <Tex tex={e.student} /> : <RichText text={e.student} as="span" />) : <span className="faint">(sin respuesta)</span>}
      </div>
      <div className="small" style={{ marginTop: 4, color: 'var(--danger)' }}>
        <RichText text={e.message} as="span" />
      </div>
    </div>
  );
}

export default function ErrorLog() {
  const errors = useProgress((s) => s.errors);
  const markReviewed = useProgress((s) => s.markErrorReviewed);
  const [open, setOpen] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);

  const groups = useMemo(() => {
    const m = new Map<string, ErrorEntry[]>();
    for (const e of errors) {
      if (onlyPending && e.reviewed) continue;
      const list = m.get(e.bug) ?? [];
      list.push(e);
      m.set(e.bug, list);
    }
    return [...m.entries()].sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return b[1].length - a[1].length;
    });
  }, [errors, onlyPending]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Banco de errores</h1>
          <p>Cada error se registra automáticamente con el paso exacto donde ocurrió. Repasar los más frecuentes es la forma más rápida de mejorar.</p>
        </div>
        <label className="row small">
          <button type="button" className={`switch ${onlyPending ? 'on' : ''}`} onClick={() => setOnlyPending(!onlyPending)} aria-pressed={onlyPending} />
          Solo sin repasar
        </label>
      </div>
      {groups.length === 0 ? (
        <div className="card empty">
          <div className="icon-wrap"><Icon name="check" /></div>
          <h3>Todavía no hay errores registrados</h3>
          <p className="muted small" style={{ marginTop: 6 }}>Cuando te equivoques en un ejercicio, aparecerá aquí con su diagnóstico.</p>
        </div>
      ) : (
        <div className="stack">
          {groups.map(([bug, list]) => {
            const info = ERROR_CATALOG[bug as BugId];
            const base = errorSkill(bug);
            const pending = list.filter((e) => !e.reviewed).length;
            const last = list[list.length - 1];
            const isOpen = open === bug;
            return (
              <div key={bug} className="card error-group">
                <div className="row between wrap">
                  <div style={{ minWidth: 0 }}>
                    <div className="row wrap" style={{ gap: 8 }}>
                      <h3>{bug === 'other' ? 'Otros errores (sin diagnóstico específico)' : errorLabel(bug)}</h3>
                      <span className="badge danger">{list.length} {list.length === 1 ? 'vez' : 'veces'}</span>
                      {pending > 0 && <span className="badge warning">{pending} sin repasar</span>}
                    </div>
                    {info && <RichText text={info.tip} className="small muted" />}
                    <div className="tiny faint" style={{ marginTop: 4 }}>
                      Última vez: {new Date(last.t).toLocaleDateString('es')}
                      {base && SKILL_BY_ID[base] && <> · Tema base: <Link to={`/habilidad/${base}`}>{SKILL_BY_ID[base].title}</Link> · <Link to={`/wiki/${base}`}>Ficha en la wiki</Link></>}
                    </div>
                  </div>
                  <div className="row">
                    <button className="btn sm ghost" onClick={() => setOpen(isOpen ? null : bug)}>
                      {isOpen ? 'Ocultar' : 'Ver ejemplos'}
                    </button>
                    {bug !== 'other' && (
                      <Link to={`/errores/repasar/${encodeURIComponent(bug)}`} className="btn sm primary">
                        <Icon name="target" size={15} /> Practicar
                      </Link>
                    )}
                  </div>
                </div>
                {isOpen && (
                  <div className="stack fade-in" style={{ marginTop: 12 }}>
                    {list.slice(-8).reverse().map((e) => (
                      <div key={e.id} className="row" style={{ alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}><Entry e={e} /></div>
                        {!e.reviewed && (
                          <button className="icon-btn" title="Marcar como repasado" onClick={() => markReviewed(e.id)}><Icon name="check" size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
