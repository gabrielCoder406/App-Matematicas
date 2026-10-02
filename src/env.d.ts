// Constantes que define Vite al compilar (ver vite.config.ts y vite.companion.config.ts).

/** true en la app del móvil (APK «Pizarra Matemática»); false en la de escritorio y en el navegador. */
declare const __PHONE_APP__: boolean;

/** Versión de la app (package.json). */
declare const __APP_VERSION__: string;
