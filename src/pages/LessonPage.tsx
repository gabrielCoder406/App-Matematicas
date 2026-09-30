// Microlección: bloques cortos que se revelan de a uno (explicación, ejemplo, modelo interactivo, comprobación).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BLOCK_BY_ID, SKILL_BY_ID } from '../content/curriculum';
import { lessonFor } from '../content/lessons';
import { makeExercise } from '../content/registry';
import { randomSeed } from '../content/rng';
import type { LessonSection } from '../content/types';
import { ExercisePlayer, type ExerciseOutcome } from '../components/exercise/ExercisePlayer';
import { Icon } from '../components/Icon';
import { RichText, Tex } from '../components/Math';
import { isUnlocked } from '../learning/engine';
import { useActiveTime } from '../lib/activity';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import { openWiki, useWikiContext } from '../store/wiki';
import { LessonWidget } from '../widgets';

function CheckSection({ generatorId, level, onDone }: { generatorId: string; level?: number; onDone(): void }) {
  const [seed, setSeed] = useState(() => randomSeed());
  const exercise = useMemo(() => makeExercise(generatorId, seed, level ?? 1), [generatorId, seed, level]);
  const record = useProgress((s) => s.record);
  const [finished, setFinished] = useState(false);
  const onResult = (o: ExerciseOutcome) => {
    const a = exercise.answer;
    record({
      skillId: exercise.skillId, generatorId: exercise.generatorId, seed: exercise.seed, level: exercise.difficulty,
      correct: o.correct, partial: o.partial, hintsUsed: o.hintsUsed, activeMs: o.activeMs, expectedMs: exercise.expectedSeconds * 1000,
      bug: o.bug, reason: 'lesson', answerKind: a.kind, optionsCount: a.kind === 'choice' || a.kind === 'multi' ? a.options.length : undefined,
      error: o.correct ? undefined : { exerciseId: exercise.id, prompt: exercise.prompt, student: o.studentAnswer, message: o.message, line: o.line },
    });
  };
  return (
    <div>
      <ExercisePlayer
        exercise={exercise}
        onResult={onResult}
        onNext={() => {
          setFinished(true);
          onDone();
        }}
        nextLabel="Continuar"
        headerExtra={<span className="badge info">Comprobación rápida</span>}
      />
      {finished && (
        <button className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => { setSeed(randomSeed()); setFinished(false); }}>
          <Icon name="refresh" size={15} /> Otro ejercicio parecido
        </button>
      )}
    </div>
  );
}

