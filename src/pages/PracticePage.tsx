// Sesión de práctica adaptativa: práctica de una habilidad, repaso espaciado o repaso de un error.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SKILL_BY_ID } from '../content/curriculum';
import { errorLabel, errorSkill, ERROR_CATALOG } from '../content/errorCatalog';
import { generatorsForBug, makeExercise, randomExercise } from '../content/registry';
import { Rng, randomSeed } from '../content/rng';
import type { Exercise } from '../content/types';
import { ExercisePlayer, type ExerciseOutcome } from '../components/exercise/ExercisePlayer';
import { Icon } from '../components/Icon';
import { RichText } from '../components/Math';
import { dueReviews, isUnlocked, missingPrereqs, nextLevel, pendingRemediationFor, sp, type EngineEvent } from '../learning/engine';
import type { AttemptReason, Remediation } from '../learning/types';
import { formatDuration } from '../learning/metrics';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import type { BugId } from '../math/mutations';

type Mode = 'skill' | 'review' | 'error';

interface Item {
  exercise: Exercise;
  reason: AttemptReason;
  remediation?: Remediation;
}

interface SessionLog {
  outcome: ExerciseOutcome;
  item: Item;
}

const SESSION_SIZE: Record<Mode, number> = { skill: 8, review: 6, error: 5 };

