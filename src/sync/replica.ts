// Móvil: muestra el progreso del PC vinculado más lo hecho en el móvil que el PC todavía no
// confirmó. Sin conexión todo funciona igual: las operaciones esperan y se envían al reconectar;
// el PC las aplica y devuelve el resultado, que reemplaza al calculado en el móvil.
import type { AnyMessage } from '../canvas/protocol';
import type { ProgressData } from '../learning/types';
import { SYNC_PROTOCOL, type SyncMessage } from './messages';
import { nextEnvelope } from './meta';
import { applyOp, hasProgress, withLocalSettings, type OpEnvelope } from './ops';
import type { SyncStore } from './store';

export type ReplicaPhase =
  /** Sin conexión con el PC. */
  | 'off'
  /** Conectado: preguntando al PC por su progreso. */
  | 'hello'
  /** Enviando lo pendiente y recibiendo el progreso del PC. */
  | 'syncing'
  /** Sincronizado: cada cambio viaja al instante. */
  | 'ready'
  /** Al vincular, el PC y el móvil tienen progreso distinto: hay que elegir qué hacer. */
  | 'conflict'
  /** La app del PC es de otra versión (anterior a la sincronización o con otro protocolo). */
  | 'unsupported';

/** Qué hacer si el PC y el móvil tienen progreso distinto al vincularlos. */
export type ConflictChoice = 'combine' | 'pc' | 'phone';

export interface ReplicaStatus {
  phase: ReplicaPhase;
  /** Solo en `conflict`: se puede sumar lo del móvil al PC (si nunca se vinculó con otro). */
  conflict: { canCombine: boolean } | null;
  /** El PC al que está conectado. */
  pc: { name?: string; version: string } | null;
}

export interface ReplicaOptions {
  version: string;
  onStatus?(s: ReplicaStatus): void;
  now?(): number;
  /** Cuánto esperar la respuesta del PC al saludo (una app de PC antigua no responde). */
  helloTimeoutMs?: number;
}

type Msg<T extends SyncMessage['type']> = Extract<SyncMessage, { type: T }>;

export class SyncReplica {
  /** Último progreso recibido del PC y su revisión (en memoria: al reconectar se pide de nuevo). */
  private base: { data: ProgressData; rev: number; profile: string } | null = null;
  private online = false;
  private pulling = false;
  private info: Msg<'progress-info'> | null = null;
  private helloTimer: ReturnType<typeof setTimeout> | null = null;
  status: ReplicaStatus = { phase: 'off', conflict: null, pc: null };

  constructor(
    private store: SyncStore,
    private send: (m: SyncMessage) => void,
    private opts: ReplicaOptions,
  ) {}

  private now(): number {
    return this.opts.now?.() ?? Date.now();
  }

  private setStatus(patch: Partial<ReplicaStatus>): void {
    this.status = { ...this.status, ...patch };
    this.opts.onStatus?.(this.status);
  }

  /** ¿Las operaciones nuevas viajan ya al PC? (si no, el tiempo de estudio se puede acumular). */
  get live(): boolean {
    return this.online && (this.status.phase === 'syncing' || this.status.phase === 'ready');
  }

  /** La conexión con el PC quedó lista. */
  connected(): void {
    this.online = true;
    this.pulling = false;
    const { data, meta } = this.store.read();
    this.setStatus({ phase: 'hello', conflict: null });
    this.send({ type: 'progress-hello', device: meta.device, profile: meta.profile, hasProgress: hasProgress(data), version: this.opts.version, proto: SYNC_PROTOCOL });
    this.clearHelloTimer();
    this.helloTimer = setTimeout(() => {
      if (this.online && this.status.phase === 'hello') this.setStatus({ phase: 'unsupported', pc: null });
    }, this.opts.helloTimeoutMs ?? 10_000);
  }

  disconnected(): void {
    this.online = false;
    this.pulling = false;
    this.clearHelloTimer();
    this.setStatus({ phase: 'off', conflict: null });
  }

  private clearHelloTimer(): void {
    if (this.helloTimer) clearTimeout(this.helloTimer);
    this.helloTimer = null;
  }

  /** Operación hecha en el móvil (ya aplicada y en la lista de pendientes). */
  localApplied(env: OpEnvelope): void {
    const { meta } = this.store.read();
    if (this.live && meta.profile && meta.pending.some((e) => e.seq === env.seq)) {
      this.send({ type: 'progress-push', device: meta.device, profile: meta.profile, ops: [env] });
    }
  }

