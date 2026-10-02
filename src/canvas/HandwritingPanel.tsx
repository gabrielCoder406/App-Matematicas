// Panel de escritura a mano dentro de un ejercicio: lienzo + OCR + móvil emparejado.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { RichText } from '../components/Math';
import { recognize } from '../lib/api';
import { IS_PHONE } from '../lib/platform';
import { useBackHandler, useKeepAwake, useLandscape } from '../phone/native';
import { useUi } from '../store/ui';
import { InkModel } from './ink';
import { InkCanvas, type CanvasTool, type InkCanvasHandle } from './InkCanvas';
import { InkToolbar } from './InkToolbar';
import { PairingDialog } from './PairingDialog';
import { pairing } from './pairing';

const BOARD_W = 1600;
const BOARD_H = 640;

interface Props {
  onRecognized(lines: string[]): void;
  hint?: string;
  /** Enunciado que se muestra en el móvil emparejado. */
  prompt?: string;
  /** Tema del ejercicio, para que la wiki del móvil sugiera su ficha. */
  topic?: string;
  /** «Comprobar» pedido desde el móvil. */
  onSubmit?(): void;
}

export function HandwritingPanel({ onRecognized, hint, prompt, topic, onSubmit }: Props) {
  const model = useMemo(() => new InkModel(), []);
  const canvasRef = useRef<InkCanvasHandle>(null);
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState('ink');
  const [size, setSize] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairOpen, setPairOpen] = useState(false);
  const ocrAvailable = useUi((s) => s.ocrAvailable);
  const serverOk = useUi((s) => s.serverOk);
  const recognizeRef = useRef<() => void>(() => {});
  /** A pantalla completa (en el móvil, en horizontal): más espacio para escribir. */
  const [full, setFull] = useState(false);
  useKeepAwake(IS_PHONE);
  useLandscape(IS_PHONE && full);
  useBackHandler(() => setFull(false), full);

  const run = async () => {
    const png = canvasRef.current?.exportPng();
    if (!png) {
      setError('Escribe algo en el lienzo primero.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { lines } = await recognize(png);
      if (!lines.length) setError('No se reconoció escritura matemática. Intenta escribir más grande y claro.');
      else {
        setFull(false);
        onRecognized(lines);
      }
      pairing.send({ type: 'ocr-result', lines });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en el reconocimiento.';
      setError(msg);
      pairing.send({ type: 'ocr-result', lines: [], error: msg });
    } finally {
      setBusy(false);
    }
  };
  recognizeRef.current = run;
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  const canSubmit = !!onSubmit;

  useEffect(
    () =>
      pairing.attachBoard({
        model,
        width: BOARD_W,
        height: BOARD_H,
        title: 'Ejercicio',
        prompt,
        topic,
        canvas: () => canvasRef.current,
        onOcrRequest: () => recognizeRef.current(),
        onSubmit: canSubmit ? () => submitRef.current?.() : undefined,
      }),
    [model, prompt, topic, canSubmit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.target instanceof Element && e.target.closest('math-field, input, textarea, select')) return;
      if (e.key === 'z') { model.undo(); pairing.sync(); e.preventDefault(); }
      if (e.key === 'y') { model.redo(); pairing.sync(); e.preventDefault(); }
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setFull(false);
    window.addEventListener('keydown', onEsc);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', onEsc);
    };
  }, [model]);

  return (
    <div className={`handwriting fade-in ${full ? 'fullscreen' : ''}`}>
      {full && prompt && <RichText text={prompt} className="hw-prompt small" />}
      <InkToolbar
        model={model}
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        onUndo={() => { model.undo(); pairing.sync(); }}
        onRedo={() => { model.redo(); pairing.sync(); }}
        onClear={() => { model.clear(); pairing.sync(); }}
        onPair={IS_PHONE || full ? undefined : () => setPairOpen(true)}
        compact
        extra={
          <button type="button" className="icon-btn" onClick={() => setFull((f) => !f)} title={full ? 'Salir de pantalla completa' : 'Escribir a pantalla completa'} aria-label={full ? 'Salir de pantalla completa' : 'Escribir a pantalla completa'}>
            <Icon name={full ? 'minimize' : 'maximize'} size={19} />
          </button>
        }
      />
      <InkCanvas ref={canvasRef} model={model} boardWidth={BOARD_W} boardHeight={BOARD_H} tool={tool} color={color} size={size} onLocal={(m) => pairing.local(m)} className="rounded" fit={full} />
      <div className="row wrap" style={{ marginTop: 8 }}>
        <span className="small muted" style={{ flex: 1, minWidth: 200 }}>{hint}</span>
        <button type="button" className="btn primary" onClick={run} disabled={busy || !ocrAvailable}>
          {busy ? <span className="spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%' }} /> : <Icon name="scan" size={18} />}
          {busy ? 'Reconociendo…' : 'Reconocer escritura'}
        </button>
      </div>
      {busy && <div className="tiny faint" style={{ marginTop: 6, textAlign: 'right' }}>Con la IA {IS_PHONE ? 'del PC' : 'de este PC'} la lectura tarda unos 20 segundos (más la primera vez).</div>}
      {!ocrAvailable && (
        <div className="callout info small" style={{ marginTop: 8 }}>
          <Icon className="callout-icon" name="alert" size={16} />
          <div>
            {IS_PHONE ? (
              serverOk ? (
                'La app del PC no tiene configurada la lectura de la escritura (Ajustes → Reconocimiento de escritura, en el PC). Mientras tanto puedes escribir la fórmula con el teclado.'
              ) : (
                <>Para leer la escritura se usa la IA del PC: abre la app del PC (misma red Wi-Fi) y <Link to="/pc">vincula el móvil</Link>. Mientras tanto puedes escribir la fórmula con el teclado.</>
              )
            ) : serverOk === false ? (
              'No hay conexión con el servidor local: ejecuta «npm run dev» para usar el OCR y el móvil.'
            ) : (
              <>
                La lectura de la escritura no está lista: abre Ollama y descarga DeepSeek-OCR, o configura Claude, en <Link to="/ajustes">Ajustes</Link>. Mientras tanto puedes escribir la fórmula con el teclado.
              </>
            )}
          </div>
        </div>
      )}
      {error && (
        <div className="callout danger small" style={{ marginTop: 8 }}>
          <Icon className="callout-icon" name="alert" size={16} />
          {error}
        </div>
      )}
      {pairOpen && <PairingDialog onClose={() => setPairOpen(false)} />}
    </div>
  );
}
