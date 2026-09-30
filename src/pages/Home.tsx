import { Link, useNavigate } from 'react-router-dom';
import { BLOCKS, SKILL_BY_ID, skillsOfBlock } from '../content/curriculum';
import { errorLabel } from '../content/errorCatalog';
import { Icon } from '../components/Icon';
import { allStates, dueReviews, recommendNext } from '../learning/engine';
import { formatDuration, streak, totals } from '../learning/metrics';
import { useProgress } from '../store/progress';

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}

export default function Home() {
  const data = useProgress();
  const navigate = useNavigate();
  const rec = recommendNext(data);
  const states = allStates(data);
  const st = streak(data);
  const today = totals(data, 1);
  const week = totals(data, 7);
  const due = dueReviews(data);
  const goalMs = data.settings.dailyGoalMinutes * 60000;
  const pending = data.remediation.filter((r) => r.remaining > 0);
  const mastered = Object.values(states).filter((s) => s === 'mastered').length;

  const bugCounts = new Map<string, number>();
  for (const e of data.errors.slice(-200)) bugCounts.set(e.bug, (bugCounts.get(e.bug) ?? 0) + 1);
  const topBugs = [...bugCounts.entries()].filter(([b]) => b !== 'other').sort((a, b) => b[1] - a[1]).slice(0, 3);

  const recSkill = rec ? SKILL_BY_ID[rec.skillId] : null;
  const recText = !rec
    ? { title: '¡Completaste todo el temario!', sub: 'Sigue repasando para mantener el dominio.', cta: 'Ver temario', to: '/temario' }
    : rec.kind === 'remedial'
      ? { title: `Refuerzo: ${SKILL_BY_ID[rec.remediation!.skillId].title}`, sub: `Detectamos un bache mientras practicabas «${recSkill?.title}». ${rec.remediation!.remaining} ejercicios cortos antes de seguir.`, cta: 'Hacer el refuerzo', to: `/practica/${rec.skillId}` }
      : rec.kind === 'review'
        ? { title: 'Repaso del día', sub: `Toca repasar ${due.length} ${due.length === 1 ? 'tema' : 'temas'} para no olvidarlos.`, cta: 'Empezar repaso', to: '/repaso' }
        : rec.kind === 'continue'
          ? { title: `Continuar: ${recSkill?.title}`, sub: recSkill?.summary ?? '', cta: 'Seguir practicando', to: `/practica/${rec.skillId}` }
          : { title: `Nuevo tema: ${recSkill?.title}`, sub: recSkill?.summary ?? '', cta: 'Empezar la lección', to: `/leccion/${rec.skillId}` };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            {greeting()}
            {data.profileName ? `, ${data.profileName}` : ''} 👋
          </h1>
          <p>
            {mastered} de {Object.keys(states).length} habilidades dominadas · {formatDuration(week.activeMs)} de estudio efectivo esta semana
          </p>
        </div>
        <Link to="/pizarra" className="btn outline">
          <Icon name="pen" size={18} /> Abrir pizarra
        </Link>
      </div>

      <div className="hero-card card" style={{ ['--h' as string]: recSkill ? String(BLOCKS.find((b) => b.id === recSkill.block)?.hue ?? 250) : '250' }}>
        <div className="hero-body">
          <span className="badge primary">
            <Icon name={rec?.kind === 'remedial' ? 'target' : rec?.kind === 'review' ? 'refresh' : 'sparkles'} size={14} />
            {rec?.kind === 'remedial' ? 'Refuerzo recomendado' : rec?.kind === 'review' ? 'Repetición espaciada' : 'Tu próximo paso'}
          </span>
          <h2 style={{ marginTop: 10 }}>{recText.title}</h2>
          <p className="muted" style={{ marginTop: 6 }}>{recText.sub}</p>
          <div className="row wrap" style={{ marginTop: 14 }}>
            <button className="btn primary lg" onClick={() => navigate(recText.to)}>
              <Icon name="play" size={18} /> {recText.cta}
            </button>
            {rec && rec.kind !== 'review' && (
              <Link className="btn ghost" to={`/habilidad/${rec.skillId}`}>
                Ver detalle
              </Link>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <svg viewBox="0 0 200 140" width="100%" height="100%">
            <defs>
              <linearGradient id="hg" x1="0" x2="1">
                <stop offset="0" stopColor="hsl(var(--h) 80% 60%)" />
                <stop offset="1" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <path d="M10 120 C 50 20, 90 20, 110 70 S 170 120, 190 30" fill="none" stroke="url(#hg)" strokeWidth="5" strokeLinecap="round" />
            <circle cx="110" cy="70" r="7" fill="var(--surface)" stroke="url(#hg)" strokeWidth="4" />
            <text x="20" y="40" fontSize="22" fill="hsl(var(--h) 60% 55%)" fontFamily="serif" fontStyle="italic">f(x)</text>
          </svg>
        </div>
      </div>

      <div className="grid cols-4" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="fire" size={16} style={{ color: '#f07a2a' }} /> Racha</span>
            <span className="stat-value">{st.current} {st.current === 1 ? 'día' : 'días'}</span>
            <span className="stat-sub">{st.activeToday ? '¡Hoy ya sumaste!' : 'Practica hoy para mantenerla'} · récord {st.best}</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="clock" size={16} /> Tiempo efectivo hoy</span>
            <span className="stat-value">{formatDuration(today.activeMs)}</span>
            <div className="progress" style={{ marginTop: 4 }}>
              <div style={{ width: `${Math.min(100, (today.activeMs / goalMs) * 100)}%` }} />
            </div>
            <span className="stat-sub">Meta diaria: {data.settings.dailyGoalMinutes} min</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="check" size={16} /> Ejercicios hoy</span>
            <span className="stat-value">{today.exercises}</span>
            <span className="stat-sub">{week.exercises} en los últimos 7 días</span>
          </div>
        </div>
        <div className="card">
          <div className="stat">
            <span className="stat-label"><Icon name="target" size={16} /> Aciertos sin pistas</span>
            <span className="stat-value">{week.exercises ? `${Math.round(week.accuracyNoHint * 100)}%` : '—'}</span>
            <span className="stat-sub">Últimos 7 días</span>
          </div>
        </div>
      </div>

      {(pending.length > 0 || due.length > 0) && (
        <div className="grid cols-2" style={{ marginTop: 16 }}>
          {pending.length > 0 && (
            <div className="card">
              <div className="card-title">
                <h3>Refuerzos pendientes</h3>
                <span className="badge warning">{pending.length}</span>
              </div>
              <div className="stack">
                {pending.map((r) => (
                  <div key={r.id} className="row between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{SKILL_BY_ID[r.skillId]?.title}</div>
                      <div className="small muted">
                        Detectado en «{SKILL_BY_ID[r.forSkill]?.title}»{r.bug ? ` · ${errorLabel(r.bug)}` : ''}
                      </div>
                    </div>
                    <Link className="btn sm" to={`/practica/${r.forSkill}`}>
                      {r.total - r.remaining}/{r.total}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          {due.length > 0 && (
            <div className="card">
              <div className="card-title">
                <h3>Repaso espaciado</h3>
                <span className="badge warning">{due.length}</span>
              </div>
              <p className="muted small">Repasar justo antes de olvidar fija lo aprendido a largo plazo.</p>
              <div className="row wrap" style={{ gap: 6 }}>
                {due.slice(0, 6).map((id) => (
                  <span key={id} className="chip">{SKILL_BY_ID[id]?.title}</span>
                ))}
              </div>
              <Link to="/repaso" className="btn primary sm" style={{ marginTop: 12 }}>
                <Icon name="refresh" size={16} /> Repasar ahora
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="section-title">
        <h2>Bloques del temario</h2>
        <Link to="/temario">Ver mapa de habilidades →</Link>
      </div>
      <div className="grid auto">
        {BLOCKS.map((b) => {
          const skills = skillsOfBlock(b.id);
          const m = skills.filter((s) => states[s.id] === 'mastered').length;
          const inProg = skills.filter((s) => states[s.id] === 'in-progress').length;
          const avail = skills.filter((s) => states[s.id] !== 'locked').length;
          return (
            <Link key={b.id} to={`/temario?bloque=${b.id}`} className="card hover block-card" style={{ ['--h' as string]: String(b.hue) }}>
              <div className="row between">
                <span className="block-tag">Bloque {b.number}</span>
                {avail === 0 && <Icon name="lock" size={16} className="faint" />}
              </div>
              <h3 style={{ marginTop: 10 }}>{b.title}</h3>
              <p className="small muted" style={{ marginTop: 6, minHeight: 42 }}>{b.description}</p>
              <div className="progress" style={{ marginTop: 10 }}>
                <div style={{ width: `${(m / skills.length) * 100}%`, background: `hsl(${b.hue} 70% 52%)` }} />
              </div>
              <div className="row between tiny faint" style={{ marginTop: 6 }}>
                <span>{m}/{skills.length} dominadas</span>
                {inProg > 0 && <span>{inProg} en curso</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {topBugs.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">
            <h3>Tus errores más frecuentes</h3>
            <Link to="/errores">Ver banco de errores →</Link>
          </div>
          <div className="row wrap">
            {topBugs.map(([bug, c]) => (
              <Link key={bug} className="chip" to={`/errores/repasar/${encodeURIComponent(bug)}`}>
                <Icon name="alert" size={14} /> {errorLabel(bug)} · {c}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
