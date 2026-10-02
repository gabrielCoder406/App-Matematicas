// Sincronización del progreso entre el PC (autoridad) y los móviles (réplicas), con la conexión
// simulada como el servidor real: lo que envía el PC llega a todos los móviles, y cada mensaje
// pasa por JSON.
import { describe, expect, it } from 'vitest';
import type { AnyMessage } from '../canvas/protocol';
import { ancestors } from '../content/curriculum';
import { applyAttempt, emptyProgress, isMastered, type AttemptInput } from '../learning/engine';
import type { ProgressData } from '../learning/types';
import { SyncAuthority } from './authority';
import type { SyncMessage } from './messages';
import { addPending, commitLocal, newSyncMeta, nextEnvelope, type SyncMeta } from './meta';
import { applyOp, hasProgress, validEnvelope, type ProgressOp } from './ops';
import { SyncReplica, type ReplicaStatus } from './replica';
import type { SyncStore } from './store';

const T0 = 1_700_000_000_000;

const attempt = (skillId: string, correct: boolean, extra: Partial<AttemptInput> = {}): ProgressOp => ({
  k: 'attempt',
  input: {
    skillId, generatorId: 'g', seed: 1, level: 1, correct, hintsUsed: 0, activeMs: 20000, expectedMs: 30000,
    reason: 'practice', answerKind: 'numeric', ...extra,
    error: correct ? undefined : { exerciseId: 'e', prompt: 'Calcula $2+2$', student: '5', message: 'No.' },
  },
});

class Device implements SyncStore {
  data: ProgressData;
  meta: SyncMeta;
  clock: number;
  constructor(isPc: boolean, data?: ProgressData) {
    this.data = data ?? emptyProgress(T0);
    this.meta = newSyncMeta(isPc);
    this.clock = T0;
  }
  read() {
    return { data: this.data, meta: this.meta };
  }
  write(next: { data?: ProgressData; meta: SyncMeta }) {
    if (next.data) this.data = next.data;
    this.meta = next.meta;
  }
}

/** Red simulada: cola de mensajes que se entregan con `flush()`, como el servidor de emparejamiento. */
class Net {
  queue: { to: 'host' | Phone; msg: string }[] = [];
  host!: Pc;
  phones: Phone[] = [];
  fromHost(m: SyncMessage) {
    for (const p of this.phones) if (p.connected) this.queue.push({ to: p, msg: JSON.stringify(m) });
  }
  fromPhone(m: SyncMessage) {
    this.queue.push({ to: 'host', msg: JSON.stringify(m) });
  }
  flush(limit = 1000) {
    while (this.queue.length && limit-- > 0) {
      const { to, msg } = this.queue.shift()!;
      const m = JSON.parse(msg) as AnyMessage;
      if (to === 'host') this.host.authority.handle(m);
      else if (to.connected) to.replica.handle(m);
    }
  }
}

class Pc extends Device {
  authority: SyncAuthority;
  remote: number[] = [];
  constructor(public net: Net, data?: ProgressData) {
    super(true, data);
    net.host = this;
    this.authority = new SyncAuthority(this, (m) => net.fromHost(m), { version: '1', now: () => this.clock, onRemote: (ops) => this.remote.push(ops.length) });
  }
  do(op: ProgressOp) {
    this.clock += 60_000;
    const r = commitLocal(this.data, this.meta, op, { authority: true, coalesce: false, now: this.clock });
    this.data = r.data;
    this.meta = r.meta;
    this.authority.localApplied(r.env);
    return r.events;
  }
}

class Phone extends Device {
  replica: SyncReplica;
  connected = false;
  statuses: ReplicaStatus[] = [];
  constructor(public net: Net, data?: ProgressData) {
    super(false, data);
    net.phones.push(this);
    this.replica = new SyncReplica(this, (m) => this.connected && net.fromPhone(m), { version: '1', now: () => this.clock, onStatus: (s) => this.statuses.push(s) });
  }
  do(op: ProgressOp) {
    this.clock += 60_000;
    const r = commitLocal(this.data, this.meta, op, { authority: false, coalesce: !this.replica.live, now: this.clock });
    this.data = r.data;
    this.meta = r.meta;
    this.replica.localApplied(r.env);
    return r.events;
  }
  connect() {
    this.connected = true;
    this.replica.connected();
  }
  disconnect() {
    this.connected = false;
    this.replica.disconnected();
  }
  get phase() {
    return this.replica.status.phase;
  }
}

/** El progreso sin los ajustes propios de cada dispositivo. */
function shared(d: ProgressData) {
  const { theme: _t, virtualKeyboard: _v, ...settings } = d.settings;
  return { ...d, settings };
}

