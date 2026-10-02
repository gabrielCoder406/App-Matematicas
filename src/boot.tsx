// Arranque común de la interfaz (app de escritorio, navegador y app del móvil).
import 'katex/dist/katex.min.css';
import { MathfieldElement } from 'mathlive';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/app.css';

/**
 * `hash`: rutas en el fragmento (#/temario). La app del móvil las usa porque el WebView de Android
 * no sabe abrir directamente una ruta como /habilidad/arith.fractions al recargar.
 */
export function renderApp(router: 'browser' | 'hash'): void {
  // MathLive usa las mismas fuentes que KaTeX (ya cargadas por su CSS): no descargar otras.
  MathfieldElement.fontsDirectory = null;
  MathfieldElement.soundsDirectory = null;
  MathfieldElement.decimalSeparator = ',';
  const Router = router === 'hash' ? HashRouter : BrowserRouter;
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Router>
        <App />
      </Router>
    </StrictMode>,
  );
}
