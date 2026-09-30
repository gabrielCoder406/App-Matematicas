import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { dueReviews } from '../learning/engine';
import { streak } from '../learning/metrics';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import { openWikiSearch, useWiki, WIKI_SHORTCUT } from '../store/wiki';
import { Icon } from './Icon';

const loadWikiPanel = () => import('./wiki/WikiPanel');
const WikiPanel = lazy(loadWikiPanel);

const NAV = [
  { to: '/', icon: 'home', label: 'Inicio', end: true, mobile: true },
  { to: '/temario', icon: 'map', label: 'Temario', mobile: true },
  { to: '/wiki', icon: 'wiki', label: 'Wiki', mobile: true },
  { to: '/pizarra', icon: 'pen', label: 'Pizarra', mobile: true },
  { to: '/laboratorio', icon: 'flask', label: 'Laboratorio' },
  { to: '/progreso', icon: 'chart', label: 'Progreso', mobile: true },
  { to: '/errores', icon: 'alert', label: 'Errores' },
];

/** Ctrl+K (⌘K en Mac) abre la wiki desde cualquier pantalla, incluso con el foco en una respuesta. */
function useWikiShortcut() {
  const onWikiHome = useLocation().pathname === '/wiki';
  // Precarga el panel para que el atajo lo abra al instante.
  useEffect(() => {
    const t = window.setTimeout(() => void loadWikiPanel(), 1500);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== 'k' && e.code !== 'KeyK') return;
      e.preventDefault();
      e.stopPropagation();
      const pageSearch = onWikiHome ? document.getElementById('wiki-page-search') : null;
      if (pageSearch instanceof HTMLInputElement) {
        pageSearch.focus();
        pageSearch.select();
      } else {
        openWikiSearch();
      }
    };
    // En captura: llega antes que los editores de fórmulas, que consumen el teclado.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onWikiHome]);
}

export function useThemeEffect() {
  const theme = useProgress((s) => s.settings.theme);
  useEffect(() => {
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    };
    apply();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

export function Layout({ children }: { children: ReactNode }) {
  const data = useProgress();
  const st = streak(data);
  const due = dueReviews(data).length;
  const errorsPending = data.errors.filter((e) => !e.reviewed).length;
  const setSettings = useProgress((s) => s.setSettings);
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark';
  const wikiOpen = useWiki((s) => s.open);
  useWikiShortcut();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">∑</div>
          <span>Matemática</span>
        </div>
        <button type="button" className="sidebar-search" onClick={openWikiSearch} title="Consultar la wiki sin salir de esta pantalla">
          <Icon name="search" size={17} />
          <span>Buscar en la wiki</span>
          <span className="kbd">{WIKI_SHORTCUT}</span>
        </button>
        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <Icon name={n.icon} />
              {n.label}
              {n.to === '/errores' && errorsPending > 0 && <span className="badge danger">{errorsPending}</span>}
              {n.to === '/temario' && due > 0 && <span className="badge warning" title="Repasos pendientes">{due}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="card flat" style={{ padding: 12 }}>
            <div className="row">
              <Icon name="fire" style={{ color: st.activeToday ? '#f07a2a' : 'var(--text-3)' }} />
              <div>
                <div style={{ fontWeight: 700 }}>{st.current} {st.current === 1 ? 'día' : 'días'}</div>
                <div className="tiny faint">Racha actual · mejor: {st.best}</div>
              </div>
            </div>
          </div>
          <div className="row">
            <NavLink to="/ajustes" className="btn ghost sm" style={{ flex: 1, justifyContent: 'flex-start' }}>
              <Icon name="settings" size={18} /> Ajustes
            </NavLink>
            <button
              className="icon-btn"
              title={dark ? 'Tema claro' : 'Tema oscuro'}
              onClick={() => setSettings({ theme: dark ? 'light' : 'dark' })}
            >
              <Icon name={dark ? 'sun' : 'moon'} size={18} />
            </button>
          </div>
        </div>
      </aside>
      <main className="main">{children}</main>
      {wikiOpen && (
        <Suspense fallback={null}>
          <WikiPanel />
        </Suspense>
      )}
      <nav className="bottom-nav">
        {NAV.filter((n) => n.mobile).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <Toasts />
    </div>
  );
}

export function Toasts() {
  const toasts = useUi((s) => s.toasts);
  const dismiss = useUi((s) => s.dismiss);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`} onClick={() => dismiss(t.id)} role="status">
          <Icon
            name={t.icon ?? (t.kind === 'success' ? 'check' : t.kind === 'danger' ? 'x' : t.kind === 'warning' ? 'alert' : 'sparkles')}
            style={{ color: `var(--${t.kind === 'info' ? 'primary' : t.kind})`, flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div style={{ fontWeight: 650 }}>{t.title}</div>
            {t.body && <div className="small muted">{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
