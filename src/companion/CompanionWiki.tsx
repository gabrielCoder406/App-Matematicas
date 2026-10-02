// Wiki de temas sobre la pizarra remota en el navegador del móvil (enlace del QR). El botón
// «atrás» del navegador vuelve a la ficha anterior o cierra la wiki, en lugar de salir de la
// pizarra. (La app del móvil usa el panel de la wiki de siempre: components/wiki/WikiPanel.tsx.)
import { useEffect, useRef } from 'react';
import { WikiBrowser } from '../components/wiki/WikiBrowser';
import { useWiki } from '../store/wiki';

export default function CompanionWiki() {
  const closing = useRef(false);

  useEffect(() => {
    const addEntry = () => history.pushState({ ...history.state, wiki: true }, '');
    if (!history.state?.wiki) addEntry();
    const onPop = (e: PopStateEvent) => {
      if ((e.state as { wiki?: boolean } | null)?.wiki) return;
      const w = useWiki.getState();
      if (!closing.current && w.entryId) {
        w.goBack();
        addEntry();
      } else {
        w.close();
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const close = () => {
    closing.current = true;
    // Quita la entrada del historial agregada al abrir; `popstate` cierra la wiki.
    if (history.state?.wiki) history.back();
    else useWiki.getState().close();
  };

  return <WikiBrowser className="wiki-panel companion-wiki" onClose={close} />;
}
