// PC: atiende los pedidos de IA de los móviles vinculados (leer la escritura y el tutor), con la
// misma IA que usa la app de escritorio. La respuesta va marcada con el móvil y el pedido.
import type { AnyMessage } from '../canvas/protocol';
import type { TutorRequest } from '../lib/api';
import type { AiMessage } from './messages';

export interface AiBackend {
  status(): { ocr: boolean; tutor: boolean };
  recognize(png: string): Promise<{ lines: string[] }>;
  askTutor(req: TutorRequest, onText: (t: string) => void, signal: AbortSignal): Promise<void>;
}

const MAX_IMAGE = 6 * 1024 * 1024;

export class AiHost {
  /** Lecturas en curso por móvil (una a la vez: la IA local del PC es lenta). */
  private reading = new Set<string>();
  private tutors = new Map<string, AbortController>();

  constructor(
    private send: (m: AiMessage) => void,
    private ai: AiBackend,
  ) {}

  /** Informa a los móviles qué IA hay disponible. */
  announce(): void {
    this.send({ type: 'ai-status', ...this.ai.status() });
  }

  handle(msg: AnyMessage): boolean {
    switch (msg.type) {
      case 'ai-ocr':
        void this.ocr(msg);
        return true;
      case 'ai-tutor':
        void this.tutor(msg);
        return true;
      case 'ai-cancel':
        this.tutors.get(`${msg.device}:${msg.id}`)?.abort();
        return true;
      default:
        return false;
    }
  }

  private async ocr(m: Extract<AiMessage, { type: 'ai-ocr' }>): Promise<void> {
    const reply = (lines: string[], error?: string) => this.send({ type: 'ai-ocr-result', to: m.device, id: m.id, lines, error });
    if (typeof m.image !== 'string' || m.image.length > MAX_IMAGE) return reply([], 'La imagen es demasiado grande.');
    if (this.reading.has(m.device)) return reply([], 'Ya hay una lectura en curso: espera a que termine.');
    this.reading.add(m.device);
    try {
      const { lines } = await this.ai.recognize(m.image);
      reply(lines);
    } catch (e) {
      reply([], e instanceof Error ? e.message : 'No se pudo leer la escritura.');
    } finally {
      this.reading.delete(m.device);
    }
  }

  private async tutor(m: Extract<AiMessage, { type: 'ai-tutor' }>): Promise<void> {
    const key = `${m.device}:${m.id}`;
    const ctrl = new AbortController();
    this.tutors.get(key)?.abort();
    this.tutors.set(key, ctrl);
    try {
      await this.ai.askTutor(m.request, (text) => this.send({ type: 'ai-tutor-text', to: m.device, id: m.id, text }), ctrl.signal);
      if (!ctrl.signal.aborted) this.send({ type: 'ai-tutor-end', to: m.device, id: m.id });
    } catch (e) {
      if (!ctrl.signal.aborted) this.send({ type: 'ai-tutor-end', to: m.device, id: m.id, error: e instanceof Error ? e.message : 'El tutor no pudo responder.' });
    } finally {
      if (this.tutors.get(key) === ctrl) this.tutors.delete(key);
    }
  }
}
