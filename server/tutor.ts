// Tutor con IA local (DeepSeek Math vía Ollama): explica pasos y errores en español.
// La corrección la hace siempre el motor matemático de la app; el tutor solo la explica,
// así que recibe ese diagnóstico como contexto confiable.
import { generateStream } from './ollama';

export interface TutorStep {
  latex: string;
  status?: string;
  message?: string;
}

export interface TutorRequest {
  /** Enunciado (texto con $LaTeX$). */
  prompt?: string;
  /** Respuesta del alumno. */
  answer?: string;
  correct?: boolean;
  /** Mensaje de la corrección automática. */
  feedback?: string;
  /** Error detectado por el motor (nombre legible) y su recordatorio. */
  error?: string;
  tip?: string;
  /** Solución de referencia: solo si el alumno ya la vio o ya resolvió el ejercicio. */
  solution?: string[];
  /** Desarrollo escrito en la pizarra (línea 0 = enunciado). */
  steps?: TutorStep[];
  /** Tipo de desarrollo en la pizarra: ecuación, expresión, lógica… */
  mode?: string;
  question?: string;
}

const SYSTEM = [
  'Eres un tutor de matemáticas paciente para estudiantes de secundaria y primeros años de universidad.',
  'Responde siempre en español, con frases cortas y en no más de 10 líneas.',
  'Escribe las fórmulas en LaTeX entre signos $...$.',
  'La corrección automática que recibes es correcta: úsala como base y no la contradigas.',
  'Si el alumno se equivocó, señala el paso exacto y explica por qué está mal.',
  'No des el resultado final salvo que se incluya la solución de referencia.',
].join(' ');

const MAX = { text: 1500, steps: 20, solution: 12 };

function str(v: unknown, max = MAX.text): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
}

/** Valida y recorta lo que llega del navegador. */
export function parseTutorRequest(body: unknown): TutorRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  const steps = Array.isArray(b.steps)
    ? b.steps.slice(0, MAX.steps).map((s) => {
        const o = (s ?? {}) as Record<string, unknown>;
        return { latex: str(o.latex, 300) ?? '', status: str(o.status, 20), message: str(o.message, 300) };
      }).filter((s) => s.latex)
    : undefined;
  const solution = Array.isArray(b.solution) ? b.solution.slice(0, MAX.solution).map((s) => str(s, 300)).filter((s): s is string => !!s) : undefined;
  const req: TutorRequest = {
    prompt: str(b.prompt),
    answer: str(b.answer, 500),
    correct: typeof b.correct === 'boolean' ? b.correct : undefined,
    feedback: str(b.feedback, 600),
    error: str(b.error, 120),
    tip: str(b.tip, 400),
    solution: solution?.length ? solution : undefined,
    steps: steps?.length ? steps : undefined,
    mode: str(b.mode, 40),
    question: str(b.question, 400),
  };
  if (!req.prompt && !req.steps) throw new Error('Falta el ejercicio o los pasos a explicar.');
  return req;
}

const STATUS: Record<string, string> = { ok: 'correcto', error: 'INCORRECTO', 'parse-error': 'no se pudo leer', carried: 'arrastra un error anterior' };

/** Texto que recibe el modelo. */
export function buildTutorPrompt(r: TutorRequest): string {
  const out: string[] = [];
  if (r.prompt) out.push(`Ejercicio: ${r.prompt}`);
  if (r.steps) {
    out.push(`Desarrollo del alumno${r.mode ? ` (${r.mode})` : ''}, la línea 0 es el enunciado:`);
    r.steps.forEach((s, i) => {
      const verdict = i > 0 && s.status ? ` — ${STATUS[s.status] ?? s.status}${s.message ? `: ${s.message}` : ''}` : '';
      out.push(`${i}) $${s.latex}$${verdict}`);
    });
  }
  if (r.answer) out.push(`Respuesta del alumno: ${r.answer}`);
  if (r.correct !== undefined) out.push(`Corrección automática: ${r.correct ? 'la respuesta es CORRECTA' : 'la respuesta es INCORRECTA'}.${r.feedback ? ` ${r.feedback}` : ''}`);
  if (r.error) out.push(`Error detectado: ${r.error}.${r.tip ? ` Recordatorio: ${r.tip}` : ''}`);
  if (r.solution) out.push(`Solución de referencia:\n${r.solution.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  const question = r.question
    ?? (r.steps ? 'Revisa mis pasos y explícame qué está bien y qué está mal.'
      : r.correct ? 'Explícame por qué esta respuesta es correcta y cuál es la idea clave.'
        : 'Explícame en qué me equivoqué y cómo debo pensarlo, sin darme el resultado final.');
  out.push(`Pregunta del alumno: ${question}`);
  // Al final, donde un modelo pequeño le presta más atención.
  out.push('(Responde en español, en 3 a 6 frases, sin repetir ideas.)');
  return out.join('\n');
}

/**
 * Formato de chat de DeepSeekMath («sistema», «User:», «Assistant:»). La versión para Ollama
 * trae una plantilla que ignora el mensaje de sistema, por eso el texto se arma aquí.
 */
export function deepseekMathPrompt(r: TutorRequest): string {
  return `${SYSTEM}\n\nUser: ${buildTutorPrompt(r)}\n\nAssistant:`;
}

/**
 * Parámetros medidos con DeepSeekMath 7B (Q4) en un portátil sin tarjeta gráfica (~4 tokens/s):
 * respuestas de ~1 minuto. Una penalización de repetición mayor deforma el español y el LaTeX.
 */
const OPTIONS = { temperature: 0.3, num_ctx: 4096, num_predict: 320, repeat_penalty: 1.05, repeat_last_n: 128, stop: ['User:', '\n\n\n'] };

export async function tutorStream(base: string, model: string, r: TutorRequest, onToken: (t: string) => void, signal?: AbortSignal): Promise<void> {
  let started = false;
  await generateStream(base, model, deepseekMathPrompt(r), (t) => {
    // El modelo suele empezar con un espacio tras «Assistant:».
    const text = started ? t : t.replace(/^\s+/, '');
    if (text) {
      started = true;
      onToken(text);
    }
  }, OPTIONS, signal);
}
