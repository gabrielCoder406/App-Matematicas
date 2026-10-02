// Bienvenida (primer uso): nombre y cómo empezar (diagnóstico o desde cero).
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { SKILLS } from '../content/curriculum';
import { IS_PHONE } from '../lib/platform';
import { useProgress } from '../store/progress';

const FEATURES = [
  { icon: 'book', title: 'Microlecciones', text: 'Bloques de 3 a 7 minutos, una idea por vez.' },
  { icon: 'steps', title: 'Paso a paso', text: 'Cada línea se valida y se detecta el error exacto.' },
  { icon: 'pen', title: 'Escritura a mano', text: 'Escribe en el PC o en el móvil y se convierte en fórmulas.' },
  { icon: 'brain', title: 'Se adapta a ti', text: 'Refuerza los baches y repasa antes de que olvides.' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const profileName = useProgress((s) => s.profileName);
  const setProfile = useProgress((s) => s.setProfile);
  const setOnboarded = useProgress((s) => s.setOnboarded);
  const [name, setName] = useState(profileName);

  const go = (to: string) => {
    setProfile(name.trim());
    setOnboarded(true);
    navigate(to, { replace: true });
  };

  return (
    <div className="onboarding">
      <div className="onboarding-card card">
        <div className="brand" style={{ padding: 0 }}>
          <div className="brand-mark">∑</div>
          <span>Matemática</span>
        </div>
        <h1>Aprende matemática paso a paso</h1>
        <p className="muted" style={{ margin: 0 }}>
          {SKILLS.length} temas, desde lógica y aritmética hasta cálculo, álgebra lineal y estadística.
        </p>
        <div className="grid cols-2" style={{ gap: 10 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <span className="state-icon in-progress"><Icon name={f.icon} size={14} /></span>
              <div>
                <div style={{ fontWeight: 650 }}>{f.title}</div>
                <div className="small muted">{f.text}</div>
              </div>
            </div>
          ))}
        </div>
        <label className="field">
          <span>¿Cómo te llamas? (opcional)</span>
          <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go('/diagnostico')} autoFocus />
        </label>
        <div className="stack" style={{ gap: 8 }}>
          <button className="btn primary lg block" onClick={() => go('/diagnostico')}>
            <Icon name="target" size={18} /> Hacer la evaluación diagnóstica
          </button>
          <div className="tiny faint" style={{ textAlign: 'center' }}>Recomendado si ya sabes algunos temas: son unas pocas preguntas y saltas lo que dominas.</div>
          <button className="btn ghost block" onClick={() => go('/')}>
            Empezar desde el principio
          </button>
          {IS_PHONE && (
            <>
              <div className="connect-or"><span>¿Ya usas la app en el PC?</span></div>
              <button className="btn outline block" onClick={() => navigate('/pc')}>
                <Icon name="monitor" size={18} /> Vincular con el PC
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
