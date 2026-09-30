// Compilación de la app del móvil (Pizarra Matemática) para empaquetarla con Capacitor.
// En desarrollo: `npm run dev:companion` y abrir http://localhost:5174/companion.html
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { WATCH_IGNORED } from './vite.config';

/** Capacitor espera un index.html en la carpeta web. */
function renameToIndex(): Plugin {
  return {
    name: 'companion-index-html',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const html = bundle['companion.html'];
      if (html) html.fileName = 'index.html';
    },
  };
}

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), renameToIndex()],
  build: {
    outDir: 'dist-companion',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: 'companion.html' },
  },
  server: { host: true, port: 5174, open: false, watch: { ignored: WATCH_IGNORED } },
});
