// Generador pseudoaleatorio con semilla (reproducible: el mismo ejercicio siempre se regenera igual).

export class Rng {
  private state: number;
  readonly seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
    this.state = this.seed || 0x9e3779b9;
  }

  /** Número en [0, 1). */
  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Entero en [a, b] (inclusive). */
  int(a: number, b: number): number {
    return a + Math.floor(this.next() * (b - a + 1));
  }

  /** Entero en [a, b] distinto de los excluidos. */
  intExcept(a: number, b: number, ...except: number[]): number {
    for (let i = 0; i < 200; i++) {
      const v = this.int(a, b);
      if (!except.includes(v)) return v;
    }
    return a;
  }

  /** Entero no nulo en [-m, m]. */
  nonZero(m: number): number {
    return this.intExcept(-m, m, 0);
  }

  sign(): 1 | -1 {
    return this.next() < 0.5 ? 1 : -1;
  }

  bool(p = 0.5): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** k elementos distintos. */
  sample<T>(arr: readonly T[], k: number): T[] {
    return this.shuffle(arr).slice(0, k);
  }

  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31);
}
