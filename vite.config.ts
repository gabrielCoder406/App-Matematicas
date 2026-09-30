import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const API_PORT = Number(process.env.API_PORT || 8787);

/** Carpetas generadas que el servidor de desarrollo no debe vigilar (OneDrive las bloquea al escribirlas). */
export const WATCH_IGNORED = ['**/release/**', '**/android/**', '**/dist/**', '**/dist-electron/**', '**/dist-companion/**', '**/.data/**', '**/build/**'];

export default defineConfig({
  plugins: [react()],
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
