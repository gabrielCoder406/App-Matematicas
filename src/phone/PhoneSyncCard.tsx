// Ajustes de la app del móvil: estado de la sincronización con el PC y de la IA del PC.
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { useProgress } from '../store/progress';
import { usePcLink } from './link';
import { syncSummary, timeAgo } from './syncStatus';

export default function PhoneSyncCard() {
  const link = usePcLink();
  const pending = useProgress((s) => s.sync.pending);
  const lastSync = useProgress((s) => s.sync.lastSync);
  const st = syncSummary(link, pending);
  const online = link.status === 'online';
  return (
    <>
      <div className="card stack" style={{ gap: 10 }}>
        <h3><Icon name="refresh" size={18} /> Sincronización con el PC</h3>
        <div className="row" style={{ gap: 12 }}>
          <span className={`sync-icon ${st.tone}`}><Icon name="monitor" size={22} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 650 }}>{link.target ? (link.target.name ?? `${link.target.host}:${link.target.port}`) : 'Ningún PC vinculado'}</div>
            <div className="tiny faint">{st.label} · última sincronización: {timeAgo(lastSync)}</div>
          </div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>{st.detail}</p>
        <Link to="/pc" className="btn outline sm" style={{ alignSelf: 'flex-start' }}>
          <Icon name={link.target ? 'settings' : 'qr'} size={16} /> {link.target ? 'Ver la sincronización' : 'Vincular con el PC'}
        </Link>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 6 }}><Icon name="brain" size={18} /> Inteligencia artificial</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          La lectura de la escritura a mano y el tutor <b>Explícame</b> usan la IA de la app del PC: en el móvil están disponibles mientras está conectado. Se configuran en <b>Ajustes</b> de la app del PC.
        </p>
        <div className="row wrap">
          <span className={`badge ${online && link.ai.ocr ? 'success' : ''}`}><Icon name="scan" size={13} /> Leer la escritura: {online ? (link.ai.ocr ? 'lista' : 'no configurada en el PC') : 'sin conexión'}</span>
          <span className={`badge ${online && link.ai.tutor ? 'success' : ''}`}><Icon name="brain" size={13} /> Tutor: {online ? (link.ai.tutor ? 'listo' : 'no configurado en el PC') : 'sin conexión'}</span>
        </div>
      </div>
    </>
  );
}
