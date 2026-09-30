// Servidor local de la app: API (OCR, configuración, red), WebSocket de emparejamiento
// con el móvil y, si se indica, la interfaz compilada. Lo usan tanto `npm run dev` /
// `npm start` (server/index.ts) como la app de escritorio (electron/main.ts).
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { hostname, networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { ConfigError, createConfigStore, type ConfigStore, type SecretCodec } from './config';
import { recognizeLocal } from './localOcr';
import { OcrError, recognizeHandwriting, testApiKey } from './ocr';
import { hasModel, OllamaError, ollamaStatus, pullModel, sameModel } from './ollama';
import { createPairingServer } from './pairing';
import { parseTutorRequest, tutorStream, type TutorRequest } from './tutor';

export interface ServerOptions {
  port: number;
  /** Si el puerto está ocupado, prueba los siguientes (0 = no probar otros). */
  portFallbacks?: number;
  /** Interfaz de escucha; por defecto todas, para que el móvil entre por la red local. */
  listenHost?: string;
  /** Carpeta con la interfaz compilada (dist); sin ella solo se sirve la API. */
  distDir?: string | null;
  /** Carpeta donde se guarda la configuración (clave de la API, etc.). */
  dataDir: string;
  secrets?: SecretCodec;
  version?: string;
  desktop?: boolean;
}

export interface RunningServer {
  port: number;
  config: ConfigStore;
  close(): Promise<void>;
}

const VIRTUAL_ADAPTER = /vEthernet|VirtualBox|VMware|WSL|Hyper-V|Tailscale|ZeroTier|docker|Loopback|Bluetooth|VPN|Npcap|Hamachi|Radmin|utun|llw|awdl|br-|veth/i;

/** Direcciones IPv4 de la red local, primero las redes domésticas típicas. */
export function lanAddresses(): string[] {
  const out: string[] = [];
  for (const [name, list] of Object.entries(networkInterfaces())) {
    if (VIRTUAL_ADAPTER.test(name)) continue;
    for (const a of list ?? []) {
      if (a.family !== 'IPv4' || a.internal || a.address.startsWith('169.254.')) continue;
      out.push(a.address);
    }
  }
  const rank = (ip: string) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2);
  return [...new Set(out)].sort((a, b) => rank(a) - rank(b));
}

const LOCAL_NAMES = new Set(['localhost', '127.0.0.1', '::1']);

/** La interfaz compilada no usa scripts en línea ni eval; KaTeX sí necesita estilos en línea. */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

function isLoopback(addr: string | undefined): boolean {
  return !!addr && (addr === '::1' || addr.startsWith('127.') || addr.startsWith('::ffff:127.'));
}

function hostnameOf(hostHeader: string): string {
  return hostHeader.replace(/:\d+$/, '').replace(/^\[|\]$/g, '').toLowerCase();
}

/**
 * Operaciones sensibles (clave de la API, OCR con cargo a la cuenta del usuario):
 * solo desde este equipo y con un Host/Origin propio (evita el «DNS rebinding»).
 */
function localOnly(req: Request, res: Response, next: NextFunction): void {
  const known = (h: string) => LOCAL_NAMES.has(h) || lanAddresses().includes(h);
  let ok = isLoopback(req.socket.remoteAddress) && known(hostnameOf(req.headers.host ?? ''));
  const origin = req.headers.origin;
  if (ok && origin && origin !== 'null') {
    try {
      ok = known(new URL(origin).hostname.replace(/^\[|\]$/g, '').toLowerCase());
    } catch {
      ok = false;
    }
  }
  if (!ok) {
    res.status(403).json({ error: 'Esta función solo está disponible desde el equipo donde corre la app.' });
    return;
  }
  next();
}

function keyHint(key: string): string {
  return key.length > 12 ? `${key.slice(0, 7)}…${key.slice(-4)}` : '…';
}

