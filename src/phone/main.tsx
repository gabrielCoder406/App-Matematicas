// Punto de entrada de la app del móvil (APK «Pizarra Matemática»): la misma app que la de
// escritorio, con el progreso guardado en el móvil y sincronizado con el PC vinculado.
import { initIndexedDbStorage } from '../lib/storage';
import { installBackButton } from './native';

// El progreso se lee al crear los stores: primero hay que cargar lo guardado.
initIndexedDbStorage()
  .catch(() => {})
  .then(async () => {
    installBackButton();
    const [{ pc }, { renderApp }] = await Promise.all([import('./link'), import('../boot')]);
    pc.start();
    renderApp('hash');
  });
