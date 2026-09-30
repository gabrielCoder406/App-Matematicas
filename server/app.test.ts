// Servidor local: emparejamiento PC ↔ móvil por código y protección de la configuración.
import { mkdtempSync, rmSync } from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { startServer, type RunningServer } from './app';

const running: RunningServer[] = [];
const dirs: string[] = [];

async function server(dataDir?: string) {
  const dir = dataDir ?? mkdtempSync(join(tmpdir(), 'mate-test-'));
  if (!dataDir) dirs.push(dir);
  const srv = await startServer({ port: 0, listenHost: '127.0.0.1', dataDir: dir });
  running.push(srv);
  return { srv, dir };
}

afterEach(async () => {
  await Promise.all(running.splice(0).map((s) => s.close()));
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

type Msg = { type: string; [k: string]: unknown };

function connect(port: number, qs: string) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?${qs}`);
  const inbox: Msg[] = [];
  const waiters: { pred: (m: Msg) => boolean; resolve: (m: Msg) => void }[] = [];
  let closed: { code: number } | null = null;
  const closeWaiters: ((c: number) => void)[] = [];
  ws.on('message', (d) => {
    const m = JSON.parse(d.toString()) as Msg;
    const i = waiters.findIndex((w) => w.pred(m));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(m);
    else inbox.push(m);
  });
  ws.on('close', (code) => {
    closed = { code };
    closeWaiters.forEach((f) => f(code));
  });
  return {
    ws,
    next(type: string): Promise<Msg> {
      const i = inbox.findIndex((m) => m.type === type);
      if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]);
      return new Promise((resolve, reject) => {
        waiters.push({ pred: (m) => m.type === type, resolve });
        setTimeout(() => reject(new Error(`timeout esperando «${type}»`)), 3000);
      });
    },
    closedWith(): Promise<number> {
      if (closed) return Promise.resolve(closed.code);
      return new Promise((resolve) => closeWaiters.push(resolve));
    },
    send(m: unknown) {
      ws.send(JSON.stringify(m));
    },
    close() {
      ws.close();
    },
  };
}

describe('emparejamiento', () => {
  it('une el móvil con el código de 6 dígitos y retransmite los mensajes', async () => {
    const { srv } = await server();
    const host = connect(srv.port, 'role=host');
    const session = await host.next('session');
    expect(session.id).toMatch(/^\d{6}$/);
    expect(String(session.secret).length).toBeGreaterThanOrEqual(20);

    const phone = connect(srv.port, `role=companion&code=${session.id}`);
    await phone.next('joined');
    expect((await host.next('peers')).count).toBe(0);
    expect((await host.next('peers')).count).toBe(1);

    phone.send({ type: 'stroke-start', id: 'a', tool: 'pen', color: 'ink', size: 5, pts: [[1, 2, 0.5, 0]] });
    expect((await host.next('stroke-start')).id).toBe('a');
    host.send({ type: 'board', width: 1600, height: 640, title: 'Ejercicio', prompt: 'Resuelve $x+1=2$' });
    expect((await phone.next('board')).prompt).toBe('Resuelve $x+1=2$');
    host.close();
    phone.close();
  });

  it('acepta el código con espacios (como se muestra en pantalla)', async () => {
    const { srv } = await server();
    const host = connect(srv.port, 'role=host');
    const { id } = await host.next('session');
    const spaced = `${String(id).slice(0, 3)}%20${String(id).slice(3)}`;
    const phone = connect(srv.port, `role=companion&code=${spaced}`);
    await phone.next('joined');
    host.close();
    phone.close();
  });

  it('rechaza un código incorrecto y bloquea tras muchos intentos', async () => {
    const { srv } = await server();
    const host = connect(srv.port, 'role=host');
    const { id } = await host.next('session');
    const wrong = id === '000000' ? '111111' : '000000';
    for (let i = 0; i < 10; i++) {
      const bad = connect(srv.port, `role=companion&code=${wrong}`);
      expect((await bad.next('error')).message).toMatch(/código/i);
      expect(await bad.closedWith()).toBe(4001);
    }
    // Bloqueado aunque ahora use el código correcto
    const blocked = connect(srv.port, `role=companion&code=${id}`);
    expect(await blocked.closedWith()).toBe(4005);
    host.close();
  });

  it('el PC recupera el mismo código tras reiniciar el servidor', async () => {
    const { srv, dir } = await server();
    const host = connect(srv.port, 'role=host');
    const s1 = await host.next('session');
    host.close();
    await srv.close();
    running.splice(running.indexOf(srv), 1);

    const { srv: srv2 } = await server(dir);
    const host2 = connect(srv2.port, `role=host&session=${s1.id}&secret=${s1.secret}`);
    const s2 = await host2.next('session');
    expect(s2.id).toBe(s1.id);
    const phone = connect(srv2.port, `role=companion&code=${s1.id}`);
    await phone.next('joined');
    host2.close();
    phone.close();
  });

  it('no permite tomar una sesión ajena sin el secreto', async () => {
    const { srv } = await server();
    const host = connect(srv.port, 'role=host');
    const s1 = await host.next('session');
    const intruder = connect(srv.port, `role=host&session=${s1.id}&secret=${'x'.repeat(24)}`);
    const s2 = await intruder.next('session');
    expect(s2.id).not.toBe(s1.id);
    host.close();
    intruder.close();
  });
});

describe('API local', () => {
  it('health es público y la configuración solo desde este equipo', async () => {
    const { srv } = await server();
    const base = `http://127.0.0.1:${srv.port}`;
    const health = await fetch(`${base}/api/health`);
    expect(health.headers.get('access-control-allow-origin')).toBe('*');
    expect(((await health.json()) as { ok: boolean }).ok).toBe(true);

    expect((await fetch(`${base}/api/config`)).status).toBe(200);
    // DNS rebinding: un Host ajeno no puede leer ni cambiar la clave (fetch no deja cambiar Host)
    const evilStatus = await new Promise<number>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port: srv.port, path: '/api/config', headers: { Host: 'evil.example' } }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', reject);
      req.end();
    });
    expect(evilStatus).toBe(403);
    const cross = await fetch(`${base}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' }, body: JSON.stringify({ apiKey: null }) });
    expect(cross.status).toBe(403);
  });

  it('guarda la clave sin devolverla', async () => {
    const { srv } = await server();
    const base = `http://127.0.0.1:${srv.port}`;
    const key = 'sk-ant-test-0123456789abcdefghijklmnop';
    const saved = (await (await fetch(`${base}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: key }) })).json()) as { hasKey: boolean; keySource: string };
    expect(saved.hasKey).toBe(true);
    expect(saved.keySource).toBe('app');
    expect(JSON.stringify(saved)).not.toContain(key);
    const bad = await fetch(`${base}/api/config`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ocrEffort: 'turbo' }) });
    expect(bad.status).toBe(400);
  });
});
