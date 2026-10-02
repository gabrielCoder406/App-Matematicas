import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const API_PORT = Number(process.env.API_PORT || 8787);

/** Versión de la app (package.json), para la interfaz: la comparan el PC y el móvil al sincronizar. */
export const APP_VERSION = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;

/** Carpetas generadas que el servidor de desarrollo no debe vigilar (OneDrive las bloquea al escribirlas). */
export const WATCH_IGNORED = ['**/release/**', '**/android/**', '**/dist/**', '**/dist-electron/**', '**/dist-companion/**', '**/.data/**', '**/build/**'];

export default defineConfig({
  plugins: [react()],
  // La app del móvil se compila con vite.companion.config.ts (__PHONE_APP__ = true).
  define: { __PHONE_APP__: 'false', __APP_VERSION__: JSON.stringify(APP_VERSION) },
  server: {
    // Escucha en todas las interfaces para que el móvil pueda entrar por la red local.
    host: true,
    port: 5173,
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
      '/ws': { target: `ws://localhost:${API_PORT}`, ws: true },
    },
    watch: { ignored: WATCH_IGNORED },
  },
  preview: { host: true },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts'],
    environment: 'node',
  },
});
