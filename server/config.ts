// Configuración persistente del servidor: qué IA lee la escritura (DeepSeek local con Ollama
// o Claude en la nube), la clave de la API de Claude y los modelos.
// Se guarda como JSON en la carpeta de datos (en la app de escritorio, la carpeta de
// datos del usuario; con `npm run dev`, la carpeta .data del proyecto).
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_OLLAMA_URL } from './ollama';

export type OcrEffort = 'low' | 'medium' | 'high';
export type OcrProvider = 'local' | 'claude';

export const OCR_EFFORTS: OcrEffort[] = ['low', 'medium', 'high'];
export const OCR_PROVIDERS: OcrProvider[] = ['local', 'claude'];
export const DEFAULT_OCR_MODEL = 'claude-opus-5-5';
/** Lectura local de la escritura (visión): DeepSeek-OCR. */
export const DEFAULT_LOCAL_OCR_MODEL = 'deepseek-ocr';
/** Tutor local (solo texto): DeepSeekMath 7B RL, versión comunitaria cuantizada para Ollama. */
export const DEFAULT_TUTOR_MODEL = 't1c/deepseek-math-7b-rl';

export interface AppConfig {
  ocrProvider?: OcrProvider;
  apiKey?: string;
  ocrModel?: string;
  ocrEffort?: OcrEffort;
  localOcrModel?: string;
  tutorModel?: string;
  ollamaUrl?: string;
}

/** Cifrado de secretos en disco (la app de escritorio usa el almacén seguro del sistema). */
export interface SecretCodec {
  encrypt(plain: string): string;
  decrypt(stored: string): string;
}

const identity: SecretCodec = { encrypt: (s) => s, decrypt: (s) => s };

export type ConfigPatch = { [K in keyof AppConfig]?: string | null };

export interface ConfigStore {
  readonly dir: string;
  get(): AppConfig;
  update(patch: ConfigPatch): AppConfig;
  ocrProvider(): OcrProvider;
  /** Clave efectiva: la guardada en la app o, si no hay, la del entorno (.env). */
  apiKey(): { key: string; source: 'app' | 'env' } | null;
  ocrModel(): string;
  ocrEffort(): OcrEffort;
  localOcrModel(): string;
  tutorModel(): string;
  ollamaUrl(): string;
}

export class ConfigError extends Error {}

const OLLAMA_MODEL_RE = /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)?(:[a-z0-9][a-z0-9._-]*)?$/i;

function validUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function createConfigStore(dir: string, codec: SecretCodec = identity): ConfigStore {
  const file = join(dir, 'config.json');
  let cfg: AppConfig = {};

  try {
    if (existsSync(file)) {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
      if (typeof raw.apiKey === 'string' && raw.apiKey) {
        try {
          cfg.apiKey = codec.decrypt(raw.apiKey);
        } catch {
          // Clave cifrada en otro equipo o con otro usuario: se descarta.
        }
      }
      if (OCR_PROVIDERS.includes(raw.ocrProvider as OcrProvider)) cfg.ocrProvider = raw.ocrProvider as OcrProvider;
      if (typeof raw.ocrModel === 'string') cfg.ocrModel = raw.ocrModel;
      if (typeof raw.ocrEffort === 'string' && OCR_EFFORTS.includes(raw.ocrEffort as OcrEffort)) cfg.ocrEffort = raw.ocrEffort as OcrEffort;
      if (typeof raw.localOcrModel === 'string' && OLLAMA_MODEL_RE.test(raw.localOcrModel)) cfg.localOcrModel = raw.localOcrModel;
      if (typeof raw.tutorModel === 'string' && OLLAMA_MODEL_RE.test(raw.tutorModel)) cfg.tutorModel = raw.tutorModel;
      if (typeof raw.ollamaUrl === 'string' && validUrl(raw.ollamaUrl)) cfg.ollamaUrl = raw.ollamaUrl;
    }
  } catch {
    cfg = {};
  }

  const save = () => {
    mkdirSync(dir, { recursive: true });
    const out: Record<string, unknown> = { ...cfg };
    if (cfg.apiKey) out.apiKey = codec.encrypt(cfg.apiKey);
    const tmp = `${file}.tmp`;
    writeFileSync(tmp, JSON.stringify(out, null, 2), 'utf8');
    renameSync(tmp, file);
  };

  /** Asigna un campo de texto validado (vacío o null = volver al valor por defecto). */
  const setField = <K extends keyof AppConfig>(next: AppConfig, key: K, value: string | null | undefined, valid: (v: string) => boolean, error: string) => {
    if (value === undefined) return;
    const v = value?.trim() ?? '';
    if (v && !valid(v)) throw new ConfigError(error);
    if (v) next[key] = v as AppConfig[K];
    else delete next[key];
  };

  return {
    dir,
    get: () => ({ ...cfg }),
    update(patch) {
      const next = { ...cfg };
      setField(next, 'ocrProvider', patch.ocrProvider, (v) => OCR_PROVIDERS.includes(v as OcrProvider), 'Proveedor de reconocimiento no válido.');
      setField(next, 'apiKey', patch.apiKey, (v) => /^[\x21-\x7e]{20,300}$/.test(v), 'La clave de la API no tiene un formato válido.');
      setField(next, 'ocrModel', patch.ocrModel, (v) => /^claude-[a-z0-9.-]{2,60}$/.test(v), 'Nombre de modelo no válido.');
      setField(next, 'ocrEffort', patch.ocrEffort, (v) => OCR_EFFORTS.includes(v as OcrEffort), 'Nivel de esfuerzo no válido.');
      setField(next, 'localOcrModel', patch.localOcrModel, (v) => OLLAMA_MODEL_RE.test(v), 'Nombre de modelo local no válido.');
      setField(next, 'tutorModel', patch.tutorModel, (v) => OLLAMA_MODEL_RE.test(v), 'Nombre de modelo local no válido.');
      setField(next, 'ollamaUrl', patch.ollamaUrl, validUrl, 'La dirección de Ollama no es válida (ejemplo: http://127.0.0.1:11434).');
      cfg = next;
      save();
      return { ...cfg };
    },
    ocrProvider: () => cfg.ocrProvider ?? 'local',
    apiKey() {
      if (cfg.apiKey) return { key: cfg.apiKey, source: 'app' };
      const env = process.env.ANTHROPIC_API_KEY?.trim();
      return env ? { key: env, source: 'env' } : null;
    },
    ocrModel: () => cfg.ocrModel || process.env.OCR_MODEL || DEFAULT_OCR_MODEL,
    ocrEffort() {
      const env = process.env.OCR_EFFORT as OcrEffort | undefined;
      return cfg.ocrEffort ?? (env && OCR_EFFORTS.includes(env) ? env : 'low');
    },
    localOcrModel: () => cfg.localOcrModel || DEFAULT_LOCAL_OCR_MODEL,
    tutorModel: () => cfg.tutorModel || DEFAULT_TUTOR_MODEL,
    ollamaUrl: () => cfg.ollamaUrl || process.env.OLLAMA_HOST_URL || DEFAULT_OLLAMA_URL,
  };
}
