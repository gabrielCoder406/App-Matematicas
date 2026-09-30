// Conexión del anfitrión (PC) con los móviles emparejados (app Android o navegador).
import { create } from 'zustand';
import { fetchNetwork } from '../lib/api';
import { activity } from '../lib/activity';
import { kv } from '../lib/storage';
import type { InkCanvasHandle } from './InkCanvas';
import type { InkModel } from './ink';
import { pairUrl, type AnyMessage, type PeerMessage } from './protocol';

export interface PairingState {
  status: 'idle' | 'connecting' | 'ready' | 'error';
  peers: number;
  /** Enlace del QR. */
  url?: string;
  /** Código de 6 dígitos que se escribe en el móvil. */
  code?: string;
  /** Dirección IP y puerto que el móvil debe usar. */
  address?: string;
  port?: number;
  error?: string;
}

export const usePairing = create<PairingState>()(() => ({ status: 'idle', peers: 0 }));

export interface BoardTarget {
  model: InkModel;
  width: number;
  height: number;
  title?: string;
  /** Enunciado del ejercicio que se muestra en el móvil. */
  prompt?: string;
  /** Tema del ejercicio (su ficha se sugiere en la wiki del móvil). */
  topic?: string;
  canvas?: () => InkCanvasHandle | null;
  onOcrRequest?(): void;
  /** Si existe, el móvil puede pedir «Comprobar». */
  onSubmit?(): void;
}

/** Acción que el móvil puede disparar cuando no hay tablero abierto (p. ej., abrir la escritura a mano). */
export interface Opener {
  /** Texto del botón en el móvil. */
  label: string;
  /** Encabezado que acompaña al botón. */
  title?: string;
  open(): void;
}

const STORE_KEY = 'mate-emparejamiento';

class HostPairing {
  private ws: WebSocket | null = null;
  private wanted = false;
  private retry: ReturnType<typeof setTimeout> | null = null;
  private boards: BoardTarget[] = [];
  private openers: Opener[] = [];
  /** Navegación de la app (la registra App para abrir la pizarra desde el móvil). */
  navigate: ((path: string) => void) | null = null;

  get board(): BoardTarget | null {
    return this.boards[this.boards.length - 1] ?? null;
  }

  get active(): boolean {
    return this.wanted;
  }

  start(): void {
    this.wanted = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this.connect();
  }

  /** Desconecta y olvida el código: los móviles emparejados tendrán que volver a escanear. */
  reset(): void {
    kv.removeItem(STORE_KEY);
    this.ws?.close();
    this.ws = null;
    usePairing.setState({ status: 'connecting', peers: 0, url: undefined, code: undefined });
    if (this.wanted) this.connect();
  }

  private connect(): void {
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    usePairing.setState({ status: 'connecting', error: undefined });
    let saved: { id: string; secret: string } | null = null;
    try {
      saved = JSON.parse(kv.getItem(STORE_KEY) ?? 'null');
    } catch {
      saved = null;
    }
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const qs = new URLSearchParams({ role: 'host' });
    if (saved?.id && saved.secret) {
      qs.set('session', saved.id);
      qs.set('secret', saved.secret);
    }
    let ws: WebSocket;
    try {
      ws = new WebSocket(`${proto}://${location.host}/ws?${qs}`);
    } catch {
      usePairing.setState({ status: 'error', error: 'No se pudo abrir la conexión.' });
      return;
    }
    this.ws = ws;
    ws.onmessage = (ev) => {
      let msg: AnyMessage;
      try {
        msg = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      this.handle(msg);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (this.wanted) {
        usePairing.setState({ status: 'connecting', peers: 0 });
        this.retry = setTimeout(() => this.connect(), 2000);
      }
    };
    ws.onerror = () => {
      usePairing.setState({ status: 'error', error: 'No hay conexión con el servidor local de la app.' });
    };
  }

  private async describe(code: string): Promise<void> {
    let host = location.hostname;
    const port = Number(location.port) || (location.protocol === 'https:' ? 443 : 80);
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(host)) {
      const net = await fetchNetwork();
      if (net?.addresses[0]) host = net.addresses[0];
    }
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(host);
    usePairing.setState({ url: pairUrl({ host, port, code }), address: local ? undefined : host, port });
  }

