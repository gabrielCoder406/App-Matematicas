// App del móvil («Pizarra Matemática»): se empareja con la app de escritorio y funciona
// como pizarra remota. La misma interfaz se usa en la app Android (APK) y en el navegador
// del móvil cuando se abre el enlace del QR (`embedded`: servida por el propio PC).
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import type { PairTarget } from '../canvas/protocol';
import { useWiki } from '../store/wiki';
import { Board } from './Board';
import { ConnectScreen, type SavedPc } from './ConnectScreen';
import { wsUrlFor } from './connection';

const CompanionWiki = lazy(() => import('./CompanionWiki'));

const LAST_KEY = 'pizarra-ultimo-pc';

function loadLast(): SavedPc | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null') as SavedPc | null;
    return v && typeof v.host === 'string' && typeof v.port === 'number' && /^\d{6}$/.test(v.code) ? v : null;
  } catch {
    return null;
  }
}

function saveLast(pc: SavedPc | null): void {
  try {
    if (pc) localStorage.setItem(LAST_KEY, JSON.stringify(pc));
    else localStorage.removeItem(LAST_KEY);
  } catch {
    /* sin almacenamiento */
  }
}

function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = mq.matches ? 'dark' : 'light';
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
}

export function CompanionApp({ embedded = false }: { embedded?: boolean }) {
  useSystemTheme();
  const wikiOpen = useWiki((s) => s.open);
  return (
    <>
      {embedded ? <EmbeddedCompanion /> : <StandaloneCompanion />}
      {wikiOpen && (
        <Suspense fallback={null}>
          <CompanionWiki />
        </Suspense>
      )}
    </>
  );
}

/** Abierta desde el enlace del QR en el navegador del móvil. */
function EmbeddedCompanion() {
  const [error, setError] = useState<string | null>(() =>
    /^\d{6}$/.test(new URLSearchParams(location.search).get('code') ?? '') ? null : 'Falta el código de emparejamiento. Escanea de nuevo el QR que muestra la app de escritorio.',
  );
  if (error) return <ErrorScreen message={error} onRetry={() => location.reload()} />;
  return <Board wsUrl={wsUrlFor(null)} label={location.host} onRejected={setError} />;
}

/** App Android: recuerda el último PC y se reconecta sola al abrirla. */
function StandaloneCompanion() {
  const [last, setLast] = useState<SavedPc | null>(loadLast);
  const [target, setTarget] = useState<PairTarget | null>(() => loadLast());
  const [error, setError] = useState<string | null>(null);

  const connect = (t: PairTarget) => {
    setError(null);
    const saved: SavedPc = { ...t, name: last && last.host === t.host && last.port === t.port ? last.name : undefined };
    saveLast(saved);
    setLast(saved);
    setTarget(t);
  };

  const exit = useCallback(() => setTarget(null), []);

  // Botón «atrás» de Android: vuelve a la pantalla de conexión en lugar de cerrar la app
  // (salvo al cerrar la wiki abierta sobre la pizarra: se vuelve a la entrada del tablero).
  useEffect(() => {
    if (!target) return;
    history.pushState({ board: true }, '');
    const onPop = (e: PopStateEvent) => {
      if (!(e.state as { board?: boolean } | null)?.board) setTarget(null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [target]);

  const onHostName = useCallback((name: string) => {
    setLast((prev) => {
      if (!prev || prev.name === name) return prev;
      const next = { ...prev, name };
      saveLast(next);
      return next;
    });
  }, []);

  if (!target) return <ConnectScreen last={last} error={error} onConnect={connect} />;
  return (
    <Board
      key={`${target.host}:${target.port}:${target.code}`}
      wsUrl={wsUrlFor(target)}
      label={`${target.host}:${target.port}`}
      onExit={() => (history.state?.board ? history.back() : exit())}
      onRejected={(msg) => {
        setError(msg);
        if (history.state?.board) history.back();
        else setTarget(null);
      }}
      onHostName={onHostName}
    />
  );
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry(): void }) {
  return (
    <div className="connect-screen">
      <div className="connect-hero">
        <div className="brand-mark big">∑</div>
        <h1>Pizarra Matemática</h1>
      </div>
      <div className="callout danger small">
        <Icon className="callout-icon" name="alert" size={16} />
        <div>{message}</div>
      </div>
      <button className="btn primary lg block" onClick={onRetry}>Reintentar</button>
    </div>
  );
}
