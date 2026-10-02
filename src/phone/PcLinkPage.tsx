// Sincronización con el PC (app del móvil): estado, vincular con un PC y qué se sincroniza.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useProgress } from '../store/progress';
import { ConnectForm } from './ConnectForm';
import { pc, usePcLink } from './link';
import { pendingChanges, syncSummary, timeAgo } from './syncStatus';

export default function PcLinkPage() {
  const link = usePcLink();
  const pending = useProgress((s) => s.sync.pending);
  const lastSync = useProgress((s) => s.sync.lastSync);
  const [relink, setRelink] = useState(false);
  const [confirmForget, setConfirmForget] = useState(false);
  const st = syncSummary(link, pending);
  const online = link.status === 'online';
  const showForm = !link.target || relink || link.status === 'rejected';
  const changes = pendingChanges(pending);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Sincronización con el PC</h1>
          <p>El mismo progreso en el móvil y en la app de escritorio: lo que practiques en uno aparece en el otro.</p>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          {link.target && (
            <div className="card stack" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 12 }}>
                <span className={`sync-icon ${st.tone}`}><Icon name="monitor" size={22} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 650 }}>{link.target.name ?? 'PC vinculado'}</div>
                  <div className="tiny faint mono">{link.target.host}:{link.target.port}</div>
                </div>
                <span className={`sync-chip ${st.tone}`}><span className="sync-dot" />{st.label}</span>
              </div>
              <p className="small muted" style={{ margin: 0 }}>{st.detail}</p>
              <div className="sync-facts">
                <div><span className="tiny faint">Última sincronización</span><b>{timeAgo(lastSync)}</b></div>
                <div><span className="tiny faint">Por enviar</span><b>{changes ? `${changes} ${changes === 1 ? 'cambio' : 'cambios'}` : 'Nada'}</b></div>
                <div><span className="tiny faint">Leer la escritura (IA del PC)</span><b>{online ? (link.ai.ocr ? 'Disponible' : 'No configurada en el PC') : 'Sin conexión'}</b></div>
                <div><span className="tiny faint">Tutor (IA del PC)</span><b>{online ? (link.ai.tutor ? 'Disponible' : 'No configurado en el PC') : 'Sin conexión'}</b></div>
              </div>
              <div className="row wrap">
                {link.sync.phase === 'conflict' && (
                  <button className="btn primary sm" onClick={() => usePcLink.setState({ conflictDeferred: false })}>
                    <Icon name="alert" size={16} /> Elegir cómo sincronizar
                  </button>
                )}
                {link.sync.phase === 'conflict' ? null : online ? (
                  <Link to="/pizarra-pc" className="btn primary sm"><Icon name="pen" size={16} /> Escribir en el PC</Link>
                ) : (
                  <button className="btn primary sm" onClick={() => pc.retry()}><Icon name="refresh" size={16} /> Reintentar ahora</button>
                )}
                {!showForm && (
                  <button className="btn ghost sm" onClick={() => setRelink(true)}><Icon name="qr" size={16} /> Vincular con otro PC</button>
                )}
                <span className="spacer" />
                {!confirmForget ? (
                  <button className="btn ghost sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmForget(true)}>Desvincular</button>
                ) : (
                  <span className="row" style={{ gap: 6 }}>
                    <button className="btn danger sm" onClick={() => { pc.forget(); setConfirmForget(false); }}>Desvincular</button>
                    <button className="btn ghost sm" onClick={() => setConfirmForget(false)}>Cancelar</button>
                  </span>
                )}
              </div>
              {confirmForget && (
                <div className="tiny faint">El móvil deja de conectarse a este PC. Tu progreso queda en los dos; lo que hagas en el móvil se enviará si vuelves a vincularlo.</div>
              )}
            </div>
          )}

          {showForm && (
            <div className="card">
              <div className="row between" style={{ marginBottom: 6 }}>
                <h3>{link.target ? 'Vincular de nuevo' : 'Vincular con el PC'}</h3>
                {relink && <button className="icon-btn" onClick={() => setRelink(false)} aria-label="Cancelar"><Icon name="x" size={18} /></button>}
              </div>
              <p className="small muted" style={{ marginTop: 0 }}>
                En la app de escritorio <b>Matemática</b> toca <b>Conectar móvil</b> y escanea el QR. Si ya tienes progreso en los dos, podrás elegir cómo combinarlo.
              </p>
              <ConnectForm
                initialHost={link.target?.host}
                initialPort={link.target?.port}
                onConnect={(t) => {
                  pc.connect(t);
                  setRelink(false);
                }}
              />
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 8 }}>Cómo funciona</h3>
          <ul className="sync-howto small">
            <li><Icon name="check" size={16} /><span>Se sincroniza todo el seguimiento: dominio de cada tema, desbloqueos, refuerzos, repasos programados, banco de errores, racha y tiempo de estudio.</span></li>
            <li><Icon name="wifi" size={16} /><span>Hace falta la misma red Wi-Fi y la app del PC abierta. Sin conexión el móvil funciona igual: lo que hagas se envía al reconectar.</span></li>
            <li><Icon name="brain" size={16} /><span>La IA (leer la escritura y el tutor) corre en el PC: en el móvil está disponible mientras están conectados.</span></li>
            <li><Icon name="pen" size={16} /><span>Conectado, el móvil también sirve de pizarra del PC: <b>Escribir en el PC</b>.</span></li>
            <li><Icon name="settings" size={16} /><span>El tema y el teclado matemático son de cada dispositivo; la meta diaria y tu nombre se comparten.</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
