// Estado persistente del progreso sobre el motor de aprendizaje (en la app de escritorio
// se guarda en la carpeta de datos del usuario; en el navegador, en localStorage).
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  addActiveTime, applyAttempt, applyPlacement, completeLesson, emptyProgress, PROGRESS_VERSION,
  type AttemptInput, type EngineEvent,
} from '../learning/engine';
import type { ProgressData, Settings } from '../learning/types';
import { kv } from '../lib/storage';

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

export type ProgressStore = ProgressData & Actions;

const DATA_KEYS: (keyof ProgressData)[] = ['version', 'profileName', 'onboarded', 'diagnosticDone', 'createdAt', 'skills', 'attempts', 'errors', 'remediation', 'days', 'settings'];

export function pickData(s: ProgressStore | ProgressData): ProgressData {
  const out = {} as Record<string, unknown>;
  for (const k of DATA_KEYS) out[k] = (s as unknown as Record<string, unknown>)[k];
  return out as unknown as ProgressData;
}

export const useProgress = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...emptyProgress(),
      record(input) {
        const { data, events } = applyAttempt(pickData(get()), input);
        set(data);
        return events;
      },
      addTime(ms, skillId) {
        set(addActiveTime(pickData(get()), ms, skillId));
      },
      completeLesson(skillId) {
        set(completeLesson(pickData(get()), skillId));
      },
      placement(known, weak) {
        set(applyPlacement(pickData(get()), known, weak));
      },
      setSettings(patch) {
        set({ settings: { ...get().settings, ...patch } });
      },
      setProfile(name) {
        set({ profileName: name });
      },
      setOnboarded(v) {
        set({ onboarded: v });
      },
      markErrorReviewed(id) {
        set({ errors: get().errors.map((e) => (e.id === id ? { ...e, reviewed: true } : e)) });
      },
      dismissRemediation(id) {
        set({ remediation: get().remediation.map((r) => (r.id === id ? { ...r, remaining: 0 } : r)) });
      },
      reset() {
        set({ ...emptyProgress(), settings: get().settings });
      },
      importData(data) {
        set({ ...emptyProgress(), ...data, version: PROGRESS_VERSION });
      },
    }),
    {
      name: 'mate-progreso',
      storage: createJSONStorage(() => kv),
      version: PROGRESS_VERSION,
      partialize: (s) => pickData(s),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ProgressData>;
        return { ...current, ...p, settings: { ...current.settings, ...(p.settings ?? {}) } };
      },
    },
  ),
);
