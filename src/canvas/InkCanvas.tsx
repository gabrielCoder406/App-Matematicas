// Lienzo de escritura a mano: dedo, mouse o lápiz con presión; borrado gestual,
// deshacer con dos dedos y puntero láser. Emite eventos vectoriales para sincronizar.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { drawStrokes, exportPng, InkModel, isScratchOut, strokeId, strokesUnder } from './ink';
import { round1, type InkTool, type PeerMessage, type WirePoint } from './protocol';

export type CanvasTool = InkTool | 'eraser' | 'laser';

export interface InkCanvasHandle {
  pushLaser(x: number, y: number): void;
  endLaser(): void;
  exportPng(): string | null;
}

interface Props {
  model: InkModel;
  boardWidth: number;
  boardHeight: number;
  tool: CanvasTool;
  color: string;
  size: number;
  readOnly?: boolean;
  /** Eventos locales (para retransmitir al otro dispositivo). */
  onLocal?(msg: PeerMessage): void;
  onGesture?(g: 'undo' | 'redo' | 'erase'): void;
  className?: string;
  grid?: 'lines' | 'dots' | 'none';
  /** Ajusta el tablero dentro del contenedor (pantalla completa) en lugar de fijar la proporción. */
  fit?: boolean;
  /** false: los gestos de deshacer/rehacer solo se emiten (los aplica el anfitrión). */
  localUndo?: boolean;
}

interface Laser {
  pts: { x: number; y: number; t: number }[];
  active: boolean;
}