function setup(pcData?: ProgressData) {
  const net = new Net();
  const pc = new Pc(net, pcData);
  return { net, pc, phone: () => new Phone(net) };
}

describe('operaciones', () => {
  it('aplicar la misma operación da exactamente el mismo resultado (ids incluidos)', () => {
    const d0 = applyOp(emptyProgress(T0), { id: 'x-1', dev: 'x', seq: 1, t: T0, op: { k: 'placement', known: [...ancestors('alg.linear-equations')], weak: [] } }).data;
    const env = { id: 'pc-7', dev: 'pc', seq: 7, t: T0 + 1000, op: attempt('alg.linear-equations', false, { bug: 'sign.term' }) };
    const a = applyOp(structuredClone(d0), env);
    const b = applyOp(JSON.parse(JSON.stringify(d0)) as ProgressData, JSON.parse(JSON.stringify(env)));
    expect(a.data).toEqual(b.data);
    expect(a.data.attempts.at(-1)?.id).toBe('pc-7');
    expect(a.data.errors.at(-1)?.id).toBe('pc-7e');
  });

  it('valida las operaciones que llegan por la red', () => {
    const ok = nextEnvelope(newSyncMeta(false), attempt('arith.signs', true), T0);
    expect(validEnvelope(JSON.parse(JSON.stringify(ok)))).toBe(true);
    expect(validEnvelope({ ...ok, seq: 0 })).toBe(false);
    expect(validEnvelope({ ...ok, op: { k: 'borrar-todo' } })).toBe(false);
    expect(validEnvelope({ ...ok, op: { k: 'attempt', input: { skillId: 'arith.signs' } } })).toBe(false);
    expect(validEnvelope({ ...ok, op: { k: 'time', ms: 5000, day: 'ayer' } })).toBe(false);
    expect(validEnvelope(null)).toBe(false);
  });

  it('sin conexión, el tiempo seguido del mismo tema se junta en una operación', () => {
    const meta = newSyncMeta(false);
    const t = (ms: number, skill = 'arith.signs'): ProgressOp => ({ k: 'time', ms, day: '2026-10-01', skill });
    let pending = addPending([], nextEnvelope(meta, t(10_000), T0), true);
    pending = addPending(pending, nextEnvelope({ ...meta, seq: 1 }, t(10_000), T0), true);
    pending = addPending(pending, nextEnvelope({ ...meta, seq: 2 }, t(5_000, 'arith.fractions'), T0), true);
    expect(pending).toHaveLength(2);
    expect(pending[0].op).toMatchObject({ k: 'time', ms: 20_000 });
    expect(addPending(pending, nextEnvelope({ ...meta, seq: 3 }, t(1_000, 'arith.fractions'), T0), false)).toHaveLength(3);
  });

  it('el nombre o el tiempo suelto no cuentan como progreso', () => {
    let d = applyOp(emptyProgress(T0), { id: 'a-1', dev: 'a', seq: 1, t: T0, op: { k: 'profile', name: 'Ana' } }).data;
    d = applyOp(d, { id: 'a-2', dev: 'a', seq: 2, t: T0, op: { k: 'time', ms: 60_000, day: '2026-10-01', skill: 'arith.signs' } }).data;
    expect(hasProgress(d)).toBe(false);
    expect(hasProgress(applyOp(d, { id: 'a-3', dev: 'a', seq: 3, t: T0, op: attempt('arith.signs', true) }).data)).toBe(true);
  });
});

