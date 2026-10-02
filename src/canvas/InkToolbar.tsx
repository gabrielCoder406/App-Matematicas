import { useEffect, useReducer, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { INK_COLORS, resolveColor, type InkModel } from './ink';
import type { CanvasTool } from './InkCanvas';
import { usePairing } from './pairing';

interface Props {
  model: InkModel;
  tool: CanvasTool;
  setTool(t: CanvasTool): void;
  color: string;
  setColor(c: string): void;
  size: number;
  setSize(s: number): void;
  onUndo(): void;
  onRedo(): void;
  onClear(): void;
  onPair?(): void;
  compact?: boolean;
  /** Botones al final de la barra (p. ej., en pantalla completa). */
  extra?: ReactNode;
}

const SIZES = [3, 5, 9];

export function InkToolbar({ model, tool, setTool, color, setColor, size, setSize, onUndo, onRedo, onClear, onPair, compact, extra }: Props) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => model.subscribe(force), [model]);
  const peers = usePairing((s) => s.peers);
  const dark = document.documentElement.dataset.theme === 'dark';

  const tools: { id: CanvasTool; icon: string; label: string }[] = [
    { id: 'pen', icon: 'pen', label: 'Lápiz' },
    { id: 'highlighter', icon: 'highlighter', label: 'Resaltador' },
    { id: 'eraser', icon: 'eraser', label: 'Borrador (o tacha en zigzag)' },
    { id: 'laser', icon: 'laser', label: 'Puntero láser' },
  ];

  return (
    <div className={`ink-toolbar ${compact ? 'compact' : ''}`}>
      <div className="tool-group">
        {tools.map((t) => (
          <button key={t.id} type="button" className={`icon-btn ${tool === t.id ? 'active' : ''}`} title={t.label} aria-label={t.label} onClick={() => setTool(t.id)}>
            <Icon name={t.icon} size={19} />
          </button>
        ))}
      </div>
      <div className="tool-group">
        {INK_COLORS.slice(0, compact ? 4 : 6).map((c) => (
          <button
            key={c}
            type="button"
            className={`color-dot ${color === c ? 'active' : ''}`}
            style={{ background: resolveColor(c, dark) }}
            title={c === 'ink' ? 'Tinta' : c}
            aria-label={`Color ${c}`}
            onClick={() => {
              setColor(c);
              if (tool === 'eraser' || tool === 'laser') setTool('pen');
            }}
          />
        ))}
      </div>
      {!compact && (
        <div className="tool-group">
          {SIZES.map((s) => (
            <button key={s} type="button" className={`icon-btn ${size === s ? 'active' : ''}`} title={`Grosor ${s}`} onClick={() => setSize(s)}>
              <span style={{ width: s + 3, height: s + 3, borderRadius: '50%', background: 'currentColor', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
      <div className="tool-group">
        <button type="button" className="icon-btn" title="Deshacer (Ctrl+Z · dos dedos)" disabled={!model.canUndo} onClick={onUndo}>
          <Icon name="undo" size={19} />
        </button>
        <button type="button" className="icon-btn" title="Rehacer (Ctrl+Y · tres dedos)" disabled={!model.canRedo} onClick={onRedo}>
          <Icon name="redo" size={19} />
        </button>
        <button type="button" className="icon-btn" title="Borrar todo" disabled={model.isEmpty} onClick={onClear}>
          <Icon name="trash" size={19} />
        </button>
      </div>
      {onPair && (
        <button type="button" className={`btn sm ${peers > 0 ? 'success' : 'outline'}`} onClick={onPair} title="Usar el móvil como pizarra remota">
          <Icon name={peers > 0 ? 'phone' : 'qr'} size={16} />
          {peers > 0 ? 'Móvil conectado' : compact ? 'Móvil' : 'Conectar móvil'}
        </button>
      )}
      {extra && <div className="toolbar-extra">{extra}</div>}
    </div>
  );
}
