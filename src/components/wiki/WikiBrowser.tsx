// Navegador de la wiki: buscador, resultados, índice y fichas con historial («Volver»). Lo usan
// el panel de consulta de la app de escritorio y la app del móvil; cada una agrega lo suyo.
import { useEffect, useLayoutEffect, useRef, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import { wikiEntry, type WikiEntry } from '../../content/wiki';
import { takeReturnFocus, useWiki } from '../../store/wiki';
import { Icon } from '../Icon';
import { RichText } from '../Math';
import { EntryLink, WikiEntryView } from './WikiEntryView';
import { useResultKeys, useWikiResults, WikiIndexList, WikiResults, WikiSearchInput } from './WikiSearch';

/** Último pedido de foco ya atendido (para no robar el foco al reabrir desde un botón). */
let handledFocusTick = 0;

function Home({ onOpen }: { onOpen(id: string): void }) {
  const context = useWiki((s) => s.context);
  const recent = useWiki((s) => s.recent);
  const ctx = wikiEntry(context);
  const rec = recent.flatMap((id) => wikiEntry(id) ?? []).filter((e) => e.id !== ctx?.id).slice(0, 6);
  return (
    <div className="stack">
      {ctx && (
        <div>
          <div className="wiki-panel-label">Tema de esta pantalla</div>
          <EntryLink id={ctx.id} onOpen={onOpen} className="wiki-hit">
            <span className="wiki-hit-head"><Icon name="target" size={16} /><strong>{ctx.title}</strong></span>
            <RichText text={ctx.summary} as="span" className="wiki-hit-summary small muted" />
          </EntryLink>
        </div>
      )}
      {rec.length > 0 && (
        <div>
          <div className="wiki-panel-label">Consultadas hace poco</div>
          <div className="row wrap" style={{ gap: 6 }}>
            {rec.map((e) => (
              <EntryLink key={e.id} id={e.id} onOpen={onOpen} className="chip">{e.title}</EntryLink>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="wiki-panel-label">Todos los temas</div>
        <WikiIndexList onOpen={onOpen} />
      </div>
    </div>
  );
}

interface Props {
  className: string;
  /** Botones extra del encabezado (p. ej. abrir la ficha en página completa). */
  actions?: ReactNode;
  /** Partes de la ficha que agrega la app (errores del estudiante, accesos a la práctica). */
  entryExtras?: (entry: WikiEntry) => { extras?: ReactNode; footer?: ReactNode };
  footer?: ReactNode;
  /** Cierra la wiki; después el foco vuelve adonde estaba al abrirla. */
  onClose(): void;
}

export function WikiBrowser({ className, actions, entryExtras, footer, onClose }: Props) {
  const entryId = useWiki((s) => s.entryId);
  const query = useWiki((s) => s.query);
  const back = useWiki((s) => s.back);
  const focusTick = useWiki((s) => s.focusTick);
  const { show, goBack, setQuery } = useWiki.getState();
  const entry = wikiEntry(entryId);
  const hits = useWikiResults(query);
  const keys = useResultKeys(hits, show);
  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Recordar dónde estaba el foco (p. ej. la respuesta de un ejercicio) para volver ahí al cerrar.
  useLayoutEffect(() => {
    const a = document.activeElement;
    returnFocus.current = takeReturnFocus() ?? (a instanceof HTMLElement && a !== document.body ? a : null);
  }, []);
  const onFocusIn = (e: FocusEvent<HTMLElement>) => {
    const from = e.relatedTarget;
    if (from instanceof HTMLElement && !rootRef.current?.contains(from)) returnFocus.current = from;
  };

  useEffect(() => {
    if (focusTick === handledFocusTick) return;
    handledFocusTick = focusTick;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [focusTick]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [entryId]);

  const close = () => {
    onClose();
    const el = returnFocus.current;
    if (el && el.isConnected) el.focus();
  };

  const onType = (q: string) => {
    setQuery(q);
    if (entryId) useWiki.setState({ entryId: null, back: [...back, entryId] });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation();
    if (e.target === inputRef.current && query) setQuery('');
    else close();
  };

  const prev = back.length ? back[back.length - 1] : undefined;
  const backLabel = prev ? `Volver a «${wikiEntry(prev)?.title ?? 'la ficha anterior'}»` : query.trim() ? 'Volver a los resultados' : 'Todos los temas';
  const added = entry && entryExtras ? entryExtras(entry) : {};

  return (
    <aside className={className} ref={rootRef} aria-label="Wiki de temas" onKeyDown={onKeyDown} onFocus={onFocusIn}>
      <div className="wiki-panel-head">
        <div className="row between">
          <div className="row" style={{ gap: 8 }}>
            <Icon name="wiki" />
            <strong>Wiki de temas</strong>
          </div>
          <div className="row" style={{ gap: 2 }}>
            {actions}
            <button type="button" className="icon-btn" onClick={close} title="Cerrar (Esc)" aria-label="Cerrar la wiki">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>
        <WikiSearchInput value={query} onChange={onType} onKeyDown={keys.onKeyDown} inputRef={inputRef} />
      </div>
      <div className="wiki-panel-body" ref={bodyRef}>
        {entry ? (
          <>
            <button type="button" className="btn ghost sm wiki-back" onClick={goBack}>
              <Icon name="left" size={16} /> {backLabel}
            </button>
            <WikiEntryView key={entry.id} entry={entry} compact onOpen={show} extras={added.extras} footer={added.footer} />
          </>
        ) : query.trim() ? (
          <WikiResults hits={hits} query={query} active={keys.active} onOpen={show} />
        ) : (
          <Home onOpen={show} />
        )}
      </div>
      {footer}
    </aside>
  );
}
