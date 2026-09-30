// Puente que expone la app de escritorio (electron/preload.ts) a la interfaz.

interface DesktopBridge {
  isDesktop: true;
  version: string;
  platform: string;
  storage: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
  };
  openDataFolder(): void;
}

interface Window {
  desktop?: DesktopBridge;
}
