// Explicación del tutor (DeepSeek Math, en el propio PC): el texto aparece a medida que se genera.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askTutor, type TutorRequest } from '../lib/api';
import { IS_PHONE } from '../lib/platform';
import { Icon } from './Icon';
import { RichText } from './Math';

/** El modelo escribe fórmulas como \( … \) o \[ … \]; RichText usa $…$ y $$…$$. */
export function tutorText(t: string): string {
  return t
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, x: string) => `$$${x}$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_m, x: string) => `$${x}$`);
}

type State = 'thinking' | 'writing' | 'done' | 'stopped' | 'error';

export function TutorPanel({ request, onClose }: { request: TutorRequest; onClose(): void }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<State>('thinking');
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const ctrl = useRef<AbortController | null>(null);
  const requestRef = useRef(request);
  requestRef.current = request;

  useEffect(() => {
    const c = new AbortController();
    ctrl.current = c;
    setText('');
    setError(null);
    setState('thinking');
    askTutor(
      requestRef.current,
      (t) => {
        setText((s) => s + t);
        setState('writing');
      },
      c.signal,
    )
      .then(() => {
        if (!c.signal.aborted) setState('done');
      })
      .catch((e: Error) => {
        if (c.signal.aborted) return;
        setError(e.message);
        setState('error');
      });
    return () => c.abort();
  }, [run]);

  const busy = state === 'thinking' || state === 'writing';

  return (
    <div className="tutor fade-in" aria-live="polite">
      <div className="tutor-head">
        <span className="tutor-badge"><Icon name="brain" size={15} /> Tutor · DeepSeek Math</span>
        <span className="spacer" />
        {busy ? (
          <button type="button" className="btn sm ghost" onClick={() => { ctrl.current?.abort(); setState('stopped'); }}>
            Detener
          </button>
        ) : (
          <button type="button" className="btn sm ghost" onClick={() => setRun((r) => r + 1)}>
            <Icon name="refresh" size={15} /> Otra explicación
          </button>
        )}
        <button type="button" className="icon-btn" onClick={() => { ctrl.current?.abort(); onClose(); }} aria-label="Cerrar"><Icon name="x" size={18} /></button>
      </div>
      {state === 'thinking' && (
        <div className="row small muted" style={{ gap: 10 }}>
          <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          Pensando… La IA corre en {IS_PHONE ? 'el PC' : 'este equipo'}: puede tardar hasta un minuto y el texto aparece a medida que se escribe.
        </div>
      )}
      {text && <RichText text={tutorText(text)} className="tutor-text" />}
      {error && (
        <div className="callout danger small">
          <Icon className="callout-icon" name="alert" size={16} />
          <div>{error} {IS_PHONE ? <Link to="/pc">Ver la conexión con el PC</Link> : <Link to="/ajustes">Ir a Ajustes</Link>}</div>
        </div>
      )}
      <div className="tiny faint">
        {state === 'stopped' ? 'Detenido. ' : ''}Respuesta generada por una IA en el PC: puede equivocarse. La corrección de la app es la referencia.
      </div>
    </div>
  );
}