describe('vincular el móvil', () => {
  it('un móvil nuevo adopta el progreso del PC', () => {
    const { net, pc, phone } = setup();
    pc.do({ k: 'profile', name: 'Gabriel' });
    pc.do({ k: 'onboarded', value: true });
    for (let i = 0; i < 4; i++) pc.do(attempt('arith.number-sets', true));
    const p = phone();
    p.do({ k: 'onboarded', value: true }); // pasó la bienvenida antes de vincular
    p.connect();
    net.flush();
    expect(p.phase).toBe('ready');
    expect(p.meta.profile).toBe(pc.meta.profile);
    expect(p.meta.pending).toEqual([]);
    expect(shared(p.data)).toEqual(shared(pc.data));
    expect(p.meta.lastSync).not.toBeNull();
  });

  it('si el PC está vacío, recibe el progreso del móvil', () => {
    const { net, pc, phone } = setup();
    const p = phone();
    p.do({ k: 'onboarded', value: true });
    for (let i = 0; i < 3; i++) p.do(attempt('logic.connectives', true));
    p.connect();
    net.flush();
    expect(p.phase).toBe('ready');
    expect(pc.data.attempts).toHaveLength(3);
    expect(pc.data.onboarded).toBe(true);
    expect(shared(pc.data)).toEqual(shared(p.data));
  });

  it('si ambos tienen progreso, pregunta; «combinar» suma lo del móvil al PC', () => {
    const { net, pc, phone } = setup();
    for (let i = 0; i < 2; i++) pc.do(attempt('arith.number-sets', true));
    const p = phone();
    for (let i = 0; i < 3; i++) p.do(attempt('logic.connectives', true));
    p.connect();
    net.flush();
    expect(p.phase).toBe('conflict');
    expect(p.replica.status.conflict).toEqual({ canCombine: true });
    expect(pc.data.attempts).toHaveLength(2);
    p.replica.resolve('combine');
    net.flush();
    expect(p.phase).toBe('ready');
    expect(pc.data.attempts).toHaveLength(5);
    expect(pc.data.skills['logic.connectives'].attempts).toBe(3);
    expect(shared(p.data)).toEqual(shared(pc.data));
  });

  it('«usar el del PC» descarta lo del móvil y «usar el del móvil» reemplaza el del PC', () => {
    for (const choice of ['pc', 'phone'] as const) {
      const { net, pc, phone } = setup();
      pc.do(attempt('arith.number-sets', true));
      const p = phone();
      p.do(attempt('logic.connectives', true));
      p.do(attempt('logic.connectives', false));
      p.connect();
      net.flush();
      p.replica.resolve(choice);
      net.flush();
      expect(shared(p.data)).toEqual(shared(pc.data));
      expect(pc.data.attempts).toHaveLength(choice === 'pc' ? 1 : 2);
      expect(!!pc.data.skills['logic.connectives']).toBe(choice === 'phone');
    }
  });
});

describe('compatibilidad', () => {
  it('si la app del PC no responde a la sincronización (versión anterior), el móvil lo avisa', async () => {
    const store = new Device(false);
    const statuses: string[] = [];
    const r = new SyncReplica(store, () => {}, { version: '1', helloTimeoutMs: 5, onStatus: (s) => statuses.push(s.phase) });
    r.connected();
    await new Promise((res) => setTimeout(res, 20));
    expect(r.status.phase).toBe('unsupported');
    expect(statuses).toEqual(['hello', 'unsupported']);
  });

  it('con otro protocolo de sincronización no se mezcla el progreso', () => {
    const { net, pc, phone } = setup();
    pc.do(attempt('arith.number-sets', true));
    const p = phone();
    const handle = pc.authority.handle.bind(pc.authority);
    // Un PC de una versión futura responde con otro protocolo.
    net.host.authority.handle = (m) => {
      if (m.type !== 'progress-hello') return handle(m);
      net.fromHost({ type: 'progress-info', to: m.device, profile: pc.meta.profile!, rev: pc.meta.rev, hasProgress: true, version: '9.0.0', proto: 99 });
      return true;
    };
    p.connect();
    net.flush();
    expect(p.phase).toBe('unsupported');
    expect(p.meta.profile).toBeNull();
    expect(p.data.attempts).toEqual([]);
  });
});

