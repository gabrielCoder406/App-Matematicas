// Resumen del estado de la sincronización para mostrarlo en la app del móvil.
import type { OpEnvelope } from '../sync/ops';
import type { PcLinkState } from './link';

export type SyncTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral';

export interface SyncSummary {
  tone: SyncTone;
  /** Texto corto (chip de la barra superior). */
  short: string;
  label: string;
  detail: string;
}

/** Ejercicios, lecciones y demás cambios pendientes (el tiempo de estudio suelto no se cuenta). */
export function pendingChanges(pending: OpEnvelope[]): number {
  return pending.filter((e) => e.op.k !== 'time').length;
}

export function timeAgo(t: number | null, now = Date.now()): string {
  if (!t) return 'nunca';
  const min = Math.round((now - t) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(t).toLocaleDateString('es', { day: 'numeric', month: 'short' });
}

export function syncSummary(s: Pick<PcLinkState, 'target' | 'status' | 'error' | 'sync'>, pending: OpEnvelope[]): SyncSummary {
  const changes = pendingChanges(pending);
  const waiting = changes ? ` ${changes === 1 ? 'Hay 1 cambio' : `Hay ${changes} cambios`} del móvil esperando para enviarse.` : '';
  const name = s.target?.name ?? s.sync.pc?.name ?? 'el PC';
  if (!s.target) {
    return { tone: 'neutral', short: 'Sin vincular', label: 'Sin vincular', detail: `Vincula el móvil con la app del PC para sincronizar el progreso.${waiting}` };
  }
  if (s.status === 'rejected') {
    return { tone: 'danger', short: 'Volver a vincular', label: 'Hay que volver a vincular', detail: `${s.error ?? 'La app del PC rechazó la conexión.'} Escanea de nuevo el QR que muestra la app del PC.${waiting}` };
  }
  if (s.status === 'online') {
    if (s.sync.phase === 'unsupported') {
      const other = s.sync.pc?.version ? ` (la del PC es la ${s.sync.pc.version})` : '';
      return { tone: 'danger', short: 'Versiones distintas', label: 'Hay que actualizar una de las apps', detail: `La app del PC y la del móvil deben ser de la misma versión para sincronizar el progreso${other}. Instala la última versión en los dos.${waiting}` };
    }
    if (s.sync.phase === 'conflict') return { tone: 'warning', short: 'Elegir progreso', label: 'Elige qué progreso conservar', detail: 'El móvil y el PC tienen progreso distinto: elige cómo quedan para empezar a sincronizar.' };
    if (s.sync.phase === 'ready' && !pending.length) return { tone: 'success', short: 'Sincronizado', label: 'Sincronizado', detail: `Conectado con ${name}: cada cambio aparece al instante en los dos.` };
    return { tone: 'info', short: 'Sincronizando…', label: 'Sincronizando…', detail: `Conectado con ${name}.` };
  }
  const why = s.status === 'host-offline'
    ? 'La app del PC está cerrada.'
    : s.status === 'unreachable'
      ? 'No se encuentra el PC: la app del PC debe estar abierta y ambos en la misma red Wi-Fi.'
      : 'Conectando con el PC…';
  return { tone: changes ? 'warning' : 'neutral', short: changes ? 'Sin enviar' : 'Sin conexión', label: changes ? 'Pendiente de sincronizar' : 'Sin conexión con el PC', detail: `${why}${waiting} Todo funciona igual sin conexión.` };
}
