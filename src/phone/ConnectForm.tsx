// Vincular el móvil con el PC: escanear el QR que muestra la app de escritorio o escribir la
// dirección y el código.
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { DEFAULT_PORT, parsePairUrl, type PairTarget } from '../canvas/protocol';
import { QrScanner } from './QrScanner';

export function ConnectForm({ initialHost, initialPort, onConnect }: { initialHost?: string; initialPort?: number; onConnect(t: PairTarget): void }) {
  const [scanning, setScanning] = useState(false);
  const [host, setHost] = useState(initialHost ?? '');
  const [code, setCode] = useState('');
  const [port, setPort] = useState(String(initialPort ?? DEFAULT_PORT));
  const [formError, setFormError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // También se acepta pegar el enlace completo del QR.
    const fromUrl = parsePairUrl(host);
    if (fromUrl) {
      onConnect(fromUrl);
      return;
    }
    const h = host.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const [hostPart, portPart] = h.split(':');
    const digits = code.replace(/\D/g, '');
    const p = Number(portPart || port);
    if (!/^[a-z0-9.-]+$/i.test(hostPart ?? '')) return setFormError('Escribe la dirección del PC, por ejemplo 192.168.1.10.');
    if (digits.length !== 6) return setFormError('El código tiene 6 dígitos.');
    if (!Number.isInteger(p) || p < 1 || p > 65535) return setFormError('El puerto no es válido.');
    setFormError(null);
    onConnect({ host: hostPart, port: p, code: digits });
  };

  if (scanning) {
    return (
      <QrScanner
        onCancel={() => setScanning(false)}
        onResult={(text) => {
          const t = parsePairUrl(text);
          if (!t) return false;
          setScanning(false);
          onConnect(t);
          return true;
        }}
      />
    );
  }

  return (
    <div className="stack">
      <button className="btn primary lg block" onClick={() => setScanning(true)}>
        <Icon name="camera" size={20} /> Escanear código QR
      </button>

      <div className="connect-or"><span>o escribe los datos</span></div>

      <form className="stack connect-form" onSubmit={submit}>
        <label className="field">
          <span>Dirección del PC</span>
          <input className="input" value={host} onChange={(e) => setHost(e.target.value)} placeholder="192.168.1.10" inputMode="decimal" autoComplete="off" autoCapitalize="off" spellCheck={false} />
        </label>
        <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
          <label className="field" style={{ flex: 1 }}>
            <span>Código</span>
            <input className="input mono code-input" value={code} onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, '').slice(0, 7))} placeholder="000 000" inputMode="numeric" autoComplete="one-time-code" />
          </label>
          <label className="field" style={{ width: 96 }}>
            <span>Puerto</span>
            <input className="input mono" value={port} onChange={(e) => setPort(e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" />
          </label>
        </div>
        {formError && <div className="small" style={{ color: 'var(--danger)' }}>{formError}</div>}
        <button className="btn outline lg block" type="submit">Vincular</button>
      </form>

      <p className="tiny faint connect-help">
        En la app de escritorio toca <b>Conectar móvil</b> (en la <b>Pizarra</b> o en <b>Ajustes</b>): ahí están el QR, la dirección y el código. El móvil y el PC deben estar en la misma red Wi-Fi.
      </p>
    </div>
  );
}
