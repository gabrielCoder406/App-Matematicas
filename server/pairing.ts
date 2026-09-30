// Emparejamiento PC ↔ móvil: sesiones con un código de 6 dígitos y retransmisión de mensajes.
// El servidor no interpreta los trazos: solo reenvía los mensajes JSON (coordenadas,
// presión y velocidad) entre el anfitrión (PC) y los acompañantes (móviles).
//
// - El anfitrión recibe { id, secret }. Con ese par puede retomar la sesión (por ejemplo,
//   tras reiniciar la app), así el código que ya conoce el móvil sigue sirviendo.
// - El móvil se une solo con el código (lo que muestra el QR o lo que se escribe a mano).
//   Los intentos fallidos se limitan por dirección IP.
import { randomBytes, randomInt } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';

interface Session {
  id: string;
  secret: string;
  host: WebSocket | null;
  companions: Set<WebSocket>;
  hostLeftAt: number | null;
}

const MAX_COMPANIONS = 3;
/** Un tablero lleno se envía entero al sincronizar: se admiten mensajes grandes. */
export const MAX_MESSAGE = 8 * 1024 * 1024;
const HOST_GRACE_MS = 30 * 60 * 1000;
const FAIL_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILS = 10;

export const CODE_RE = /^\d{6}$/;
const SECRET_RE = /^[a-z0-9]{20,64}$/;

function secret(): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(randomBytes(24), (b) => alphabet[b % alphabet.length]).join('');
}

function send(ws: WebSocket | null, msg: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
}

export function normalizeCode(raw: string | null | undefined): string {
  return (raw ?? '').replace(/\D/g, '');
}

export function createPairingServer(): WebSocketServer {
  const sessions = new Map<string, Session>();
  const fails = new Map<string, { count: number; first: number }>();
  const alive = new WeakMap<WebSocket, boolean>();

  const newCode = (): string => {
    for (;;) {
      const c = String(randomInt(0, 1_000_000)).padStart(6, '0');
      if (!sessions.has(c)) return c;
    }
  };

  const notifyPeers = (s: Session): void => {
    send(s.host, { type: 'peers', count: s.companions.size });
    for (const c of s.companions) send(c, { type: 'host', online: !!s.host && s.host.readyState === WebSocket.OPEN });
  };

  const blocked = (ip: string): boolean => {
    const f = fails.get(ip);
    if (!f) return false;
    if (Date.now() - f.first > FAIL_WINDOW_MS) {
      fails.delete(ip);
      return false;
    }
    return f.count >= MAX_FAILS;
  };

  const fail = (ip: string): void => {
    const f = fails.get(ip);
    if (!f || Date.now() - f.first > FAIL_WINDOW_MS) fails.set(ip, { count: 1, first: Date.now() });
    else f.count++;
  };

  const attachHost = (ws: WebSocket, url: URL): void => {
    const wantId = url.searchParams.get('session') ?? '';
    const wantSecret = url.searchParams.get('secret') ?? '';
    let s = sessions.get(wantId);
    if (!s || s.secret !== wantSecret) {
      // Retomar una sesión anterior (servidor reiniciado) si el código está libre.
      const restore = !s && CODE_RE.test(wantId) && SECRET_RE.test(wantSecret);
      s = { id: restore ? wantId : newCode(), secret: restore ? wantSecret : secret(), host: null, companions: new Set(), hostLeftAt: null };
      sessions.set(s.id, s);
    }
    if (s.host && s.host !== ws) s.host.close(4000, 'Otra ventana tomó el control de la sesión');
    s.host = ws;
    s.hostLeftAt = null;
    const session = s;
    send(ws, { type: 'session', id: session.id, secret: session.secret });
    notifyPeers(session);

    ws.on('message', (data: RawData, isBinary) => {
      if (isBinary) return;
      const text = data.toString();
      for (const c of session.companions) send(c, text);
    });
    ws.on('close', () => {
      if (session.host === ws) {
        session.host = null;
        session.hostLeftAt = Date.now();
        notifyPeers(session);
      }
    });
  };

  const attachCompanion = (ws: WebSocket, url: URL, ip: string): void => {
    if (blocked(ip)) {
      send(ws, { type: 'error', message: 'Demasiados intentos con códigos incorrectos. Espera unos minutos y vuelve a intentarlo.' });
      ws.close(4005, 'blocked');
      return;
    }
    const code = normalizeCode(url.searchParams.get('code') ?? url.searchParams.get('session'));
    const s = sessions.get(code);
    if (!s) {
      fail(ip);
      send(ws, { type: 'error', message: 'El código no es válido o la pizarra del PC está cerrada. Revisa el código que muestra la app de escritorio.' });
      ws.close(4001, 'invalid');
      return;
    }
    fails.delete(ip);
    if (s.companions.size >= MAX_COMPANIONS) {
      send(ws, { type: 'error', message: 'Ya hay demasiados dispositivos conectados a esta pizarra.' });
      ws.close(4002, 'full');
      return;
    }
    s.companions.add(ws);
    send(ws, { type: 'joined', id: s.id });
    notifyPeers(s);

    ws.on('message', (data: RawData, isBinary) => {
      if (isBinary) return;
      send(s.host, data.toString());
    });
    ws.on('close', () => {
      s.companions.delete(ws);
      notifyPeers(s);
    });
  };

  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_MESSAGE });
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    alive.set(ws, true);
    ws.on('pong', () => alive.set(ws, true));
    ws.on('error', () => ws.terminate());
    const url = new URL(req.url ?? '/', 'http://localhost');
    const role = url.searchParams.get('role');
    if (role === 'host') attachHost(ws, url);
    else if (role === 'companion') attachCompanion(ws, url, req.socket.remoteAddress ?? '?');
    else ws.close(4003, 'role');
  });

  const timer = setInterval(() => {
    for (const ws of wss.clients) {
      if (alive.get(ws) === false) {
        ws.terminate();
        continue;
      }
      alive.set(ws, false);
      ws.ping();
    }
    const now = Date.now();
    for (const [id, s] of sessions) {
      if (!s.host && s.hostLeftAt && now - s.hostLeftAt > HOST_GRACE_MS) {
        for (const c of s.companions) c.close(4004, 'expired');
        sessions.delete(id);
      }
    }
  }, 20_000);
  timer.unref?.();
  wss.on('close', () => clearInterval(timer));
  return wss;
}
