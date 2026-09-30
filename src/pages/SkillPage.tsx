import { Link, useParams } from 'react-router-dom';
import { BLOCK_BY_ID, dependents, SKILL_BY_ID } from '../content/curriculum';
import { errorLabel } from '../content/errorCatalog';
import { lessonFor } from '../content/lessons';
import { Icon } from '../components/Icon';
import { RichText } from '../components/Math';
import { allStates, masteryScore, missingPrereqs, nextLevel, pendingRemediationFor, sp } from '../learning/engine';
import { formatDuration } from '../learning/metrics';
import type { SkillState } from '../learning/types';
import { useProgress } from '../store/progress';
import { useWikiContext } from '../store/wiki';

const STATE_LABEL: Record<SkillState, string> = { locked: 'Bloqueada', available: 'Disponible', 'in-progress': 'En progreso', mastered: 'Dominada' };
const STATE_BADGE: Record<SkillState, string> = { locked: '', available: 'info', 'in-progress': 'primary', mastered: 'success' };

export default function SkillPage() {
  const { id = '' } = useParams();
  const skill = SKILL_BY_ID[id];
  const data = useProgress();
  useWikiContext(skill ? id : undefined);
  if (!skill) return <div className="page"><div className="empty">Habilidad no encontrada. <Link to="/temario">Volver</Link></div></div>;
  const states = allStates(data);
  const st = states[id];
  const p = sp(data, id);
  const block = BLOCK_BY_ID[skill.block];
  const score = masteryScore(data.skills[id]);
  const acc = p.attempts ? p.correct / p.attempts : null;
  const errors = data.errors.filter((e) => e.skillId === id).slice(-6).reverse();
  const rem = pendingRemediationFor(data, id);
  const missing = missingPrereqs(data, id);
  const lesson = lessonFor(id);
  const deps = dependents(id);

  return (
    <div className="page" style={{ ['--h' as string]: String(block.hue) }}>
      <Link to="/temario" className="small muted row" style={{ gap: 4, marginBottom: 10 }}>
        <Icon name="left" size={16} /> Temario
      </Link>
      <div className="page-header">
        <div>
          <div className="row wrap" style={{ gap: 8 }}>
            <span className="block-tag">Bloque {block.number} · {block.short}</span>
            <span className={`badge ${STATE_BADGE[st]}`}>{STATE_LABEL[st]}</span>
            {p.placed && <span className="badge">Nivelado por diagnóstico</span>}
          </div>
          <h1 style={{ marginTop: 10 }}>{skill.title}</h1>
          <p>{skill.summary}</p>
        </div>
        {st !== 'locked' && (
          <div className="row wrap">
            <Link to={`/leccion/${id}`} className="btn outline lg"><Icon name="book" size={18} /> Microlección · {lesson.minutes} min</Link>
            <Link to={`/practica/${id}`} className="btn primary lg"><Icon name="play" size={18} /> Practicar</Link>
          </div>
        )}
      </div>

      {st === 'locked' && (
        <div className="callout warning" style={{ marginBottom: 16 }}>
          <Icon className="callout-icon" name="lock" />
          <div>
            Para desbloquear este tema primero domina:{' '}
            {missing.map((m, i) => (
              <span key={m}>
                {i > 0 && ', '}
                <Link to={`/habilidad/${m}`}>{SKILL_BY_ID[m].title}</Link>
              </span>
            ))}
            . Si ya sabes estos temas, <Link to="/diagnostico">haz la evaluación diagnóstica</Link> para saltarlos.
          </div>
        </div>
      )}

      {rem.length > 0 && (
        <div className="callout warning" style={{ marginBottom: 16 }}>
          <Icon className="callout-icon" name="target" />
          <div>
            Refuerzo pendiente en <strong>{SKILL_BY_ID[rem[0].skillId].title}</strong> ({rem[0].total - rem[0].remaining}/{rem[0].total}).
            El tema no se da por dominado hasta completarlo. <Link to={`/practica/${id}`}>Hacer el refuerzo</Link>
          </div>
        </div>
      )}

      <div className="grid cols-4">
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="brain" size={16} /> Dominio estimado</span>
            <span className="stat-value">{Math.round(p.pL * 100)}%</span>
            <div className="progress success"><div style={{ width: `${Math.min(100, (p.pL / 0.9) * 100)}%` }} /></div>
            <span className="stat-sub">Se domina al llegar a 90%</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="target" size={16} /> Precisión</span>
            <span className="stat-value">{acc === null ? '—' : `${Math.round(acc * 100)}%`}</span>
            <span className="stat-sub">{p.attempts} ejercicios · {p.correctNoHint} sin pistas</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="clock" size={16} /> Tiempo efectivo</span>
            <span className="stat-value">{formatDuration(p.activeMs)}</span>
            <span className="stat-sub">Rapidez {Math.round(p.speed * 100)}%</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="chart" size={16} /> Nivel actual</span>
            <span className="stat-value">{['', 'Básico', 'Intermedio', 'Avanzado'][nextLevel(data.skills[id])]}</span>
            <span className="stat-sub">{score === null ? 'Sin datos todavía' : `Puntaje del mapa de calor: ${Math.round(score * 100)}%`}</span>
          </div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Idea clave</h3>
          <RichText text={skill.concept} className="concept" />
          <Link to={`/wiki/${id}`} className="small row" style={{ gap: 6, marginTop: 10 }}>
            <Icon name="wiki" size={16} /> Ficha completa en la wiki: fórmulas, ejemplo y errores frecuentes →
          </Link>
        </div>
        <div className="card">
          <h3>Conexiones</h3>
          <div className="small muted" style={{ marginTop: 10 }}>Requisitos</div>
          <div className="row wrap" style={{ marginTop: 6 }}>
            {skill.prereqs.length === 0 && <span className="small faint">Es un punto de partida: no tiene requisitos.</span>}
            {skill.prereqs.map((pid) => (
              <Link key={pid} to={`/habilidad/${pid}`} className={`chip ${states[pid] === 'mastered' ? 'active' : ''}`}>
                <Icon name={states[pid] === 'mastered' ? 'check' : 'lock'} size={13} /> {SKILL_BY_ID[pid].title}
              </Link>
            ))}
          </div>
          <div className="small muted" style={{ marginTop: 14 }}>Desbloquea</div>
          <div className="row wrap" style={{ marginTop: 6 }}>
            {deps.length === 0 && <span className="small faint">Es uno de los temas finales del recorrido.</span>}
            {deps.map((d) => (
              <Link key={d.id} to={`/habilidad/${d.id}`} className="chip">{d.title}</Link>
            ))}
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">
            <h3>Errores recientes en este tema</h3>
            <Link to="/errores">Banco de errores →</Link>
          </div>
          <div className="stack">
            {errors.map((e) => (
              <div key={e.id} className="row between wrap">
                <div className="row" style={{ gap: 8 }}>
                  <span className="badge danger">{errorLabel(e.bug)}</span>
                  <span className="small muted">{new Date(e.t).toLocaleDateString('es')}</span>
                </div>
                {e.bug !== 'other' && <Link className="btn sm ghost" to={`/errores/repasar/${encodeURIComponent(e.bug)}`}>Practicar</Link>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
