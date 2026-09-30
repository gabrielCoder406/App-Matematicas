// Laboratorio: galería de herramientas de manipulación visual y modelos conceptuales.
import { Link, useParams } from 'react-router-dom';
import { BLOCK_BY_ID, BLOCKS } from '../content/curriculum';
import { Icon } from '../components/Icon';
import { WIDGET_BY_ID, WIDGETS } from '../widgets';

export default function Lab() {
  const { tool } = useParams();
  const current = tool ? WIDGET_BY_ID[tool] : undefined;

  if (current) {
    const C = current.component;
    const block = BLOCK_BY_ID[current.block];
    return (
      <div className="page wide" style={{ ['--h' as string]: String(block.hue) }}>
        <Link to="/laboratorio" className="small muted row" style={{ gap: 4, marginBottom: 10 }}>
          <Icon name="left" size={16} /> Laboratorio
        </Link>
        <div className="page-header">
          <div>
            <span className="block-tag">{block.short}</span>
            <h1 style={{ marginTop: 8 }}>{current.title}</h1>
            <p>{current.description}</p>
          </div>
        </div>
        <div className="card lab-stage">
          <C {...(current.lab ?? {})} />
        </div>
      </div>
    );
  }

  return (
    <div className="page wide">
      <div className="page-header">
        <div>
          <h1>Laboratorio</h1>
          <p>Modelos interactivos para manipular las ideas: mueve, arrastra y observa cómo cambia todo en tiempo real.</p>
        </div>
      </div>
      {BLOCKS.filter((b) => WIDGETS.some((w) => w.block === b.id)).map((b) => (
        <div key={b.id} style={{ marginBottom: 22, ['--h' as string]: String(b.hue) }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="block-tag">Bloque {b.number}</span>
            <h2 style={{ fontSize: '1.1rem' }}>{b.title}</h2>
          </div>
          <div className="grid auto">
            {WIDGETS.filter((w) => w.block === b.id).map((w) => (
              <Link key={w.id} to={`/laboratorio/${w.id}`} className="card hover lab-card">
                <div className="lab-icon"><Icon name={w.icon} size={22} /></div>
                <h3>{w.title}</h3>
                <p className="small muted" style={{ marginTop: 6 }}>{w.description}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
