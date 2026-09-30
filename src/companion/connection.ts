// Conexión del móvil (acompañante) con la app de escritorio por WebSocket.
import type { AnyMessage, PairTarget, PeerMessage } from '../canvas/protocol';

export type LinkStatus =
  /** Abriendo la conexión (o reintentando tras un corte). */
  | 'connecting'
  /** Conectado y la app del PC está abierta. */
  | 'online'
  /** Conectado al servidor, pero la ventana del PC se cerró o se está recargando. */
  | 'host-offline'
  /** No responde nadie en esa dirección (se sigue reintentando). */
  | 'unreachable'
  /** Rechazado (código incorrecto, demasiados dispositivos…): hay que volver a emparejar. */
  | 'rejected';

interface Events {
  status(s: LinkStatus, detail?: string): void;
  message(m: AnyMessage): void;
}

const REJECT_CODES = new Set([4001, 4002, 4004, 4005]);

export function wsUrlFor(target: PairTarget | null): string {
  const qs = (code: string) => `role=companion&code=${encodeURIComponent(code)}`;
  if (!target) {
    // Página servida por el propio PC (navegador del móvil): mismo origen.
    const code = new URLSearchParams(location.search).get('code') ?? '';
    return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?${qs(code)}`;
  }
  const host = target.host.includes(':') ? `[${target.host}]` : target.host;
  return `ws://${host}:${target.port}/ws?${qs(target.code)}`;
}

export class CompanionLink {
  private ws: WebSocket | null = null;
  private closed = false;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private joined = false;
  private invalidRetries = 0;
  private lastError = '';

  constructor(private url: string, private ev: Events) {}

  open(): void {
    this.closed = false;
    this.connect();
  }

  /** Reintenta ya (p. ej., al volver la app a primer plano). */
  kick(): void {
    if (this.closed || (this.ws && this.ws.readyState <= WebSocket.OPEN)) return;
    this.connect();
  }

  close(): void {
    this.closed = true;
    if (this.retry) clearTimeout(this.retry);
    this.ws?.close();
    this.ws = null;
  }

  send(m: PeerMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  private schedule(ms: number): void {
    if (this.retry) clearTimeout(this.retry);
    this.retry = setTimeout(() => this.connect(), ms);
  }

  private connect(): void {
    if (this.closed) return;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    if (this.failures < 3) this.ev.status('connecting');
    let opened = false;
    let sock: WebSocket;
    try {
      sock = new WebSocket(this.url);
    } catch {
      this.ev.status('rejected', 'La dirección del PC no es válida.');
      return;
    }
    this.ws = sock;
    sock.onopen = () => {
      opened = true;
      this.failures = 0;
      this.send({ type: 'hello', device: /Mobi|Android/i.test(navigator.userAgent) ? 'móvil' : 'tablet' });
    };
    sock.onmessage = (e) => {
      let msg: AnyMessage;
      try {
        msg = JSON.parse(e.data as string);
      } catch {
        return;
      }
      if (msg.type === 'joined') {
        this.joined = true;
        this.invalidRetries = 0;
        this.ev.status('online');
      } else if (msg.type === 'host') {
        this.ev.status(msg.online ? 'online' : 'host-offline');
      } else if (msg.type === 'error') {
        this.lastError = msg.message;
      }
      this.ev.message(msg);
    };
    sock.onclose = (e) => {
      if (this.ws !== sock) return;
      this.ws = null;
      if (this.closed) return;
      if (REJECT_CODES.has(e.code)) {
        // Código desconocido: puede que la app del PC se esté abriendo; unos reintentos y luego error.
        if (e.code === 4001 && this.invalidRetries < 3) {
          this.invalidRetries++;
          this.ev.status('connecting');
          this.schedule(2500);
          return;
        }
        this.ev.status('rejected', this.lastError || 'La app del PC rechazó la conexión.');
        return;
      }
      if (!opened) this.failures++;
      if (this.failures >= 3) this.ev.status('unreachable');
      else this.ev.status('connecting');
      this.schedule(this.joined ? 1500 : Math.min(6000, 1500 * this.failures));
    };
  }
}
