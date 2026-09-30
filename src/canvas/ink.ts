// Modelo de tinta: trazos vectoriales con deshacer/rehacer, borrado, detección del gesto
// de tachado y exportación a PNG para el reconocimiento de escritura.
import { getStroke } from 'perfect-freehand';
import type { InkTool, WirePoint, WireStroke } from './protocol';

export interface Stroke {
  id: string;
  tool: InkTool;
  color: string;
  size: number;
  points: WirePoint[];
  /** Presión real (lápiz) o simulada a partir de la velocidad (dedo, mouse). */
  realPressure: boolean;
  done: boolean;
}

type Action =
  | { kind: 'add'; stroke: Stroke }
  | { kind: 'remove'; strokes: Stroke[] }
  | { kind: 'clear'; strokes: Stroke[] };

export function strokeId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

export class InkModel {
  strokes: Stroke[] = [];
  private undoStack: Action[] = [];
  private redoStack: Action[] = [];
  private listeners = new Set<() => void>();
  version = 0;

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get isEmpty(): boolean {
    return this.strokes.length === 0;
  }

  find(id: string): Stroke | undefined {
    for (let i = this.strokes.length - 1; i >= 0; i--) if (this.strokes[i].id === id) return this.strokes[i];
    return undefined;
  }

  begin(s: Omit<Stroke, 'done'>): Stroke {
    const existing = this.find(s.id);
    if (existing) return existing;
    const stroke: Stroke = { ...s, done: false };
    this.strokes.push(stroke);
    this.emit();
    return stroke;
  }

  extend(id: string, pts: WirePoint[]): void {
    const s = this.find(id);
    if (!s || s.done) return;
    s.points.push(...pts);
    this.emit();
  }

  end(id: string): Stroke | undefined {
    const s = this.find(id);
    if (!s || s.done) return s;
    s.done = true;
    if (s.points.length === 0) {
      this.strokes = this.strokes.filter((x) => x !== s);
    } else {
      this.undoStack.push({ kind: 'add', stroke: s });
      this.redoStack = [];
    }
    this.emit();
    return s;
  }

  /** Descarta un trazo en curso (por ejemplo, cuando era un gesto). */
  discard(id: string): void {
    this.strokes = this.strokes.filter((s) => s.id !== id);
    this.emit();
  }

  remove(ids: string[]): void {
    const set = new Set(ids);
    const removed = this.strokes.filter((s) => set.has(s.id));
    if (!removed.length) return;
    this.strokes = this.strokes.filter((s) => !set.has(s.id));
    this.undoStack.push({ kind: 'remove', strokes: removed });
    this.redoStack = [];
    this.emit();
  }

  clear(): void {
    if (!this.strokes.length) return;
    this.undoStack.push({ kind: 'clear', strokes: this.strokes.slice() });
    this.redoStack = [];
    this.strokes = [];
    this.emit();
  }

  undo(): void {
    const a = this.undoStack.pop();
    if (!a) return;
    if (a.kind === 'add') this.strokes = this.strokes.filter((s) => s !== a.stroke);
    else this.strokes = [...this.strokes, ...a.strokes];
    this.redoStack.push(a);
    this.emit();
  }

  redo(): void {
    const a = this.redoStack.pop();
    if (!a) return;
    if (a.kind === 'add') this.strokes = [...this.strokes, a.stroke];
    else {
      const set = new Set(a.strokes);
      this.strokes = this.strokes.filter((s) => !set.has(s));
    }
    this.undoStack.push(a);
    this.emit();
  }

  /** Reemplaza todo el contenido (sincronización desde el anfitrión). */
  load(strokes: WireStroke[]): void {
    this.strokes = strokes.map((w) => ({ id: w.id, tool: w.tool, color: w.color, size: w.size, points: w.pts, realPressure: w.pts.some((p) => p[2] !== 0.5), done: true }));
    this.undoStack = [];
    this.redoStack = [];
    this.emit();
  }

  toWire(): WireStroke[] {
    return this.strokes.filter((s) => s.done).map((s) => ({ id: s.id, tool: s.tool, color: s.color, size: s.size, pts: s.points }));
  }

  /** Trazos que pasan a menos de `r` unidades del punto. */
  hitTest(x: number, y: number, r: number): string[] {
    const r2 = r * r;
    const out: string[] = [];
    for (const s of this.strokes) {
      const rr = r + s.size / 2;
      const rr2 = rr * rr;
      if (s.points.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= Math.max(r2, rr2))) out.push(s.id);
    }
    return out;
  }

  bbox(filter?: (s: Stroke) => boolean): { minX: number; minY: number; maxX: number; maxY: number } | null {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of this.strokes) {
      if (filter && !filter(s)) continue;
      for (const [x, y] of s.points) {
        minX = Math.min(minX, x - s.size);
        minY = Math.min(minY, y - s.size);
        maxX = Math.max(maxX, x + s.size);
        maxY = Math.max(maxY, y + s.size);
      }
    }
    return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : null;
  }
}

