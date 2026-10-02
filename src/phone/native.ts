// Funciones de la app Android (Capacitor): pantalla encendida, orientación y botón «atrás». En
// el navegador y en la app de escritorio no hacen nada.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { useEffect, useRef } from 'react';

interface KeepAwakePlugin {
  set(options: { on: boolean }): Promise<void>;
}

/** Plugin propio de la app (android/.../KeepAwakePlugin.java). */
const KeepAwake = registerPlugin<KeepAwakePlugin>('KeepAwake');

let awake = 0;

function applyKeepAwake(): void {
  if (Capacitor.isNativePlatform()) KeepAwake.set({ on: awake > 0 }).catch(() => {});
}

/** La pantalla no se apaga mientras el componente está montado (pizarras: se escribe sin tocar nada más). */
export function useKeepAwake(active = true): void {
  useEffect(() => {
    if (!active) return undefined;
    awake++;
    applyKeepAwake();
    return () => {
      awake--;
      applyKeepAwake();
    };
  }, [active]);
}

/** App Android: en horizontal mientras `active` (las pizarras son más anchas que altas). */
export function useLandscape(active: boolean): void {
  useEffect(() => {
    if (!active || !Capacitor.isNativePlatform()) return undefined;
    ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
    return () => {
      ScreenOrientation.unlock().catch(() => {});
    };
  }, [active]);
}

// Botón «atrás» de Android: MainActivity llama a window.androidBack(). Primero se cierra lo que
// esté abierto encima (la wiki, un diálogo, el menú); si no hay nada, se vuelve a la pantalla
// anterior y, en la primera, la app pasa a segundo plano.
const backHandlers: (() => void)[] = [];

/** Mientras `active`, el botón «atrás» llama a `onBack` (el último registrado tiene prioridad). */
export function useBackHandler(onBack: () => void, active = true): void {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return undefined;
    const h = () => ref.current();
    backHandlers.push(h);
    return () => {
      const i = backHandlers.lastIndexOf(h);
      if (i >= 0) backHandlers.splice(i, 1);
    };
  }, [active]);
}

declare global {
  interface Window {
    /** Lo llama la app Android al tocar «atrás»; true si la interfaz lo atendió. */
    androidBack?: () => boolean;
  }
}

export function installBackButton(): void {
  window.androidBack = () => {
    const h = backHandlers[backHandlers.length - 1];
    if (!h) return false;
    h();
    return true;
  };
}
