// Estado de la sincronización que se guarda junto al progreso (en el mismo registro, así
// nunca quedan desparejos tras un cierre inesperado).
import type { EngineEvent } from '../learning/engine';
import type { ProgressData } from '../learning/types';
import { applyOp, type OpEnvelope, type ProgressOp } from './ops';

export interface SyncMeta {
  /** Este dispositivo. */
  device: string;
  /** Última operación creada aquí (cada dispositivo numera las suyas 1, 2, 3…). */
  seq: number;
  /** Progreso de referencia: lo crea el PC; en el móvil es el del PC vinculado (null: nunca se vinculó). */
  profile: string | null;
  /** PC: operaciones aplicadas hasta ahora (revisión del progreso). */
  rev: number;
  /** PC: última operación aplicada de cada móvil (así ninguna se aplica dos veces). */
  applied: Record<string, number>;
  /** Móvil: operaciones hechas aquí que el PC todavía no confirmó. */
  pending: OpEnvelope[];
  /** Móvil: última vez que quedó todo confirmado por el PC. PC: última operación recibida de un móvil. */
  lastSync: number | null;
}

export function randomId(len = 12): string {
  const alphabet = 'abcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** `authority`: el PC crea su propio progreso de referencia; el móvil espera a vincularse. */
export function newSyncMeta(authority: boolean): SyncMeta {
  return { device: randomId(10), seq: 0, profile: authority ? randomId(16) : null, rev: 0, applied: {}, pending: [], lastSync: null };
}

/** Lee el estado guardado; si falta o está dañado, empieza uno nuevo. */
export function loadSyncMeta(raw: unknown, authority: boolean): SyncMeta {
  const fresh = newSyncMeta(authority);
  if (!raw || typeof raw !== 'object') return fresh;
  const m = raw as Partial<SyncMeta>;
  if (typeof m.device !== 'string' || !m.device) return fresh;
  return {
    device: m.device,
    seq: Number.isInteger(m.seq) && m.seq! >= 0 ? m.seq! : 0,
    profile: typeof m.profile === 'string' && m.profile ? m.profile : authority ? fresh.profile : null,
    rev: Number.isInteger(m.rev) && m.rev! >= 0 ? m.rev! : 0,
    applied: m.applied && typeof m.applied === 'object' ? m.applied : {},
    pending: Array.isArray(m.pending) ? m.pending : [],
    lastSync: typeof m.lastSync === 'number' ? m.lastSync : null,
  };
}

/** Envuelve una operación nueva de este dispositivo (id = dispositivo + número de orden). */
export function nextEnvelope(meta: SyncMeta, op: ProgressOp, t: number): OpEnvelope {
  const seq = meta.seq + 1;
  return { id: `${meta.device}-${seq}`, dev: meta.device, seq, t, op };
}

/**
 * Agrega una operación a las pendientes del móvil. Sin conexión, el tiempo de estudio seguido
 * del mismo tema y día se suma a la operación anterior, para que la lista no crezca de más.
 */
export function addPending(pending: OpEnvelope[], env: OpEnvelope, coalesce: boolean): OpEnvelope[] {
  const last = pending[pending.length - 1];
  const op = env.op;
  if (coalesce && op.k === 'time' && last?.op.k === 'time' && last.op.day === op.day && last.op.skill === op.skill) {
    return [...pending.slice(0, -1), { ...last, op: { ...last.op, ms: last.op.ms + op.ms } }];
  }
  return [...pending, env];
}

export interface Committed {
  data: ProgressData;
  meta: SyncMeta;
  env: OpEnvelope;
  events: EngineEvent[];
}

/**
 * Aplica una operación hecha en este dispositivo y la registra: en el PC suma una revisión; en el
 * móvil queda pendiente hasta que el PC la confirme.
 */
export function commitLocal(data: ProgressData, meta: SyncMeta, op: ProgressOp, o: { authority: boolean; coalesce: boolean; now: number }): Committed {
  const env = nextEnvelope(meta, op, o.now);
  const r = applyOp(data, env);
  const next = o.authority
    ? { ...meta, seq: env.seq, rev: meta.rev + 1 }
    : { ...meta, seq: env.seq, pending: addPending(meta.pending, env, o.coalesce) };
  return { data: r.data, meta: next, env, events: r.events };
}
