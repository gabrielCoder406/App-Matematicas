// Evaluación diagnóstica: pocas preguntas elegidas sobre el grafo de habilidades para
// saltar lo que ya se domina y empezar en el nivel real.
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BLOCKS, SKILL_BY_ID } from '../content/curriculum';
import { randomExercise } from '../content/registry';
import type { BlockId, Exercise } from '../content/types';
import { ExercisePlayer } from '../components/exercise/ExercisePlayer';
import { Icon } from '../components/Icon';
import { finalize, isFinished, nextProbe, recordProbe, skillsInBlocks, startDiagnostic, type DiagnosticState } from '../learning/diagnostic';
import { useProgress } from '../store/progress';
import { useUi } from '../store/ui';

type Phase = 'intro' | 'test' | 'done';

export default function Diagnostic() {
  const navigate = useNavigate();
  const placement = useProgress((s) => s.placement);
  const toast = useUi((s) => s.toast);
  const [phase, setPhase] = useState<Phase>('intro');
  const [blocks, setBlocks] = useState<BlockId[]>(BLOCKS.map((b) => b.id));
  const [st, setSt] = useState<DiagnosticState | null>(null);
  const [current, setCurrent] = useState<{ skillId: string; exercise: Exercise } | null>(null);

  const ask = (state: DiagnosticState) => {
    const next = nextProbe(state);
    if (!next || isFinished(state)) {
      setCurrent(null);
      setPhase('done');
      return;
    }
    setCurrent({ skillId: next, exercise: randomExercise(next, 2) });
  };

  const begin = () => {
    const s = startDiagnostic(blocks);
    setSt(s);
    setPhase('test');
    ask(s);
  };

  const summary = useMemo(() => (st && phase === 'done' ? finalize(st) : null), [st, phase]);

  const toggle = (id: BlockId) => setBlocks((bs) => (bs.includes(id) ? bs.filter((b) => b !== id) : [...bs, id]));

  if (phase === 'intro') {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>Evaluación diagnóstica</h1>
            <p>Unas pocas preguntas para saltar los temas que ya dominas y empezar donde realmente estás.</p>
          </div>
        </div>
        <div className="card stack" style={{ maxWidth: 760 }}>
          <div className="callout info small">
            <Icon className="callout-icon" name="bulb" size={16} />
            <div>
              Cada respuesta correcta da por sabidos ese tema y sus requisitos; cada error marca ese tema y los que dependen de él para practicarlos. Son como máximo 18 preguntas y no hay pistas.
              Si no sabes una, elige «No lo sé»: adivinar solo te haría saltar temas que conviene practicar.
            </div>
          </div>
          <div>
            <div className="label">Bloques a evaluar</div>
            <div className="row wrap" style={{ gap: 6 }}>
              {BLOCKS.map((b) => (
                <button key={b.id} className={`chip ${blocks.includes(b.id) ? 'active' : ''}`} onClick={() => toggle(b.id)}>
                  {blocks.includes(b.id) && <Icon name="check" size={13} />} {b.number}. {b.short}
                </button>
              ))}
            </div>
            <div className="tiny faint" style={{ marginTop: 6 }}>{skillsInBlocks(blocks)} temas seleccionados</div>
          </div>
          <div className="row">
            <Link to="/" className="btn ghost">Ahora no</Link>
            <span className="spacer" />
            <button className="btn primary lg" disabled={!blocks.length} onClick={begin}>
              <Icon name="play" size={18} /> Empezar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'test' && st && current) {
    const asked = st.asked.length;
    return (
      <div className="page">
        <div className="practice-top">
          <button className="icon-btn" onClick={() => setPhase('done')} title="Terminar ahora"><Icon name="x" /></button>
          <div style={{ flex: 1 }}>
            <div className="progress"><div style={{ width: `${Math.min(100, (asked / st.maxQuestions) * 100)}%` }} /></div>
          </div>
          <span className="small muted nowrap">Pregunta {asked + 1} de hasta {st.maxQuestions}</span>
        </div>
        <ExercisePlayer
          key={current.exercise.id}
          exercise={current.exercise}
          mode="diagnostic"
          nextLabel={isFinished(st) ? 'Ver resultado' : 'Siguiente pregunta'}
          onResult={(o) => setSt((s) => (s ? recordProbe(s, current.skillId, o.correct) : s))}
          onNext={() => st && ask(st)}
        />
      </div>
    );
  }

  const known = summary?.known ?? [];
  const weak = summary?.weak ?? [];
  const pending = summary?.undetermined ?? [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Resultado del diagnóstico</h1>
          <p>{st ? `${st.asked.length} preguntas respondidas.` : ''}</p>
        </div>
      </div>
      <div className="grid cols-3" style={{ marginBottom: 16 }}>
        <div className="card stat"><span className="stat-label">Dominados</span><span className="stat-value">{known.length}</span><span className="stat-sub">se saltan y quedan para repaso</span></div>
        <div className="card stat"><span className="stat-label">Para practicar</span><span className="stat-value">{weak.length}</span><span className="stat-sub">empiezan en nivel básico</span></div>
        <div className="card stat"><span className="stat-label">Sin evaluar</span><span className="stat-value">{pending.length}</span><span className="stat-sub">se desbloquean con normalidad</span></div>
      </div>
      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <h3>Ya dominas</h3>
          {known.length ? (
            <ul className="summary-list">{known.map((id) => <li key={id}><Icon name="check" size={16} style={{ color: 'var(--success)' }} /> {SKILL_BY_ID[id]?.title}</li>)}</ul>
          ) : <p className="small muted">Ningún tema por ahora: empezarás desde el principio.</p>}
        </div>
        <div className="card">
          <h3>Conviene practicar</h3>
          {weak.length ? (
            <ul className="summary-list">{weak.map((id) => <li key={id}><Icon name="target" size={16} style={{ color: 'var(--warning)' }} /> {SKILL_BY_ID[id]?.title}</li>)}</ul>
          ) : <p className="small muted">Nada marcado.</p>}
        </div>
      </div>
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn ghost" onClick={() => { setPhase('intro'); setSt(null); }}>Repetir</button>
        <span className="spacer" />
        <button
          className="btn primary lg"
          onClick={() => {
            placement(known, weak);
            toast({ kind: 'success', title: 'Nivel ajustado', body: `${known.length} temas marcados como dominados.` });
            navigate('/temario');
          }}
        >
          <Icon name="check" size={18} /> Aplicar y ver el temario
        </button>
      </div>
    </div>
  );
}
