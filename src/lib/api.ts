// Llamadas al servidor local. En la app del móvil, la IA es la del PC vinculado (ver phone/ai.ts).
import { isDesktop } from './storage';

export interface Health {
  ok: boolean;
  ocr: boolean;
  tutor?: boolean;
  version?: string;
  desktop?: boolean;
  /** Nombre del equipo. */
  name?: string;
}

export type OcrProvider = 'local' | 'claude';

export interface ServerConfig {
  ocrProvider: OcrProvider;
  hasKey: boolean;
  keySource: 'app' | 'env' | null;
  keyHint: string | null;
  ocrModel: string;
  ocrEffort: 'low' | 'medium' | 'high';
  localOcrModel: string;
  tutorModel: string;
  ollamaUrl: string;
  ocr: boolean;
  desktop: boolean;
}

export type ConfigPatch = Partial<Record<'ocrProvider' | 'apiKey' | 'ocrModel' | 'ocrEffort' | 'localOcrModel' | 'tutorModel' | 'ollamaUrl', string | null>>;

export interface AiStatus {
  ollama: { url: string; running: boolean; version: string | null };
  ocr: { model: string; installed: boolean };
  tutor: { model: string; installed: boolean };
}

export interface PullProgress {
  status?: string;
  completed?: number;
  total?: number;
  error?: string;
}

/** Datos para el tutor (ver server/tutor.ts). */
export interface TutorRequest {
  prompt?: string;
  answer?: string;
  correct?: boolean;
  feedback?: string;
  error?: string;
  tip?: string;
  solution?: string[];
  steps?: { latex: string; status?: string; message?: string }[];
  mode?: string;
  question?: string;
}

/** IA de otro equipo (la app del móvil usa la del PC vinculado). */
export interface RemoteAi {
  recognize(pngDataUrl: string): Promise<{ lines: string[] }>;
  askTutor(req: TutorRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<void>;
}

let remoteAi: RemoteAi | null = null;

export function setRemoteAi(ai: RemoteAi | null): void {
  remoteAi = ai;
}

const OFFLINE = isDesktop
  ? 'No hay conexión con el servidor interno de la app. Reinicia la aplicación.'
  : 'No hay conexión con el servidor local. ¿Está ejecutándose «npm run dev»?';

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(path, init);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new Error(OFFLINE);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await send(path, init);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((body as { error?: string }).error ?? `Error ${r.status}`);
  return body as T;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function fetchHealth(): Promise<Health | null> {
  try {
    return await request<Health>('/api/health');
  } catch {
    return null;
  }
}

export async function fetchNetwork(): Promise<{ addresses: string[]; serverPort: number } | null> {
  try {
    return await request('/api/network');
  } catch {
    return null;
  }
}

export function recognize(pngDataUrl: string): Promise<{ lines: string[] }> {
  if (remoteAi) return remoteAi.recognize(pngDataUrl);
  return request('/api/ocr', json('POST', { image: pngDataUrl }));
}

export function getConfig(): Promise<ServerConfig> {
  return request('/api/config');
}

export function saveConfig(patch: ConfigPatch): Promise<ServerConfig> {
  return request('/api/config', json('PUT', patch));
}

export function testConfig(apiKey?: string): Promise<{ ok: true; model: string; displayName: string }> {
  return request('/api/config/test', json('POST', { apiKey }));
}

export function getAiStatus(): Promise<AiStatus> {
  return request('/api/ai/status');
}

/** Lee una respuesta en streaming y entrega cada fragmento de texto. */
async function readStream(r: Response, onText: (t: string) => void): Promise<void> {
  const reader = r.body!.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (value) onText(decoder.decode(value, { stream: true }));
    if (done) break;
  }
}

/** Descarga un modelo de la IA local (Ollama) informando el progreso. */
export async function pullModel(which: 'ocr' | 'tutor', onProgress: (p: PullProgress) => void, signal?: AbortSignal): Promise<void> {
  const r = await send('/api/ai/pull', { ...json('POST', { which }), signal });
  if (!r.ok || !r.body) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Error ${r.status}`);
  }
  let buf = '';
  let error: string | null = null;
  await readStream(r, (t) => {
    buf += t;
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const p = JSON.parse(line) as PullProgress;
      if (p.error) error = p.error;
      else onProgress(p);
    }
  });
  if (error) throw new Error(error);
}

/** Pide una explicación al tutor (DeepSeek Math); el texto llega de a fragmentos. */
export async function askTutor(req: TutorRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<void> {
  if (remoteAi) return remoteAi.askTutor(req, onText, signal);
  const r = await send('/api/tutor', { ...json('POST', req), signal });
  if (!r.ok || !r.body) {
    const body = (await r.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Error ${r.status}`);
  }
  await readStream(r, onText);
}
