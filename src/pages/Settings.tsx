// Ajustes: IA (lectura de la escritura y tutor), móvil, apariencia, estudio y datos. En la app
// del móvil, la sincronización con el PC en lugar de la IA (que corre en el PC).
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { PairingDialog } from '../canvas/PairingDialog';
import { usePairing } from '../canvas/pairing';
import { PROGRESS_VERSION } from '../learning/engine';
import type { ProgressData, Theme } from '../learning/types';
import { IS_PHONE } from '../lib/platform';
import { isDesktop } from '../lib/storage';
import { pickData, useProgress } from '../store/progress';
import { useUi } from '../store/ui';
import { COPYRIGHT } from '../../shared/about';
import { AiSettings } from './AiSettings';

const PhoneSyncCard = lazy(() => import('../phone/PhoneSyncCard'));

function timeAgo(t: number | null): string {
  if (!t) return 'todavía no';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `hace ${h} h` : new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

/** Nombre: se guarda (y se sincroniza) al terminar de escribirlo, no con cada letra. */
function NameField() {
  const profileName = useProgress((s) => s.profileName);
  const setProfile = useProgress((s) => s.setProfile);
  const [name, setName] = useState(profileName);
  useEffect(() => setName(profileName), [profileName]);
  const save = () => setProfile(name.trim());
  return (
    <label className="field" style={{ marginTop: 12 }}>
      <span>Tu nombre</span>
      <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} placeholder="Opcional" />
    </label>
  );
}

