// Puente seguro entre la ventana y el proceso principal (ver src/desktop.d.ts).
import { contextBridge, ipcRenderer } from 'electron';

const info = ipcRenderer.sendSync('app:info') as { version: string; platform: string };

contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  version: info.version,
  platform: info.platform,
  storage: {
    getItem: (key: string): string | null => ipcRenderer.sendSync('store:get', String(key)) as string | null,
    setItem: (key: string, value: string): void => ipcRenderer.send('store:set', String(key), String(value)),
    removeItem: (key: string): void => ipcRenderer.send('store:remove', String(key)),
  },
  openDataFolder: (): void => ipcRenderer.send('app:open-data'),
});