async function listen(server: Server, port: number, host: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (e: Error) => {
      server.off('listening', onListening);
      reject(e);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve((server.address() as AddressInfo).port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

export async function startServer(opts: ServerOptions): Promise<RunningServer> {
  const config = createConfigStore(opts.dataDir, opts.secrets);
  const claudeReady = () => !!config.apiKey() || !!process.env.ANTHROPIC_AUTH_TOKEN;
  const ocrReady = async () => (config.ocrProvider() === 'claude' ? claudeReady() : hasModel(config.ollamaUrl(), config.localOcrModel()));
  const tutorReady = () => hasModel(config.ollamaUrl(), config.tutorModel());
  let port = opts.port;

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', async (_req, res) => {
    // Público (el móvil lo usa para comprobar que encontró el PC).
    res.set('Access-Control-Allow-Origin', '*');
    const [ocr, tutor] = await Promise.all([ocrReady(), tutorReady()]);
    res.json({ ok: true, app: 'matematica', ocr, tutor, version: opts.version ?? '', desktop: !!opts.desktop, name: hostname() });
  });

  app.get('/api/network', (_req, res) => {
    res.json({ addresses: lanAddresses(), serverPort: port });
  });

  const configView = async () => {
    const key = config.apiKey();
    return {
      ocrProvider: config.ocrProvider(),
      hasKey: !!key,
      keySource: key?.source ?? null,
      keyHint: key ? keyHint(key.key) : null,
      ocrModel: config.ocrModel(),
      ocrEffort: config.ocrEffort(),
      localOcrModel: config.localOcrModel(),
      tutorModel: config.tutorModel(),
      ollamaUrl: config.ollamaUrl(),
      ocr: await ocrReady(),
      desktop: !!opts.desktop,
    };
  };

  app.get('/api/config', localOnly, async (_req, res) => {
    res.json(await configView());
  });

  app.put('/api/config', localOnly, async (req, res) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const pick = (k: string) => (body[k] === null ? null : typeof body[k] === 'string' ? (body[k] as string) : undefined);
    try {
      config.update({
        ocrProvider: pick('ocrProvider'),
        apiKey: pick('apiKey'),
        ocrModel: pick('ocrModel'),
        ocrEffort: pick('ocrEffort'),
        localOcrModel: pick('localOcrModel'),
        tutorModel: pick('tutorModel'),
        ollamaUrl: pick('ollamaUrl'),
      });
      res.json(await configView());
    } catch (e) {
      res.status(e instanceof ConfigError ? 400 : 500).json({ error: e instanceof Error ? e.message : 'No se pudo guardar la configuración.' });
    }
  });

  app.post('/api/config/test', localOnly, async (req, res) => {
    const candidate = typeof req.body?.apiKey === 'string' ? (req.body.apiKey as string).trim() : '';
    const key = candidate || config.apiKey()?.key;
    if (!key && !process.env.ANTHROPIC_AUTH_TOKEN) {
      res.status(400).json({ error: 'Primero escribe una clave de la API.' });
      return;
    }
    try {
      const info = await testApiKey({ apiKey: key, model: config.ocrModel() });
      res.json({ ok: true, ...info });
    } catch (e) {
      const err = e instanceof OcrError ? e : new OcrError('No se pudo comprobar la clave.');
      res.status(err.status).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------------- IA local (Ollama)

  app.get('/api/ai/status', localOnly, async (_req, res) => {
    const base = config.ollamaUrl();
    const st = await ollamaStatus(base);
    const installed = (m: string) => st.models.some((x) => sameModel(x, m));
    res.json({
      ollama: { url: base, running: st.running, version: st.version ?? null },
      ocr: { model: config.localOcrModel(), installed: installed(config.localOcrModel()) },
      tutor: { model: config.tutorModel(), installed: installed(config.tutorModel()) },
    });
  });

  // Descarga uno de los modelos configurados, informando el progreso (una línea JSON por evento).
  app.post('/api/ai/pull', localOnly, async (req, res) => {
    const which = req.body?.which;
    const model = which === 'ocr' ? config.localOcrModel() : which === 'tutor' ? config.tutorModel() : null;
    if (!model) {
      res.status(400).json({ error: 'Modelo no válido.' });
      return;
    }
    const ctrl = new AbortController();
    res.on('close', () => !res.writableEnded && ctrl.abort());
    res.set({ 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.flushHeaders();
    const line = (o: unknown) => `${JSON.stringify(o)}\n`;
    try {
      await pullModel(config.ollamaUrl(), model, (p) => res.write(line({ status: p.status, completed: p.completed, total: p.total })), ctrl.signal);
      res.end(line({ status: 'success' }));
    } catch (e) {
      res.end(line({ error: e instanceof Error ? e.message : 'No se pudo descargar el modelo.' }));
    }
  });

  app.post('/api/ocr', localOnly, async (req, res) => {
    const image = typeof req.body?.image === 'string' ? (req.body.image as string) : '';
    const data = image.replace(/^data:image\/png;base64,/, '');
    if (!data || data.length < 100) {
      res.status(400).json({ error: 'Falta la imagen (PNG en base64).' });
      return;
    }
    if (config.ocrProvider() === 'local') {
      try {
        res.json(await recognizeLocal(config.ollamaUrl(), config.localOcrModel(), data));
      } catch (e) {
        const err = e instanceof OllamaError ? e : new OllamaError('Error inesperado en la IA local.', 500);
        res.status(err.status).json({ error: `${err.message} También puedes usar Claude: Ajustes → Reconocimiento de escritura.` });
      }
      return;
    }
    if (!claudeReady()) {
      res.status(503).json({ error: 'Falta la clave de la API de Claude: agrégala en Ajustes o usa la IA local (DeepSeek).' });
      return;
    }
    try {
      const result = await recognizeHandwriting(data, { apiKey: config.apiKey()?.key, model: config.ocrModel(), effort: config.ocrEffort() });
      res.json(result);
    } catch (e) {
      const err = e instanceof OcrError ? e : new OcrError('Error inesperado en el OCR.');
      res.status(err.status).json({ error: err.message });
    }
  });

  // Tutor (DeepSeek Math): la explicación llega en streaming, como texto plano.
  app.post('/api/tutor', localOnly, async (req, res) => {
    let request: TutorRequest;
    try {
      request = parseTutorRequest(req.body);
    } catch (e) {
      res.status(400).json({ error: (e as Error).message });
      return;
    }
    const base = config.ollamaUrl();
    const model = config.tutorModel();
    const st = await ollamaStatus(base);
    if (!st.running) {
      res.status(503).json({ error: 'Ollama no está abierto. Ábrelo para usar el tutor (DeepSeek Math).' });
      return;
    }
    if (!st.models.some((m) => sameModel(m, model))) {
      res.status(404).json({ error: 'Falta el modelo del tutor (DeepSeek Math). Descárgalo en Ajustes.' });
      return;
    }
    const ctrl = new AbortController();
    res.on('close', () => !res.writableEnded && ctrl.abort());
    res.set({ 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.flushHeaders();
    try {
      await tutorStream(base, model, request, (t) => res.write(t), ctrl.signal);
      res.end();
    } catch (e) {
      if (!ctrl.signal.aborted) res.end(`\n\n⚠️ ${e instanceof Error ? e.message : 'El tutor no pudo responder.'}`);
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.' });
  });

  if (opts.distDir) {
    const dist = opts.distDir;
    const html = (res: Response) => res.set({ 'Cache-Control': 'no-cache', 'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff' });
    app.use('/assets', express.static(join(dist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
    app.use(express.static(dist, { index: false, maxAge: 0, setHeaders: (res, file) => file.endsWith('.html') && html(res as unknown as Response) }));
    // Rutas de la interfaz (React Router): siempre index.html.
    app.get(/^\/(?!api\/|ws).*/, (_req, res) => {
      html(res);
      res.sendFile('index.html', { root: dist });
    });
  }

  const server = createServer(app);
  const wss = createPairingServer();
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws')) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  const host = opts.listenHost ?? '0.0.0.0';
  const attempts = (opts.portFallbacks ?? 0) + 1;
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      port = await listen(server, opts.port + i, host);
      lastError = undefined;
      break;
    } catch (e) {
      lastError = e;
      if ((e as NodeJS.ErrnoException).code !== 'EADDRINUSE') break;
    }
  }
  if (lastError) throw lastError;

  return {
    port,
    config,
    close: () =>
      new Promise<void>((resolve) => {
        for (const ws of wss.clients) ws.terminate();
        wss.close();
        server.close(() => resolve());
        server.closeAllConnections?.();
      }),
  };
}
