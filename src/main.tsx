import { renderApp } from './boot';

// El servidor de desarrollo de la app del móvil (npm run dev:companion) también sirve esta página
// en su raíz: la app del móvil es companion.html.
if (__PHONE_APP__) location.replace(`/companion.html${location.hash}`);
else renderApp('browser');
