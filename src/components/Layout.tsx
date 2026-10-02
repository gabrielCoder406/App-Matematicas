import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { dueReviews } from '../learning/engine';
import { streak } from '../learning/metrics';
import { IS_PHONE } from '../lib/platform';
import { useBackHandler } from '../phone/native';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import { openWikiSearch, useWiki, WIKI_SHORTCUT } from '../store/wiki';
import { Icon } from './Icon';

const loadWikiPanel = () => import('./wiki/WikiPanel');
const WikiPanel = lazy(loadWikiPanel);
/** Estado de la sincronización con el PC (solo en la app del móvil). */
const SyncChip = lazy(() => import('../phone/SyncChip'));

interface NavItem {
  to: string;
  icon: string;
  label: string;
  end?: boolean;
  /** En la barra inferior de las pantallas chicas (el resto va en «Más»). */
  bottom?: boolean;
}

const NAV: NavItem[] = [
  { to: '/', icon: 'home', label: 'Inicio', end: true, bottom: true },
  { to: '/temario', icon: 'map', label: 'Temario', bottom: true },
  { to: '/wiki', icon: 'wiki', label: 'Wiki' },
  { to: '/pizarra', icon: 'pen', label: 'Pizarra', bottom: true },
  { to: '/laboratorio', icon: 'flask', label: 'Laboratorio' },
  { to: '/progreso', icon: 'chart', label: 'Progreso', bottom: true },
  { to: '/errores', icon: 'alert', label: 'Errores' },
];

/** Solo en la app del móvil. */
const PHONE_NAV: NavItem[] = [
  { to: '/pizarra-pc', icon: 'monitor', label: 'Escribir en el PC' },
  { to: '/pc', icon: 'refresh', label: 'Sincronización' },
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
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  useWikiShortcut();

  // Al cambiar de pantalla se cierra el menú «Más».
  useEffect(() => setMoreOpen(false), [location.pathname]);

  const badge = (to: string) =>
    to === '/errores' && errorsPending > 0 ? <span className="badge danger">{errorsPending}</span>
      : to === '/temario' && due > 0 ? <span className="badge warning" title="Repasos pendientes">{due}</span>
        : null;
  const moreItems = [...NAV.filter((n) => !n.bottom), ...(IS_PHONE ? PHONE_NAV : []), { to: '/ajustes', icon: 'settings', label: 'Ajustes' }];
  const moreActive = moreItems.some((n) => location.pathname === n.to || location.pathname.startsWith(`${n.to}/`));

  return (
    <div className={`app-shell ${IS_PHONE ? 'phone' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">∑</div>
          <span>Matemática</span>
        </div>
        <button type="button" className="sidebar-search" onClick={openWikiSearch} title="Consultar la wiki sin salir de esta pantalla">
          <Icon name="search" size={17} />
          <span>Buscar en la wiki</span>
          {!IS_PHONE && <span className="kbd">{WIKI_SHORTCUT}</span>}
        </button>
        <nav className="nav">
          {[...NAV, ...(IS_PHONE ? PHONE_NAV : [])].map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <Icon name={n.icon} />
              {n.label}
              {badge(n.to)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {IS_PHONE && (
            <Suspense fallback={null}>
              <SyncChip full />
            </Suspense>
          )}
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
      {/* Pantallas chicas: barra superior (la lateral no entra). */}
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Inicio">
          <div className="brand-mark">∑</div>
          <span>Matemática</span>
        </NavLink>
        <span className="spacer" />
        {IS_PHONE && (
          <Suspense fallback={null}>
            <SyncChip />
          </Suspense>
        )}
        <span className="topbar-streak" title={`Racha actual · mejor: ${st.best}`}>
          <Icon name="fire" size={18} style={{ color: st.activeToday ? '#f07a2a' : 'var(--text-3)' }} /> {st.current}
        </span>
        <button type="button" className="icon-btn" onClick={openWikiSearch} aria-label="Buscar en la wiki" title="Buscar en la wiki">
          <Icon name="search" size={20} />
        </button>
      </header>
      <main className="main">{children}</main>
      {wikiOpen && (
        <Suspense fallback={null}>
          <WikiPanel />
        </Suspense>
      )}
      <nav className="bottom-nav">
        {NAV.filter((n) => n.bottom).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <Icon name={n.icon} size={22} />
            {n.label}
          </NavLink>
        ))}
        <button type="button" className={moreActive || moreOpen ? 'active' : ''} onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen}>
          <Icon name="more" size={22} />
          Más
          {errorsPending > 0 && <span className="nav-dot" />}
        </button>
      </nav>
      {moreOpen && <MoreSheet items={moreItems} badge={badge} onClose={() => setMoreOpen(false)} />}
      <Toasts />
    </div>
  );
}

function MoreSheet({ items, badge, onClose }: { items: NavItem[]; badge(to: string): ReactNode; onClose(): void }) {
  useBackHandler(onClose);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <nav className="sheet" onClick={(e) => e.stopPropagation()} aria-label="Más secciones">
        {items.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="sheet-item">
            <Icon name={n.icon} size={20} />
            <span>{n.label}</span>
            {badge(n.to)}
          </NavLink>
        ))}
      </nav>
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
