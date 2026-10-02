// Móvil: conexión con la app del PC (misma red Wi-Fi). Por ella se sincroniza el progreso, se usa
// la IA del PC (leer la escritura y el tutor) y el móvil puede hacer de pizarra del PC. Mientras
// la app está abierta se reconecta sola; sin conexión todo sigue funcionando y lo hecho espera.
import { create } from 'zustand';
import type { AnyMessage, LinkMessage, PairTarget } from '../canvas/protocol';
import { CompanionLink, wsUrlFor, type LinkStatus } from '../companion/connection';
import { setRemoteAi } from '../lib/api';
import { kv } from '../lib/storage';
import { progressSyncStore, setLocalOpSink } from '../store/progress';
import { useUi } from '../store/ui';
import { SyncReplica, type ConflictChoice, type ReplicaStatus } from '../sync/replica';
import { RemoteAi } from './ai';

export interface SavedPc extends PairTarget {
  name?: string;
}

/** El mismo registro que usaba la versión anterior (solo pizarra): al actualizar se reconecta sola. */
const TARGET_KEY = 'pizarra-ultimo-pc';
/**
 * Tras un rechazo (p. ej., el móvil llegó antes de que la app del PC abriera su sesión) se vuelve a
 * probar cada tanto. Más de 60 s: el servidor bloquea un rato tras 10 códigos incorrectos en 10 min.
 */
const REJECTED_RETRY_MS = 90_000;

function loadTarget(): SavedPc | null {
  try {
    const v = JSON.parse(kv.getItem(TARGET_KEY) ?? 'null') as SavedPc | null;
    return v && typeof v.host === 'string' && typeof v.port === 'number' && /^\d{6}$/.test(v.code) ? v : null;
  } catch {
    return null;
  }
}

function saveTarget(pc: SavedPc | null): void {
  if (pc) kv.setItem(TARGET_KEY, JSON.stringify(pc));
  else kv.removeItem(TARGET_KEY);
}

export interface PcLinkState {
  /** PC vinculado (null: ninguno). */
  target: SavedPc | null;
  link: CompanionLink | null;
  status: LinkStatus | 'off';
  /** Motivo del rechazo (código cambiado, demasiados dispositivos…). */
  error: string | null;
  sync: ReplicaStatus;
  /** Se eligió «Decidir después» en el conflicto de la primera vinculación. */
  conflictDeferred: boolean;
  /** IA disponible en el PC. */
  ai: { ocr: boolean; tutor: boolean };
}

export const usePcLink = create<PcLinkState>()(() => ({
  target: null,
  link: null,
  status: 'off',
  error: null,
  sync: { phase: 'off', conflict: null, pc: null },
  conflictDeferred: false,
  ai: { ocr: false, tutor: false },
}));

class PcConnection {
  private online = false;
  private unsubscribe: (() => void) | null = null;
  private started = false;
  private rejectedRetry: ReturnType<typeof setTimeout> | null = null;

  readonly replica = new SyncReplica(progressSyncStore, (m) => this.send(m), {
    version: __APP_VERSION__,
    onStatus: (sync) => {
      // Al salir del conflicto (o al volver a conectarse) se vuelve a preguntar.
      usePcLink.setState(sync.phase === 'conflict' ? { sync } : { sync, conflictDeferred: false });
      if (sync.pc?.name) this.rememberName(sync.pc.name);
    },
  });

  readonly ai = new RemoteAi((m) => this.send(m), () => progressSyncStore.read().meta.device, () => this.online);

