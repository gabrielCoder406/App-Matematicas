// Protocolo de mensajes entre la pizarra del PC (anfitrión) y el móvil (acompañante).
// Solo viajan datos vectoriales: coordenadas en unidades del tablero, presión y velocidad.

/** Punto: [x, y, presión 0-1, velocidad en unidades/ms]. */
export type WirePoint = [number, number, number, number];

export type InkTool = 'pen' | 'highlighter';

export interface WireStroke {
  id: string;
  tool: InkTool;
  color: string;
  size: number;
  pts: WirePoint[];
}

export type PeerMessage =
  | { type: 'hello'; device: string }
  /**
   * Tablero activo en el PC. `prompt`: enunciado del ejercicio (texto con $LaTeX$); `topic`: id
   * del tema del ejercicio, para sugerir su ficha en la wiki del móvil (desde la versión 0.2.0).
   */
  | { type: 'board'; width: number; height: number; title?: string; prompt?: string; canSubmit?: boolean; topic?: string }
  /** No hay ningún tablero abierto en el PC; `action` describe qué abre el botón del móvil. */
  | { type: 'idle'; action?: string; title?: string }
  | { type: 'open-board' }
  | { type: 'sync'; strokes: WireStroke[]; canUndo: boolean; canRedo: boolean }
  | { type: 'stroke-start'; id: string; tool: InkTool; color: string; size: number; pts: WirePoint[] }
  | { type: 'stroke-points'; id: string; pts: WirePoint[] }
  | { type: 'stroke-end'; id: string }
  | { type: 'erase'; ids: string[] }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear' }
  | { type: 'laser'; x: number; y: number }
  | { type: 'laser-end' }
  | { type: 'ocr' }
  | { type: 'ocr-result'; lines: string[]; error?: string }
  /** Comprobar la respuesta del ejercicio abierto en el PC. */
  | { type: 'submit' }
  | { type: 'feedback'; correct: boolean; partial?: boolean; message: string };

export type ServerMessage =
  | { type: 'session'; id: string; secret: string }
  | { type: 'peers'; count: number }
  | { type: 'joined'; id: string }
  | { type: 'host'; online: boolean }
  | { type: 'error'; message: string };

export type AnyMessage = PeerMessage | ServerMessage;

export function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Puerto por defecto del servidor de la app de escritorio. */
export const DEFAULT_PORT = 8787;

/** Datos para conectarse al PC: dirección, puerto y código de 6 dígitos. */
export interface PairTarget {
  host: string;
  port: number;
  code: string;
}

/** Enlace que codifica el QR (el móvil sin la app lo abre en el navegador). */
export function pairUrl(t: PairTarget): string {
  return `http://${t.host}:${t.port}/companion?code=${t.code}`;
}

/** Interpreta el contenido de un QR o un texto pegado con el enlace de emparejamiento. */
export function parsePairUrl(text: string): PairTarget | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const code = (url.searchParams.get('code') ?? '').replace(/\D/g, '');
  if (code.length !== 6 || !url.hostname) return null;
  const port = url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80;
  return { host: url.hostname.replace(/^\[|\]$/g, ''), port, code };
}
