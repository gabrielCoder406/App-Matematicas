// Móvil: la IA (leer la escritura y el tutor DeepSeek Math) corre en el PC vinculado. Los pedidos
// viajan por la conexión con el PC y la respuesta vuelve marcada con el id del pedido.
import type { AnyMessage } from '../canvas/protocol';
import type { RemoteAi as RemoteAiApi, TutorRequest } from '../lib/api';
import type { AiMessage } from '../sync/messages';
import { randomId } from '../sync/meta';

/** La primera lectura con la IA local del PC puede tardar más de un minuto. */
const OCR_TIMEOUT_MS = 180_000;
const OFFLINE = 'Sin conexión con el PC: la IA corre en la app de escritorio. Abre la app en el PC (misma red Wi-Fi).';
const LOST = 'Se perdió la conexión con el PC.';

interface Waiting {
  resolve(v: { lines: string[] } | void): void;
  reject(e: Error): void;
  onText?(t: string): void;
}

export class RemoteAi implements RemoteAiApi {
  private waiting = new Map<string, Waiting>();

  constructor(
    private send: (m: AiMessage) => void,
    private device: () => string,
    private online: () => boolean,
  ) {}

  recognize(image: string): Promise<{ lines: string[] }> {
    if (!this.online()) return Promise.reject(new Error(OFFLINE));
    const id = randomId(8);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new Error('El PC no respondió a tiempo. Vuelve a intentarlo.'));
      }, OCR_TIMEOUT_MS);
      this.waiting.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v as { lines: string[] });
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.send({ type: 'ai-ocr', device: this.device(), id, image });
    });
  }

  askTutor(request: TutorRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<void> {
    if (!this.online()) return Promise.reject(new Error(OFFLINE));
    const id = randomId(8);
    return new Promise((resolve, reject) => {
      const abort = () => {
        this.waiting.delete(id);
        this.send({ type: 'ai-cancel', device: this.device(), id });
        reject(new DOMException('Cancelado', 'AbortError'));
      };
      if (signal?.aborted) {
        abort();
        return;
      }
      signal?.addEventListener('abort', abort, { once: true });
      const done = () => signal?.removeEventListener('abort', abort);
      this.waiting.set(id, {
        resolve: () => {
          done();
          resolve();
        },
        reject: (e) => {
          done();
          reject(e);
        },
        onText,
      });
      this.send({ type: 'ai-tutor', device: this.device(), id, request });
    });
  }

  /** Atiende una respuesta del PC; devuelve false si no es de la IA. */
  handle(m: AnyMessage): boolean {
    if (m.type !== 'ai-ocr-result' && m.type !== 'ai-tutor-text' && m.type !== 'ai-tutor-end') return false;
    if (m.to !== this.device()) return true;
    const w = this.waiting.get(m.id);
    if (!w) return true;
    if (m.type === 'ai-tutor-text') {
      w.onText?.(m.text);
      return true;
    }
    this.waiting.delete(m.id);
    if (m.error) w.reject(new Error(m.error));
    else w.resolve(m.type === 'ai-ocr-result' ? { lines: m.lines } : undefined);
    return true;
  }

  /** Se cortó la conexión: los pedidos en curso fallan (se pueden repetir al reconectar). */
  disconnected(): void {
    const all = [...this.waiting.values()];
    this.waiting.clear();
    for (const w of all) w.reject(new Error(LOST));
  }
}
