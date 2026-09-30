// Pizarra: escritura libre (en el PC o desde el móvil), OCR a LaTeX editable y
// verificación paso a paso de lo escrito.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { RichText, Tex } from '../components/Math';
import { MathInput } from '../components/MathInput';
import { errorLabel } from '../content/errorCatalog';
import { useActiveTime } from '../lib/activity';
import { recognize, type TutorRequest } from '../lib/api';
import { parse } from '../math/parse';
import { validateSteps, type LineResult, type StepMode } from '../math/validate';
import { useUi } from '../store/ui';
import { InkModel } from '../canvas/ink';
import { InkCanvas, type CanvasTool, type InkCanvasHandle } from '../canvas/InkCanvas';
import { InkToolbar } from '../canvas/InkToolbar';
import { PairingDialog } from '../canvas/PairingDialog';
import { pairing, usePairing } from '../canvas/pairing';
import { TutorPanel } from '../components/TutorPanel';

const BOARD_W = 1600;
const BOARD_H = 1000;

const MODES: { id: StepMode; label: string; hint: string }[] = [
  { id: 'equation', label: 'Ecuación', hint: 'Cada línea debe ser equivalente a la anterior (misma solución).' },
  { id: 'expression', label: 'Expresión', hint: 'Cada línea debe valer lo mismo que la anterior (simplificación).' },
  { id: 'inequality', label: 'Inecuación', hint: 'Cada línea debe tener el mismo conjunto solución.' },
  { id: 'logic', label: 'Lógica', hint: 'Cada proposición debe ser equivalente a la anterior.' },
  { id: 'set', label: 'Conjuntos', hint: 'Cada expresión debe representar el mismo conjunto.' },
];

// Modelo compartido: la pizarra conserva su contenido al cambiar de página.
const boardModel = new InkModel();

