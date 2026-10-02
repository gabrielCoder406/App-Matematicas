// Mensajes de sincronización y de IA entre el PC y el móvil. Viajan por la misma conexión del
// emparejamiento (el servidor solo los retransmite): lo que envía el PC llega a todos los móviles
// conectados, así que las respuestas para uno solo llevan `to` (su id de dispositivo).
import type { ProgressData } from '../learning/types';
import type { TutorRequest } from '../lib/api';
import type { OpEnvelope } from './ops';

/** Versión del protocolo de sincronización: el PC y el móvil deben usar la misma. */
export const SYNC_PROTOCOL = 1;

/** Operación ya aplicada en el PC con su número de revisión (1, 2, 3… sin huecos). */
export interface RevOp {
  rev: number;
  env: OpEnvelope;
}

export type SyncMessage =
  // móvil → PC
  /** Al conectarse: con qué progreso está vinculado el móvil y si tiene progreso propio. */
  | { type: 'progress-hello'; device: string; profile: string | null; hasProgress: boolean; version: string; proto: number }
  /** Operaciones hechas en el móvil que el PC todavía no confirmó. */
  | { type: 'progress-push'; device: string; profile: string; ops: OpEnvelope[] }
  /** Pide el progreso completo. */
  | { type: 'progress-pull'; device: string; profile: string }
  // PC → móvil
  | { type: 'progress-info'; to: string; profile: string; rev: number; hasProgress: boolean; version: string; proto: number; name?: string }
  | { type: 'progress-snapshot'; to: string; profile: string; rev: number; applied: Record<string, number>; data: ProgressData }
  /** Operaciones aplicadas en el PC (de cualquier dispositivo) y lo confirmado de cada móvil. */
  | { type: 'progress-ops'; to?: string; profile: string; ops: RevOp[]; applied: Record<string, number> }
  /** El móvil está vinculado con otro progreso (el del PC cambió): hay que volver a vincular. */
  | { type: 'progress-rejected'; to: string; profile: string };

export type AiMessage =
  /** PC → móviles: qué IA hay disponible en el PC. */
  | { type: 'ai-status'; ocr: boolean; tutor: boolean }
  | { type: 'ai-ocr'; device: string; id: string; image: string }
  | { type: 'ai-ocr-result'; to: string; id: string; lines: string[]; error?: string }
  | { type: 'ai-tutor'; device: string; id: string; request: TutorRequest }
  | { type: 'ai-tutor-text'; to: string; id: string; text: string }
  | { type: 'ai-tutor-end'; to: string; id: string; error?: string }
  | { type: 'ai-cancel'; device: string; id: string };
