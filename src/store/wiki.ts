// Estado de la wiki: panel de consulta rápida (se abre sobre cualquier pantalla sin salir de
// ella) y fichas consultadas recientemente (persistentes).
import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { kv } from '../lib/storage';

const MAX_RECENT = 8;

/** Atajo de teclado que abre la wiki desde cualquier pantalla. */
export const WIKI_SHORTCUT = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

interface WikiState {
  open: boolean;
  /** Ficha abierta en el panel (null: buscador). */
  entryId: string | null;
  /** Fichas vistas antes en el panel, para «Volver». */
  back: (string | null)[];
  query: string;
  /** Tema de la pantalla actual (ejercicio, lección…): se sugiere al abrir el panel. */
  context: string | null;
  /** Cambia cada vez que hay que enfocar el buscador del panel. */
  focusTick: number;
  recent: string[];
  /** Abre el panel en una ficha o, sin id, en el buscador. */
  openPanel(entryId?: string | null): void;
  close(): void;
  /** Navega dentro del panel. */
  show(entryId: string | null): void;
  goBack(): void;
  setQuery(q: string): void;
  focusSearch(): void;
  /** Registra una ficha como consultada. */
  visit(id: string): void;
}

export const useWiki = create<WikiState>()(
  persist(
    (set, get) => ({
      open: false,
      entryId: null,
      back: [],
      query: '',
      context: null,
      focusTick: 0,
      recent: [],
      openPanel(entryId = null) {
        const s = get();
        if (s.open && s.entryId === entryId) return;
        set({ open: true, entryId, back: s.open ? [...s.back, s.entryId] : [] });
        if (entryId) get().visit(entryId);
      },
      close() {
        set({ open: false });
      },
      show(entryId) {
        const s = get();
        if (s.entryId === entryId) return;
        set({ entryId, back: [...s.back, s.entryId] });
        if (entryId) get().visit(entryId);
      },
      goBack() {
        const back = [...get().back];
        set({ entryId: back.pop() ?? null, back });
      },
      setQuery(query) {
        set({ query });
      },
      focusSearch() {
        set({ focusTick: get().focusTick + 1 });
      },
      visit(id) {
        set({ recent: [id, ...get().recent.filter((r) => r !== id)].slice(0, MAX_RECENT) });
      },
    }),
    {
      name: 'mate-wiki',
      storage: createJSONStorage(() => kv),
      partialize: (s) => ({ recent: s.recent }),
    },
  ),
);

/** Abre la ficha de un tema en el panel de consulta, sin salir de la pantalla actual. */
export function openWiki(entryId?: string | null) {
  useWiki.getState().openPanel(entryId);
}

let returnFocusTarget: HTMLElement | null = null;

/** Abre el panel con el buscador enfocado (Ctrl+K o el buscador de la barra lateral). */
export function openWikiSearch() {
  const w = useWiki.getState();
  if (!w.open) {
    // Mientras el panel aparece, lo que se escriba no debe ir a parar a la respuesta del ejercicio.
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      returnFocusTarget = active;
      active.blur();
    }
    w.openPanel();
  }
  w.focusSearch();
}

/** Elemento que tenía el foco antes de abrir el panel con el buscador (para devolvérselo al cerrarlo). */
export function takeReturnFocus(): HTMLElement | null {
  const el = returnFocusTarget;
  returnFocusTarget = null;
  return el;
}

const contextStack: { token: number; id: string }[] = [];
let nextToken = 1;

/** Declara el tema de la pantalla actual para sugerirlo en el panel de la wiki. */
export function useWikiContext(skillId: string | null | undefined) {
  useEffect(() => {
    if (!skillId) return undefined;
    const token = nextToken++;
    contextStack.push({ token, id: skillId });
    useWiki.setState({ context: skillId });
    return () => {
      const i = contextStack.findIndex((c) => c.token === token);
      if (i >= 0) contextStack.splice(i, 1);
      useWiki.setState({ context: contextStack.at(-1)?.id ?? null });
    };
  }, [skillId]);
}