  /** Al abrir la app: se reconecta al último PC. */
  start(): void {
    if (this.started) return;
    this.started = true;
    setLocalOpSink({ coalesce: () => !this.replica.live, applied: (env) => this.replica.localApplied(env) });
    setRemoteAi(this.ai);
    const target = loadTarget();
    usePcLink.setState({ target });
    if (target) this.open(target);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      if (usePcLink.getState().status === 'rejected' && this.canAutoRetry()) this.retry(true);
      else usePcLink.getState().link?.kick();
    });
  }

  /** Un PC con el que ya se sincronizó: el rechazo puede ser pasajero (la app del PC se estaba abriendo). */
  private canAutoRetry(): boolean {
    return !!usePcLink.getState().target && progressSyncStore.read().meta.profile !== null;
  }

  /** Vincula con un PC (lo leído del QR o escrito a mano). */
  connect(t: PairTarget): void {
    const prev = usePcLink.getState().target;
    const saved: SavedPc = { ...t, name: prev && prev.host === t.host && prev.port === t.port ? prev.name : undefined };
    saveTarget(saved);
    usePcLink.setState({ target: saved });
    this.open(saved);
  }

  /** Vuelve a intentar con el PC vinculado (tras un rechazo o para sincronizar ya). */
  retry(auto = false): void {
    const t = usePcLink.getState().target;
    if (t) this.open(t, auto);
  }

  /** Deja de conectarse a este PC. Lo hecho en el móvil se conserva y se envía si se vuelve a vincular. */
  forget(): void {
    if (this.rejectedRetry) clearTimeout(this.rejectedRetry);
    this.rejectedRetry = null;
    this.close();
    saveTarget(null);
    usePcLink.setState({ target: null, status: 'off', error: null });
  }

  resolveConflict(choice: ConflictChoice): void {
    this.replica.resolve(choice);
  }

  send(m: LinkMessage): void {
    usePcLink.getState().link?.send(m);
  }

  /** `auto`: reintento automático tras un rechazo; un solo intento (no suma fallos de más en el servidor). */
  private open(t: SavedPc, auto = false): void {
    this.close();
    if (this.rejectedRetry) clearTimeout(this.rejectedRetry);
    this.rejectedRetry = null;
    const link = new CompanionLink(wsUrlFor(t), auto ? { invalidRetries: 0 } : {});
    this.unsubscribe = link.subscribe({ status: (s, detail) => this.onStatus(s, detail), message: (m) => this.onMessage(m) });
    usePcLink.setState({ link, status: 'connecting', error: null });
    link.open();
  }

  private close(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    usePcLink.getState().link?.close();
    usePcLink.setState({ link: null, status: 'off' });
    this.setOnline(false);
  }

  private onStatus(s: LinkStatus, detail?: string): void {
    usePcLink.setState({ status: s, error: s === 'rejected' ? (detail ?? 'La app del PC rechazó la conexión.') : null });
    this.setOnline(s === 'online');
    if (s === 'rejected' && this.canAutoRetry()) {
      if (this.rejectedRetry) clearTimeout(this.rejectedRetry);
      this.rejectedRetry = setTimeout(() => {
        if (document.visibilityState === 'visible') this.retry(true);
      }, REJECTED_RETRY_MS);
    }
  }

  private setOnline(on: boolean): void {
    if (on === this.online) return;
    this.online = on;
    if (on) {
      this.replica.connected();
    } else {
      this.replica.disconnected();
      this.ai.disconnected();
      usePcLink.setState({ ai: { ocr: false, tutor: false } });
    }
    this.updateUi();
  }

  private onMessage(m: AnyMessage): void {
    if (this.replica.handle(m) || this.ai.handle(m)) return;
    if (m.type === 'ai-status') {
      usePcLink.setState({ ai: { ocr: m.ocr, tutor: m.tutor } });
      this.updateUi();
    }
    // Los mensajes de la pizarra los atiende la pizarra remota (suscrita a la misma conexión).
  }

  /** «Servidor» e IA disponibles, para las pantallas que los consultan (como en el PC). */
  private updateUi(): void {
    const { ai } = usePcLink.getState();
    useUi.getState().setServer(this.online, this.online && ai.ocr, this.online && ai.tutor);
  }

  private rememberName(name: string): void {
    const cur = usePcLink.getState().target;
    if (!cur || cur.name === name) return;
    const next = { ...cur, name };
    saveTarget(next);
    usePcLink.setState({ target: next });
  }
}

export const pc = new PcConnection();
