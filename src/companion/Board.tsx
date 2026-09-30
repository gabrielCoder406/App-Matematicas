// Pizarra del móvil: lo que se escribe aquí aparece al instante en la app de escritorio.
import { Capacitor } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { RichText, Tex } from '../components/Math';
import { InkModel, INK_COLORS, resolveColor } from '../canvas/ink';
import { InkCanvas, type CanvasTool, type InkCanvasHandle } from '../canvas/InkCanvas';
import type { AnyMessage, PeerMessage } from '../canvas/protocol';
import { openWiki, useWiki, useWikiContext } from '../store/wiki';
import { CompanionLink, type LinkStatus } from './connection';

interface BoardInfo {
  width: number;
  height: number;
  title: string;
  prompt?: string;
  canSubmit: boolean;
  /** Tema del ejercicio abierto en el PC (se sugiere su ficha en la wiki). */
  topic?: string;
}

const STATUS_TEXT: Record<LinkStatus, string> = {
  connecting: 'conectando…',
  online: 'conectado',
  'host-offline': 'la app del PC está cerrada',
  unreachable: 'sin respuesta del PC',
  rejected: 'desconectado',
};

export function Board({ wsUrl, label, onExit, onRejected, onHostName }: {
  wsUrl: string;
  /** Dirección del PC (para los mensajes de ayuda). */
  label: string;
  onExit?(): void;
  onRejected(message: string): void;
  onHostName?(name: string): void;
}) {
  const model = useMemo(() => new InkModel(), []);
  const canvasRef = useRef<InkCanvasHandle>(null);
  const link = useRef<CompanionLink | null>(null);
  const localIds = useRef(new Set<string>());
  const [status, setStatus] = useState<LinkStatus>('connecting');
  const [board, setBoard] = useState<BoardInfo | null>(null);
  const [idle, setIdle] = useState<{ action: string; title: string } | null>(null);
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState('ink');
  const [ocr, setOcr] = useState<{ lines: string[]; error?: string } | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; partial?: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [portrait, setPortrait] = useState(() => window.innerHeight > window.innerWidth);
  // Pantallas bajas (móvil en horizontal): una sola barra para dejar más espacio al lienzo.
  const [compact, setCompact] = useState(() => window.innerHeight < 520);
  const dark = document.documentElement.dataset.theme === 'dark';
  const onRejectedRef = useRef(onRejected);
  onRejectedRef.current = onRejected;

  useEffect(() => {
    let current: BoardInfo | null = null;
    const handle = (msg: AnyMessage) => {
      switch (msg.type) {
        case 'board': {
          const next = { width: msg.width, height: msg.height, title: msg.title ?? 'Pizarra', prompt: msg.prompt, canSubmit: !!msg.canSubmit, topic: msg.topic };
          if (!current || current.prompt !== next.prompt || current.width !== next.width || current.height !== next.height) {
            setOcr(null);
            setFeedback(null);
            setShowPrompt(true);
          }
          current = next;
          setBoard(next);
          setIdle(null);
          break;
        }
        case 'idle':
          current = null;
          setBoard(null);
          setIdle({ action: msg.action ?? 'Abrir la pizarra', title: msg.title ?? 'No hay una pizarra abierta en el PC' });
          model.load([]);
          break;
        case 'sync':
          model.load(msg.strokes);
          localIds.current = new Set([...localIds.current].filter((id) => msg.strokes.some((s) => s.id === id)));
          setCanUndo(msg.canUndo);
          break;
        case 'stroke-start':
          if (localIds.current.has(msg.id)) break;
          model.begin({ id: msg.id, tool: msg.tool, color: msg.color, size: msg.size, points: msg.pts.slice(), realPressure: msg.pts.some((p) => p[2] !== 0.5) });
          break;
        case 'stroke-points':
          if (!localIds.current.has(msg.id)) model.extend(msg.id, msg.pts);
          break;
        case 'stroke-end':
          if (!localIds.current.has(msg.id)) model.end(msg.id);
          break;
        case 'ocr-result':
          setOcrBusy(false);
          setOcr({ lines: msg.lines, error: msg.error });
          break;
        case 'feedback':
          setSubmitting(false);
          setFeedback({ correct: msg.correct, partial: msg.partial, message: msg.message });
          if (navigator.vibrate) navigator.vibrate(msg.correct ? 40 : [30, 60, 30]);
          break;
        default:
          break;
      }
    };
    const l = new CompanionLink(wsUrl, {
      status: (s, detail) => {
        setStatus(s);
        if (s === 'rejected') onRejectedRef.current(detail ?? 'La conexión fue rechazada.');
      },
      message: handle,
    });
    link.current = l;
    l.open();
    const onVisible = () => document.visibilityState === 'visible' && l.kick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      l.close();
      link.current = null;
    };
  }, [wsUrl, model]);

  // Nombre del PC (lo muestra la pantalla de conexión la próxima vez).
  useEffect(() => {
    if (status !== 'online' || !onHostName) return;
    const base = wsUrl.replace(/^ws/, 'http').replace(/\/ws\?.*$/, '');
    fetch(`${base}/api/health`).then((r) => r.json()).then((h: { name?: string }) => h.name && onHostName(h.name)).catch(() => {});
  }, [status, wsUrl, onHostName]);

  useWikiContext(board?.topic);
  const wikiOpen = useWiki((s) => s.open);

  // En la app Android, el tablero (más ancho que alto) se usa en horizontal; con la wiki
  // abierta se libera el giro para poder leer en vertical.
  const hasBoard = !!board;
  useEffect(() => {
    if (!hasBoard || wikiOpen || !Capacitor.isNativePlatform()) return;
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    return () => {
      ScreenOrientation.unlock().catch(() => {});
    };
  }, [hasBoard, wikiOpen]);

  useEffect(() => {
    const onResize = () => {
      setPortrait(window.innerHeight > window.innerWidth);
      setCompact(window.innerHeight < 520);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    // Mantener la pantalla encendida mientras se escribe (en la app Android lo hace el sistema).
    let lock: { release(): Promise<void> } | null = null;
    const req = async () => {
      try {
        const wl = (navigator as unknown as { wakeLock?: { request(t: string): Promise<{ release(): Promise<void> }> } }).wakeLock;
        if (wl && !lock) lock = await wl.request('screen');
      } catch {
        /* no disponible */
      }
    };
    window.addEventListener('pointerdown', req, { once: true });
    return () => {
      window.removeEventListener('pointerdown', req);
      lock?.release().catch(() => {});
    };
  }, []);

  const send = (m: PeerMessage) => link.current?.send(m);
  const online = status === 'online';

  const onLocal = (m: PeerMessage) => {
    if (m.type === 'stroke-start') {
      localIds.current.add(m.id);
      setFeedback(null);
    }
    send(m);
  };

  const recognize = () => {
    setOcrBusy(true);
    setOcr(null);
    setFeedback(null);
    send({ type: 'ocr' });
    // La lectura con la IA local del PC puede tardar más de un minuto la primera vez.
    setTimeout(() => setOcrBusy(false), 150_000);
  };

  const submit = () => {
    setSubmitting(true);
    send({ type: 'submit' });
    setTimeout(() => setSubmitting(false), 8000);
  };

  const tools: { id: CanvasTool; icon: string; label: string }[] = [
    { id: 'pen', icon: 'pen', label: 'Lápiz' },
    { id: 'highlighter', icon: 'highlighter', label: 'Resaltador' },
    { id: 'eraser', icon: 'eraser', label: 'Borrador' },
    { id: 'laser', icon: 'laser', label: 'Puntero láser' },
  ];

  const statusLine = status === 'unreachable'
    ? `No se encuentra el PC en ${label}. Revisa que la app de escritorio esté abierta y que ambos estén en la misma Wi-Fi.`
    : status === 'host-offline'
      ? 'La app del PC se cerró o se está recargando. Se reconectará sola.'
      : null;

  const wide = board ? board.width / board.height > 1.3 : false;

  const colorButtons = INK_COLORS.map((c) => (
    <button key={c} className={`color-dot ${color === c && tool !== 'eraser' && tool !== 'laser' ? 'active' : ''}`} style={{ background: resolveColor(c, dark) }} onClick={() => { setColor(c); if (tool === 'eraser' || tool === 'laser') setTool('pen'); }} aria-label={`Color ${c}`} />
  ));
  const toolButtons = tools.map((t) => (
    <button key={t.id} className={`icon-btn ${tool === t.id ? 'active' : ''}`} onClick={() => setTool(t.id)} aria-label={t.label} title={t.label}>
      <Icon name={t.icon} size={20} />
    </button>
  ));
  const historyButtons = (
    <>
      <button className="icon-btn" onClick={() => send({ type: 'undo' })} disabled={!canUndo && model.isEmpty} aria-label="Deshacer" title="Deshacer"><Icon name="undo" size={20} /></button>
      <button className="icon-btn" onClick={() => send({ type: 'redo' })} aria-label="Rehacer" title="Rehacer"><Icon name="redo" size={20} /></button>
      <button className="icon-btn" onClick={() => send({ type: 'clear' })} aria-label="Borrar todo" title="Borrar todo"><Icon name="trash" size={20} /></button>
    </>
  );
  const wikiButton = (
    <button className="icon-btn" onClick={() => openWiki()} aria-label="Wiki de temas" title="Wiki de temas">
      <Icon name="wiki" size={20} />
    </button>
  );
  const actionButtons = board && (
    <>
      <button className={`btn ${compact ? 'sm' : ''}`} onClick={recognize} disabled={!online || ocrBusy}>
        <Icon name="scan" size={18} /> {ocrBusy ? 'Leyendo…' : 'Reconocer'}
      </button>
      {board.canSubmit && (
        <button className={`btn primary ${compact ? 'sm' : ''}`} onClick={submit} disabled={!online || submitting}>
          <Icon name="check" size={18} /> {submitting ? 'Comprobando…' : 'Comprobar'}
        </button>
      )}
    </>
  );

  return (
    <div className={`companion ${compact ? 'compact' : ''}`}>
      <header className="companion-bar">
        {onExit && (
          <button className="icon-btn" onClick={onExit} aria-label="Desconectar" title="Desconectar"><Icon name="left" size={20} /></button>
        )}
        <div className="row companion-title" title={STATUS_TEXT[status]}>
          <span className={`status-dot ${online ? 'online' : status === 'rejected' || status === 'unreachable' ? 'error' : ''}`} />
          {!(compact && board) && <strong className="nowrap">{board?.title ?? 'Pizarra'}</strong>}
          {!(compact && board) && <span className="tiny faint nowrap hidden-narrow">{STATUS_TEXT[status]}</span>}
        </div>
        {board && compact ? (
          <>
            <div className="companion-scroll">{colorButtons}<span className="bar-sep" />{toolButtons}<span className="bar-sep" />{historyButtons}</div>
            {wikiButton}
            {actionButtons}
          </>
        ) : (
          <>
            <span className="spacer" />
            {board && toolButtons}
            {board && <span className="bar-sep" />}
            {wikiButton}
          </>
        )}
      </header>

      {statusLine && <div className="companion-banner small">{statusLine}</div>}

      {board ? (
        <>
          {!compact && (
            <div className="companion-colors">
              {colorButtons}
              <span className="spacer" />
              {historyButtons}
            </div>
          )}
          {board.prompt && (
            <button className={`companion-prompt ${showPrompt ? '' : 'collapsed'}`} onClick={() => setShowPrompt((s) => !s)} aria-expanded={showPrompt}>
              {showPrompt ? <RichText text={board.prompt} /> : <span className="small muted">Ver el enunciado</span>}
            </button>
          )}
          <div className="companion-board">
            <InkCanvas ref={canvasRef} model={model} boardWidth={board.width} boardHeight={board.height} tool={tool} color={color} size={5} onLocal={onLocal} fit localUndo={false} />
            {portrait && wide && <div className="rotate-hint tiny">Gira el teléfono para tener más espacio</div>}
          </div>
          {!compact && <div className="companion-actions">{actionButtons}</div>}
          {(ocr || feedback) && (
            <div className="companion-sheet" onClick={() => { setOcr(null); setFeedback(null); }}>
              {ocr && (ocr.error
                ? <span className="small" style={{ color: 'var(--danger)' }}>{ocr.error}</span>
                : ocr.lines.length
                  ? <div className="stack" style={{ gap: 4 }}>{ocr.lines.map((l, i) => <Tex key={i} tex={l} />)}</div>
                  : <span className="small muted">No se reconoció escritura.</span>)}
              {feedback && <FeedbackBox f={feedback} />}
              <span className="tiny faint">Toca para cerrar</span>
            </div>
          )}
        </>
      ) : (
        <div className="companion-idle">
          {status === 'online' && idle ? (
            <>
              <Icon name="pen" size={34} />
              <h2>{idle.title}</h2>
              {feedback && <FeedbackBox f={feedback} />}
              <button className="btn primary lg" onClick={() => { setFeedback(null); send({ type: 'open-board' }); }}>{idle.action}</button>
              <p className="small muted">También puedes abrir la Pizarra o un ejercicio con «A mano» en la app de escritorio.</p>
            </>
          ) : (
            <>
              <span className="spinner" />
              <p className="muted">{status === 'unreachable' ? 'Buscando el PC…' : 'Conectando con la app de escritorio…'}</p>
              {onExit && <button className="btn ghost" onClick={onExit}>Cambiar de PC</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackBox({ f }: { f: { correct: boolean; partial?: boolean; message: string } }) {
  return (
    <div className={`callout small ${f.correct ? 'success' : f.partial ? 'warning' : 'danger'}`}>
      <Icon className="callout-icon" name={f.correct ? 'check' : f.partial ? 'alert' : 'x'} size={16} />
      <RichText text={f.message} />
    </div>
  );
}