  send(msg: PeerMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  /** Envía el estado completo (tablero o «sin tablero») a los móviles. */
  sync(): void {
    const b = this.board;
    if (!b) {
      const o = this.openers[this.openers.length - 1];
      this.send({ type: 'idle', action: o?.label ?? 'Abrir la pizarra', title: o?.title ?? 'No hay una pizarra abierta en el PC' });
      return;
    }
    this.send({ type: 'board', width: b.width, height: b.height, title: b.title, prompt: b.prompt, canSubmit: !!b.onSubmit, topic: b.topic });
    this.send({ type: 'sync', strokes: b.model.toWire(), canUndo: b.model.canUndo, canRedo: b.model.canRedo });
  }

  attachBoard(target: BoardTarget): () => void {
    this.boards.push(target);
    this.sync();
    return () => {
      this.boards = this.boards.filter((b) => b !== target);
      this.sync();
    };
  }

  /** Registra qué hace el botón del móvil cuando no hay tablero abierto. */
  setOpener(opener: Opener): () => void {
    this.openers.push(opener);
    if (!this.board) this.sync();
    return () => {
      this.openers = this.openers.filter((o) => o !== opener);
      if (!this.board) this.sync();
    };
  }

  private handle(msg: AnyMessage): void {
    switch (msg.type) {
      case 'session': {
        kv.setItem(STORE_KEY, JSON.stringify({ id: msg.id, secret: msg.secret }));
        usePairing.setState({ status: 'ready', code: msg.id, error: undefined });
        void this.describe(msg.id);
        this.sync();
        return;
      }
      case 'peers': {
        const prev = usePairing.getState().peers;
        usePairing.setState({ peers: msg.count });
        if (msg.count > prev) this.sync();
        return;
      }
      case 'error':
        usePairing.setState({ status: 'error', error: msg.message });
        return;
      case 'hello':
        this.sync();
        return;
      case 'open-board': {
        const opener = this.openers[this.openers.length - 1];
        if (this.board) this.sync();
        else if (opener) opener.open();
        else this.navigate?.('/pizarra');
        return;
      }
      default:
        break;
    }
    const b = this.board;
    if (!b) {
      if (msg.type === 'stroke-start' || msg.type === 'undo' || msg.type === 'clear' || msg.type === 'ocr') this.sync();
      return;
    }
    const m = b.model;
    activity.poke();
    switch (msg.type) {
      case 'stroke-start':
        m.begin({ id: msg.id, tool: msg.tool, color: msg.color, size: msg.size, points: msg.pts.slice(), realPressure: msg.pts.some((p) => p[2] !== 0.5) });
        this.send(msg);
        break;
      case 'stroke-points':
        m.extend(msg.id, msg.pts);
        this.send(msg);
        break;
      case 'stroke-end':
        m.end(msg.id);
        this.send(msg);
        break;
      case 'erase':
        m.remove(msg.ids);
        this.sync();
        break;
      case 'undo':
        m.undo();
        this.sync();
        break;
      case 'redo':
        m.redo();
        this.sync();
        break;
      case 'clear':
        m.clear();
        this.sync();
        break;
      case 'laser':
        b.canvas?.()?.pushLaser(msg.x, msg.y);
        break;
      case 'laser-end':
        b.canvas?.()?.endLaser();
        break;
      case 'ocr':
        b.onOcrRequest?.();
        break;
      case 'submit':
        b.onSubmit?.();
        break;
      default:
        break;
    }
  }

  /** Eventos generados localmente en el PC que deben verse en el móvil. */
  local(msg: PeerMessage): void {
    if (msg.type === 'undo' || msg.type === 'redo' || msg.type === 'clear' || msg.type === 'erase') {
      this.sync();
      return;
    }
    this.send(msg);
  }
}

export const pairing = new HostPairing();
