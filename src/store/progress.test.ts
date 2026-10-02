// Store del progreso: cada acción es una operación sincronizable y el estado de la
// sincronización se guarda junto al progreso.
import { describe, expect, it } from 'vitest';
import { kv } from '../lib/storage';
import { useProgress } from './progress';

const saved = () => JSON.parse(kv.getItem('mate-progreso') ?? 'null') as { state: { sync: { device: string; profile: string | null; rev: number }; attempts: unknown[] } };

describe('store del progreso', () => {
  it('guarda la identidad de sincronización apenas se crea', () => {
    const s = saved();
    expect(s.state.sync.device).toBe(useProgress.getState().sync.device);
    // En el PC (no en el móvil) se crea el progreso de referencia.
    expect(s.state.sync.profile).toBeTruthy();
  });

  it('cada acción es una operación: nueva revisión y ids derivados de ella', () => {
    const before = useProgress.getState().sync;
    useProgress.getState().record({
      skillId: 'arith.number-sets', generatorId: 'g', seed: 1, level: 1, correct: true, hintsUsed: 0,
      activeMs: 10_000, expectedMs: 30_000, reason: 'practice', answerKind: 'numeric',
    });
    const after = useProgress.getState();
    expect(after.sync.rev).toBe(before.rev + 1);
    expect(after.attempts.at(-1)?.id).toBe(`${before.device}-${before.seq + 1}`);
    expect(saved().state.sync.rev).toBe(after.sync.rev);
    expect(saved().state.attempts).toHaveLength(after.attempts.length);
  });

  it('el tema es de cada dispositivo (no es una operación); la meta diaria se sincroniza', () => {
    const rev = useProgress.getState().sync.rev;
    useProgress.getState().setSettings({ theme: 'dark' });
    expect(useProgress.getState().sync.rev).toBe(rev);
    expect(useProgress.getState().settings.theme).toBe('dark');
    useProgress.getState().setSettings({ dailyGoalMinutes: 30 });
    expect(useProgress.getState().sync.rev).toBe(rev + 1);
    expect(useProgress.getState().settings.dailyGoalMinutes).toBe(30);
  });

  it('escribir el mismo nombre o volver a marcar la bienvenida no genera operaciones', () => {
    const s = useProgress.getState();
    s.setProfile('Gabriel');
    const rev = useProgress.getState().sync.rev;
    useProgress.getState().setProfile('Gabriel');
    useProgress.getState().setOnboarded(useProgress.getState().onboarded);
    expect(useProgress.getState().sync.rev).toBe(rev);
  });
});
