// IA local con Ollama (https://ollama.com): lectura de la escritura con DeepSeek-OCR y
// tutor con DeepSeek Math. Ollama corre en el mismo PC y expone su API en el puerto 11434.

export const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';

export class OllamaError extends Error {
  status: number;
  constructor(message: string, status = 503) {
    super(message);
    this.status = status;
  }
}

export interface OllamaStatus {
  running: boolean;
  version?: string;
  models: string[];
}

/** «deepseek-ocr» y «deepseek-ocr:latest» son el mismo modelo. */
export function sameModel(a: string, b: string): boolean {
  const norm = (m: string) => (m.includes(':') ? m : `${m}:latest`).toLowerCase();
  return norm(a) === norm(b);
}

function notRunning(): OllamaError {
  return new OllamaError('Ollama no está abierto. Ábrelo (o instálalo desde ollama.com) para usar la IA local.', 503);
}

async function call(base: string, path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), init.timeoutMs ?? 5000);
  const outer = init.signal;
  const onAbort = () => ctrl.abort();
  outer?.addEventListener('abort', onAbort);
  try {
    return await fetch(new URL(path, base), { ...init, signal: ctrl.signal });
  } catch (e) {
    if (outer?.aborted) throw new OllamaError('Cancelado.', 499);
    if ((e as Error).name === 'AbortError') throw new OllamaError('La IA local tardó demasiado en responder.', 504);
    throw notRunning();
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener('abort', onAbort);
  }
}

async function failure(r: Response, model?: string): Promise<OllamaError> {
  const body = (await r.json().catch(() => ({}))) as { error?: string };
  const msg = body.error ?? `Error ${r.status}`;
  if (r.status === 404 || /not found/i.test(msg)) return new OllamaError(`Falta el modelo «${model}». Descárgalo en Ajustes.`, 404);
  return new OllamaError(`IA local: ${msg}`, 502);
}

export async function ollamaStatus(base: string): Promise<OllamaStatus> {
  try {
    const [v, tags] = await Promise.all([call(base, '/api/version', { timeoutMs: 2500 }), call(base, '/api/tags', { timeoutMs: 2500 })]);
    const version = ((await v.json().catch(() => ({}))) as { version?: string }).version;
    const models = (((await tags.json().catch(() => ({}))) as { models?: { name: string }[] }).models ?? []).map((m) => m.name);
    return { running: true, version, models };
  } catch {
    return { running: false, models: [] };
  }
}

export async function hasModel(base: string, model: string): Promise<boolean> {
  const st = await ollamaStatus(base);
  return st.running && st.models.some((m) => sameModel(m, model));
}

export interface PullProgress {
  status: string;
  completed?: number;
  total?: number;
  error?: string;
}

/** Descarga un modelo; `onProgress` recibe cada línea de progreso de Ollama. */
export async function pullModel(base: string, model: string, onProgress: (p: PullProgress) => void, signal?: AbortSignal): Promise<void> {
  const r = await call(base, '/api/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true }),
    timeoutMs: 6 * 60 * 60 * 1000,
    signal,
  });
  if (!r.ok || !r.body) throw await failure(r, model);
  await readLines(r.body, (line) => {
    const p = JSON.parse(line) as PullProgress;
    if (p.error) throw new OllamaError(`No se pudo descargar «${model}»: ${p.error}`, 502);
    onProgress(p);
  });
}

async function readLines(body: ReadableStream<Uint8Array>, onLine: (line: string) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (value) buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onLine(line);
    }
    if (done) break;
  }
  if (buf.trim()) onLine(buf.trim());
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  /** Imágenes en base64 (sin el prefijo data:). */
  images?: string[];
}

interface ChatOptions {
  temperature?: number;
  num_ctx?: number;
  num_predict?: number;
  repeat_penalty?: number;
  repeat_last_n?: number;
  stop?: string[];
}

/** Respuesta completa (sin streaming). */
export async function chat(base: string, model: string, messages: ChatMessage[], options: ChatOptions = {}, timeoutMs = 180_000): Promise<string> {
  const r = await call(base, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false, options, keep_alive: '10m' }),
    timeoutMs,
  });
  if (!r.ok) throw await failure(r, model);
  const body = (await r.json()) as { message?: { content?: string } };
  return body.message?.content ?? '';
}

/**
 * Texto en streaming con el prompt ya armado («raw»: Ollama no aplica la plantilla del modelo).
 * `onToken` recibe cada fragmento a medida que llega.
 */
export async function generateStream(
  base: string,
  model: string,
  prompt: string,
  onToken: (text: string) => void,
  options: ChatOptions = {},
  signal?: AbortSignal,
): Promise<void> {
  const r = await call(base, '/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, raw: true, stream: true, options, keep_alive: '10m' }),
    timeoutMs: 10 * 60 * 1000,
    signal,
  });
  if (!r.ok || !r.body) throw await failure(r, model);
  await readLines(r.body, (line) => {
    const chunk = JSON.parse(line) as { response?: string; error?: string };
    if (chunk.error) throw new OllamaError(`IA local: ${chunk.error}`, 502);
    if (chunk.response) onToken(chunk.response);
  });
}
