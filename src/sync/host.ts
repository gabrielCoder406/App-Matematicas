// PC: sincronización del progreso con los móviles vinculados e IA para ellos. Todo viaja por la
// conexión del emparejamiento (la misma que usa el móvil como pizarra).
import { pairing, usePairing } from '../canvas/pairing';
import type { LinkMessage } from '../canvas/protocol';
import { SKILL_BY_ID } from '../content/curriculum';
import type { EngineEvent } from '../learning/engine';
import { askTutor, recognize } from '../lib/api';
import { progressSyncStore, setLocalOpSink } from '../store/progress';
import { useUi } from '../store/ui';
import { AiHost } from './aiHost';
import { SyncAuthority } from './authority';
import type { OpEnvelope } from './ops';

let started = false;

export function startSyncHost(): void {
  if (started) return;
  started = true;
  // Sin móviles conectados no hace falta enviar nada: al conectarse piden el progreso completo.
  const send = (m: LinkMessage) => {
    if (usePairing.getState().peers > 0) pairing.send(m);
  };
  const authority = new SyncAuthority(progressSyncStore, send, {
    version: __APP_VERSION__,
    name: () => useUi.getState().hostName,
    onRemote: notifyRemote,
  });
  setLocalOpSink({ coalesce: () => false, applied: (env) => authority.localApplied(env) });
  const ai = new AiHost(send, {
    status: () => {
      const u = useUi.getState();
      return { ocr: u.ocrAvailable, tutor: u.tutorAvailable };
    },
    recognize,
    askTutor,
  });
  pairing.addListener((msg) => {
    if (msg.type === 'progress-hello') ai.announce();
    return authority.handle(msg) || ai.handle(msg);
  });
  // Si Ollama se abre o se cierra con la app abierta, los móviles se enteran.
  useUi.subscribe((s, prev) => {
    if (s.ocrAvailable !== prev.ocrAvailable || s.tutorAvailable !== prev.tutorAvailable) ai.announce();
  });
}

// Aviso en el PC de lo que llegó del móvil (agrupado: el móvil puede enviar muchas operaciones juntas).
let exercises = 0;
let replaced: 'import' | 'reset' | null = null;
const mastered = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function notifyRemote(ops: OpEnvelope[], events: EngineEvent[]): void {
  for (const e of ops) {
    if (e.op.k === 'attempt') exercises++;
    if (e.op.k === 'import' || e.op.k === 'reset') replaced = e.op.k;
  }
  for (const e of events) if (e.type === 'mastered') mastered.add(e.skillId);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    const toast = useUi.getState().toast;
    if (replaced === 'import') toast({ kind: 'info', icon: 'phone', title: 'Se usó el progreso del móvil', body: 'El progreso de este PC se reemplazó por el del móvil vinculado.' }, 6000);
    if (replaced === 'reset') toast({ kind: 'info', icon: 'phone', title: 'Progreso borrado desde el móvil' }, 6000);
    if (exercises) toast({ kind: 'info', icon: 'phone', title: 'Progreso del móvil sincronizado', body: `${exercises} ${exercises === 1 ? 'ejercicio hecho' : 'ejercicios hechos'} en el móvil.` }, 4000);
    for (const id of mastered) toast({ kind: 'success', icon: 'trophy', title: `¡Dominaste «${SKILL_BY_ID[id]?.title ?? id}»!`, body: 'Practicando en el móvil.' }, 5000);
    exercises = 0;
    replaced = null;
    mastered.clear();
  }, 1500);
}