  /** Atiende un mensaje del PC; devuelve false si no es de sincronización. */
  handle(msg: AnyMessage): boolean {
    if (!msg.type.startsWith('progress-')) return false;
    const to = (msg as { to?: string }).to;
    if (to && to !== this.store.read().meta.device) return true;
    switch (msg.type) {
      case 'progress-info':
        this.onInfo(msg);
        break;
      case 'progress-snapshot':
        this.onSnapshot(msg);
        break;
      case 'progress-ops':
        this.onOps(msg);
        break;
      case 'progress-rejected':
        // El progreso del PC cambió (se reinstaló, se borró su carpeta de datos…): se vuelve a vincular.
        if (this.online) this.connected();
        break;
      default:
        break;
    }
    return true;
  }

  /** Respuesta del usuario al conflicto de la primera vinculación. */
  resolve(choice: ConflictChoice): void {
    const info = this.info;
    if (!info || this.status.phase !== 'conflict') return;
    if (choice === 'pc') this.adopt(info.profile, true);
    else if (choice === 'phone') this.importInto(info.profile);
    else if (this.status.conflict?.canCombine) this.adopt(info.profile, false);
  }

  private onInfo(info: Msg<'progress-info'>): void {
    this.clearHelloTimer();
    this.info = info;
    this.setStatus({ pc: { name: info.name, version: info.version } });
    if (info.proto !== SYNC_PROTOCOL) {
      this.setStatus({ phase: 'unsupported' });
      return;
    }
    const { data, meta } = this.store.read();
    if (meta.profile === info.profile) this.startSync();
    else if (!hasProgress(data)) this.adopt(info.profile, true);
    else if (!info.hasProgress) this.importInto(info.profile);
    else this.setStatus({ phase: 'conflict', conflict: { canCombine: meta.profile === null } });
  }

  /** Vincula con el progreso del PC; `dropLocal`: descarta lo hecho en el móvil (si no, se suma). */
  private adopt(profile: string, dropLocal: boolean): void {
    const { meta } = this.store.read();
    this.base = null;
    this.store.write({ meta: { ...meta, profile, pending: dropLocal ? [] : meta.pending } });
    this.startSync();
  }

  /** El progreso del móvil reemplaza al del PC. */
  private importInto(profile: string): void {
    const { data, meta } = this.store.read();
    const env = nextEnvelope(meta, { k: 'import', data }, this.now());
    this.base = null;
    this.store.write({ meta: { ...meta, seq: env.seq, profile, pending: [env] } });
    this.startSync();
  }

  private startSync(): void {
    const { meta } = this.store.read();
    if (!meta.profile) return;
    this.setStatus({ phase: 'syncing', conflict: null });
    if (meta.pending.length) this.send({ type: 'progress-push', device: meta.device, profile: meta.profile, ops: meta.pending });
    this.pull();
  }

  private pull(): void {
    const { meta } = this.store.read();
    if (this.pulling || !this.online || !meta.profile) return;
    this.pulling = true;
    this.send({ type: 'progress-pull', device: meta.device, profile: meta.profile });
  }

  private onSnapshot(s: Msg<'progress-snapshot'>): void {
    const { data, meta } = this.store.read();
    if (s.profile !== meta.profile) return;
    this.pulling = false;
    this.base = { data: withLocalSettings(s.data, data.settings), rev: s.rev, profile: s.profile };
    this.rebuild(s.applied);
    if (this.online && this.status.phase === 'syncing') this.setStatus({ phase: 'ready' });
  }

  private onOps(m: Msg<'progress-ops'>): void {
    const { meta } = this.store.read();
    if (m.profile !== meta.profile) return;
    const base = this.base;
    if (base && base.profile === m.profile) {
      let { data, rev } = base;
      let gap = false;
      for (const { rev: r, env } of m.ops) {
        if (r <= rev) continue;
        if (r !== rev + 1) {
          gap = true;
          break;
        }
        try {
          data = applyOp(data, env).data;
        } catch {
          gap = true;
          break;
        }
        rev = r;
      }
      this.base = { ...base, data, rev };
      if (gap) this.pull(); // se perdió algo (o no se pudo aplicar): se pide el progreso completo
    } else if (m.ops.length) {
      this.pull();
    }
    this.rebuild(m.applied);
  }

  /** Progreso a mostrar: el del PC más lo pendiente; quita lo que el PC ya confirmó. */
  private rebuild(applied: Record<string, number>): void {
    const { data: current, meta } = this.store.read();
    const acked = applied?.[meta.device] ?? 0;
    const pending = meta.pending.filter((e) => e.seq > acked);
    const synced = !!this.base && pending.length === 0;
    const nextMeta = { ...meta, pending, lastSync: synced ? this.now() : meta.lastSync };
    if (!this.base) {
      this.store.write({ meta: nextMeta });
      return;
    }
    let data = withLocalSettings(this.base.data, current.settings);
    for (const e of pending) {
      try {
        data = applyOp(data, e).data;
      } catch {
        /* se descarta en el PC igual */
      }
    }
    this.store.write({ data, meta: nextMeta });
  }
}