/** PC: móviles vinculados (sincronización del progreso y pizarra remota). */
function PhonesCard({ onPair }: { onPair(): void }) {
  const peers = usePairing((s) => s.peers);
  const code = usePairing((s) => s.code);
  const linked = useProgress((s) => Object.keys(s.sync.applied).length);
  const lastSync = useProgress((s) => s.sync.lastSync);
  return (
    <div className="card">
      <h3 style={{ marginBottom: 6 }}><Icon name="phone" size={18} /> Móvil: progreso y pizarra</h3>
      <p className="small muted" style={{ marginTop: 0 }}>
        Instala la app <b>Pizarra Matemática</b> (APK) en tu teléfono Android: es esta misma app, con el progreso <b>sincronizado</b> con este PC (lo que practiques en uno aparece en el otro). Conectado, también sirve para escribir los ejercicios con el dedo o un lápiz y verlos aquí al instante.
      </p>
      <div className="row wrap">
        <span className={`badge ${peers > 0 ? 'success' : ''}`}>
          <Icon name="phone" size={13} /> {peers > 0 ? (peers === 1 ? 'Móvil conectado' : `${peers} móviles conectados`) : 'Ningún móvil conectado'}
        </span>
        {code && <span className="badge mono">Código {code.slice(0, 3)} {code.slice(3)}</span>}
        <span className="spacer" />
        <button className="btn outline sm" onClick={onPair}>
          <Icon name="qr" size={16} /> Conectar móvil
        </button>
      </div>
      <div className="tiny faint" style={{ marginTop: 8 }}>
        {linked > 0
          ? `Progreso sincronizado con ${linked === 1 ? 'un móvil' : `${linked} móviles`} · último cambio recibido ${timeAgo(lastSync)}.`
          : 'Todavía no se vinculó ningún móvil: al vincularlo recibe el progreso de este PC.'}
        {' '}Sin conexión, cada uno sigue funcionando y se ponen al día al reconectarse (misma red Wi-Fi, con esta app abierta).
      </div>
    </div>
  );
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Settings() {
  const settings = useProgress((s) => s.settings);
  const setSettings = useProgress((s) => s.setSettings);
  const reset = useProgress((s) => s.reset);
  const importData = useProgress((s) => s.importData);
  const linkedPhones = useProgress((s) => Object.keys(s.sync.applied).length);
  const phoneLinked = useProgress((s) => !!s.sync.profile);
  const toast = useUi((s) => s.toast);
  const [pairOpen, setPairOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Partial<ProgressData>;
      if (!data || typeof data !== 'object' || typeof data.skills !== 'object' || !Array.isArray(data.attempts)) throw new Error('formato');
      importData({ ...pickData(useProgress.getState()), ...data, version: PROGRESS_VERSION } as ProgressData);
      toast({ kind: 'success', title: 'Progreso importado' });
    } catch {
      toast({ kind: 'danger', title: 'No se pudo importar', body: 'El archivo no es una copia de progreso válida.' });
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ajustes</h1>
          <p>{IS_PHONE ? 'Sincronización con el PC, apariencia y datos.' : 'Inteligencia artificial, móvil, apariencia y datos.'}</p>
        </div>
      </div>

      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          {IS_PHONE ? (
            <Suspense fallback={null}>
              <PhoneSyncCard />
            </Suspense>
          ) : (
            <>
              <AiSettings />
              <PhonesCard onPair={() => setPairOpen(true)} />
            </>
          )}
        </div>

        <div className="stack">
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Apariencia y estudio</h3>
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600 }}>Tema</div>
              </div>
              <Segmented<Theme>
                value={settings.theme}
                options={[{ id: 'system', label: 'Sistema' }, { id: 'light', label: 'Claro' }, { id: 'dark', label: 'Oscuro' }]}
                onChange={(theme) => setSettings({ theme })}
              />
            </div>
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600 }}>Teclado matemático en pantalla</div>
                <div className="tiny faint">Se abre al tocar un campo de fórmula en pantallas táctiles.</div>
              </div>
              <button className={`switch ${settings.virtualKeyboard ? 'on' : ''}`} role="switch" aria-checked={settings.virtualKeyboard} onClick={() => setSettings({ virtualKeyboard: !settings.virtualKeyboard })} />
            </div>
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600 }}>Meta diaria</div>
                <div className="tiny faint">Minutos de estudio efectivo por día.</div>
              </div>
              <select className="input" style={{ width: 110 }} value={settings.dailyGoalMinutes} onChange={(e) => setSettings({ dailyGoalMinutes: Number(e.target.value) })}>
                {[5, 10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600 }}>Pausa por inactividad</div>
                <div className="tiny faint">Tras estos segundos sin actividad deja de contar el tiempo.</div>
              </div>
              <select className="input" style={{ width: 110 }} value={settings.idleSeconds} onChange={(e) => setSettings({ idleSeconds: Number(e.target.value) })}>
                {[15, 25, 40, 60, 90].map((s) => <option key={s} value={s}>{s} s</option>)}
              </select>
            </div>
            <NameField />
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Progreso y datos</h3>
            <div className="stack" style={{ gap: 10 }}>
              <Link to="/diagnostico" className="btn outline">
                <Icon name="target" size={16} /> Hacer la evaluación diagnóstica
              </Link>
              {IS_PHONE ? (
                <div className="tiny faint">Las copias del progreso (exportar e importar) se hacen desde la app del PC; con el móvil vinculado, el progreso queda guardado en los dos.</div>
              ) : (
                <div className="row wrap">
                  <button className="btn ghost sm" onClick={() => download(`progreso-matematica-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(pickData(useProgress.getState()), null, 1))}>
                    <Icon name="download" size={16} /> Exportar progreso
                  </button>
                  <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>
                    <Icon name="plus" size={16} /> Importar
                  </button>
                  {isDesktop && (
                    <button className="btn ghost sm" onClick={() => window.desktop?.openDataFolder()}>
                      <Icon name="book" size={16} /> Carpeta de datos
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void onImport(f); e.target.value = ''; }} />
                </div>
              )}
              {!confirmReset ? (
                <button className="btn ghost sm" style={{ alignSelf: 'flex-start', color: 'var(--danger)' }} onClick={() => setConfirmReset(true)}>
                  <Icon name="trash" size={16} /> Borrar todo el progreso
                </button>
              ) : (
                <div className="callout danger small">
                  <Icon className="callout-icon" name="alert" size={16} />
                  <div className="stack" style={{ gap: 8 }}>
                    <div>
                      Se borrarán el dominio de cada tema, el historial y el banco de errores. Los ajustes se conservan. Esta acción no se puede deshacer.
                      {IS_PHONE && phoneLinked && <b> También se borrará en el PC vinculado.</b>}
                      {!IS_PHONE && linkedPhones > 0 && <b> También se borrará en los móviles vinculados.</b>}
                    </div>
                    <div className="row">
                      <button className="btn danger sm" onClick={() => { reset(); setConfirmReset(false); toast({ kind: 'info', title: 'Progreso borrado' }); }}>Borrar</button>
                      <button className="btn ghost sm" onClick={() => setConfirmReset(false)}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="tiny faint">
                {isDesktop || IS_PHONE ? `${IS_PHONE ? 'Pizarra Matemática' : 'Matemática'} ${__APP_VERSION__} · ` : ''}
                {COPYRIGHT}
              </div>
            </div>
          </div>
        </div>
      </div>
      {pairOpen && <PairingDialog onClose={() => setPairOpen(false)} />}
    </div>
  );
}
