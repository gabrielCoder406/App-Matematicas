// Diálogo de emparejamiento: QR + dirección y código para escribir en la app del móvil.
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { isDesktop } from '../lib/storage';
import { pairing, usePairing } from './pairing';

export function PairingDialog({ onClose }: { onClose(): void }) {
  const st = usePairing();
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    pairing.start();
  }, []);

  useEffect(() => {
    if (!st.url) return;
    QRCode.toDataURL(st.url, { margin: 1, width: 260, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setQr(null));
  }, [st.url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const code = st.code ? `${st.code.slice(0, 3)} ${st.code.slice(3)}` : '— — —';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal pairing-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Conectar el móvil">
        <div className="row between" style={{ marginBottom: 12 }}>
          <h2>Escribir desde el móvil</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><Icon name="x" /></button>
        </div>
        <div className="pairing">
          <div className="qr-box">
            {st.status === 'ready' && qr ? <img src={qr} alt="Código QR de emparejamiento" width={220} height={220} /> : (
              <div className="empty" style={{ padding: 20 }}>
                {st.status === 'error' ? <Icon name="alert" size={28} /> : <span className="spinner" />}
              </div>
            )}
          </div>
          <div className="stack" style={{ gap: 10 }}>
            <ol className="small pairing-steps">
              <li>Conecta el móvil a la <b>misma red Wi-Fi</b> que este equipo.</li>
              <li>Abre la app <b>Pizarra Matemática</b> en el móvil y toca <b>Escanear QR</b>. <span className="muted">Sin la app, escanea el QR con la cámara y abre el enlace en el navegador.</span></li>
              <li>O escribe estos datos en la app:</li>
            </ol>
            <div className="pair-data">
              <div><span className="tiny faint">Dirección del PC</span><b className="mono">{st.address ?? '—'}</b></div>
              <div><span className="tiny faint">Puerto</span><b className="mono">{st.port ?? '—'}</b></div>
              <div><span className="tiny faint">Código</span><b className="mono pair-code">{code}</b></div>
            </div>
            <div className="row wrap">
              <span className={`badge ${st.peers > 0 ? 'success' : st.status === 'ready' ? 'info' : st.status === 'error' ? 'danger' : ''}`}>
                <Icon name={st.peers > 0 ? 'phone' : 'wifi'} size={13} />
                {st.peers > 0 ? `${st.peers} ${st.peers === 1 ? 'dispositivo conectado' : 'dispositivos conectados'}` : st.status === 'ready' ? 'Esperando al móvil…' : st.status === 'error' ? 'Sin conexión' : 'Conectando…'}
              </span>
            </div>
            {st.error && <div className="callout danger small"><Icon className="callout-icon" name="alert" size={16} />{st.error}</div>}
            {st.status === 'ready' && !st.address && (
              <div className="callout warning small">
                <Icon className="callout-icon" name="alert" size={16} />
                No se detectó la red local de este equipo. Conéctalo a una red Wi-Fi o por cable.
              </div>
            )}
            <div className="tiny faint">
              ¿No conecta? {isDesktop ? 'Si Windows preguntó por el acceso a la red, permite que «Matemática» use redes privadas. ' : ''}
              Comprueba que la red Wi-Fi no sea de invitados (aíslan los dispositivos) y que el móvil no use datos móviles.
            </div>
          </div>
        </div>
        <div className="row wrap" style={{ marginTop: 16 }}>
          {st.url && (
            <button
              className="btn sm ghost"
              onClick={() => {
                navigator.clipboard?.writeText(st.url!).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
            >
              <Icon name={copied ? 'check' : 'copy'} size={15} /> {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
          )}
          <button className="btn sm ghost" onClick={() => pairing.reset()} title="Genera un código nuevo; los móviles conectados se desconectan">
            <Icon name="refresh" size={15} /> Cambiar código
          </button>
          <span className="spacer" />
          <button className="btn primary" onClick={onClose}>Listo</button>
        </div>
      </div>
    </div>
  );
}