function Section({ s, onCheckDone }: { s: LessonSection; onCheckDone(): void }) {
  switch (s.type) {
    case 'text':
      return (
        <div className="card lesson-card">
          {s.title && <h3 style={{ marginBottom: 8 }}>{s.title}</h3>}
          <RichText text={s.body} />
        </div>
      );
    case 'example':
      return (
        <div className="card lesson-card example">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="badge primary"><Icon name="book" size={13} /> Ejemplo</span>
            <h3>{s.title}</h3>
          </div>
          <RichText text={s.problem} />
          <div className="example-steps">
            {s.steps.map((st, i) => (
              <div key={i} className="example-step">
                <span className="step-dot">{i + 1}</span>
                <div>
                  {st.math && <Tex tex={st.math} display />}
                  {st.note && <RichText text={st.note} className="small muted" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    case 'widget':
      return (
        <div className="card lesson-card">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="badge info"><Icon name="flask" size={13} /> Modelo interactivo</span>
          </div>
          {s.caption && <RichText text={s.caption} className="small muted" />}
          <div style={{ marginTop: 10 }}>
            <LessonWidget id={s.widget} props={s.props} />
          </div>
        </div>
      );
    case 'tip':
      return (
        <div className="callout warning lesson-tip">
          <Icon className="callout-icon" name="alert" />
          <div>
            <strong>{s.title ?? 'Atención'}</strong>
            <RichText text={s.body} />
          </div>
        </div>
      );
    case 'check':
      return <CheckSection generatorId={s.generatorId} level={s.level} onDone={onCheckDone} />;
    case 'summary':
      return (
        <div className="card lesson-card summary-card">
          <h3>Para recordar</h3>
          <ul className="summary-list">
            {s.points.map((p, i) => (
              <li key={i}><Icon name="check" size={16} stroke={2.4} /> <RichText text={p} as="span" /></li>
            ))}
          </ul>
        </div>
      );
  }
}

export default function LessonPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const skill = SKILL_BY_ID[id];
  const lesson = useMemo(() => lessonFor(id), [id]);
  const [shown, setShown] = useState(1);
  const bottom = useRef<HTMLDivElement>(null);
  const data = useProgress();
  const completeLesson = useProgress((s) => s.completeLesson);
  const toast = useUi((s) => s.toast);
  useActiveTime(id);
  useWikiContext(skill ? id : undefined);

  useEffect(() => setShown(1), [id]);
  useEffect(() => {
    if (shown > 1) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [shown]);

  if (!skill) return <div className="page"><div className="empty">Lección no encontrada. <Link to="/temario">Volver</Link></div></div>;
  const block = BLOCK_BY_ID[skill.block];
  const total = lesson.sections.length;
  const done = shown >= total;
  const current = lesson.sections[shown - 1];
  const waitingCheck = current?.type === 'check';

  const finish = () => {
    completeLesson(id);
    toast({ kind: 'success', title: 'Microlección completada', body: 'Ahora practica para dominar la habilidad.', icon: 'book' });
    navigate(`/practica/${id}`);
  };

  return (
    <div className="page lesson" style={{ ['--h' as string]: String(block.hue) }}>
      <div className="lesson-top">
        <button className="icon-btn" onClick={() => navigate(`/habilidad/${id}`)} aria-label="Volver"><Icon name="left" /></button>
        <div style={{ flex: 1 }}>
          <div className="row between wrap">
            <div className="row" style={{ gap: 8 }}>
              <span className="block-tag">Bloque {block.number}</span>
              <strong>{skill.title}</strong>
            </div>
            <div className="row" style={{ gap: 6 }}>
              <span className="small muted"><Icon name="clock" size={14} /> {lesson.minutes} min</span>
              <button type="button" className="btn sm ghost" onClick={() => openWiki(id)} title="Consultar la ficha del tema en la wiki">
                <Icon name="wiki" size={16} /> <span className="hidden-mobile">Ficha</span>
              </button>
            </div>
          </div>
          <div className="progress" style={{ marginTop: 8 }}><div style={{ width: `${(shown / total) * 100}%` }} /></div>
        </div>
      </div>
      {!isUnlocked(data, id) && (
        <div className="callout info small" style={{ marginBottom: 12 }}>
          <Icon className="callout-icon" name="lock" size={16} />
          Este tema todavía está bloqueado: puedes leer la lección, pero la práctica se habilita al dominar sus requisitos.
        </div>
      )}
      <div className="lesson-intro card">
        <RichText text={lesson.intro} />
      </div>
      <div className="stack lg" style={{ marginTop: 16 }}>
        {lesson.sections.slice(0, shown).map((s, i) => (
          <div key={i} className="fade-in">
            <Section s={s} onCheckDone={() => i === shown - 1 && setShown((n) => Math.min(total, n + 1))} />
          </div>
        ))}
      </div>
      <div ref={bottom} className="lesson-footer">
        {!done ? (
          !waitingCheck && (
            <button className="btn primary lg" onClick={() => setShown((n) => Math.min(total, n + 1))}>
              Continuar <Icon name="right" size={18} />
            </button>
          )
        ) : (
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            <button className="btn primary lg" onClick={finish} disabled={!isUnlocked(data, id)}>
              <Icon name="play" size={18} /> Terminar y practicar
            </button>
            <Link to="/laboratorio" className="btn ghost lg">Explorar el laboratorio</Link>
          </div>
        )}
        {waitingCheck && !done && <div className="small muted center">Resuelve la comprobación para continuar.</div>}
      </div>
    </div>
  );
}