export default function PracticePage({ mode }: { mode: Mode }) {
  const params = useParams();
  const navigate = useNavigate();
  const skillId = mode === 'skill' ? params.id! : undefined;
  const bug = mode === 'error' ? decodeURIComponent(params.bug ?? '') : undefined;
  const record = useProgress((s) => s.record);
  const markErrorReviewed = useProgress((s) => s.markErrorReviewed);
  const toast = useUi((s) => s.toast);
  const [item, setItem] = useState<Item | null>(null);
  const [log, setLog] = useState<SessionLog[]>([]);
  const [done, setDone] = useState(false);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const startP = useRef<number>(skillId ? sp(useProgress.getState(), skillId).pL : 0);
  const startTime = useRef(Date.now());
  const reviewQueue = useRef<string[]>([]);
  const recentGens = useRef<string[]>([]);
  const skill = skillId ? SKILL_BY_ID[skillId] : undefined;

  const pick = useCallback((): Item | null => {
    const data = useProgress.getState();
    const avoid = recentGens.current.slice(-2);
    if (mode === 'skill' && skillId) {
      const rem = pendingRemediationFor(data, skillId)[0];
      if (rem) {
        const ex = randomExercise(rem.skillId, 1, { bug: rem.bug, avoid });
        return { exercise: ex, reason: 'remedial', remediation: rem };
      }
      return { exercise: randomExercise(skillId, nextLevel(data.skills[skillId]), { avoid }), reason: 'practice' };
    }
    if (mode === 'review') {
      if (!reviewQueue.current.length) return null;
      const id = reviewQueue.current.shift()!;
      return { exercise: randomExercise(id, Math.max(2, nextLevel(data.skills[id])), { avoid }), reason: 'review' };
    }
    if (mode === 'error' && bug) {
      const unlocked = generatorsForBug(bug).filter((g) => isUnlocked(data, g.skillId));
      const base = errorSkill(bug);
      const pool = unlocked.length ? unlocked : [];
      if (!pool.length) {
        if (base && isUnlocked(data, base)) return { exercise: randomExercise(base, 1, { avoid }), reason: 'error-review' };
        return null;
      }
      const rng = new Rng(randomSeed());
      const g = rng.pick(pool);
      return { exercise: makeExercise(g.id, randomSeed(), Math.min(2, nextLevel(data.skills[g.skillId]))), reason: 'error-review' };
    }
    return null;
  }, [mode, skillId, bug]);

  useEffect(() => {
    if (mode === 'review') {
      const data = useProgress.getState();
      let due = dueReviews(data);
      if (!due.length) {
        // Sin repasos vencidos: práctica mixta de habilidades dominadas (intercalada)
        due = Object.keys(data.skills).filter((id) => data.skills[id].masteredAt !== undefined || data.skills[id].placed);
      }
      const rng = new Rng(randomSeed());
      reviewQueue.current = rng.shuffle(due).slice(0, SESSION_SIZE.review);
    }
    setLog([]);
    setDone(false);
    setEvents([]);
    startTime.current = Date.now();
    const first = pick();
    setItem(first);
    if (!first) setDone(true);
  }, [mode, skillId, bug, pick]);

  const onResult = (o: ExerciseOutcome) => {
    if (!item) return;
    const ex = item.exercise;
    const answer = ex.answer;
    const evs = record({
      skillId: ex.skillId,
      generatorId: ex.generatorId,
      seed: ex.seed,
      level: ex.difficulty,
      correct: o.correct,
      partial: o.partial,
      hintsUsed: o.hintsUsed,
      activeMs: o.activeMs,
      expectedMs: ex.expectedSeconds * 1000,
      bug: o.bug,
      reason: item.reason,
      answerKind: answer.kind,
      optionsCount: answer.kind === 'choice' || answer.kind === 'multi' ? answer.options.length : undefined,
      remediationId: item.remediation?.id,
      error: o.correct
        ? undefined
        : { exerciseId: ex.id, prompt: ex.prompt, student: o.studentAnswer, message: o.message, line: o.line },
    });
    setLog((l) => [...l, { outcome: o, item }]);
    setEvents((e) => [...e, ...evs]);
    if (o.correct && mode === 'error' && bug) {
      const errs = useProgress.getState().errors.filter((e) => e.bug === bug && !e.reviewed).slice(0, 1);
      errs.forEach((e) => markErrorReviewed(e.id));
    }
    for (const e of evs) {
      if (e.type === 'mastered') toast({ kind: 'success', title: `¡Dominaste «${SKILL_BY_ID[e.skillId]?.title}»!`, body: 'Programamos repasos espaciados para que no se olvide.', icon: 'trophy' }, 6000);
      if (e.type === 'unlocked') toast({ kind: 'info', title: 'Nuevas habilidades desbloqueadas', body: e.skillIds.map((id) => SKILL_BY_ID[id]?.title).join(', '), icon: 'sparkles' }, 6000);
      if (e.type === 'gap') toast({ kind: 'warning', title: `Detectamos un bache en «${SKILL_BY_ID[e.remediation.skillId]?.title}»`, body: `Antes de seguir, ${e.remediation.total} ejercicios cortos de refuerzo.`, icon: 'target' }, 7000);
      if (e.type === 'remediation-done') toast({ kind: 'success', title: 'Refuerzo completado', body: `Ya puedes continuar con «${SKILL_BY_ID[e.remediation.forSkill]?.title}».` });
      if (e.type === 'review' && e.days > 1) toast({ kind: 'info', title: 'Repaso registrado', body: `Próximo repaso en ${e.days} días.`, icon: 'refresh' }, 3000);
      if (e.type === 'lapse') toast({ kind: 'warning', title: 'Conviene volver a practicar este tema', body: 'Lo repasaremos de nuevo mañana.' });
    }
  };

  const next = () => {
    const count = log.length;
    const data = useProgress.getState();
    const remPending = skillId ? pendingRemediationFor(data, skillId).length > 0 : false;
    if (count >= SESSION_SIZE[mode] && !remPending) {
      setDone(true);
      return;
    }
    if (item) recentGens.current.push(item.exercise.generatorId);
    const n = pick();
    if (!n) {
      setDone(true);
      return;
    }
    setItem(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const data = useProgress();

  if (mode === 'skill' && skillId && !skill) {
    return <div className="page"><div className="empty">Habilidad no encontrada. <Link to="/temario">Volver al temario</Link></div></div>;
  }

  if (mode === 'skill' && skillId && !isUnlocked(data, skillId)) {
    const missing = missingPrereqs(data, skillId);
    return (
      <div className="page">
        <div className="card empty">
          <div className="icon-wrap"><Icon name="lock" /></div>
          <h2>«{skill?.title}» todavía está bloqueada</h2>
          <p className="muted" style={{ marginTop: 8 }}>Primero hay que dominar:</p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {missing.map((id) => (
              <Link key={id} to={`/habilidad/${id}`} className="chip">{SKILL_BY_ID[id]?.title}</Link>
            ))}
          </div>
          <div className="row wrap" style={{ justifyContent: 'center', marginTop: 16 }}>
            <Link to="/diagnostico" className="btn outline">Hacer la evaluación diagnóstica</Link>
          </div>
        </div>
      </div>
    );
  }

  const title = mode === 'skill' ? skill?.title : mode === 'review' ? 'Repaso espaciado' : `Repaso: ${errorLabel(bug ?? '')}`;
  const progress = Math.min(1, log.length / SESSION_SIZE[mode]);
  const currentP = skillId ? sp(data, skillId).pL : 0;

  if (done) return <Summary mode={mode} skillId={skillId} bug={bug} log={log} events={events} startP={startP.current} endP={currentP} elapsed={Date.now() - startTime.current} onAgain={() => navigate(0)} />;

  const rem = item?.remediation;
  const banner = rem ? (
    <div className="callout warning" style={{ marginBottom: 14 }}>
      <Icon className="callout-icon" name="target" />
      <div>
        <strong>Refuerzo: {SKILL_BY_ID[rem.skillId]?.title}</strong>
        <div className="small">
          Detectamos un bache {rem.bug ? `(${errorLabel(rem.bug)})` : ''} mientras practicabas «{SKILL_BY_ID[rem.forSkill]?.title}». Completa {rem.remaining} {rem.remaining === 1 ? 'ejercicio correcto' : 'ejercicios correctos'} más para seguir.
        </div>
      </div>
    </div>
  ) : item?.reason === 'review' ? (
    <div className="callout info" style={{ marginBottom: 14 }}>
      <Icon className="callout-icon" name="refresh" />
      <div className="small">Repaso de <strong>{SKILL_BY_ID[item.exercise.skillId]?.title}</strong>: recordar algo justo antes de olvidarlo lo fija en la memoria a largo plazo.</div>
    </div>
  ) : mode === 'error' && bug && ERROR_CATALOG[bug as BugId] ? (
    <div className="callout primary" style={{ marginBottom: 14 }}>
      <Icon className="callout-icon" name="alert" />
      <div className="small"><RichText text={`Practicando para evitar: **${errorLabel(bug)}**. ${ERROR_CATALOG[bug as BugId].tip}`} as="span" /></div>
    </div>
  ) : null;

  return (
    <div className="page">
      <div className="practice-top">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Volver"><Icon name="left" /></button>
        <div style={{ flex: 1 }}>
          <div className="row between">
            <strong>{title}</strong>
            <span className="small muted">{Math.min(log.length + 1, SESSION_SIZE[mode])} / {SESSION_SIZE[mode]}</span>
          </div>
          <div className="progress" style={{ marginTop: 6 }}><div style={{ width: `${progress * 100}%` }} /></div>
        </div>
        {skillId && (
          <div className="mastery-pill" title="Probabilidad estimada de dominio">
            <Icon name="brain" size={16} /> {Math.round(currentP * 100)}%
          </div>
        )}
      </div>
      {item ? (
        <ExercisePlayer key={item.exercise.id} exercise={item.exercise} onResult={onResult} onNext={next} banner={banner} />
      ) : (
        <div className="empty">No hay ejercicios disponibles.</div>
      )}
    </div>
  );
}

function Summary({ mode, skillId, bug, log, events, startP, endP, elapsed, onAgain }: { mode: Mode; skillId?: string; bug?: string; log: SessionLog[]; events: EngineEvent[]; startP: number; endP: number; elapsed: number; onAgain(): void }) {
  const correct = log.filter((l) => l.outcome.correct).length;
  const noHints = log.filter((l) => l.outcome.correct && l.outcome.hintsUsed === 0).length;
  const bugs = log.filter((l) => l.outcome.bug).map((l) => l.outcome.bug!);
  const mastered = events.filter((e) => e.type === 'mastered').map((e) => (e.type === 'mastered' ? e.skillId : ''));
  const unlocked = events.flatMap((e) => (e.type === 'unlocked' ? e.skillIds : []));
  const activeMs = log.reduce((a, l) => a + l.outcome.activeMs, 0);
  const skill = skillId ? SKILL_BY_ID[skillId] : undefined;
  const data = useProgress();

  if (!log.length) {
    return (
      <div className="page">
        <div className="card empty">
          <div className="icon-wrap"><Icon name={mode === 'review' ? 'refresh' : 'check'} /></div>
          <h2>{mode === 'review' ? 'No tienes repasos pendientes' : 'No hay ejercicios para este repaso todavía'}</h2>
          <p className="muted" style={{ marginTop: 8 }}>{mode === 'review' ? 'Domina alguna habilidad y te avisaremos cuando toque repasarla.' : 'Desbloquea los temas relacionados para practicar este error.'}</p>
          <Link to="/" className="btn primary" style={{ marginTop: 12 }}>Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card summary fade-in">
        <div className="center">
          <div className="summary-icon"><Icon name={correct / log.length >= 0.7 ? 'trophy' : 'target'} size={30} /></div>
          <h1>{correct / log.length >= 0.8 ? '¡Excelente sesión!' : correct / log.length >= 0.5 ? '¡Buen trabajo!' : 'Sesión completada'}</h1>
          <p className="muted" style={{ marginTop: 6 }}>{skill ? skill.title : mode === 'review' ? 'Repaso espaciado' : `Repaso de «${errorLabel(bug ?? '')}»`}</p>
        </div>
        <div className="grid cols-4" style={{ marginTop: 20 }}>
          <div className="stat center"><span className="stat-label" style={{ justifyContent: 'center' }}>Correctos</span><span className="stat-value">{correct}/{log.length}</span></div>
          <div className="stat center"><span className="stat-label" style={{ justifyContent: 'center' }}>Sin pistas</span><span className="stat-value">{noHints}</span></div>
          <div className="stat center"><span className="stat-label" style={{ justifyContent: 'center' }}>Tiempo efectivo</span><span className="stat-value">{formatDuration(activeMs || elapsed)}</span></div>
          {skillId ? (
            <div className="stat center"><span className="stat-label" style={{ justifyContent: 'center' }}>Dominio</span><span className="stat-value">{Math.round(startP * 100)}% → {Math.round(endP * 100)}%</span></div>
          ) : (
            <div className="stat center"><span className="stat-label" style={{ justifyContent: 'center' }}>Errores detectados</span><span className="stat-value">{bugs.length}</span></div>
          )}
        </div>
        {mastered.length > 0 && (
          <div className="callout success" style={{ marginTop: 16 }}>
            <Icon className="callout-icon" name="trophy" />
            <div>Dominaste: <strong>{mastered.map((id) => SKILL_BY_ID[id]?.title).join(', ')}</strong>.{unlocked.length > 0 && <> Se desbloqueó: {unlocked.map((id) => SKILL_BY_ID[id]?.title).join(', ')}.</>}</div>
          </div>
        )}
        {bugs.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <h3>Errores detectados en esta sesión</h3>
            <div className="row wrap" style={{ marginTop: 8 }}>
              {[...new Set(bugs)].map((b) => (
                <Link key={b} to={`/errores/repasar/${encodeURIComponent(b)}`} className="chip"><Icon name="alert" size={14} /> {errorLabel(b)}</Link>
              ))}
            </div>
          </div>
        )}
        <div className="row wrap" style={{ marginTop: 22, justifyContent: 'center' }}>
          <button className="btn primary lg" onClick={onAgain}><Icon name="refresh" size={18} /> Otra sesión</button>
          {skillId && unlocked[0] && <Link to={`/leccion/${unlocked[0]}`} className="btn outline lg">Siguiente tema: {SKILL_BY_ID[unlocked[0]]?.title}</Link>}
          <Link to="/temario" className="btn ghost lg">Ver temario</Link>
        </div>
        {skillId && pendingRemediationFor(data, skillId).length > 0 && (
          <div className="small muted center" style={{ marginTop: 10 }}>Queda un refuerzo pendiente: lo retomaremos en la próxima sesión.</div>
        )}
      </div>
    </div>
  );
}
