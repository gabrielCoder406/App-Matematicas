// Acceso de la sincronización al progreso guardado (el store de la app o uno de prueba).
import type { ProgressData } from '../learning/types';
import type { SyncMeta } from './meta';

export interface SyncStore {
  read(): { data: ProgressData; meta: SyncMeta };
  /** Sin `data`, solo cambia el estado de la sincronización. */
  write(next: { data?: ProgressData; meta: SyncMeta }): void;
}
