// Conexión del móvil (acompañante) con la app de escritorio por WebSocket. Una sola conexión
// sirve para todo: la pizarra remota, la sincronización del progreso y la IA del PC.
import type { AnyMessage, LinkMessage, PairTarget } from '../canvas/protocol';

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

export interface LinkEvents {
  status?(s: LinkStatus, detail?: string): void;
  message?(m: AnyMessage): void;
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

/** Dirección http del PC (para /api/health). */
export function httpBaseFor(target: PairTarget): string {
  const host = target.host.includes(':') ? `[${target.host}]` : target.host;
  return `http://${host}:${target.port}`;
}

/** «móvil» o «tablet»: lo que se informa al PC al conectarse. */
export function deviceKind(): string {
  return /Mobi|Android/i.test(navigator.userAgent) ? 'móvil' : 'tablet';
}

export class CompanionLink {
  status: LinkStatus = 'connecting';
  /** Motivo del rechazo (si `status` es 'rejected'). */
  detail?: string;
  private ws: WebSocket | null = null;
  private closed = false;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private joined = false;
  private invalidRetries = 0;
  private lastError = '';
  private listeners = new Set<LinkEvents>();

  /**
   * `invalidRetries`: reintentos rápidos si el PC no reconoce el código (puede que su app se esté
   * abriendo). Cada uno cuenta como intento fallido en el servidor, que bloquea tras 10 en 10 min.
   */
  constructor(private url: string, private opts: { invalidRetries?: number } = {}) {}

  subscribe(ev: LinkEvents): () => void {
    this.listeners.add(ev);
    return () => {
      this.listeners.delete(ev);
    };
  }

  open(): void {
    this.closed = false;
    this.connect();
  }

  /** Reintenta ya (p. ej., al volver la app a primer plano). */
  kick(): void {
    if (this.closed || this.status === 'rejected' || (this.ws && this.ws.readyState <= WebSocket.OPEN)) return;
    this.connect();
  }

  close(): void {
    this.closed = true;
    if (this.retry) clearTimeout(this.retry);
    this.ws?.close();
    this.ws = null;
  }

  send(m: LinkMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  private setStatus(s: LinkStatus, detail?: string): void {
    this.status = s;
    this.detail = detail;
    for (const l of [...this.listeners]) l.status?.(s, detail);
  }

  private schedule(ms: number): void {
    if (this.retry) clearTimeout(this.retry);
    this.retry = setTimeout(() => this.connect(), ms);
  }

  private connect(): void {
    if (this.closed) return;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    if (this.failures < 3) this.setStatus('connecting');
    let opened = false;
    let sock: WebSocket;
    try {
      sock = new WebSocket(this.url);
    } catch {
      this.setStatus('rejected', 'La dirección del PC no es válida.');
      return;
    }
    this.ws = sock;
    sock.onopen = () => {
      opened = true;
      this.failures = 0;
      this.send({ type: 'hello', device: deviceKind() });
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
        this.setStatus('online');
      } else if (msg.type === 'host') {
        if (msg.online !== (this.status === 'online')) this.setStatus(msg.online ? 'online' : 'host-offline');
      } else if (msg.type === 'error') {
        this.lastError = msg.message;
      }
      for (const l of [...this.listeners]) l.message?.(msg);
    };
    sock.onclose = (e) => {
      if (this.ws !== sock) return;
      this.ws = null;
      if (this.closed) return;
      if (REJECT_CODES.has(e.code)) {
        // Código desconocido: puede que la app del PC se esté abriendo; unos reintentos y luego error.
        if (e.code === 4001 && this.invalidRetries < (this.opts.invalidRetries ?? 3)) {
          this.invalidRetries++;
          this.setStatus('connecting');
          this.schedule(2500);
          return;
        }
        this.setStatus('rejected', this.lastError || 'La app del PC rechazó la conexión.');
        return;
      }
      if (!opened) this.failures++;
      if (this.failures >= 3) this.setStatus('unreachable');
      else this.setStatus('connecting');
      // Sin respuesta durante un rato (fuera de casa, PC apagado): se reintenta cada vez menos seguido.
      this.schedule(this.joined ? 1500 : Math.min(this.failures > 8 ? 30_000 : 6000, 1500 * this.failures));
    };
  }
}
