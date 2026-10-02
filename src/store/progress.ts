// Estado persistente del progreso sobre el motor de aprendizaje (en la app de escritorio
// se guarda en la carpeta de datos del usuario; en el móvil, en IndexedDB; en el navegador, en
// localStorage). Cada cambio es una operación (sync/ops.ts) que se sincroniza entre el PC y el
// móvil: el PC guarda el progreso de referencia y el móvil lo replica.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { dayKey, emptyProgress, PROGRESS_VERSION, type AttemptInput, type EngineEvent } from '../learning/engine';
import type { ProgressData, Settings } from '../learning/types';
import { IS_PHONE } from '../lib/platform';
import { kv } from '../lib/storage';
import { commitLocal, loadSyncMeta, newSyncMeta, type SyncMeta } from '../sync/meta';
import { splitSettings, type OpEnvelope, type ProgressOp } from '../sync/ops';
import type { SyncStore } from '../sync/store';

interface Actions {
  record(input: AttemptInput): EngineEvent[];
  addTime(ms: number, skillId?: string): void;
  completeLesson(skillId: string): void;
  placement(known: string[], weak: string[]): void;
  setSettings(patch: Partial<Settings>): void;
  setProfile(name: string): void;
  setOnboarded(v: boolean): void;
  markErrorReviewed(id: string): void;
  dismissRemediation(id: string): void;
  reset(): void;
  importData(data: ProgressData): void;
}

export type ProgressStore = ProgressData & { sync: SyncMeta } & Actions;

/** El PC guarda el progreso de referencia; el móvil lo replica (ver sync/). */
const AUTHORITY = !IS_PHONE;

const DATA_KEYS: (keyof ProgressData)[] = ['version', 'profileName', 'onboarded', 'diagnosticDone', 'createdAt', 'skills', 'attempts', 'errors', 'remediation', 'days', 'settings'];

export function pickData(s: ProgressStore | ProgressData): ProgressData {
  const out = {} as Record<string, unknown>;
  for (const k of DATA_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out as unknown as ProgressData;
}

/** Quién recibe las operaciones hechas en este dispositivo (la sincronización, si está activa). */
export interface LocalOpSink {
  /** Móvil sin envío en curso: el tiempo de estudio se puede acumular en una sola operación. */
  coalesce(): boolean;
  applied(env: OpEnvelope): void;
}

let sink: LocalOpSink | null = null;
/** ¿El estado de la sincronización ya estaba guardado? (si no, se guarda al crear el store). */
let syncLoaded = false;

export function setLocalOpSink(s: LocalOpSink | null): void {
  sink = s;
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => {
      const commit = (op: ProgressOp): EngineEvent[] => {
        const s = get();
        const r = commitLocal(pickData(s), s.sync, op, { authority: AUTHORITY, coalesce: sink ? sink.coalesce() : true, now: Date.now() });
        set({ ...r.data, sync: r.meta });
        sink?.applied(r.env);
        return r.events;
      };
      return {
        ...emptyProgress(),
        sync: newSyncMeta(AUTHORITY),
        record(input) {
          return commit({ k: 'attempt', input });
        },
        addTime(ms, skillId) {
          if (ms > 0) commit({ k: 'time', ms, day: dayKey(Date.now()), skill: skillId });
        },
        completeLesson(skillId) {
          commit({ k: 'lesson', skill: skillId });
        },
        placement(known, weak) {
          commit({ k: 'placement', known, weak });
        },
        setSettings(patch) {
          // El tema y el teclado son de cada dispositivo; el resto (meta diaria, pausa) se sincroniza.
          const { local, synced } = splitSettings(patch);
          if (Object.keys(local).length) set({ settings: { ...get().settings, ...local } });
          if (Object.keys(synced).length) commit({ k: 'settings', patch: synced });
        },
        setProfile(name) {
          if (name !== get().profileName) commit({ k: 'profile', name });
        },
        setOnboarded(v) {
          if (v !== get().onboarded) commit({ k: 'onboarded', value: v });
        },
        markErrorReviewed(id) {
          commit({ k: 'error-reviewed', id });
        },
        dismissRemediation(id) {
          commit({ k: 'remediation-dismissed', id });
        },
        reset() {
          const s = get();
          if (!AUTHORITY && !s.sync.profile) {
            // Móvil que nunca se vinculó: no hay nada que avisar al PC; se descarta también lo pendiente.
            set({ ...emptyProgress(), settings: s.settings, sync: { ...s.sync, pending: [] } });
            return;
          }
          commit({ k: 'reset' });
        },
        importData(data) {
          commit({ k: 'import', data: { ...data, version: PROGRESS_VERSION } });
        },
      };
    },
    {
      name: 'mate-progreso',
      storage: createJSONStorage(() => kv),
      version: PROGRESS_VERSION,
      // El estado de la sincronización va en el mismo registro que el progreso: se guardan juntos.
      partialize: (s) => ({ ...pickData(s), sync: s.sync }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressData> & { sync?: unknown };
        syncLoaded = !!p.sync;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) }, sync: loadSyncMeta(p.sync, AUTHORITY) };
      },
    },
  ),
);

// Dispositivo nuevo (o que viene de una versión sin sincronización): su identidad se guarda ya.
// Si no, al reabrir la app tendría otra y el PC o el móvil vinculado no la reconocería.
if (!syncLoaded) useProgress.setState({ sync: { ...useProgress.getState().sync } });

/** El progreso visto por la sincronización. */
export const progressSyncStore: SyncStore = {
  read() {
    const s = useProgress.getState();
    return { data: pickData(s), meta: s.sync };
  },
  write({ data, meta }) {
    useProgress.setState(data ? { ...data, sync: meta } : { sync: meta });
  },
};
