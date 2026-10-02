// En qué app corre la interfaz. Es la misma en ambas; cambia el papel en la sincronización:
// la app de escritorio guarda el progreso de referencia y el móvil lo replica (ver sync/).

/** App del móvil (APK): se conecta al PC para sincronizar el progreso y usar su IA. */
export const IS_PHONE: boolean = __PHONE_APP__;
