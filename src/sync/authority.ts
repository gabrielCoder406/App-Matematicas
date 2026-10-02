// PC: guarda el progreso de referencia. Aplica en orden de llegada las operaciones que envían
// los móviles, les asigna un número de revisión y las reenvía a todos los móviles conectados,
// que así quedan con exactamente el mismo progreso.
import type { AnyMessage } from '../canvas/protocol';
import type { EngineEvent } from '../learning/engine';
import { SYNC_PROTOCOL, type RevOp, type SyncMessage } from './messages';
import { applyOp, hasProgress, validEnvelope, type OpEnvelope } from './ops';
import type { SyncStore } from './store';

export interface AuthorityOptions {
  version: string;
  /** Nombre del PC (lo muestra el móvil). */
  name?(): string | undefined;
  /** Se aplicaron operaciones hechas en un móvil (para avisarlo en el PC). */
  onRemote?(ops: OpEnvelope[], events: EngineEvent[]): void;
  now?(): number;
}

type Msg<T extends SyncMessage['type']> = Extract<SyncMessage, { type: T }>;

export class SyncAuthority {
  constructor(
    private store: SyncStore,
    private send: (m: SyncMessage) => void,
    private opts: AuthorityOptions,
  ) {}

  private get profile(): string {
    return this.store.read().meta.profile ?? '';
  }

  /** Operación hecha en este PC: ya está aplicada y `meta.rev` es su revisión. */
  localApplied(env: OpEnvelope): void {
    const { meta } = this.store.read();
    this.send({ type: 'progress-ops', profile: this.profile, ops: [{ rev: meta.rev, env }], applied: meta.applied });
  }

  /** Atiende un mensaje de un móvil; devuelve false si no es de sincronización. */
  handle(msg: AnyMessage): boolean {
    switch (msg.type) {
      case 'progress-hello': {
        const { data, meta } = this.store.read();
        this.send({ type: 'progress-info', to: msg.device, profile: this.profile, rev: meta.rev, hasProgress: hasProgress(data), version: this.opts.version, proto: SYNC_PROTOCOL, name: this.opts.name?.() });
        return true;
      }
      case 'progress-push':
        this.push(msg);
        return true;
      case 'progress-pull': {
        const { data, meta } = this.store.read();
        if (msg.profile !== this.profile) this.send({ type: 'progress-rejected', to: msg.device, profile: this.profile });
        else this.send({ type: 'progress-snapshot', to: msg.device, profile: this.profile, rev: meta.rev, applied: meta.applied, data });
        return true;
      }
      default:
        return false;
    }
  }

  private push(msg: Msg<'progress-push'>): void {
    if (msg.profile !== this.profile) {
      this.send({ type: 'progress-rejected', to: msg.device, profile: this.profile });
      return;
    }
    let { data, meta } = this.store.read();
    const applied: RevOp[] = [];
    const events: EngineEvent[] = [];
    let changed = false;
    const ops = (Array.isArray(msg.ops) ? msg.ops : []).filter((e) => validEnvelope(e) && e.dev === msg.device).sort((a, b) => a.seq - b.seq);
    for (const env of ops) {
      if (env.seq <= (meta.applied[env.dev] ?? 0)) continue; // reenviada tras un corte: ya está aplicada
      changed = true;
      let ok = true;
      try {
        const r = applyOp(data, env);
        data = r.data;
        events.push(...r.events);
      } catch {
        ok = false; // no se puede aplicar: se descarta, pero se confirma para que no se reenvíe
      }
      meta = { ...meta, rev: ok ? meta.rev + 1 : meta.rev, applied: { ...meta.applied, [env.dev]: env.seq } };
      if (ok) applied.push({ rev: meta.rev, env });
    }
    if (!changed) {
      this.send({ type: 'progress-ops', to: msg.device, profile: this.profile, ops: [], applied: meta.applied });
      return;
    }
    meta = { ...meta, lastSync: this.opts.now?.() ?? Date.now() };
    this.store.write({ data, meta });
    if (applied.length) this.opts.onRemote?.(applied.map((a) => a.env), events);
    // A todos: el que las envió recibe la confirmación y los demás móviles, los cambios.
    this.send({ type: 'progress-ops', profile: this.profile, ops: applied, applied: meta.applied });
  }
}
