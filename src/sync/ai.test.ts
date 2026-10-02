// IA del PC usada desde el móvil: los pedidos viajan por la conexión del emparejamiento
// (aquí, un canal en memoria que pasa por JSON como la conexión real).
import { describe, expect, it } from 'vitest';
import type { AnyMessage } from '../canvas/protocol';
import type { TutorRequest } from '../lib/api';
import { RemoteAi } from '../phone/ai';
import { AiHost, type AiBackend } from './aiHost';
import type { AiMessage } from './messages';

const tick = () => new Promise((r) => setTimeout(r, 0));

function setup(backend: Partial<AiBackend> = {}) {
  const toHost: string[] = [];
  const phones: { device: string; ai: RemoteAi; online: boolean }[] = [];
  const host = new AiHost(
    (m: AiMessage) => {
      // Lo que envía el PC llega a todos los móviles.
      for (const p of phones) p.ai.handle(JSON.parse(JSON.stringify(m)) as AnyMessage);
    },
    {
      status: () => ({ ocr: true, tutor: true }),
      recognize: async (png) => ({ lines: [`leído:${png.length}`] }),
      askTutor: async (_req, onText) => {
        onText('Hola ');
        onText('mundo');
      },
      ...backend,
    },
  );
  const phone = (device: string) => {
    const p = { device, online: true, ai: null as unknown as RemoteAi };
    p.ai = new RemoteAi((m) => toHost.push(JSON.stringify(m)), () => device, () => p.online);
    phones.push(p);
    return p;
  };
  const deliver = async () => {
    while (toHost.length) host.handle(JSON.parse(toHost.shift()!) as AnyMessage);
    await tick();
    await tick();
  };
  return { host, phone, deliver };
}

const request: TutorRequest = { prompt: '¿Cuánto es $2+2$?' };

describe('IA del PC desde el móvil', () => {
  it('la lectura de la escritura vuelve solo al móvil que la pidió', async () => {
    const { phone, deliver } = setup();
    const a = phone('a');
    const b = phone('b');
    const ra = a.ai.recognize('data:image/png;base64,AAAA');
    const rb = b.ai.recognize('data:image/png;base64,BBBBBBBB');
    await deliver();
    await expect(ra).resolves.toEqual({ lines: ['leído:26'] });
    await expect(rb).resolves.toEqual({ lines: ['leído:30'] });
  });

  it('el tutor llega de a partes y termina', async () => {
    const { phone, deliver } = setup();
    const a = phone('a');
    let text = '';
    const done = a.ai.askTutor(request, (t) => (text += t));
    await deliver();
    await done;
    expect(text).toBe('Hola mundo');
  });

  it('detener el tutor en el móvil lo cancela en el PC', async () => {
    let aborted = false;
    const { phone, deliver } = setup({
      askTutor: (_req, onText, signal) =>
        new Promise((_resolve, reject) => {
          onText('Pensando');
          signal.addEventListener('abort', () => {
            aborted = true;
            reject(new Error('cancelado'));
          });
        }),
    });
    const a = phone('a');
    const ctrl = new AbortController();
    const done = a.ai.askTutor(request, () => {}, ctrl.signal);
    await deliver();
    ctrl.abort();
    await expect(done).rejects.toThrow();
    await deliver();
    expect(aborted).toBe(true);
  });

  it('los errores de la IA del PC llegan al móvil', async () => {
    const { phone, deliver } = setup({ recognize: async () => Promise.reject(new Error('Ollama no está abierto.')) });
    const a = phone('a');
    const r = expect(a.ai.recognize('png')).rejects.toThrow('Ollama no está abierto.');
    await deliver();
    await r;
  });

  it('sin conexión falla al instante, y lo pendiente falla si se corta', async () => {
    const { phone } = setup();
    const a = phone('a');
    const pending = a.ai.recognize('png');
    a.ai.disconnected();
    await expect(pending).rejects.toThrow('Se perdió la conexión con el PC.');
    a.online = false;
    await expect(a.ai.recognize('png')).rejects.toThrow(/Sin conexión con el PC/);
  });
});
