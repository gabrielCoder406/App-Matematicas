import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout, Toasts, useThemeEffect } from './components/Layout';
import { pairing, usePairing } from './canvas/pairing';
import { useProgress } from './store/progress';
import { useUi } from './store/ui';
import Home from './pages/Home';

const SkillMap = lazy(() => import('./pages/SkillMap'));
const SkillPage = lazy(() => import('./pages/SkillPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const PracticePage = lazy(() => import('./pages/PracticePage'));
const Whiteboard = lazy(() => import('./pages/Whiteboard'));
const Lab = lazy(() => import('./pages/Lab'));
const Progress = lazy(() => import('./pages/Progress'));
const ErrorLog = lazy(() => import('./pages/ErrorLog'));
const Settings = lazy(() => import('./pages/Settings'));
const Diagnostic = lazy(() => import('./pages/Diagnostic'));
const Wiki = lazy(() => import('./pages/Wiki'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CompanionPage = lazy(() => import('./companion/CompanionApp').then((m) => ({ default: () => <m.CompanionApp embedded /> })));

function Loading() {
  return <div className="empty" style={{ paddingTop: 80 }}>Cargando…</div>;
}

/** Conexión con el móvil: activa en segundo plano para que la app del teléfono se reconecte sola. */
function usePairingHost() {
  const navigate = useNavigate();
  const serverOk = useUi((s) => s.serverOk);
  const toast = useUi((s) => s.toast);
  const hasPeer = usePairing((s) => s.peers > 0);

  useEffect(() => {
    pairing.navigate = (path) => navigate(path);
    return () => {
      pairing.navigate = null;
    };
  }, [navigate]);

  useEffect(() => {
    if (serverOk) pairing.start();
  }, [serverOk]);

  useEffect(() => {
    if (hasPeer) toast({ kind: 'success', title: 'Móvil conectado', body: 'Lo que escribas en el teléfono aparecerá en la pizarra abierta.', icon: 'phone' }, 3500);
  }, [hasPeer, toast]);
}

export default function App() {
  useThemeEffect();
  const refreshHealth = useUi((s) => s.refreshHealth);
  const location = useLocation();
  const onboarded = useProgress((s) => s.onboarded);
  const companion = location.pathname.startsWith('/companion');

  // Estado del servidor y de la IA: al abrir, al volver a la ventana y cada 30 s
  // (así la app nota si Ollama se abre o se cierra mientras está en uso).
  useEffect(() => {
    if (companion) return;
    void refreshHealth();
    const onFocus = () => void refreshHealth();
    window.addEventListener('focus', onFocus);
    const timer = setInterval(onFocus, 30_000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(timer);
    };
  }, [refreshHealth, companion]);

  if (companion) {
    return (
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<Loading />}>
          <CompanionPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return <MainApp onboarded={onboarded} />;
}

function MainApp({ onboarded }: { onboarded: boolean }) {
  const location = useLocation();
  usePairingHost();

  if (location.pathname === '/bienvenida' || (!onboarded && location.pathname === '/')) {
    return (
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<Loading />}>
          <Onboarding />
        </Suspense>
        <Toasts />
      </ErrorBoundary>
    );
  }

  return (
    <Layout>
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/temario" element={<SkillMap />} />
            <Route path="/habilidad/:id" element={<SkillPage />} />
            <Route path="/leccion/:id" element={<LessonPage />} />
            <Route path="/practica/:id" element={<PracticePage mode="skill" />} />
            <Route path="/repaso" element={<PracticePage mode="review" />} />
            <Route path="/errores/repasar/:bug" element={<PracticePage mode="error" />} />
            <Route path="/errores" element={<ErrorLog />} />
            <Route path="/wiki" element={<Wiki />} />
            <Route path="/wiki/:id" element={<Wiki />} />
            <Route path="/pizarra" element={<Whiteboard />} />
            <Route path="/laboratorio" element={<Lab />} />
            <Route path="/laboratorio/:tool" element={<Lab />} />
            <Route path="/progreso" element={<Progress />} />
            <Route path="/diagnostico" element={<Diagnostic />} />
            <Route path="/ajustes" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </Layout>
  );
}