// ---------------------------------------------------------------------------
// Renderizado
// ---------------------------------------------------------------------------

const outlineCache = new WeakMap<Stroke, { n: number; path: Path2D }>();

export function strokeOutline(s: Stroke): Path2D {
  const cached = outlineCache.get(s);
  if (cached && cached.n === s.points.length && s.done) return cached.path;
  const pts = s.points.map(([x, y, p]) => [x, y, p] as [number, number, number]);
  const outline = getStroke(pts, {
    size: s.size,
    thinning: s.tool === 'highlighter' ? 0 : s.realPressure ? 0.62 : 0.5,
    smoothing: 0.55,
    streamline: 0.45,
    simulatePressure: !s.realPressure && s.tool !== 'highlighter',
    last: s.done,
    start: { taper: s.tool === 'highlighter' ? 0 : s.realPressure ? 0 : 6, cap: true },
    end: { taper: s.tool === 'highlighter' ? 0 : s.realPressure ? 0 : 8, cap: true },
  });
  const path = new Path2D();
  if (outline.length) {
    path.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length - 1; i++) {
      const [x0, y0] = outline[i];
      const [x1, y1] = outline[i + 1];
      path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    path.closePath();
  }
  outlineCache.set(s, { n: s.points.length, path });
  return path;
}

/** Color efectivo: la tinta «automática» se adapta al tema. */
export function resolveColor(color: string, dark: boolean): string {
  if (color === 'ink') return dark ? '#e9ebf2' : '#1d2233';
  return color;
}

export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[], dark: boolean, forceColor?: string): void {
  for (const s of strokes) {
    if (!s.points.length) continue;
    ctx.save();
    if (s.tool === 'highlighter') {
      ctx.globalAlpha = forceColor ? 0 : 0.32;
      ctx.globalCompositeOperation = dark ? 'screen' : 'multiply';
    }
    ctx.fillStyle = forceColor ?? resolveColor(s.color, dark);
    ctx.fill(strokeOutline(s));
    ctx.restore();
  }
}

/** Exporta los trazos (tinta negra sobre blanco, recortados) como PNG para el OCR. */
export function exportPng(model: InkModel, maxWidth = 1500): string | null {
  const bb = model.bbox((s) => s.tool !== 'highlighter');
  if (!bb) return null;
  const pad = 30;
  const w = bb.maxX - bb.minX + pad * 2;
  const h = bb.maxY - bb.minY + pad * 2;
  const scale = Math.min(1.5, maxWidth / w);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(64, Math.round(w * scale));
  canvas.height = Math.max(64, Math.round(h * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);
  ctx.translate(-bb.minX + pad, -bb.minY + pad);
  drawStrokes(ctx, model.strokes.filter((s) => s.tool !== 'highlighter'), false, '#111111');
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Gestos
// ---------------------------------------------------------------------------

/**
 * ¿El trazo es un «tachado» (zigzag rápido sobre algo escrito)? Se reconoce por
 * muchas inversiones de dirección en un área compacta.
 */
export function isScratchOut(points: WirePoint[]): boolean {
  if (points.length < 12) return false;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, len = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    if (i) len += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
  }
  const w = maxX - minX, h = maxY - minY;
  const major = Math.max(w, h);
  if (major < 25) return false;
  const horizontal = w >= h;
  let reversals = 0;
  let dir = 0;
  let acc = 0;
  for (let i = 1; i < points.length; i++) {
    const d = horizontal ? points[i][0] - points[i - 1][0] : points[i][1] - points[i - 1][1];
    acc += d;
    if (Math.abs(acc) < major * 0.12) continue;
    const s = Math.sign(acc);
    if (dir !== 0 && s !== dir) reversals++;
    dir = s;
    acc = 0;
  }
  return reversals >= 4 && len > 3.2 * major;
}

/** Trazos tapados por un tachado: los que tienen buena parte de sus puntos dentro de su área. */
export function strokesUnder(model: InkModel, scratch: WirePoint[], excludeId?: string): string[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of scratch) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const m = 8;
  const inside = (x: number, y: number) => x >= minX - m && x <= maxX + m && y >= minY - m && y <= maxY + m;
  return model.strokes
    .filter((s) => s.id !== excludeId && s.done)
    .filter((s) => {
      const n = s.points.filter(([x, y]) => inside(x, y)).length;
      return n > 0 && n / s.points.length >= 0.35;
    })
    .map((s) => s.id);
}

export const INK_COLORS = ['ink', '#2f6fe0', '#d63c3c', '#16965a', '#8a4fd8', '#e08a00'];
