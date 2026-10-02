// Pizarra remota en el navegador del móvil, sin instalar la app: se abre con el enlace del QR
// que muestra la app de escritorio (la sirve el propio PC). La app del móvil (APK) usa la misma
// pizarra desde «Escribir en el PC» (ver phone/RemoteBoardPage.tsx).
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { useWiki } from '../store/wiki';
import { Board } from './Board';
import { CompanionLink, wsUrlFor } from './connection';

const CompanionWiki = lazy(() => import('./CompanionWiki'));

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

export function CompanionApp() {
  useSystemTheme();
  const wikiOpen = useWiki((s) => s.open);
  const [error, setError] = useState<string | null>(() =>
    /^\d{6}$/.test(new URLSearchParams(location.search).get('code') ?? '') ? null : 'Falta el código de emparejamiento. Escanea de nuevo el QR que muestra la app de escritorio.',
  );
  const link = useMemo(() => (error ? null : new CompanionLink(wsUrlFor(null))), [error]);

  useEffect(() => {
    if (!link) return undefined;
    link.open();
    const onVisible = () => document.visibilityState === 'visible' && link.kick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      link.close();
    };
  }, [link]);

  return (
    <>
      {error || !link ? <ErrorScreen message={error ?? ''} onRetry={() => location.reload()} /> : <Board link={link} label={location.host} onRejected={setError} />}
      {wikiOpen && (
        <Suspense fallback={null}>
          <CompanionWiki />
        </Suspense>
      )}
    </>
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