describe('sincronización', () => {
  function linked() {
    const s = setup();
    const p = s.phone();
    p.connect();
    s.net.flush();
    return { ...s, p };
  }

  it('con conexión, cada cambio llega al otro dispositivo al instante', () => {
    const { net, pc, p } = linked();
    p.do(attempt('arith.number-sets', true));
    net.flush();
    expect(pc.data.attempts).toHaveLength(1);
    expect(p.meta.pending).toEqual([]);
    pc.do(attempt('arith.number-sets', false));
    net.flush();
    expect(p.data.attempts).toHaveLength(2);
    expect(shared(p.data)).toEqual(shared(pc.data));
    expect(pc.remote).toEqual([1]);
  });

  it('lo hecho sin conexión se envía al reconectar, sin perder lo hecho en el PC', () => {
    const { net, pc, p } = linked();
    p.disconnect();
    for (let i = 0; i < 6; i++) p.do(attempt('arith.number-sets', true));
    p.do({ k: 'time', ms: 10_000, day: '2026-10-01', skill: 'arith.number-sets' });
    p.do({ k: 'time', ms: 10_000, day: '2026-10-01', skill: 'arith.number-sets' });
    for (let i = 0; i < 2; i++) pc.do(attempt('logic.connectives', true));
    expect(p.meta.pending).toHaveLength(7); // el tiempo se juntó
    p.connect();
    net.flush();
    expect(p.phase).toBe('ready');
    expect(p.meta.pending).toEqual([]);
    expect(pc.data.attempts).toHaveLength(8);
    expect(pc.data.days['2026-10-01'].activeMs).toBe(20_000);
    expect(isMastered(pc.data, 'arith.number-sets')).toBe(true);
    expect(shared(p.data)).toEqual(shared(pc.data));
  });

  it('una operación reenviada tras un corte no se aplica dos veces', () => {
    const { net, pc, p } = linked();
    p.do(attempt('arith.number-sets', true));
    const pending = p.meta.pending;
    net.flush();
    expect(pc.data.attempts).toHaveLength(1);
    // El móvil no recibió la confirmación y vuelve a enviar lo mismo.
    net.fromPhone({ type: 'progress-push', device: p.meta.device, profile: p.meta.profile!, ops: pending });
    net.flush();
    expect(pc.data.attempts).toHaveLength(1);
  });

  it('con dos móviles, lo de uno llega al otro', () => {
    const { net, pc, p } = linked();
    const q = new Phone(net);
    q.connect();
    net.flush();
    p.do(attempt('arith.number-sets', true));
    q.do(attempt('logic.connectives', true));
    pc.do(attempt('sets.basics', true));
    net.flush();
    for (const d of [p, q]) expect(shared(d.data)).toEqual(shared(pc.data));
    expect(pc.data.attempts).toHaveLength(3);
  });

  it('si se pierde un mensaje, el móvil pide el progreso completo', () => {
    const { net, pc, p } = linked();
    pc.do(attempt('arith.number-sets', true));
    net.queue = []; // se pierde
    pc.do(attempt('arith.number-sets', true));
    net.flush();
    expect(shared(p.data)).toEqual(shared(pc.data));
    expect(p.data.attempts).toHaveLength(2);
  });

  it('el tema y el teclado de cada dispositivo no se sincronizan; la meta diaria sí', () => {
    const { net, pc, p } = linked();
    p.data = { ...p.data, settings: { ...p.data.settings, theme: 'dark', virtualKeyboard: false } };
    pc.data = { ...pc.data, settings: { ...pc.data.settings, theme: 'light' } };
    pc.do({ k: 'settings', patch: { dailyGoalMinutes: 30 } });
    net.flush();
    expect(p.data.settings).toMatchObject({ theme: 'dark', virtualKeyboard: false, dailyGoalMinutes: 30 });
    p.disconnect();
    p.connect();
    net.flush();
    expect(p.data.settings.theme).toBe('dark');
  });

  it('borrar el progreso en el PC lo borra también en el móvil', () => {
    const { net, pc, p } = linked();
    p.do(attempt('arith.number-sets', true));
    net.flush();
    pc.do({ k: 'reset' });
    net.flush();
    expect(p.data.attempts).toEqual([]);
    expect(p.data.skills).toEqual({});
  });

  it('si el PC empieza de cero (otro perfil), el móvil le devuelve su progreso', () => {
    const { net, pc, p } = linked();
    for (let i = 0; i < 3; i++) p.do(attempt('arith.number-sets', true));
    net.flush();
    // Se borró la carpeta de datos del PC: progreso nuevo con otro perfil.
    pc.data = emptyProgress(T0);
    pc.meta = newSyncMeta(true);
    p.disconnect();
    p.connect();
    net.flush();
    expect(pc.data.attempts).toHaveLength(3);
    expect(p.meta.profile).toBe(pc.meta.profile);
  });

  it('los refuerzos creados en el móvil se completan igual en el PC', () => {
    const known = [...ancestors('alg.linear-equations')];
    const { net, pc, p } = linked();
    pc.do({ k: 'placement', known, weak: [] });
    net.flush();
    p.do(attempt('alg.linear-equations', false, { bug: 'sign.term' }));
    p.do(attempt('alg.linear-equations', false, { bug: 'sign.term' }));
    const rem = p.data.remediation.find((r) => r.remaining > 0);
    expect(rem).toBeDefined();
    for (let i = 0; i < 3; i++) p.do(attempt('arith.signs', true, { reason: 'remedial', remediationId: rem!.id }));
    net.flush();
    expect(pc.data.remediation.find((r) => r.id === rem!.id)?.remaining).toBe(0);
    expect(shared(p.data)).toEqual(shared(pc.data));
  });

  it('el resultado no depende de en qué dispositivo se hizo cada ejercicio', () => {
    const { net, pc, p } = linked();
    let solo = emptyProgress(T0);
    const ops = [true, true, false, true, true, true, false, true].map((c) => attempt('arith.number-sets', c));
    ops.forEach((op, i) => {
      if (i % 2) p.do(op);
      else pc.do(op);
      net.flush();
      solo = applyAttempt(solo, (op as Extract<ProgressOp, { k: 'attempt' }>).input, T0).data;
    });
    const sp = pc.data.skills['arith.number-sets'];
    expect(sp.attempts).toBe(8);
    expect(sp.pL).toBeCloseTo(solo.skills['arith.number-sets'].pL, 10);
    expect(shared(p.data)).toEqual(shared(pc.data));
  });
});
