// Ajustes de la IA: quién lee la escritura (DeepSeek-OCR en este PC o Claude en la nube)
// y el tutor (DeepSeek Math). La IA local corre con Ollama (https://ollama.com).
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { getAiStatus, getConfig, pullModel, saveConfig, testConfig, type AiStatus, type ConfigPatch, type OcrProvider, type PullProgress, type ServerConfig } from '../lib/api';
import { isDesktop } from '../lib/storage';
import { useUi } from '../store/ui';

const EFFORTS: { id: ServerConfig['ocrEffort']; label: string; hint: string }[] = [
  { id: 'low', label: 'Rápido', hint: 'Respuesta en pocos segundos; suficiente para letra clara.' },
  { id: 'medium', label: 'Equilibrado', hint: 'Algo más lento; mejor con letra difícil o fórmulas largas.' },
  { id: 'high', label: 'Preciso', hint: 'El más lento y el que más consume de la API.' },
];

const PROVIDERS: { id: OcrProvider; label: string }[] = [
  { id: 'local', label: 'DeepSeek (en este PC)' },
  { id: 'claude', label: 'Claude (en la nube)' },
];

/** Tamaño de descarga de los modelos predeterminados. */
const SIZES: Record<string, string> = { 'deepseek-ocr': '6,7 GB', 't1c/deepseek-math-7b-rl': '4,2 GB' };

const gb = (n?: number) => (n ? `${(n / 1e9).toLocaleString('es', { maximumFractionDigits: 1 })} GB` : '');

function progressLabel(p: PullProgress): string {
  const s = p.status ?? '';
  if (s.startsWith('pulling manifest')) return 'Preparando…';
  if (s.startsWith('pulling')) return p.total ? `Descargando ${gb(p.completed)} de ${gb(p.total)}` : 'Descargando…';
  if (s.startsWith('verifying')) return 'Verificando…';
  if (s.startsWith('writing') || s === 'success') return 'Terminando…';
  return s || 'Iniciando…';
}

