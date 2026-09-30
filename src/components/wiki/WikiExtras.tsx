// Partes de la ficha que dependen de la app de escritorio (progreso del estudiante y navegación):
// sus errores en el tema y los accesos a la lección y a la práctica. La app del móvil no las usa.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { errorLabel } from '../../content/errorCatalog';
import type { WikiEntry } from '../../content/wiki';
import { isUnlocked } from '../../learning/engine';
import { useProgress } from '../../store/progress';
import { Icon } from '../Icon';

/** Errores que el estudiante cometió practicando este tema (del banco de errores). */
function MyErrors({ skillId }: { skillId: string }) {
  const errors = useProgress((s) => s.errors);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of errors) if (e.skillId === skillId && e.bug !== 'other') m.set(e.bug, (m.get(e.bug) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [errors, skillId]);
  if (!counts.length) return null;
  return (
    <div className="callout warning">
      <Icon className="callout-icon" name="target" />
      <div>
        <strong>Tus errores en este tema</strong>
        <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
          {counts.map(([bug, n]) => (
            <Link key={bug} to={`/errores/repasar/${encodeURIComponent(bug)}`} className="chip" title="Practicar para evitar este error">
              {errorLabel(bug)} · {n} {n === 1 ? 'vez' : 'veces'}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Actions({ entry, compact }: { entry: WikiEntry; compact?: boolean }) {
  const unlocked = useProgress((s) => isUnlocked(s, entry.id));
  const size = compact ? 'sm' : '';
  return (
    <div className="row wrap wiki-actions">
      <Link to={`/leccion/${entry.id}`} className={`btn outline ${size}`}><Icon name="book" size={16} /> Microlección</Link>
      {unlocked && <Link to={`/practica/${entry.id}`} className={`btn primary ${size}`}><Icon name="play" size={16} /> Practicar</Link>}
      <Link to={`/habilidad/${entry.id}`} className={`btn ghost ${size}`}>Ver en el temario</Link>
    </div>
  );
}

/** Extras de la app de escritorio para `WikiEntryView` (solo en fichas de temas del temario). */
export function desktopExtras(entry: WikiEntry, compact?: boolean) {
  if (!entry.isSkill) return {};
  return { extras: <MyErrors skillId={entry.id} />, footer: <Actions entry={entry} compact={compact} /> };
}
