// Compila el APK firmado de «Pizarra Matemática» y lo copia a release/.
// Requisitos: JDK 21 y Android SDK (se buscan en JAVA_HOME / ANDROID_HOME o en %LOCALAPPDATA%).
// Antes: `npm run android:sync` (lo hace `npm run apk`).
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const android = join(root, 'android');
const win = process.platform === 'win32';
const local = process.env.LOCALAPPDATA ?? '';

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

function findJavaHome() {
  const candidates = [process.env.JAVA_HOME];
  const progs = join(local, 'Programs');
  if (existsSync(progs)) {
    for (const d of readdirSync(progs).filter((n) => /^jdk-2[1-9]/.test(n)).sort().reverse()) candidates.push(join(progs, d));
  }
  candidates.push(join(local, 'Android', 'Android Studio', 'jbr'), 'C:\\Program Files\\Android\\Android Studio\\jbr');
  return candidates.find((p) => p && existsSync(join(p, 'bin', win ? 'java.exe' : 'java')));
}

function findSdk() {
  const candidates = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT, join(local, 'Android', 'Sdk')];
  return candidates.find((p) => p && existsSync(join(p, 'platforms')));
}

const javaHome = findJavaHome();
if (!javaHome) fail('No se encontró el JDK 21. Instálalo (por ejemplo, Eclipse Temurin 21) o define JAVA_HOME.');
const sdk = findSdk();
if (!sdk) fail('No se encontró el Android SDK. Instala Android Studio o define ANDROID_HOME.');
if (!existsSync(join(android, 'app'))) fail('Falta el proyecto Android: ejecuta «npx cap add android».');

const env = { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdk, ANDROID_SDK_ROOT: sdk, PATH: `${join(javaHome, 'bin')}${win ? ';' : ':'}${process.env.PATH}` };
writeFileSync(join(android, 'local.properties'), `sdk.dir=${sdk.replaceAll('\\', '\\\\').replaceAll(':', '\\:')}\n`);

// Firma: se crea una sola vez. Guárdala: sin ella no se pueden instalar actualizaciones encima.
const propsFile = join(android, 'keystore.properties');
if (!existsSync(propsFile)) {
  const password = randomBytes(18).toString('base64url');
  const store = 'matematica-release.jks';
  console.log('Creando la firma del APK (android/matematica-release.jks)…');
  execFileSync(join(javaHome, 'bin', win ? 'keytool.exe' : 'keytool'), [
    '-genkeypair', '-v', '-keystore', join(android, store), '-alias', 'pizarra', '-keyalg', 'RSA', '-keysize', '2048',
    '-validity', '10000', '-storepass', password, '-keypass', password, '-dname', 'CN=Pizarra Matematica, O=Matematica, C=AR',
  ], { stdio: 'inherit', env });
  writeFileSync(propsFile, `storeFile=${store}\nstorePassword=${password}\nkeyAlias=pizarra\nkeyPassword=${password}\n`);
}

console.log('Compilando el APK (la primera vez Gradle descarga sus dependencias y tarda varios minutos)…');
// Con LOCALAPPDATA, la compilación va fuera del proyecto (ver android/build.gradle), también la caché.
const outRoot = local ? join(local, 'matematica-build', 'android') : null;
const gradleArgs = ['assembleRelease', '--no-daemon', '--console=plain', ...(outRoot ? ['--project-cache-dir', join(outRoot, '.gradle')] : [])];
const quote = (a) => (/\s/.test(a) ? `"${a}"` : a);
const gradle = win
  ? spawnSync(`"${join(android, 'gradlew.bat')}" ${gradleArgs.map(quote).join(' ')}`, { cwd: android, env, stdio: 'inherit', shell: true })
  : spawnSync(join(android, 'gradlew'), gradleArgs, { cwd: android, env, stdio: 'inherit' });
if (gradle.status !== 0) fail('Gradle no pudo compilar el APK (revisa los mensajes de arriba).');

const apk = [outRoot && join(outRoot, 'app'), join(android, 'app', 'build')]
  .filter(Boolean)
  .map((d) => join(d, 'outputs', 'apk', 'release', 'app-release.apk'))
  .find(existsSync);
if (!apk) fail('No se encontró el APK compilado.');
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
mkdirSync(join(root, 'release'), { recursive: true });
const out = join(root, 'release', `PizarraMatematica-${version}.apk`);
copyFileSync(apk, out);
console.log(`\n  APK listo: ${out}\n`);