export const InkCanvas = forwardRef<InkCanvasHandle, Props>(function InkCanvas(
  { model, boardWidth, boardHeight, tool, color, size, readOnly, onLocal, onGesture, className, grid = 'lines', fit, localUndo = true },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const view = useRef({ scale: 1, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 });
  const dirty = useRef(true);
  const laser = useRef<Laser>({ pts: [], active: false });
  const remoteLaser = useRef<Laser>({ pts: [], active: false });
  const drawing = useRef<{ id: string; pointerId: number; last: WirePoint | null; lastT: number; pending: WirePoint[]; tool: CanvasTool } | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number; t: number; moved: boolean }>());
  const gestureStart = useRef<{ count: number; t: number; moved: boolean } | null>(null);
  const lastPen = useRef(0);
  const props = useRef({ tool, color, size, readOnly, onLocal, onGesture, localUndo });
  props.current = { tool, color, size, readOnly, onLocal, onGesture, localUndo };

  const emit = (m: PeerMessage) => props.current.onLocal?.(m);

  // ------------------------------------------------------------------ geometría
  const layout = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !inkRef.current || !overlayRef.current) return;
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const scale = Math.min(rect.width / boardWidth, rect.height / boardHeight);
    const ox = (rect.width - boardWidth * scale) / 2;
    const oy = (rect.height - boardHeight * scale) / 2;
    view.current = { scale, ox, oy, dpr, w: rect.width, h: rect.height };
    for (const c of [inkRef.current, overlayRef.current]) {
      c.width = Math.round(rect.width * dpr);
      c.height = Math.round(rect.height * dpr);
      c.style.width = `${rect.width}px`;
      c.style.height = `${rect.height}px`;
    }
    dirty.current = true;
  }, [boardWidth, boardHeight]);

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    const v = view.current;
    return { x: (e.clientX - rect.left - v.ox) / v.scale, y: (e.clientY - rect.top - v.oy) / v.scale };
  };

  // ------------------------------------------------------------------ dibujo
  const drawInk = useCallback(() => {
    const c = inkRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    const v = view.current;
    const dark = document.documentElement.dataset.theme === 'dark';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
    ctx.fillStyle = getComputedStyle(c).getPropertyValue('--board-bg') || (dark ? '#141722' : '#fff');
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    if (grid !== 'none') {
      ctx.strokeStyle = dark ? 'rgba(200,210,255,0.07)' : 'rgba(80,90,130,0.09)';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1 / v.scale;
      const step = 50;
      if (grid === 'lines') {
        ctx.beginPath();
        for (let x = step; x < boardWidth; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, boardHeight); }
        for (let y = step; y < boardHeight; y += step) { ctx.moveTo(0, y); ctx.lineTo(boardWidth, y); }
        ctx.stroke();
      } else {
        for (let x = step; x < boardWidth; x += step) for (let y = step; y < boardHeight; y += step) ctx.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      }
    }
    drawStrokes(ctx, model.strokes, dark);
  }, [model, boardWidth, boardHeight, grid]);

  const drawOverlay = useCallback(() => {
    const c = overlayRef.current;
    if (!c) return false;
    const ctx = c.getContext('2d')!;
    const v = view.current;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.setTransform(v.dpr * v.scale, 0, 0, v.dpr * v.scale, v.dpr * v.ox, v.dpr * v.oy);
    const now = performance.now();
    let animating = false;
    for (const L of [laser.current, remoteLaser.current]) {
      L.pts = L.pts.filter((p) => now - p.t < 650);
      if (!L.pts.length) continue;
      animating = true;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < L.pts.length; i++) {
        const a = L.pts[i - 1], b = L.pts[i];
        const age = (now - b.t) / 650;
        ctx.strokeStyle = `rgba(255, 45, 70, ${Math.max(0, 0.85 - age)})`;
        ctx.lineWidth = 7 * (1 - age * 0.7);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      const head = L.pts[L.pts.length - 1];
      if (L.active || now - head.t < 200) {
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 22);
        g.addColorStop(0, 'rgba(255,60,80,1)');
        g.addColorStop(0.35, 'rgba(255,40,70,0.55)');
        g.addColorStop(1, 'rgba(255,40,70,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 22, 0, Math.PI * 2);
        ctx.fill();
        if (L.active) head.t = now;
      }
    }
    return animating;
  }, []);

  useEffect(() => {
    layout();
    const ro = new ResizeObserver(() => layout());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const unsub = model.subscribe(() => {
      dirty.current = true;
    });
    const themeObs = new MutationObserver(() => {
      dirty.current = true;
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    let raf = 0;
    const loop = () => {
      if (drawing.current?.pending.length) flushPending();
      if (dirty.current) {
        dirty.current = false;
        drawInk();
      }
      drawOverlay();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, layout, drawInk, drawOverlay]);

  useImperativeHandle(ref, () => ({
    pushLaser(x: number, y: number) {
      remoteLaser.current.active = true;
      remoteLaser.current.pts.push({ x, y, t: performance.now() });
    },
    endLaser() {
      remoteLaser.current.active = false;
    },
    exportPng: () => exportPng(model),
  }));

  // ------------------------------------------------------------------ entrada
  const flushPending = () => {
    const d = drawing.current;
    if (!d || !d.pending.length) return;
    const pts = d.pending;
    d.pending = [];
    model.extend(d.id, pts);
    emit({ type: 'stroke-points', id: d.id, pts });
  };

  const pointFrom = (e: PointerEvent, prev: WirePoint | null, prevT: number): WirePoint => {
    const { x, y } = toBoard(e);
    const pressure = e.pointerType === 'pen' ? Math.max(0.05, e.pressure || 0.5) : 0.5;
    const dt = Math.max(1, e.timeStamp - prevT);
    const v = prev ? Math.hypot(x - prev[0], y - prev[1]) / dt : 0;
    return [round1(x), round1(y), Math.round(pressure * 100) / 100, Math.round(v * 100) / 100];
  };

  const eraseAt = (x: number, y: number) => {
    const ids = model.hitTest(x, y, 14 / Math.max(0.3, view.current.scale) * 0.6 + 8);
    if (ids.length) {
      model.remove(ids);
      emit({ type: 'erase', ids });
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const P = props.current;
    if (P.readOnly) return;
    if (e.pointerType === 'pen') lastPen.current = performance.now();
    if (e.pointerType === 'touch') {
      // Rechazo de la palma: si hay un lápiz en uso, el dedo no dibuja
      if (performance.now() - lastPen.current < 1500) return;
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), moved: false });
      if (touches.current.size >= 2) {
        // Gesto multitáctil: cancelar el trazo iniciado por el primer dedo
        if (drawing.current) {
          model.discard(drawing.current.id);
          drawing.current = null;
        }
        gestureStart.current = { count: touches.current.size, t: performance.now(), moved: false };
        return;
      }
    }
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = toBoard(e.nativeEvent);
    if (P.tool === 'laser') {
      laser.current.active = true;
      laser.current.pts.push({ x, y, t: performance.now() });
      emit({ type: 'laser', x: round1(x), y: round1(y) });
      drawing.current = { id: '', pointerId: e.pointerId, last: null, lastT: e.timeStamp, pending: [], tool: 'laser' };
      return;
    }
    if (P.tool === 'eraser') {
      drawing.current = { id: '', pointerId: e.pointerId, last: null, lastT: e.timeStamp, pending: [], tool: 'eraser' };
      eraseAt(x, y);
      return;
    }
    const first = pointFrom(e.nativeEvent, null, e.timeStamp);
    const id = strokeId();
    const width = P.tool === 'highlighter' ? P.size * 4 : P.size;
    model.begin({ id, tool: P.tool, color: P.color, size: width, points: [first], realPressure: e.pointerType === 'pen' });
    emit({ type: 'stroke-start', id, tool: P.tool, color: P.color, size: width, pts: [first] });
    drawing.current = { id, pointerId: e.pointerId, last: first, lastT: e.timeStamp, pending: [], tool: P.tool };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const t = touches.current.get(e.pointerId);
    if (t && Math.hypot(e.clientX - t.x, e.clientY - t.y) > 12) {
      t.moved = true;
      if (gestureStart.current) gestureStart.current.moved = true;
    }
    const d = drawing.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events.length ? events : [e.nativeEvent]) {
      if (d.tool === 'laser') {
        const { x, y } = toBoard(ev);
        laser.current.pts.push({ x, y, t: performance.now() });
        emit({ type: 'laser', x: round1(x), y: round1(y) });
        continue;
      }
      if (d.tool === 'eraser') {
        const { x, y } = toBoard(ev);
        eraseAt(x, y);
        continue;
      }
      const p = pointFrom(ev, d.last, d.lastT);
      if (d.last && Math.hypot(p[0] - d.last[0], p[1] - d.last[1]) < 0.8) continue;
      d.pending.push(p);
      d.last = p;
      d.lastT = ev.timeStamp;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      const g = gestureStart.current;
      touches.current.delete(e.pointerId);
      if (g && touches.current.size === 0) {
        gestureStart.current = null;
        if (!g.moved && performance.now() - g.t < 450) {
          const kind = g.count >= 3 ? 'redo' : 'undo';
          if (props.current.localUndo) {
            if (kind === 'undo') model.undo();
            else model.redo();
          }
          emit({ type: kind });
          props.current.onGesture?.(kind);
        }
        return;
      }
      if (g) return;
    }
    const d = drawing.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drawing.current = null;
    if (d.tool === 'laser') {
      laser.current.active = false;
      emit({ type: 'laser-end' });
      return;
    }
    if (d.tool === 'eraser') return;
    if (d.pending.length) {
      model.extend(d.id, d.pending);
      emit({ type: 'stroke-points', id: d.id, pts: d.pending });
      d.pending = [];
    }
    const s = model.find(d.id);
    if (s && d.tool === 'pen' && isScratchOut(s.points)) {
      const under = strokesUnder(model, s.points, s.id);
      if (under.length) {
        model.discard(s.id);
        emit({ type: 'erase', ids: [s.id] });
        model.remove(under);
        emit({ type: 'erase', ids: under });
        props.current.onGesture?.('erase');
        return;
      }
    }
    model.end(d.id);
    emit({ type: 'stroke-end', id: d.id });
  };

  return (
    <div
      ref={wrapRef}
      className={`ink-canvas ${className ?? ''} tool-${tool} ${readOnly ? 'readonly' : ''}`}
      style={fit ? undefined : { aspectRatio: `${boardWidth} / ${boardHeight}` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={inkRef} />
      <canvas ref={overlayRef} className="overlay" />
    </div>
  );
});
