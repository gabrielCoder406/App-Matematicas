// Servidor local en modo terminal: `npm run dev` (solo API, la interfaz la sirve Vite)
// o `npm start` (API + interfaz compilada). La app de escritorio no usa este archivo.
import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lanAddresses, startServer } from './app';

const prod = process.argv.includes('--prod');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
// Solo API_PORT: PORT suele venir definido por otras herramientas (y chocaría con Vite).
const port = Number(process.env.API_PORT || 8787);
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };

if (prod && !existsSync(join(dist, 'index.html'))) {
  console.error('\n  No existe la carpeta dist: ejecuta primero «npm run build».\n');
  process.exit(1);
}

try {
  const srv = await startServer({ port, distDir: prod ? dist : null, dataDir: join(root, '.data'), version });
  console.log(`\n  Servidor de la app listo en el puerto ${srv.port}${prod ? ' (producción)' : ''}`);
  console.log(
    srv.config.ocrProvider() === 'local'
      ? `  Lectura de la escritura: ${srv.config.localOcrModel()} en Ollama (${srv.config.ollamaUrl()})`
      : `  Lectura de la escritura: Claude ${srv.config.apiKey() ? '(clave configurada)' : '(falta la clave: agrégala en Ajustes o en .env)'}`,
  );
  console.log(`  Tutor: ${srv.config.tutorModel()} en Ollama`);
  if (prod) {
    console.log(`  Abre en este equipo: http://localhost:${srv.port}`);
    for (const ip of lanAddresses()) console.log(`  Desde el móvil (misma Wi-Fi): http://${ip}:${srv.port}`);
  }
  console.log('');
} catch (e) {
  const err = e as NodeJS.ErrnoException;
  if (err.code === 'EADDRINUSE') console.error(`\n  El puerto ${port} está ocupado (¿la app de escritorio u otro «npm run dev» ya está abierto?). Ciérralo o define API_PORT en .env.\n`);
  else console.error(err);
  process.exit(1);
}
