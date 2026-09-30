// Ficha de la wiki: fórmulas, tablas, definiciones, procedimiento, ejemplo resuelto, errores
// frecuentes y temas relacionados. Se usa en la página de la wiki, en el panel de consulta y
// en la app del móvil (por eso no depende del router ni del progreso: eso llega en `extras`).
import type { ReactNode } from 'react';
import { BLOCK_BY_ID } from '../../content/curriculum';
import { relatedEntries, type WikiEntry, type WikiFormula, type WikiTable } from '../../content/wiki';
import { Icon } from '../Icon';
import { RichText, Tex } from '../Math';

/** Enlace a otra ficha (la abre quien muestra la wiki: el panel, la página o el móvil). */
export function EntryLink({ id, onOpen, className, children, title }: { id: string; onOpen(id: string): void; className?: string; children: ReactNode; title?: string }) {
  return (
    <button type="button" className={className} onClick={() => onOpen(id)} title={title}>
      {children}
    </button>
  );
}

export function FormulaCard({ formula }: { formula: WikiFormula }) {
  return (
    <div className="wiki-formula">
      <div className="wiki-formula-name">{formula.name}</div>
      <Tex tex={formula.tex} display />
      {formula.note && <RichText text={formula.note} className="wiki-formula-note" />}
    </div>
  );
}

export function WikiTableView({ table }: { table: WikiTable }) {
  return (
    <div className="table-wrap">
      <table className="table wiki-table">
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th key={i}><RichText text={h} as="span" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}><RichText text={cell} as="span" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <section className="wiki-section">
      <h3 className="wiki-section-title">
        <Icon name={icon} size={17} /> <RichText text={title} as="span" />
      </h3>
      {children}
    </section>
  );
}

function Related({ entry, onOpen }: { entry: WikiEntry; onOpen(id: string): void }) {
  const { prereqs, usedIn, seeAlso } = relatedEntries(entry.id);
  const rows = [
    { label: 'Se apoya en', entries: prereqs },
    { label: 'Se usa en', entries: usedIn },
    { label: 'Ver también', entries: seeAlso },
  ].filter((r) => r.entries.length > 0);
  if (!rows.length) return null;
  return (
    <Section icon="link" title="Temas relacionados">
      <div className="wiki-related">
        {rows.map((r) => (
          <div key={r.label} className="wiki-related-row">
            <span className="small muted">{r.label}</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {r.entries.map((e) => (
                <EntryLink key={e.id} id={e.id} onOpen={onOpen} className="chip">{e.title}</EntryLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

interface Props {
  entry: WikiEntry;
  /** Versión compacta para el panel lateral y el móvil. */
  compact?: boolean;
  /** Abre otra ficha (temas relacionados). */
  onOpen(id: string): void;
  /** Contenido propio de la app, después de «Para recordar» (p. ej. los errores del estudiante). */
  extras?: ReactNode;
  /** Al final de la ficha (p. ej. accesos a la lección y a la práctica). */
  footer?: ReactNode;
}

export function WikiEntryView({ entry, compact, onOpen, extras, footer }: Props) {
  const block = entry.block ? BLOCK_BY_ID[entry.block] : null;
  const ex = entry.example;
  return (
    <article className={`wiki-entry ${compact ? 'compact' : ''}`} style={{ ['--h' as string]: String(block?.hue ?? 250) }}>
      <header className="wiki-entry-head">
        <span className="block-tag">{block ? `Bloque ${block.number} · ${block.short}` : 'Referencia general'}</span>
        {compact ? <h2>{entry.title}</h2> : <h1>{entry.title}</h1>}
        <RichText text={entry.summary} className="wiki-summary" />
      </header>

      {entry.formulas && entry.formulas.length > 0 && (
        <Section icon="sigma" title="Fórmulas y propiedades">
          <div className="wiki-formulas">
            {entry.formulas.map((f) => (
              <FormulaCard key={f.name} formula={f} />
            ))}
          </div>
        </Section>
      )}

      {entry.tables?.map((t) => (
        <Section key={t.title} icon="grid" title={t.title}>
          <WikiTableView table={t} />
        </Section>
      ))}

      {entry.terms && entry.terms.length > 0 && (
        <Section icon="book" title="Definiciones">
          <dl className="wiki-terms">
            {entry.terms.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd><RichText text={t.def} /></dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {entry.steps && (
        <Section icon="steps" title={entry.steps.title}>
          <ol className="wiki-steps">
            {entry.steps.items.map((s, i) => (
              <li key={i}><RichText text={s} as="span" /></li>
            ))}
          </ol>
        </Section>
      )}

      {ex && (
        <Section icon="check" title={ex.title ? `Ejemplo resuelto: ${ex.title}` : 'Ejemplo resuelto'}>
          <RichText text={ex.problem} />
          <div className="example-steps">
            {ex.steps.map((st, i) => (
              <div key={i} className="example-step">
                <span className="step-dot">{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  {st.math && <Tex tex={st.math} display />}
                  {st.note && <RichText text={st.note} className="small muted" />}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {entry.mistakes && entry.mistakes.length > 0 && (
        <Section icon="alert" title="Errores frecuentes">
          <div className="wiki-mistakes">
            {entry.mistakes.map((m, i) => (
              <div key={i} className="wiki-mistake">
                <div className="wiki-wrong">
                  <Icon name="x" size={16} stroke={2.4} />
                  <RichText text={m.wrong} as="span" />
                </div>
                <div className="wiki-right">
                  <Icon name="check" size={16} stroke={2.4} />
                  <RichText text={m.right} as="span" />
                </div>
                {m.note && <RichText text={m.note} className="wiki-mistake-note small muted" />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {entry.remember && entry.remember.length > 0 && (
        <div className="callout primary">
          <Icon className="callout-icon" name="bulb" />
          <div>
            <strong>Para recordar</strong>
            <ul className="wiki-remember">
              {entry.remember.map((r, i) => (
                <li key={i}><RichText text={r} as="span" /></li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {extras}
      <Related entry={entry} onOpen={onOpen} />
      {footer}
    </article>
  );
}
