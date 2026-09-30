// Empaqueta el proceso principal de Electron (con el servidor local) en dist-electron/.
import { build } from 'esbuild';
import { rmSync } from 'node:fs';

rmSync('dist-electron', { recursive: true, force: true });

await build({
  entryPoints: { main: 'electron/main.ts', preload: 'electron/preload.ts' },
  outdir: 'dist-electron',
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  // bufferutil y utf-8-validate son aceleradores opcionales de «ws».
  external: ['electron', 'bufferutil', 'utf-8-validate'],
  legalComments: 'none',
  logLevel: 'warning',
});

console.log('dist-electron listo');
