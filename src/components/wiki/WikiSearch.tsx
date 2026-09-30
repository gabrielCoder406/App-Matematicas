// Piezas compartidas por la página de la wiki y el panel de consulta: buscador, resultados
// (con la fórmula o la definición que coincide) e índice de temas.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react';
import { BLOCK_BY_ID } from '../../content/curriculum';
import { searchWiki, wikiGroups, type WikiHit } from '../../content/wiki';
import { Icon } from '../Icon';
import { RichText, Tex } from '../Math';
import { EntryLink } from './WikiEntryView';

export function WikiSearchInput({ value, onChange, onKeyDown, inputRef, id, autoFocus, large }: {
  value: string;
  onChange(v: string): void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  id?: string;
  autoFocus?: boolean;
  large?: boolean;
}) {
  return (
    <div className={`wiki-search ${large ? 'lg' : ''}`}>
      <Icon name="search" size={large ? 20 : 18} />
      <input
        ref={inputRef}
        id={id}
        type="search"
        className="input"
        placeholder="Busca un tema, fórmula o palabra…"
        aria-label="Buscar en la wiki"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button type="button" className="icon-btn" onClick={() => onChange('')} aria-label="Borrar la búsqueda" title="Borrar">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

export function useWikiResults(query: string): WikiHit[] {
  return useMemo(() => searchWiki(query), [query]);
}

/** Flechas para recorrer los resultados y Enter para abrir el marcado. */
export function useResultKeys(hits: WikiHit[], open: (id: string) => void) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [hits]);
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!hits.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(hits.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(hits[Math.min(active, hits.length - 1)].entry.id);
    }
  };
  return { active, onKeyDown };
}

export function WikiResults({ hits, query, active, onOpen }: { hits: WikiHit[]; query: string; active: number; onOpen(id: string): void }) {
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector('.wiki-hit.active')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!hits.length) {
    return (
      <div className="empty wiki-empty">
        <div className="icon-wrap"><Icon name="search" /></div>
        <p>No encontré nada para «{query.trim()}».</p>
        <p className="small faint">Prueba con otra palabra: el nombre del tema («logaritmos»), de una fórmula («discriminante») o de un teorema («Pitágoras»).</p>
      </div>
    );
  }

  return (
    <div className="wiki-results" ref={list}>
      <div className="tiny faint">{hits.length === 1 ? '1 ficha' : `${hits.length} fichas`} · ↑ ↓ para elegir, Enter para abrir</div>
      {hits.map((h, i) => {
        const block = h.entry.block ? BLOCK_BY_ID[h.entry.block] : null;
        return (
          <EntryLink key={h.entry.id} id={h.entry.id} onOpen={onOpen} className={`wiki-hit ${i === active ? 'active' : ''}`}>
            <span className="wiki-hit-head" style={{ ['--h' as string]: String(block?.hue ?? 250) }}>
              <span className="block-dot" />
              <strong>{h.entry.title}</strong>
              <span className="tiny faint">{block?.short ?? 'Referencia'}</span>
            </span>
            {h.matches.length > 0 ? (
              h.matches.map((m) =>
                m.kind === 'formula' ? (
                  <span key={`f${m.formula.name}`} className="wiki-hit-match">
                    <span className="tiny muted">{m.formula.name}</span>
                    <Tex tex={m.formula.tex} />
                  </span>
                ) : (
                  <span key={`t${m.term.term}`} className="wiki-hit-match">
                    <span className="small"><strong>{m.term.term}:</strong> <RichText text={m.term.def} as="span" /></span>
                  </span>
                ),
              )
            ) : (
              <RichText text={h.entry.summary} as="span" className="wiki-hit-summary small muted" />
            )}
          </EntryLink>
        );
      })}
    </div>
  );
}

/** Índice compacto de todas las fichas, agrupadas por bloque. */
export function WikiIndexList({ onOpen, currentId }: { onOpen(id: string): void; currentId?: string | null }) {
  return (
    <div className="wiki-index">
      {wikiGroups().map((g) => (
        <div key={g.title} className="wiki-index-group" style={{ ['--h' as string]: String(g.block ? BLOCK_BY_ID[g.block].hue : 250) }}>
          <div className="wiki-index-title">
            <span className="block-dot" /> {g.block ? `${BLOCK_BY_ID[g.block].number}. ${BLOCK_BY_ID[g.block].short}` : g.title}
          </div>
          {g.entries.map((e) => (
            <EntryLink key={e.id} id={e.id} onOpen={onOpen} className={`wiki-index-item ${e.id === currentId ? 'active' : ''}`}>
              {e.title}
            </EntryLink>
          ))}
        </div>
      ))}
    </div>
  );
}
