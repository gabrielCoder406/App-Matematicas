// OCR de escritura matemática manuscrita → líneas en LaTeX, usando la API de Claude.
import Anthropic from '@anthropic-ai/sdk';
import type { OcrEffort } from './config';

const SYSTEM = `You transcribe handwritten mathematics from an image into LaTeX.
The image comes from a digital whiteboard where a student writes math, usually one step per line (the student writes in Spanish).

Rules:
- Return one entry per written line, from top to bottom. Each entry is a LaTeX string without $ delimiters and without \\begin{aligned}.
- Transcribe exactly what is written, including mistakes. Never correct, simplify or solve anything.
- Use standard LaTeX: \\frac{a}{b}, \\sqrt{x}, \\sqrt[n]{x}, x^{2}, \\cdot for an explicit multiplication dot, \\le, \\ge, \\neq, \\pm, \\infty, \\pi.
- Functions: write sine as \\sin (students may write "sen"), \\cos, \\tan, \\ln, \\log.
- Logic: \\neg, \\land, \\lor, \\Rightarrow, \\Leftrightarrow; truth values V and F. Sets: \\cup, \\cap, \\setminus, A^{c}, \\{1, 2\\}, \\emptyset.
- Use a period as decimal separator (a written "3,5" is 3.5 unless it is clearly a list).
- Ignore strokes that are crossed out or scribbled over, arrows, and doodles. Keep words like "o" between solutions as \\text{ o }.
- If nothing mathematical is written, return an empty list.`;

const SCHEMA = {
  type: 'object',
  properties: {
    lines: { type: 'array', items: { type: 'string' }, description: 'LaTeX de cada línea escrita, de arriba hacia abajo.' },
  },
  required: ['lines'],
  additionalProperties: false,
} as const;

export interface OcrOptions {
  /** Sin clave explícita, el SDK usa las credenciales del entorno. */
  apiKey?: string;
  model: string;
  effort: OcrEffort;
}

export class OcrError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

// Un cliente por clave (se recrea si el usuario cambia la clave en Ajustes).
let cached: { key: string | undefined; client: Anthropic } | null = null;

function clientFor(apiKey?: string): Anthropic {
  if (!cached || cached.key !== apiKey) cached = { key: apiKey, client: new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 }) };
  return cached.client;
}

function apiError(e: unknown, model: string): OcrError {
  if (e instanceof OcrError) return e;
  if (e instanceof Anthropic.AuthenticationError) return new OcrError('La clave de la API no es válida. Revísala en Ajustes.', 401);
  if (e instanceof Anthropic.PermissionDeniedError) return new OcrError('La clave de la API no tiene permiso para usar este modelo.', 403);
  if (e instanceof Anthropic.NotFoundError) return new OcrError(`El modelo «${model}» no está disponible para esta clave.`, 404);
  if (e instanceof Anthropic.RateLimitError) return new OcrError('Se alcanzó el límite de uso de la API. Intenta en unos segundos.', 429);
  if (e instanceof Anthropic.BadRequestError) return new OcrError(`Solicitud rechazada por la API: ${e.message}`, 400);
  if (e instanceof Anthropic.APIConnectionError) return new OcrError('No hay conexión con la API de Claude. Revisa la conexión a Internet.', 503);
  if (e instanceof Anthropic.APIError) return new OcrError(`Error de la API (${e.status}): ${e.message}`, 502);
  return new OcrError(e instanceof Error ? e.message : 'Error desconocido en el OCR.');
}

export async function recognizeHandwriting(pngBase64: string, opts: OcrOptions): Promise<{ lines: string[]; model: string }> {
  try {
    const response = await clientFor(opts.apiKey).beta.messages.create({
      model: opts.model,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      output_config: { effort: opts.effort, format: { type: 'json_schema', schema: SCHEMA as unknown as Record<string, unknown> } },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/png', data: pngBase64 } },
            { type: 'text', text: 'Transcribe the handwritten math in this image.' },
          ],
        },
      ],
    });
    if (response.stop_reason === 'refusal') throw new OcrError('El modelo no pudo procesar esta imagen.', 422);
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') throw new OcrError('Respuesta vacía del OCR.', 502);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.text);
    } catch {
      throw new OcrError('No se pudo interpretar la respuesta del OCR.', 502);
    }
    const lines = (parsed as { lines?: unknown }).lines;
    if (!Array.isArray(lines) || !lines.every((l) => typeof l === 'string')) throw new OcrError('Formato inesperado en la respuesta del OCR.', 502);
    return { lines: lines.map((l) => l.trim()).filter(Boolean), model: response.model };
  } catch (e) {
    throw apiError(e, opts.model);
  }
}

/** Comprueba la clave sin gastar tokens: consulta los datos del modelo configurado. */
export async function testApiKey(opts: Omit<OcrOptions, 'effort'>): Promise<{ model: string; displayName: string }> {
  try {
    const info = await clientFor(opts.apiKey).models.retrieve(opts.model);
    return { model: info.id, displayName: info.display_name };
  } catch (e) {
    throw apiError(e, opts.model);
  }
}
