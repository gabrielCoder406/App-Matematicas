// Panel de consulta rápida de la wiki en la app de escritorio: se abre sobre cualquier pantalla
// (Ctrl+K, el buscador de la barra lateral o el botón «Ficha» de un ejercicio) sin salir de ella,
// así se puede repasar una fórmula en medio de un ejercicio y seguir escribiendo.
import { Link } from 'react-router-dom';
import { wikiEntry } from '../../content/wiki';
import { useWiki, WIKI_SHORTCUT } from '../../store/wiki';
import { Icon } from '../Icon';
import { WikiBrowser } from './WikiBrowser';
import { desktopExtras } from './WikiExtras';

export default function WikiPanel() {
  const entry = wikiEntry(useWiki((s) => s.entryId));
  const close = () => useWiki.getState().close();
  return (
    <WikiBrowser
      className="wiki-panel"
      onClose={close}
      entryExtras={(e) => desktopExtras(e, true)}
      actions={
        <Link to={entry ? `/wiki/${entry.id}` : '/wiki'} className="icon-btn" title="Abrir en página completa" onClick={close}>
          <Icon name="external" size={18} />
        </Link>
      }
      footer={
        <div className="wiki-panel-foot tiny faint">
          <span className="kbd">{WIKI_SHORTCUT}</span> abre la wiki desde cualquier pantalla · <span className="kbd">Esc</span> la cierra
        </div>
      }
    />
  );
}
