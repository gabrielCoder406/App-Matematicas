// Punto de entrada de la app del móvil (se empaqueta como APK con Capacitor).
import 'katex/dist/katex.min.css';
import { createRoot } from 'react-dom/client';
import '../styles/global.css';
import '../styles/app.css';
import { CompanionApp } from './CompanionApp';

createRoot(document.getElementById('root')!).render(<CompanionApp />);
