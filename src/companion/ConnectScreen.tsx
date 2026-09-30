// Pantalla inicial de la app del móvil: escanear el QR del PC o escribir dirección y código.
import { useState } from 'react';
import { Icon } from '../components/Icon';
import { DEFAULT_PORT, parsePairUrl, type PairTarget } from '../canvas/protocol';
import { openWiki } from '../store/wiki';
import { QrScanner } from './QrScanner';
import { COPYRIGHT } from '../../shared/about';

export interface SavedPc extends PairTarget {
  name?: string;
}

export function ConnectScreen({ last, error, onConnect }: { last: SavedPc | null; error?: string | null; onConnect(t: PairTarget): void }) {
  const [scanning, setScanning] = useState(false);
  const [host, setHost] = useState(last?.host ?? '');
  const [code, setCode] = useState('');
  const [port, setPort] = useState(String(last?.port ?? DEFAULT_PORT));
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
    <div className="connect-screen">
      <div className="connect-hero">
        <div className="brand-mark big">∑</div>
        <h1>Pizarra Matemática</h1>
        <p className="muted">Escribe con el dedo o un lápiz y lo que escribes aparece en la app de escritorio.</p>
      </div>

      {error && (
        <div className="callout danger small">
          <Icon className="callout-icon" name="alert" size={16} />
          <div>{error}</div>
        </div>
      )}

      {last && (
        <button className="card connect-last" onClick={() => onConnect(last)}>
          <Icon name="refresh" size={20} />
          <div>
            <div style={{ fontWeight: 650 }}>Volver a conectar</div>
            <div className="tiny faint">{last.name ? `${last.name} · ` : ''}{last.host}:{last.port}</div>
          </div>
          <Icon name="right" size={18} />
        </button>
      )}

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
        <button className="btn outline lg block" type="submit">Conectar</button>
      </form>

      <button type="button" className="card connect-last" onClick={() => openWiki()}>
        <Icon name="wiki" size={20} />
        <div>
          <div style={{ fontWeight: 650 }}>Wiki de temas</div>
          <div className="tiny faint">Fórmulas, definiciones y errores frecuentes. Funciona sin conectarte al PC.</div>
        </div>
        <Icon name="right" size={18} />
      </button>

      <p className="tiny faint connect-help">
        En la app de escritorio abre la <b>Pizarra</b> (o un ejercicio → <b>A mano</b>) y toca <b>Conectar móvil</b>: ahí están el QR, la dirección y el código. El móvil y el PC deben estar en la misma red Wi-Fi.
      </p>
      <p className="tiny faint connect-help">{COPYRIGHT}</p>
    </div>
  );
}
