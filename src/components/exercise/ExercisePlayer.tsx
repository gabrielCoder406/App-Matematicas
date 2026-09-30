// Reproductor de ejercicios: respuesta (directa, paso a paso o a mano), pistas en 3 niveles,
// verificación con diagnóstico del error y solución desarrollada.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { checkAnswer, checkSteps, truthTableConnectiveError, type FullCheckResult } from '../../content/check';
import { errorLabel, ERROR_CATALOG } from '../../content/errorCatalog';
import { SKILL_BY_ID } from '../../content/curriculum';
import type { Exercise } from '../../content/types';
import { useActiveTime } from '../../lib/activity';
import type { BugId } from '../../math/mutations';
import { Icon } from '../Icon';
import { RichText, Tex } from '../Math';
import { Visual } from '../visuals/Visual';
import { HandwritingPanel } from '../../canvas/HandwritingPanel';
import { pairing } from '../../canvas/pairing';
import type { TutorRequest } from '../../lib/api';
import { useUi } from '../../store/ui';
import { openWiki, useWikiContext } from '../../store/wiki';
import { TutorPanel } from '../TutorPanel';
import { AnswerInput, initialAnswer, isTextKind, toAnswerInput, type AnswerState } from './AnswerInput';
import { StepEditor } from './StepEditor';

export interface ExerciseOutcome {
  correct: boolean;
  partial: boolean;
  hintsUsed: number;
  activeMs: number;
  bug?: string;
  studentAnswer: string;
  message: string;
  line?: number;
  gaveUp?: boolean;
}

interface Props {
  exercise: Exercise;
  onResult(o: ExerciseOutcome): void;
  onNext(): void;
  mode?: 'practice' | 'diagnostic';
  banner?: ReactNode;
  nextLabel?: string;
  headerExtra?: ReactNode;
}

function summarize(ex: Exercise, s: AnswerState, lines: string[] | null): string {
  if (lines) return lines.filter(Boolean).join('  ⟶  ');
  const a = ex.answer;
  switch (a.kind) {
    case 'choice': return s.choice !== null ? a.options[s.choice] : '';
    case 'multi': return s.multi.map((i) => a.options[i]).join(' | ');
    case 'truefalse': return s.bool === null ? '' : s.bool ? 'Verdadero' : 'Falso';
    case 'truth-table': return '(tabla de verdad)';
    case 'vector': return `(${s.cells.join('; ')})`;
    case 'matrix': return s.grid.map((r) => r.join(' ')).join(' / ');
    case 'venn': return `Regiones: ${s.regions.map((r) => r || 'fuera').join(', ')}`;
    case 'solutions': return s.none ? '∅' : s.text;
    default: return s.text;
  }
}

let preferHandwriting = false;

