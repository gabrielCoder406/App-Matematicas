// Wiki de temas: ayuda memoria con las fórmulas, definiciones, ejemplos y errores frecuentes de
// cada tema. Tres vistas (temas, formulario y glosario) y una página por ficha.
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BLOCK_BY_ID, BLOCKS } from '../content/curriculum';
import type { BlockId } from '../content/types';
import { glossary, neighbors, wikiEntry, wikiGroups, type GlossaryItem } from '../content/wiki';
import { Icon } from '../components/Icon';
import { RichText } from '../components/Math';
import { Segmented } from '../components/Segmented';
import { FormulaCard, WikiEntryView, WikiTableView } from '../components/wiki/WikiEntryView';
import { desktopExtras } from '../components/wiki/WikiExtras';
import { useResultKeys, useWikiResults, WikiResults, WikiSearchInput } from '../components/wiki/WikiSearch';
import { useWiki, WIKI_SHORTCUT } from '../store/wiki';

type View = 'temas' | 'formulario' | 'glosario';

const VIEWS: { id: View; label: string }[] = [
  { id: 'temas', label: 'Temas' },
  { id: 'formulario', label: 'Formulario' },
  { id: 'glosario', label: 'Glosario' },
];

function TopicsView({ block }: { block: BlockId | null }) {
  return (
    <div className="stack lg">
      {wikiGroups(block).map((g) => (
        <section key={g.title} style={{ ['--h' as string]: String(g.block ? BLOCK_BY_ID[g.block].hue : 250) }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="block-tag">{g.block ? `Bloque ${BLOCK_BY_ID[g.block].number}` : 'General'}</span>
            <h2 style={{ fontSize: '1.1rem' }}>{g.title}</h2>
          </div>
          <div className="grid auto">
            {g.entries.map((e) => (
              <Link key={e.id} to={`/wiki/${e.id}`} className="card hover wiki-card">
                <h3>{e.title}</h3>
                <div className="small muted wiki-card-summary"><RichText text={e.summary} as="span" /></div>
                <div className="tiny faint">
                  {[
                    e.formulas?.length && `${e.formulas.length} ${e.formulas.length === 1 ? 'fórmula' : 'fórmulas'}`,
                    !e.formulas?.length && e.tables?.length && `${e.tables.length} ${e.tables.length === 1 ? 'tabla' : 'tablas'}`,
                    e.terms?.length && `${e.terms.length} ${e.terms.length === 1 ? 'definición' : 'definiciones'}`,
                    e.mistakes?.length && `${e.mistakes.length} ${e.mistakes.length === 1 ? 'error frecuente' : 'errores frecuentes'}`,
                  ].filter(Boolean).join(' · ')}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function FormulaSheet({ block }: { block: BlockId | null }) {
  return (
    <div className="stack lg">
      {wikiGroups(block).map((g) => {
        const entries = g.entries.filter((e) => e.formulas?.length || e.tables?.some((t) => t.sheet));
        if (!entries.length) return null;
        return (
          <section key={g.title} style={{ ['--h' as string]: String(g.block ? BLOCK_BY_ID[g.block].hue : 250) }}>
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="block-tag">{g.block ? `Bloque ${BLOCK_BY_ID[g.block].number}` : 'General'}</span>
              <h2 style={{ fontSize: '1.1rem' }}>{g.title}</h2>
            </div>
            <div className="stack">
              {entries.map((e) => (
                <div key={e.id} className="card wiki-sheet-entry">
                  <div className="card-title">
                    <h3>{e.title}</h3>
                    <Link to={`/wiki/${e.id}`} className="small">Ver ficha →</Link>
                  </div>
                  {e.formulas && e.formulas.length > 0 && (
                    <div className="wiki-formulas">
                      {e.formulas.map((f) => (
                        <FormulaCard key={f.name} formula={f} />
                      ))}
                    </div>
                  )}
                  {e.tables?.filter((t) => t.sheet).map((t) => (
                    <div key={t.title} style={{ marginTop: 12 }}>
                      <div className="wiki-formula-name"><RichText text={t.title} as="span" /></div>
                      <WikiTableView table={t} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GlossaryView({ block }: { block: BlockId | null }) {
  const groups = useMemo(() => {
    const m = new Map<string, GlossaryItem[]>();
    for (const item of glossary()) {
      if (block && item.entry.block !== block) continue;
      m.set(item.letter, [...(m.get(item.letter) ?? []), item]);
    }
    return [...m.entries()];
  }, [block]);

  return (
    <div>
      <div className="wiki-letters">
        {groups.map(([letter]) => (
          <button key={letter} type="button" className="chip" onClick={() => document.getElementById(`letra-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            {letter}
          </button>
        ))}
      </div>
      <div className="stack">
        {groups.map(([letter, items]) => (
          <section key={letter} id={`letra-${letter}`} className="card wiki-glossary-group">
            <h2 className="wiki-letter">{letter}</h2>
            <dl className="wiki-terms">
              {items.map((t) => (
                <div key={`${t.entry.id}-${t.term}`}>
                  <dt>
                    {t.term} <Link to={`/wiki/${t.entry.id}`} className="tiny wiki-term-source">{t.entry.title}</Link>
                  </dt>
                  <dd><RichText text={t.def} /></dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}

function WikiHome() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get('q') ?? '';
  const view = VIEWS.find((v) => v.id === params.get('vista'))?.id ?? 'temas';
  const block = BLOCKS.find((b) => b.id === params.get('bloque'))?.id ?? null;
  const hits = useWikiResults(q);
  const open = (id: string) => navigate(`/wiki/${id}`);
  const keys = useResultKeys(hits, open);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  return (
    <div className="page wide wiki-home">
      <div className="page-header">
        <div>
          <h1>Wiki de temas</h1>
          <p>
            Tu ayuda memoria: fórmulas, definiciones, ejemplos resueltos y errores frecuentes de cada tema. Ábrela desde cualquier pantalla
            con <span className="kbd">{WIKI_SHORTCUT}</span>, incluso en medio de un ejercicio.
          </p>
        </div>
      </div>
      <WikiSearchInput id="wiki-page-search" value={q} onChange={(v) => update({ q: v || null })} onKeyDown={keys.onKeyDown} autoFocus large />
      {q.trim() ? (
        <div style={{ marginTop: 14 }}>
          <WikiResults hits={hits} query={q} active={keys.active} onOpen={open} />
        </div>
      ) : (
        <>
          <div className="row between wrap wiki-toolbar">
            <Segmented value={view} options={VIEWS} onChange={(v) => update({ vista: v === 'temas' ? null : v })} />
            <div className="row wrap" style={{ gap: 6 }}>
              <button type="button" className={`chip ${!block ? 'active' : ''}`} onClick={() => update({ bloque: null })}>Todos</button>
              {BLOCKS.map((b) => (
                <button key={b.id} type="button" className={`chip ${block === b.id ? 'active' : ''}`} onClick={() => update({ bloque: b.id })}>
                  {b.short}
                </button>
              ))}
            </div>
          </div>
          {view === 'temas' && <TopicsView block={block} />}
          {view === 'formulario' && <FormulaSheet block={block} />}
          {view === 'glosario' && <GlossaryView block={block} />}
        </>
      )}
    </div>
  );
}

function EntryPage({ id }: { id: string }) {
  const entry = wikiEntry(id);
  const visit = useWiki((s) => s.visit);
  const navigate = useNavigate();

  useEffect(() => {
    if (entry) visit(entry.id);
    window.scrollTo({ top: 0 });
  }, [entry, visit]);

  if (!entry) {
    return (
      <div className="page">
        <div className="empty">
          No encontré esa ficha. <Link to="/wiki">Volver a la wiki</Link>
        </div>
      </div>
    );
  }
  const { prev, next } = neighbors(entry.id);

  return (
    <div className="page wiki-page">
      <Link to="/wiki" className="small muted row" style={{ gap: 4, marginBottom: 10 }}>
        <Icon name="left" size={16} /> Wiki de temas
      </Link>
      <WikiEntryView entry={entry} onOpen={(next) => navigate(`/wiki/${next}`)} {...desktopExtras(entry)} />
      <nav className="wiki-pager" aria-label="Otras fichas">
        {prev ? (
          <Link to={`/wiki/${prev.id}`} className="card hover wiki-pager-link">
            <span className="tiny faint">← Anterior</span>
            <strong>{prev.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/wiki/${next.id}`} className="card hover wiki-pager-link next">
            <span className="tiny faint">Siguiente →</span>
            <strong>{next.title}</strong>
          </Link>
        ) : <span />}
      </nav>
    </div>
  );
}

export default function Wiki() {
  const { id } = useParams();
  return id ? <EntryPage id={id} /> : <WikiHome />;
}
