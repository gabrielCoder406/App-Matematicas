// Genera el instalador de Windows (NSIS) y lo copia a release/.
// electron-builder trabaja en una carpeta fuera del proyecto: dentro de OneDrive la
// sincronización bloquea los archivos recién creados y el empaquetado falla (EPERM).
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const out = join(process.env.LOCALAPPDATA ?? tmpdir(), 'matematica-build', 'desktop');
rmSync(out, { recursive: true, force: true });

const cli = join(root, 'node_modules', 'electron-builder', 'cli.js');
const r = spawnSync(process.execPath, [cli, '--win', 'nsis', '--x64', `--config.directories.output=${out}`], { cwd: root, stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

const installers = existsSync(out) ? readdirSync(out).filter((n) => n.endsWith('.exe')) : [];
if (!installers.length) {
  console.error('\n  No se generó el instalador.\n');
  process.exit(1);
}
mkdirSync(join(root, 'release'), { recursive: true });
for (const f of installers) {
  copyFileSync(join(out, f), join(root, 'release', f));
  console.log(`\n  Instalador listo: release/${f}`);
}
console.log(`  (app sin instalar para pruebas: ${join(out, 'win-unpacked')})\n`);
