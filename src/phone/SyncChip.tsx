// Estado de la sincronización con el PC (barra superior y lateral de la app del móvil).
import { Link } from 'react-router-dom';
import { useProgress } from '../store/progress';
import { usePcLink } from './link';
import { syncSummary } from './syncStatus';

export default function SyncChip({ full = false }: { full?: boolean }) {
  const link = usePcLink();
  const pending = useProgress((s) => s.sync.pending);
  const st = syncSummary(link, pending);
  return (
    <Link to="/pc" className={`sync-chip ${st.tone}`} title={`${st.label}. ${st.detail}`}>
      <span className="sync-dot" />
      <span className="nowrap">{full ? st.label : st.short}</span>
    </Link>
  );
}