function ModelRow({ which, model, installed, running, onDone }: { which: 'ocr' | 'tutor'; model: string; installed: boolean; running: boolean; onDone(): void }) {
  const [progress, setProgress] = useState<PullProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  useEffect(() => () => ctrl.current?.abort(), []);

  const start = async () => {
    const c = new AbortController();
    ctrl.current = c;
    setError(null);
    setProgress({ status: '' });
    try {
      await pullModel(which, setProgress, c.signal);
      onDone();
    } catch (e) {
      if (!c.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo descargar el modelo.');
    } finally {
      setProgress(null);
    }
  };

  const pct = progress?.total ? Math.round(((progress.completed ?? 0) / progress.total) * 100) : 0;

  return (
    <div className="model-row">
      <div>
        <div className="mono small" style={{ fontWeight: 650 }}>{model}</div>
        <div className="tiny faint">{SIZES[model] ? `Descarga de ${SIZES[model]}` : 'Modelo de Ollama'}</div>
      </div>
      {installed ? (
        <span className="badge success"><Icon name="check" size={13} /> Descargado</span>
      ) : progress ? (
        <div className="pull-progress" style={{ minWidth: 220, flex: 1 }}>
          <div className="progress"><div style={{ width: `${pct}%` }} /></div>
          <div className="row tiny faint" style={{ justifyContent: 'space-between' }}>
            <span>{progressLabel(progress)}</span>
            <button type="button" className="btn sm ghost" onClick={() => ctrl.current?.abort()}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn sm primary" disabled={!running} onClick={start} title={running ? undefined : 'Primero abre Ollama'}>
          <Icon name="download" size={15} /> Descargar
        </button>
      )}
      {error && <div className="small" style={{ color: 'var(--danger)', flexBasis: '100%' }}>{error}</div>}
    </div>
  );
}

function OllamaState({ status, onRetry }: { status: AiStatus | null; onRetry(): void }) {
  if (!status) return <div className="muted small">Comprobando la IA local…</div>;
  if (status.ollama.running) {
    return (
      <span className="badge success" style={{ alignSelf: 'flex-start' }}>
        <Icon name="check" size={13} /> Ollama {status.ollama.version ?? ''} en ejecución
      </span>
    );
  }
  return (
    <div className="callout warning small">
      <Icon className="callout-icon" name="alert" size={16} />
      <div className="stack" style={{ gap: 6 }}>
        <div>
          Ollama no está abierto. Es el programa gratuito que ejecuta la IA en tu PC: si no lo tienes, descárgalo de{' '}
          <a href="https://ollama.com/download" target="_blank" rel="noreferrer">ollama.com/download</a>, instálalo y vuelve aquí.
        </div>
        <button type="button" className="btn sm outline" style={{ alignSelf: 'flex-start' }} onClick={onRetry}>
          <Icon name="refresh" size={15} /> Comprobar de nuevo
        </button>
      </div>
    </div>
  );
}

export function AiSettings() {
  const refreshHealth = useUi((s) => s.refreshHealth);
  const toast = useUi((s) => s.toast);
  const [cfg, setCfg] = useState<ServerConfig | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [fields, setFields] = useState({ ocrModel: '', localOcrModel: '', tutorModel: '', ollamaUrl: '' });
  const [busy, setBusy] = useState<'save' | 'test' | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = (c: ServerConfig) => {
    setCfg(c);
    setFields({ ocrModel: c.ocrModel, localOcrModel: c.localOcrModel, tutorModel: c.tutorModel, ollamaUrl: c.ollamaUrl });
  };

  const reload = useCallback(async () => {
    try {
      const [c, s] = await Promise.all([getConfig(), getAiStatus()]);
      apply(c);
      setStatus(s);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Error');
    }
    void refreshHealth();
  }, [refreshHealth]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const save = async (patch: ConfigPatch, okText: string) => {
    setBusy('save');
    setResult(null);
    try {
      apply(await saveConfig(patch));
      setKey('');
      toast({ kind: 'success', title: okText });
      await reload();
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'No se pudo guardar.' });
    } finally {
      setBusy(null);
    }
  };

  const test = async () => {
    setBusy('test');
    setResult(null);
    try {
      const r = await testConfig(key.trim() || undefined);
      setResult({ ok: true, text: `La clave funciona: acceso a ${r.displayName}.` });
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : 'No se pudo comprobar la clave.' });
    } finally {
      setBusy(null);
    }
  };

  if (loadError) {
    return (
      <div className="card">
        <div className="callout warning small">
          <Icon className="callout-icon" name="alert" size={16} />
          <div>No se pudo leer la configuración del servidor local: {loadError}</div>
        </div>
      </div>
    );
  }
  if (!cfg) return <div className="card muted small">Cargando…</div>;

  const running = !!status?.ollama.running;
  const local = cfg.ocrProvider === 'local';
  const field = (k: keyof typeof fields, label: string, hint: string) => (
    <label className="field">
      <span>{label}</span>
      <div className="row" style={{ gap: 6 }}>
        <input className="input mono" value={fields[k]} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} spellCheck={false} />
        <button type="button" className="btn sm outline" disabled={fields[k].trim() === cfg[k] || !!busy} onClick={() => save({ [k]: fields[k].trim() || null }, 'Guardado')}>
          Guardar
        </button>
      </div>
      <span className="field-hint">{hint}</span>
    </label>
  );

  return (
    <>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}><Icon name="scan" size={18} /> Reconocimiento de escritura</h3>
        <div className="stack" style={{ gap: 12 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <Segmented value={cfg.ocrProvider} options={PROVIDERS} onChange={(v) => v !== cfg.ocrProvider && save({ ocrProvider: v }, v === 'local' ? 'Ahora lee DeepSeek en este PC' : 'Ahora lee Claude')} />
            <span className={`badge ${cfg.ocr ? 'success' : 'warning'}`}>
              <Icon name={cfg.ocr ? 'check' : 'alert'} size={13} /> {cfg.ocr ? 'Listo' : 'Falta configurar'}
            </span>
          </div>

          {local ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>
                <b>DeepSeek-OCR</b> convierte tu escritura (en el PC o desde el móvil) en fórmulas, sin Internet ni costo. Sin tarjeta gráfica tarda unos 20 segundos por lectura; la primera vez, más, porque carga el modelo. Si lee mal tu letra, prueba con Claude.
              </p>
              <OllamaState status={status} onRetry={reload} />
              <ModelRow which="ocr" model={cfg.localOcrModel} installed={!!status?.ocr.installed} running={running} onDone={() => { toast({ kind: 'success', title: 'DeepSeek-OCR descargado' }); void reload(); }} />
            </>
          ) : (
            <>
              <p className="small muted" style={{ margin: 0 }}>
                Claude lee la escritura en la nube: es más rápido y preciso con letra difícil, pero necesita Internet y una clave de API de tu cuenta de Anthropic (se crea en{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">console.anthropic.com</a>; el uso se factura en esa cuenta).
              </p>
              <div className="row wrap" style={{ gap: 8 }}>
                {cfg.hasKey && <span className="badge mono">{cfg.keyHint}</span>}
                {cfg.keySource === 'env' && <span className="badge">Clave tomada de .env</span>}
              </div>
              <label className="field">
                <span>{cfg.keySource === 'app' ? 'Reemplazar la clave de la API' : 'Clave de la API'}</span>
                <div className="row" style={{ gap: 6 }}>
                  <input className="input mono" type={show ? 'text' : 'password'} value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" autoComplete="off" spellCheck={false} />
                  <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)} title={show ? 'Ocultar' : 'Mostrar'}>
                    <Icon name="eye" size={18} />
                  </button>
                </div>
                <span className="field-hint">
                  {isDesktop ? 'Se guarda cifrada en este equipo y solo se usa desde aquí.' : 'Se guarda en la carpeta .data del proyecto (no se sube a git).'}
                </span>
              </label>
              <div className="row wrap">
                <button type="button" className="btn primary" disabled={!key.trim() || !!busy} onClick={() => save({ apiKey: key.trim() }, 'Clave guardada')}>
                  <Icon name="check" size={16} /> Guardar clave
                </button>
                <button type="button" className="btn outline" disabled={(!key.trim() && !cfg.hasKey) || !!busy} onClick={test}>
                  {busy === 'test' ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icon name="refresh" size={16} />} Probar
                </button>
                {cfg.keySource === 'app' && (
                  <button type="button" className="btn ghost" disabled={!!busy} onClick={() => save({ apiKey: null }, 'Clave eliminada')}>
                    <Icon name="trash" size={16} /> Quitar clave
                  </button>
                )}
              </div>
            </>
          )}

          {result && (
            <div className={`callout small ${result.ok ? 'success' : 'danger'}`}>
              <Icon className="callout-icon" name={result.ok ? 'check' : 'alert'} size={16} />
              <div>{result.text}</div>
            </div>
          )}

          <details>
            <summary className="small" style={{ cursor: 'pointer' }}>Opciones avanzadas</summary>
            <div className="stack" style={{ gap: 12, marginTop: 10 }}>
              {field('localOcrModel', 'Modelo local para leer la escritura', 'Cualquier modelo de Ollama con visión. Por defecto deepseek-ocr; vacío = predeterminado.')}
              {field('ollamaUrl', 'Dirección de Ollama', 'Por defecto http://127.0.0.1:11434 (Ollama en este mismo PC).')}
              <div className="settings-row">
                <div>
                  <div style={{ fontWeight: 600 }}>Velocidad de Claude</div>
                  <div className="tiny faint">{EFFORTS.find((e) => e.id === cfg.ocrEffort)?.hint}</div>
                </div>
                <Segmented value={cfg.ocrEffort} options={EFFORTS} onChange={(v) => save({ ocrEffort: v }, 'Velocidad actualizada')} />
              </div>
              {field('ocrModel', 'Modelo de Claude', 'Por defecto claude-opus-5-5; vacío = predeterminado.')}
            </div>
          </details>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 6 }}><Icon name="brain" size={18} /> Tutor con IA (DeepSeek Math)</h3>
        <div className="stack" style={{ gap: 12 }}>
          <p className="small muted" style={{ margin: 0 }}>
            Explica tus pasos y tus errores con el botón <b>Explícame</b> de la Pizarra y de los ejercicios. Corre en este PC, sin Internet ni costo; sin tarjeta gráfica tarda alrededor de un minuto por respuesta y puede equivocarse (la corrección de la app es la referencia). Responde en español, aunque a veces mezcla inglés.
          </p>
          {!local && <OllamaState status={status} onRetry={reload} />}
          <ModelRow which="tutor" model={cfg.tutorModel} installed={!!status?.tutor.installed} running={running} onDone={() => { toast({ kind: 'success', title: 'DeepSeek Math descargado' }); void reload(); }} />
          <details>
            <summary className="small" style={{ cursor: 'pointer' }}>Opciones avanzadas</summary>
            <div style={{ marginTop: 10 }}>
              {field('tutorModel', 'Modelo del tutor', 'Por defecto t1c/deepseek-math-7b-rl (DeepSeekMath 7B); vacío = predeterminado.')}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
