// Wiki de temas en el móvil: la misma consulta que la app de escritorio, incluida en el APK
// (funciona sin conexión y sin el PC). El botón «atrás» de Android vuelve a la ficha anterior
// o cierra la wiki, en lugar de desconectar la pizarra.
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
