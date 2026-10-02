// Móvil como pizarra del PC: lo que se escribe aquí aparece al instante en la pizarra (o el
// ejercicio con «A mano») abierta en la app de escritorio.
import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Board } from '../companion/Board';
import { Icon } from '../components/Icon';
import { useWiki } from '../store/wiki';
import { usePcLink } from './link';

const WikiPanel = lazy(() => import('../components/wiki/WikiPanel'));

export default function RemoteBoardPage() {
  const navigate = useNavigate();
  const link = usePcLink((s) => s.link);
  const target = usePcLink((s) => s.target);
  const wikiOpen = useWiki((s) => s.open);
  const back = () => ((window.history.state as { idx?: number } | null)?.idx ? navigate(-1) : navigate('/', { replace: true }));

  if (!link || !target) {
    return (
      <div className="connect-screen">
        <div className="connect-hero">
          <div className="brand-mark big"><Icon name="monitor" size={30} /></div>
          <h1>Escribir en el PC</h1>
          <p className="muted">Primero vincula el móvil con la app del PC (misma red Wi-Fi).</p>
        </div>
        <Link to="/pc" className="btn primary lg block" replace>Vincular con el PC</Link>
        <button className="btn ghost block" onClick={back}>Volver</button>
      </div>
    );
  }

  return (
    <>
      <Board link={link} label={`${target.host}:${target.port}`} onExit={back} exitLabel="Volver" onRejected={() => navigate('/pc', { replace: true })} />
      {wikiOpen && (
        <Suspense fallback={null}>
          <WikiPanel />
        </Suspense>
      )}
    </>
  );
}
