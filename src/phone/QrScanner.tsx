// Lector de códigos QR con la cámara (getUserMedia). Usa el detector nativo del sistema
// si existe y, si no, jsQR sobre fotogramas reducidos.
import jsQR from 'jsqr';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { useBackHandler } from './native';

interface NativeDetector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => NativeDetector;
  }
}

export function QrScanner({ onResult, onCancel }: { onResult(text: string): boolean; onCancel(): void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const done = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  useBackHandler(onCancel);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    let detector: NativeDetector | null = null;
    try {
      if (window.BarcodeDetector) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
    } catch {
      detector = null;
    }

    const handle = (text: string | undefined) => {
      if (!text || done.current) return;
      if (onResultRef.current(text)) done.current = true;
      else setInvalid(true);
    };

    const scan = async () => {
      if (stopped || done.current) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2 && v.videoWidth) {
        try {
          if (detector) {
            const codes = await detector.detect(v);
            handle(codes[0]?.rawValue);
          } else if (ctx) {
            const scale = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
            canvas.width = Math.round(v.videoWidth * scale);
            canvas.height = Math.round(v.videoHeight * scale);
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            handle(jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data);
          }
        } catch {
          detector = null; // el detector nativo falló: seguir con jsQR
        }
      }
      timer = setTimeout(scan, 160);
    };

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Este dispositivo no permite usar la cámara aquí. Escribe la dirección y el código a mano.');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play().catch(() => {});
        scan();
      } catch (e) {
        const name = (e as { name?: string }).name;
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'No hay permiso para usar la cámara. Actívalo en los ajustes del teléfono o escribe los datos a mano.'
            : 'No se pudo abrir la cámara. Escribe la dirección y el código a mano.',
        );
      }
    })();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="qr-scanner">
      <video ref={videoRef} playsInline muted />
      <div className="qr-frame" aria-hidden />
      <div className="qr-scanner-top">
        <button className="icon-btn on-dark" onClick={onCancel} aria-label="Cerrar"><Icon name="x" size={22} /></button>
      </div>
      <div className="qr-scanner-bottom">
        {error ? (
          <div className="callout danger small"><Icon className="callout-icon" name="alert" size={16} />{error}</div>
        ) : (
          <div className="qr-help">{invalid ? 'Ese QR no es de la app. Apunta al QR que muestra «Conectar móvil» en el PC.' : 'Apunta al código QR que muestra la app de escritorio.'}</div>
        )}
        <button className="btn" onClick={onCancel}>Escribir los datos a mano</button>
      </div>
    </div>
  );
}
