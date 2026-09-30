// Tiempo efectivo de cálculo: solo cuenta mientras la pestaña está visible y hubo
// interacción (teclado, puntero, lápiz) en los últimos segundos. El tiempo en reposo no suma.
import { useEffect, useRef } from 'react';
import { useProgress } from '../store/progress';

class ActivityTracker {
  lastInput = 0;
  private listeners = 0;
  private bound = false;

  private onInput = () => {
    this.lastInput = Date.now();
  };

  attach(): void {
    this.listeners++;
    if (this.bound) return;
    this.bound = true;
    for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'input']) {
      window.addEventListener(ev, this.onInput, { passive: true, capture: true });
    }
    this.lastInput = Date.now();
  }

  detach(): void {
    this.listeners = Math.max(0, this.listeners - 1);
  }

  /** Marca actividad externa (por ejemplo, trazos recibidos desde el móvil). */
  poke(): void {
    this.lastInput = Date.now();
  }

  isActive(idleMs: number): boolean {
    return document.visibilityState === 'visible' && Date.now() - this.lastInput < idleMs;
  }
}

export const activity = new ActivityTracker();

/**
 * Cuenta el tiempo activo mientras el componente está montado. Devuelve una
 * referencia con los milisegundos activos acumulados desde el último `reset`.
 */
export function useActiveTime(skillId?: string, enabled = true) {
  const counter = useRef(0);
  const pending = useRef(0);
  const idle = useProgress((s) => s.settings.idleSeconds);
  const addTime = useProgress((s) => s.addTime);

  useEffect(() => {
    if (!enabled) return;
    activity.attach();
    const tick = setInterval(() => {
      if (activity.isActive(idle * 1000)) {
        counter.current += 1000;
        pending.current += 1000;
      }
    }, 1000);
    const flush = setInterval(() => {
      if (pending.current > 0) {
        addTime(pending.current, skillId);
        pending.current = 0;
      }
    }, 10000);
    return () => {
      clearInterval(tick);
      clearInterval(flush);
      if (pending.current > 0) addTime(pending.current, skillId);
      pending.current = 0;
      activity.detach();
    };
  }, [enabled, idle, skillId, addTime]);

  return {
    get ms() {
      return counter.current;
    },
    reset() {
      counter.current = 0;
    },
  };
}
