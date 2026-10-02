// Primera vinculación cuando el móvil y el PC ya tienen progreso distinto: se elige cómo quedan.
import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { ConflictChoice } from '../sync/replica';
import { pc, usePcLink } from './link';
import { useBackHandler } from './native';

function Choice({ icon, title, text, onClick, primary }: { icon: string; title: string; text: string; onClick(): void; primary?: boolean }) {
  return (
    <button type="button" className={`card hover sync-choice ${primary ? 'primary' : ''}`} onClick={onClick}>
      <Icon name={icon} size={22} />
      <div>
        <div style={{ fontWeight: 650 }}>{title}</div>
        <div className="small muted">{text}</div>
      </div>
    </button>
  );
}

export default function SyncConflictDialog() {
  const phase = usePcLink((s) => s.sync.phase);
  const canCombine = usePcLink((s) => !!s.sync.conflict?.canCombine);
  const pcName = usePcLink((s) => s.target?.name ?? s.sync.pc?.name);
  const deferred = usePcLink((s) => s.conflictDeferred);
  /** Las opciones que descartan progreso se confirman antes. */
  const [confirm, setConfirm] = useState<Exclude<ConflictChoice, 'combine'> | null>(null);
  const open = phase === 'conflict' && !deferred;
  const later = () => {
    setConfirm(null);
    usePcLink.setState({ conflictDeferred: true });
  };
  useBackHandler(() => (confirm ? setConfirm(null) : later()), open);

  if (!open) return null;
  const resolve = (choice: ConflictChoice) => {
    setConfirm(null);
    pc.resolveConflict(choice);
  };
  return (
    <div className="modal-backdrop">
      <div className="modal stack" role="dialog" aria-label="Elegir el progreso">
        <div>
          <h2>El móvil y el PC tienen progreso distinto</h2>
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            Para sincronizarlos, elige cómo quedan. Desde entonces, lo que hagas en uno aparece en el otro.
          </p>
        </div>
        {confirm ? (
          <div className="callout warning small">
            <Icon className="callout-icon" name="alert" size={16} />
            <div className="stack" style={{ gap: 8 }}>
              <div>
                {confirm === 'pc'
                  ? 'Se borrará lo practicado en este móvil y quedará el progreso del PC. No se puede deshacer.'
                  : 'Se borrará el progreso del PC y quedará el de este móvil. No se puede deshacer.'}
              </div>
              <div className="row">
                <button type="button" className="btn danger sm" onClick={() => resolve(confirm)}>
                  {confirm === 'pc' ? 'Usar el del PC' : 'Usar el del móvil'}
                </button>
                <button type="button" className="btn ghost sm" onClick={() => setConfirm(null)}>Volver</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {canCombine && (
              <Choice icon="plus" primary title="Combinar los dos" text="Lo practicado en este móvil se suma al progreso del PC." onClick={() => resolve('combine')} />
            )}
            <Choice icon="monitor" primary={!canCombine} title={`Usar el progreso del PC${pcName ? ` (${pcName})` : ''}`} text="Se descarta lo hecho en este móvil." onClick={() => setConfirm('pc')} />
            <Choice icon="phone" title="Usar el progreso de este móvil" text="Reemplaza el progreso del PC por el de este móvil." onClick={() => setConfirm('phone')} />
          </>
        )}
        <button type="button" className="btn ghost sm" style={{ alignSelf: 'center' }} onClick={later}>
          Decidir después
        </button>
      </div>
    </div>
  );
}
