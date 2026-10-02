// Estado de interfaz no persistente: avisos (toasts) y disponibilidad del servidor y de la IA
// (en la app del móvil, la del PC vinculado: la actualiza phone/link.ts).
import { create } from 'zustand';
import { fetchHealth } from '../lib/api';

export type ToastKind = 'success' | 'warning' | 'danger' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  icon?: string;
}

interface UiState {
  toasts: Toast[];
  serverOk: boolean | null;
  /** Hay una IA lista para leer la escritura (DeepSeek-OCR local o Claude). */
  ocrAvailable: boolean;
  /** El tutor (DeepSeek Math) está descargado y Ollama está abierto. */
  tutorAvailable: boolean;
  /** Nombre de este equipo (el móvil lo muestra al vincularse). */
  hostName?: string;
  toast(t: Omit<Toast, 'id'>, ms?: number): void;
  dismiss(id: number): void;
  setServer(ok: boolean, ocr: boolean, tutor?: boolean): void;
  /** Vuelve a consultar el servidor (p. ej., si se abrió Ollama con la app abierta). */
  refreshHealth(): Promise<void>;
}

let nextId = 1;

export const useUi = create<UiState>()((set, get) => ({
  toasts: [],
  serverOk: null,
  ocrAvailable: false,
  tutorAvailable: false,
  toast(t, ms = 4500) {
    const id = nextId++;
    set({ toasts: [...get().toasts.slice(-3), { ...t, id }] });
    setTimeout(() => get().dismiss(id), ms);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
  setServer(ok, ocr, tutor) {
    set({ serverOk: ok, ocrAvailable: ocr, ...(tutor !== undefined ? { tutorAvailable: tutor } : {}) });
  },
  async refreshHealth() {
    const h = await fetchHealth();
    set({ serverOk: !!h, ocrAvailable: !!h?.ocr, tutorAvailable: !!h?.tutor, ...(h?.name ? { hostName: h.name } : {}) });
  },
}));
