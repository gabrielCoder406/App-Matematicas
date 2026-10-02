// Almacenamiento clave-valor persistente. En la app de escritorio es un archivo en la
// carpeta de datos del usuario (no depende del puerto ni de la caché del navegador);
// en la app del móvil, IndexedDB (sin el límite de tamaño de localStorage); en el navegador,
// localStorage. La lectura siempre es síncrona: en el móvil todo se carga en memoria al arrancar.

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

let backend: KeyValueStore = pick();

/** Los módulos guardan esta referencia; el almacenamiento real puede cambiar al arrancar (móvil). */
export const kv: KeyValueStore = {
  getItem: (k) => backend.getItem(k),
  setItem: (k, v) => backend.setItem(k, v),
  removeItem: (k) => backend.removeItem(k),
};

/** true dentro de la app de escritorio. */
export const isDesktop = typeof window !== 'undefined' && !!window.desktop;

// ---------------------------------------------------------------------------- móvil: IndexedDB

const DB_NAME = 'matematica';
const STORE = 'kv';
const WRITE_DELAY_MS = 400;
/** Lo que guardaba en localStorage la versión anterior de la app del móvil (solo pizarra). */
const LEGACY_KEYS = ['pizarra-ultimo-pc', 'mate-wiki'];

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDb(): Promise<IDBDatabase> {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = () => req.result.createObjectStore(STORE);
  return request(req);
}

function readAll(db: IDBDatabase): Promise<Map<string, string>> {
  return new Promise((resolve, reject) => {
    const out = new Map<string, string>();
    const tx = db.transaction(STORE, 'readonly');
    const cursor = tx.objectStore(STORE).openCursor();
    cursor.onsuccess = () => {
      const c = cursor.result;
      if (!c) return;
      out.set(String(c.key), String(c.value));
      c.continue();
    };
    tx.oncomplete = () => resolve(out);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * App del móvil: carga los datos guardados en IndexedDB y desde entonces `kv` lee de memoria y
 * escribe en segundo plano. Hay que esperarla antes de crear los stores (que leen al crearse).
 * La primera vez copia lo que la versión anterior de la app dejó en localStorage (el último PC y
 * la wiki).
 */
export async function initIndexedDbStorage(): Promise<void> {
  let db: IDBDatabase;
  let data: Map<string, string>;
  try {
    db = await openDb();
    data = await readAll(db);
  } catch {
    return; // sin IndexedDB: se queda con localStorage
  }
  const dirty = new Map<string, string | null>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    if (!dirty.size) return;
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const [k, v] of dirty) {
      if (v === null) store.delete(k);
      else store.put(v, k);
    }
    dirty.clear();
  };
  const schedule = (k: string, v: string | null) => {
    dirty.set(k, v);
    if (!timer) timer = setTimeout(flush, WRITE_DELAY_MS);
  };

  if (!data.size) {
    try {
      for (const k of LEGACY_KEYS) {
        const v = localStorage.getItem(k);
        if (v === null) continue;
        data.set(k, v);
        dirty.set(k, v);
      }
      flush();
    } catch {
      /* sin localStorage */
    }
  }

  // Al pasar a segundo plano se guarda enseguida: Android puede cerrar la app sin avisar.
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  window.addEventListener('pagehide', flush);

  backend = {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
      schedule(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
      schedule(k, null);
    },
  };
}