export default function Whiteboard() {
  const model = boardModel;
  const canvasRef = useRef<InkCanvasHandle>(null);
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState('ink');
  const [size, setSize] = useState(5);
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairOpen, setPairOpen] = useState(false);
  const [mode, setMode] = useState<StepMode>('equation');
  const [results, setResults] = useState<LineResult[] | null>(null);
  const [full, setFull] = useState(false);
  const ocrAvailable = useUi((s) => s.ocrAvailable);
  const tutorAvailable = useUi((s) => s.tutorAvailable);
  const [tutorOpen, setTutorOpen] = useState(false);
  const peers = usePairing((s) => s.peers);
  const runRef = useRef<() => void>(() => {});
  useActiveTime(undefined);

  const run = async () => {
    const png = canvasRef.current?.exportPng();
    if (!png) {
      setError('La pizarra está vacía.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const r = await recognize(png);
      setLines(r.lines);
      setResults(null);
      pairing.send({ type: 'ocr-result', lines: r.lines });
      if (!r.lines.length) setError('No se reconoció escritura matemática.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error en el reconocimiento.';
      setError(msg);
      pairing.send({ type: 'ocr-result', lines: [], error: msg });
    } finally {
      setBusy(false);
    }
  };
  runRef.current = run;

  useEffect(
    () => pairing.attachBoard({ model, width: BOARD_W, height: BOARD_H, title: 'Pizarra', canvas: () => canvasRef.current, onOcrRequest: () => runRef.current() }),
    [model],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('math-field, input, textarea, select')) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { model.undo(); pairing.sync(); e.preventDefault(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { model.redo(); pairing.sync(); e.preventDefault(); }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'p') setTool('pen');
        if (e.key === 'e') setTool('eraser');
        if (e.key === 'l') setTool('laser');
        if (e.key === 'h') setTool('highlighter');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [model]);

  const verify = () => {
    const filled = lines.map((l) => l.trim()).filter(Boolean);
    if (filled.length < 2) {
      setResults(null);
      setError('Se necesitan al menos dos líneas: la primera es el enunciado y las siguientes, los pasos.');
      return;
    }
    try {
      const pm = mode === 'logic' ? 'logic' : mode === 'set' ? 'set' : 'arith';
      const start = parse(filled[0], { mode: pm });
      const res = validateSteps(start, filled.slice(1), { mode, variable: 'x', parseMode: pm });
      setResults(res);
      setError(null);
    } catch (e) {
      setError(`No pude leer la primera línea: ${e instanceof Error ? e.message : ''}`);
    }
  };

  const modeInfo = MODES.find((m) => m.id === mode)!;

  const tutorRequest = (): TutorRequest => ({
    mode: modeInfo.label.toLowerCase(),
    steps: lines
      .map((latex, i) => ({ latex: latex.trim(), result: i > 0 ? results?.[i - 1] : undefined }))
      .filter((l) => l.latex)
      .map(({ latex, result }) => ({ latex, status: result?.status, message: result ? `${result.bug ? `${errorLabel(result.bug)}. ` : ''}${result.message ?? ''}`.trim() : undefined })),
  });
  const firstTex = useMemo(() => lines[0] ?? '', [lines]);

  return (
    <div className={`page wide whiteboard ${full ? 'fullscreen' : ''}`}>
      <div className="page-header">
        <div>
          <h1>Pizarra</h1>
          <p>Escribe con el mouse, el dedo o un lápiz digital —o desde el móvil— y convierte tu letra en fórmulas editables.</p>
        </div>
        <div className="row wrap">
          <span className={`badge ${peers > 0 ? 'success' : ''}`}><Icon name="phone" size={13} /> {peers > 0 ? 'Móvil conectado' : 'Sin móvil'}</span>
          <button className="icon-btn" onClick={() => setFull((f) => !f)} title={full ? 'Salir de pantalla completa' : 'Pantalla completa'}>
            <Icon name={full ? 'minimize' : 'maximize'} />
          </button>
        </div>
      </div>
      <div className="wb-layout">
        <div className="wb-board card flat">
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
            onClear={() => { model.clear(); pairing.sync(); setLines([]); setResults(null); }}
            onPair={() => setPairOpen(true)}
          />
          <InkCanvas ref={canvasRef} model={model} boardWidth={BOARD_W} boardHeight={BOARD_H} tool={tool} color={color} size={size} onLocal={(m) => pairing.local(m)} />
          <div className="tiny faint" style={{ marginTop: 6 }}>
            Atajos: <span className="kbd">P</span> lápiz · <span className="kbd">H</span> resaltador · <span className="kbd">E</span> borrador · <span className="kbd">L</span> láser · <span className="kbd">Ctrl+Z</span> deshacer · tachar en zigzag borra lo que está debajo.
          </div>
        </div>
        <div className="wb-side stack">
          <div className="card">
            <div className="card-title">
              <h3>Reconocimiento</h3>
              <button className="btn primary sm" onClick={run} disabled={busy || !ocrAvailable}>
                {busy ? <span className="spin" style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%' }} /> : <Icon name="scan" size={16} />}
                {busy ? 'Leyendo…' : 'Reconocer'}
              </button>
            </div>
            {busy && <div className="tiny faint" style={{ marginBottom: 8 }}>Con la IA de este PC la lectura tarda unos 20 segundos (más la primera vez).</div>}
            {!ocrAvailable && (
              <div className="callout info small">
                <Icon className="callout-icon" name="alert" size={16} />
                <div>La lectura de la escritura no está lista: abre Ollama y descarga DeepSeek-OCR, o configura Claude, en <Link to="/ajustes">Ajustes</Link>. También puedes escribir las líneas con el teclado abajo.</div>
              </div>
            )}
            {error && <div className="callout danger small" style={{ marginTop: 8 }}><Icon className="callout-icon" name="alert" size={16} />{error}</div>}
            <div className="stack" style={{ gap: 8, marginTop: 10 }}>
              {lines.map((l, i) => {
                const r = i > 0 ? results?.[i - 1] : undefined;
                return (
                  <div key={i} className={`ocr-line ${r?.status ?? ''}`}>
                    <span className="step-num">{i === 0 ? '0' : i}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <MathInput value={l} onChange={(v) => { setLines(lines.map((x, k) => (k === i ? v : x))); setResults(null); }} noKeyboard />
                      {r && r.status !== 'ok' && (
                        <div className={`step-msg ${r.status}`}>
                          {r.bug && <span className="badge danger" style={{ marginRight: 6 }}>{errorLabel(r.bug)}</span>}
                          <RichText text={r.message} as="span" />
                        </div>
                      )}
                    </div>
                    <span className="step-status">
                      {r?.status === 'ok' && <Icon name="check" size={18} stroke={2.6} style={{ color: 'var(--success)' }} />}
                      {(r?.status === 'error' || r?.status === 'parse-error') && <Icon name="x" size={18} stroke={2.6} style={{ color: 'var(--danger)' }} />}
                      {r?.status === 'carried' && <Icon name="alert" size={18} style={{ color: 'var(--warning)' }} />}
                    </span>
                  </div>
                );
              })}
              <button className="btn sm ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setLines([...lines, ''])}>
                <Icon name="plus" size={15} /> Agregar línea
              </button>
            </div>
            {lines.length > 0 && (
              <button className="btn sm outline" style={{ marginTop: 8 }} onClick={() => navigator.clipboard?.writeText(lines.join(' \\\\\n'))}>
                <Icon name="copy" size={15} /> Copiar LaTeX
              </button>
            )}
          </div>
          <div className="card">
            <h3>Verificar pasos</h3>
            <p className="small muted" style={{ marginTop: 4 }}>La línea 0 se toma como enunciado; cada línea siguiente se compara con la anterior.</p>
            <div className="row wrap" style={{ gap: 6, margin: '8px 0' }}>
              {MODES.map((m) => (
                <button key={m.id} className={`chip ${mode === m.id ? 'active' : ''}`} onClick={() => { setMode(m.id); setResults(null); }}>{m.label}</button>
              ))}
            </div>
            <div className="tiny faint">{modeInfo.hint}</div>
            <button className="btn primary block" style={{ marginTop: 10 }} onClick={verify} disabled={lines.filter((l) => l.trim()).length < 2}>
              <Icon name="steps" size={16} /> Verificar
            </button>
            {results && (
              <div className={`callout ${results.every((r) => r.status === 'ok') ? 'success' : 'warning'} small`} style={{ marginTop: 10 }}>
                <Icon className="callout-icon" name={results.every((r) => r.status === 'ok') ? 'check' : 'alert'} size={16} />
                <div>
                  {results.every((r) => r.status === 'ok')
                    ? `Todos los pasos son válidos${results[results.length - 1]?.isFinal ? ' y llegaste a la solución' : ''}.`
                    : `Hay ${results.filter((r) => r.status !== 'ok').length} paso(s) con problemas: revisa las líneas marcadas.`}
                </div>
              </div>
            )}
            {firstTex && !results && <div className="tiny faint" style={{ marginTop: 8 }}>Enunciado: <Tex tex={firstTex} /></div>}
            {tutorAvailable && lines.some((l) => l.trim()) && !tutorOpen && (
              <button className="btn sm ghost" style={{ marginTop: 8 }} onClick={() => setTutorOpen(true)} title="Explicación del tutor con IA (DeepSeek Math, en tu PC)">
                <Icon name="brain" size={16} /> Explícame mis pasos
              </button>
            )}
            {tutorOpen && (
              <div style={{ marginTop: 10 }}>
                <TutorPanel request={tutorRequest()} onClose={() => setTutorOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
      {pairOpen && <PairingDialog onClose={() => setPairOpen(false)} />}
    </div>
  );
}