export function ExercisePlayer({ exercise, onResult, onNext, mode = 'practice', banner, nextLabel, headerExtra }: Props) {
  const [answer, setAnswer] = useState<AnswerState>(() => initialAnswer(exercise.answer));
  const [stepsMode, setStepsMode] = useState(false);
  const [lines, setLines] = useState<string[]>(['']);
  const [hints, setHints] = useState(0);
  const [feedback, setFeedback] = useState<FullCheckResult | null>(null);
  const [recorded, setRecorded] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  // El modo «a mano» se mantiene entre ejercicios (cómodo al responder desde el móvil).
  const [handwriting, setHandwritingState] = useState(() => preferHandwriting);
  const setHandwriting = (v: boolean | ((h: boolean) => boolean)) =>
    setHandwritingState((h) => {
      const next = typeof v === 'function' ? v(h) : v;
      preferHandwriting = next;
      return next;
    });
  const [checking, setChecking] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const tutorAvailable = useUi((s) => s.tutorAvailable);
  const hintsAtFirst = useRef(0);
  const timer = useActiveTime(exercise.skillId);
  const skill = SKILL_BY_ID[exercise.skillId];
  const diag = mode === 'diagnostic';
  useWikiContext(diag ? undefined : exercise.skillId);

  useEffect(() => {
    setAnswer(initialAnswer(exercise.answer));
    setStepsMode(false);
    setLines(['']);
    setHints(0);
    setFeedback(null);
    setRecorded(false);
    setSolved(false);
    setShowSolution(false);
    setTutorOpen(false);
    setChecking(false);
    timer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const finished = solved || (diag && recorded);

  const record = (res: FullCheckResult, extra: Partial<ExerciseOutcome> = {}) => {
    if (recorded) return;
    setRecorded(true);
    hintsAtFirst.current = hints;
    let bug = res.bug as string | undefined;
    if (!res.correct && !bug && exercise.answer.kind === 'truth-table') {
      const input = toAnswerInput(exercise.answer, answer);
      if (input) bug = truthTableConnectiveError(exercise.answer, input) ?? undefined;
    }
    if (!res.correct && !bug && res.partial && exercise.answer.kind === 'numeric') bug = 'form.not-simplified';
    if (!res.correct && !bug && res.partial && exercise.answer.kind === 'expression') {
      const f = exercise.answer.form;
      bug = f === 'factored' ? 'form.not-factored' : f === 'expanded' ? 'form.not-expanded' : undefined;
    }
    const badLine = res.lines?.find((l) => l.status === 'error' || l.status === 'parse-error');
    onResult({
      correct: res.correct,
      partial: !!res.partial,
      hintsUsed: hints,
      activeMs: timer.ms,
      bug,
      studentAnswer: summarize(exercise, answer, stepsMode ? lines : null),
      message: res.message,
      line: badLine ? badLine.index + 1 : undefined,
      ...extra,
    });
  };

  const check = () => {
    if (finished || checking) return;
    let res: FullCheckResult;
    if (stepsMode && exercise.steps) {
      if (!lines.some((l) => l.trim())) {
        setFeedback({ correct: false, message: 'Escribe al menos un paso.' });
        return;
      }
      setChecking(true);
      res = checkSteps(exercise.steps, exercise.answer, lines);
      setChecking(false);
    } else {
      const input = toAnswerInput(exercise.answer, answer);
      if (!input) {
        setFeedback({ correct: false, message: 'Completa tu respuesta antes de comprobar.' });
        return;
      }
      res = checkAnswer(exercise.answer, input);
    }
    setFeedback(res);
    if (res.parseError) return;
    if (res.correct) {
      record(res);
      setSolved(true);
      return;
    }
    if (diag) {
      record(res);
      return;
    }
    // Una respuesta parcial (valor correcto, forma incompleta) no cuenta como intento fallido
    if (res.partial && !recorded) return;
    record(res);
  };

  const giveUp = () => {
    if (!recorded) record({ correct: false, message: 'Solución consultada' }, { gaveUp: true });
    setSolved(true);
    setShowSolution(true);
  };

  const revealHint = () => setHints((h) => Math.min(3, h + 1));

  const status = feedback ? (feedback.correct ? 'ok' : feedback.partial ? 'warning' : feedback.parseError ? null : 'error') : null;

  const canSteps = !!exercise.steps && !diag;
  const canHandwrite = isTextKind(exercise.answer) || !!exercise.steps;

  const onRecognized = (recognized: string[]) => {
    if (!recognized.length) return;
    if (canSteps && (recognized.length > 1 || stepsMode)) {
      setStepsMode(true);
      setLines(recognized);
    } else {
      setAnswer((a) => ({ ...a, text: recognized[recognized.length - 1], none: false }));
    }
  };

  // Móvil emparejado: sin tablero abierto, su botón abre la escritura a mano o pasa al siguiente ejercicio.
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;
  useEffect(() => {
    if (finished) return pairing.setOpener({ title: 'Ejercicio terminado', label: nextLabel ?? 'Siguiente ejercicio', open: () => onNextRef.current() });
    if (canHandwrite) return pairing.setOpener({ title: 'Hay un ejercicio abierto en el PC', label: 'Responder este ejercicio a mano', open: () => setHandwriting(true) });
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, canHandwrite, nextLabel]);

  useEffect(() => {
    if (!feedback) return;
    const message = diag && !feedback.parseError ? (feedback.correct ? '¡Correcto!' : 'Respuesta registrada.') : feedback.message;
    pairing.send({ type: 'feedback', correct: feedback.correct, partial: !!feedback.partial, message });
  }, [feedback, diag]);

  const bugInfo = feedback?.bug ? ERROR_CATALOG[feedback.bug as BugId] : undefined;

  /** Contexto para el tutor: el diagnóstico del motor y, si ya se vio o se resolvió, la solución. */
  const tutorRequest = (): TutorRequest => ({
    prompt: exercise.prompt,
    answer: summarize(exercise, answer, stepsMode ? lines : null),
    correct: feedback?.correct,
    feedback: feedback?.message,
    error: feedback?.bug ? errorLabel(feedback.bug) : undefined,
    tip: bugInfo?.tip,
    solution: solved || showSolution ? exercise.solution.map((s) => [s.math && `$${s.math}$`, s.note].filter(Boolean).join(' — ')) : undefined,
  });

  const levelLabel = useMemo(() => ['', 'Básico', 'Intermedio', 'Avanzado'][exercise.difficulty] ?? '', [exercise.difficulty]);

  return (
    <div className="exercise card fade-in" onKeyDown={(e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) check();
    }}>
      {banner}
      <div className="exercise-head">
        <div className="row wrap" style={{ gap: 8 }}>
          {skill && <span className="badge">{skill.title}</span>}
          {!diag && <span className="badge primary">{levelLabel}</span>}
          {headerExtra}
        </div>
        <div className="row" style={{ gap: 4 }}>
          {!diag && (
            <button type="button" className="btn sm ghost" onClick={() => openWiki(exercise.skillId)} title="Consultar la ficha del tema en la wiki sin salir del ejercicio">
              <Icon name="wiki" size={16} /> <span className="hidden-mobile">Ficha</span>
            </button>
          )}
          {canHandwrite && !finished && (
            <button type="button" className={`btn sm ${handwriting ? 'primary' : 'ghost'}`} onClick={() => setHandwriting((h) => !h)} title="Escribir a mano (o desde el móvil)">
              <Icon name="pen" size={16} /> <span className="hidden-mobile">A mano</span>
            </button>
          )}
          {canSteps && !finished && (
            <button type="button" className={`btn sm ${stepsMode ? 'primary' : 'ghost'}`} onClick={() => setStepsMode((s) => !s)} title="Resolver paso a paso con validación línea por línea">
              <Icon name="steps" size={16} /> <span className="hidden-mobile">Paso a paso</span>
            </button>
          )}
        </div>
      </div>

      <div className="exercise-prompt">
        <RichText text={exercise.prompt} />
      </div>

      {exercise.visual && (
        <div className="exercise-visual">
          <Visual spec={exercise.visual} />
        </div>
      )}

      {handwriting && !finished && (
        <HandwritingPanel
          onRecognized={onRecognized}
          prompt={exercise.prompt}
          topic={diag ? undefined : exercise.skillId}
          onSubmit={check}
          hint={stepsMode || canSteps ? 'Escribe un paso por renglón. Al reconocer, cada renglón se convierte en una línea validada.' : 'Escribe tu respuesta y presiona «Reconocer».'}
        />
      )}

      <div className="exercise-answer">
        {stepsMode && exercise.steps ? (
          <StepEditor steps={exercise.steps} lines={lines} onChange={setLines} onSubmit={check} disabled={finished} results={feedback?.lines ?? null} />
        ) : (
          <AnswerInput
            spec={exercise.answer}
            state={answer}
            onChange={setAnswer}
            onSubmit={check}
            disabled={finished}
            wrongCells={feedback?.wrongCells}
            status={status}
            autoFocus={!handwriting}
          />
        )}
      </div>

      {feedback && (
        <div className={`callout ${feedback.correct ? 'success' : feedback.partial ? 'warning' : feedback.parseError ? 'info' : 'danger'} feedback fade-in`}>
          <Icon className="callout-icon" name={feedback.correct ? 'check' : feedback.partial ? 'alert' : feedback.parseError ? 'keyboard' : 'x'} />
          <div style={{ flex: 1 }}>
            {!diag && feedback.bug && (
              <div style={{ marginBottom: 4 }}>
                <span className="badge danger">Error detectado: {errorLabel(feedback.bug)}</span>
              </div>
            )}
            <RichText text={diag && !feedback.parseError ? (feedback.correct ? '¡Correcto!' : 'Respuesta registrada.') : feedback.message} />
            {!diag && bugInfo && !feedback.correct && (
              <div className="small muted" style={{ marginTop: 4 }}>
                <RichText text={`Recordatorio: ${bugInfo.tip}`} as="span" />{' '}
                <button type="button" className="link-btn" onClick={() => openWiki(bugInfo.skill)}>
                  Repasar en la wiki
                </button>
              </div>
            )}
            {!diag && recorded && !feedback.correct && !solved && (
              <div className="small muted" style={{ marginTop: 6 }}>Puedes corregir tu respuesta y volver a comprobar, pedir una pista o ver la solución.</div>
            )}
          </div>
          {!diag && tutorAvailable && !feedback.parseError && !tutorOpen && (
            <button type="button" className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setTutorOpen(true)} title="Explicación del tutor con IA (DeepSeek Math, en tu PC)">
              <Icon name="brain" size={16} /> Explícame
            </button>
          )}
        </div>
      )}

      {tutorOpen && feedback && <TutorPanel request={tutorRequest()} onClose={() => setTutorOpen(false)} />}

      {!diag && hints > 0 && (
        <div className="hints">
          {exercise.hints.slice(0, hints).map((h, i) => (
            <div key={i} className={`hint level-${i + 1} fade-in`}>
              <div className="hint-title">
                <Icon name="bulb" size={16} />
                {['Recordatorio', 'Siguiente paso', 'Paso desarrollado'][i]}
              </div>
              <RichText text={h} />
            </div>
          ))}
        </div>
      )}

      {(showSolution || (solved && feedback?.correct)) && exercise.solution.length > 0 && (
        <details className="solution" open={showSolution}>
          <summary>
            <Icon name="book" size={16} /> Solución desarrollada
          </summary>
          <div className="solution-steps">
            {exercise.solution.map((s, i) => (
              <div key={i} className="solution-step">
                {s.math && <Tex tex={s.math} display />}
                {s.note && <RichText text={s.note} className="muted small" />}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="exercise-actions">
        {!finished ? (
          <>
            {!diag && (
              <button type="button" className="btn ghost" onClick={revealHint} disabled={hints >= 3}>
                <Icon name="bulb" size={18} /> {hints === 0 ? 'Pista' : hints < 3 ? `Otra pista (${hints}/3)` : 'Sin más pistas'}
              </button>
            )}
            {!diag && (recorded || hints >= 2) && (
              <button type="button" className="btn ghost" onClick={giveUp}>
                <Icon name="eye" size={18} /> Ver solución
              </button>
            )}
            {diag && (
              <button type="button" className="btn ghost" onClick={() => { record({ correct: false, message: 'No lo sé' }, { gaveUp: true }); }}>
                No lo sé
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn primary lg" onClick={check} disabled={checking}>
              <Icon name="check" size={18} /> Comprobar
            </button>
          </>
        ) : (
          <>
            {!diag && !showSolution && exercise.solution.length > 0 && !feedback?.correct && (
              <button type="button" className="btn ghost" onClick={() => setShowSolution(true)}>
                <Icon name="eye" size={18} /> Ver solución
              </button>
            )}
            <span className="spacer" />
            <button type="button" className="btn primary lg" onClick={onNext} autoFocus>
              {nextLabel ?? 'Siguiente'} <Icon name="right" size={18} />
            </button>
          </>
        )}
      </div>
      {!diag && hintsAtFirst.current === 0 && hints > 0 && !recorded && (
        <div className="tiny faint" style={{ marginTop: 8 }}>Usar pistas está bien: el sistema ajusta la dificultad según cuánta ayuda necesitaste.</div>
      )}
    </div>
  );
}
