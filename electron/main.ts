// App de escritorio: arranca el servidor local (API, OCR y emparejamiento con el móvil)
// dentro del propio proceso y abre la interfaz en una ventana.
import { app, BrowserWindow, dialog, ipcMain, Menu, nativeTheme, safeStorage, shell, type MenuItemConstructorOptions } from 'electron';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { startServer, type RunningServer } from '../server/app';
import { COPYRIGHT } from '../shared/about';

const APP_NAME = 'Matemática';
const PREFERRED_PORT = 8787;

// Carpeta de datos con nombre ASCII: %APPDATA%\Matematica (MATEMATICA_DATA_DIR la cambia, útil en pruebas).
app.setName(APP_NAME);
app.setPath('userData', process.env.MATEMATICA_DATA_DIR || join(app.getPath('appData'), 'Matematica'));
if (process.platform === 'win32') app.setAppUserModelId('com.matematica.app');

const smokeTest = process.argv.find((a) => a.startsWith('--smoke-test='))?.slice('--smoke-test='.length);

/** Almacén clave-valor en un JSON (progreso y ajustes de la interfaz). */
class FileStore {
  private data: Record<string, string> = {};
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private file: string) {
    try {
      if (existsSync(file)) this.data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
    } catch {
      // Archivo dañado: se conserva una copia y se empieza de cero.
      try {
        renameSync(file, `${file}.dañado-${Date.now()}`);
      } catch {
        /* nada */
      }
      this.data = {};
    }
  }

  get(key: string): string | null {
    return Object.hasOwn(this.data, key) ? this.data[key] : null;
  }

  set(key: string, value: string): void {
    this.data[key] = value;
    this.schedule();
  }

  remove(key: string): void {
    delete this.data[key];
    this.schedule();
  }

  private schedule(): void {
    if (!this.timer) this.timer = setTimeout(() => this.flush(), 300);
  }

  flush(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.data), 'utf8');
    renameSync(tmp, this.file);
  }
}

let win: BrowserWindow | null = null;
let server: RunningServer | null = null;
let store: FileStore | null = null;
let origin = '';

function iconPath(): string | undefined {
  const candidates = [join(process.resourcesPath ?? '', 'icon.png'), join(app.getAppPath(), 'build', 'icon.png')];
  return candidates.find((p) => existsSync(p));
}

function buildMenu(): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Archivo',
      submenu: [
        { label: 'Abrir carpeta de datos', click: () => void shell.openPath(app.getPath('userData')) },
        { type: 'separator' },
        { role: 'quit', label: 'Salir' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Tamaño normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla completa' },
      ],
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: `Acerca de ${APP_NAME}`,
          click: () =>
            void dialog.showMessageBox({
              type: 'info',
              title: APP_NAME,
              message: `${APP_NAME} ${app.getVersion()}`,
              detail: `${COPYRIGHT}\n\nServidor local en el puerto ${server?.port ?? '?'}.\nDatos: ${app.getPath('userData')}`,
            }),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow(): void {
  const w = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: APP_NAME,
    icon: iconPath(),
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0e1016' : '#f5f6fb',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win = w;
  w.once('ready-to-show', () => {
    if (!smokeTest) w.show();
  });
  w.on('closed', () => {
    if (win === w) win = null;
  });

  // Enlaces externos en el navegador del sistema; la ventana nunca sale de la app.
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url) && !url.startsWith(origin)) void shell.openExternal(url);
    return { action: 'deny' };
  });
  w.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith(origin)) return;
    e.preventDefault();
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
  });

  if (smokeTest) runSmokeTest(w, smokeTest);
  void w.loadURL(`${origin}/`);
}

/** Prueba automática: captura la ventana y los errores de consola, y cierra la app. */
function runSmokeTest(w: BrowserWindow, file: string): void {
  const logs: string[] = [];
  w.webContents.on('console-message', (details) => {
    if (details.level === 'error' || details.level === 'warning') logs.push(`[${details.level}] ${details.message}`);
  });
  w.webContents.on('did-fail-load', (_e, code, desc) => logs.push(`[load] ${code} ${desc}`));
  w.webContents.once('did-finish-load', () => {
    setTimeout(async () => {
      try {
        const text = await w.webContents.executeJavaScript('document.body.innerText.slice(0, 400)');
        const image = await w.webContents.capturePage();
        writeFileSync(file, image.toPNG());
        writeFileSync(`${file}.json`, JSON.stringify({ port: server?.port, text, logs, userData: app.getPath('userData') }, null, 2));
      } finally {
        app.quit();
      }
    }, 3500);
  });
}

function registerIpc(): void {
  const fromApp = (e: Electron.IpcMainEvent) => !!origin && (e.senderFrame?.url ?? '').startsWith(origin);
  ipcMain.on('store:get', (e, key: unknown) => {
    e.returnValue = fromApp(e) && store ? store.get(String(key)) : null;
  });
  ipcMain.on('store:set', (e, key: unknown, value: unknown) => {
    if (fromApp(e)) store?.set(String(key), String(value));
  });
  ipcMain.on('store:remove', (e, key: unknown) => {
    if (fromApp(e)) store?.remove(String(key));
  });
  ipcMain.on('app:info', (e) => {
    e.returnValue = { version: app.getVersion(), platform: process.platform };
  });
  ipcMain.on('app:open-data', (e) => {
    if (fromApp(e)) void shell.openPath(app.getPath('userData'));
  });
}

async function start(): Promise<void> {
  const dataDir = app.getPath('userData');
  mkdirSync(dataDir, { recursive: true });
  store = new FileStore(join(dataDir, 'progreso.json'));
  registerIpc();
  buildMenu();

  const encrypt = safeStorage.isEncryptionAvailable();
  try {
    server = await startServer({
      port: PREFERRED_PORT,
      portFallbacks: 10,
      distDir: join(app.getAppPath(), 'dist'),
      dataDir,
      version: app.getVersion(),
      desktop: true,
      secrets: {
        encrypt: (plain) => (encrypt ? `enc:${safeStorage.encryptString(plain).toString('base64')}` : plain),
        decrypt: (stored) => (stored.startsWith('enc:') ? safeStorage.decryptString(Buffer.from(stored.slice(4), 'base64')) : stored),
      },
    });
  } catch (e) {
    dialog.showErrorBox(APP_NAME, `No se pudo iniciar el servidor interno de la app.\n\n${e instanceof Error ? e.message : String(e)}`);
    app.exit(1);
    return;
  }
  origin = `http://localhost:${server.port}`;
  createWindow();
}

if (!app.requestSingleInstanceLock()) {
  // Ya hay una ventana abierta: se enfoca esa (ver 'second-instance').
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  app.whenReady().then(start);
  app.on('activate', () => {
    if (!win && origin) createWindow();
  });
  app.on('window-all-closed', () => app.quit());
  app.on('before-quit', () => {
    store?.flush();
    void server?.close();
  });
}
