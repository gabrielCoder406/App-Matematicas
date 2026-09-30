import 'katex/dist/katex.min.css';
import { MathfieldElement } from 'mathlive';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';
import './styles/app.css';

// MathLive usa las mismas fuentes que KaTeX (ya cargadas por su CSS): no descargar otras.
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;
MathfieldElement.decimalSeparator = ',';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
