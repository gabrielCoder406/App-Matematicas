// Almacenamiento clave-valor persistente. En la app de escritorio es un archivo en la
// carpeta de datos del usuario (no depende del puerto ni de la caché del navegador);
// en el navegador, localStorage.

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const memory = new Map<string, string>();
const inMemory: KeyValueStore = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => void memory.set(k, v),
  removeItem: (k) => void memory.delete(k),
};

function pick(): KeyValueStore {
  if (typeof window === 'undefined') return inMemory;
  if (window.desktop?.storage) return window.desktop.storage;
  try {
    localStorage.setItem('__prueba', '1');
    localStorage.removeItem('__prueba');
    return localStorage;
  } catch {
    return inMemory;
  }
}

export const kv: KeyValueStore = pick();

/** true dentro de la app de escritorio. */
export const isDesktop = typeof window !== 'undefined' && !!window.desktop;
