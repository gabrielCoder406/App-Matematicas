// Campo de edición matemática estructurada (MathLive) con salida en LaTeX.
import type { MathfieldElement } from 'mathlive';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useProgress } from '../store/progress';

export interface MathInputHandle {
  focus(): void;
  insert(latex: string): void;
  getValue(): string;
  setValue(latex: string): void;
}

interface Props {
  value: string;
  onChange(latex: string): void;
  onSubmit?(): void;
  onFocus?(): void;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  status?: 'ok' | 'error' | 'warning' | null;
  /** Oculta el teclado virtual (por ejemplo, en el modo pizarra). */
  noKeyboard?: boolean;
  size?: 'md' | 'lg';
}

export const MathInput = forwardRef<MathInputHandle, Props>(function MathInput(
  { value, onChange, onSubmit, onFocus, placeholder, autoFocus, disabled, className, status, noKeyboard, size = 'md' },
  ref,
) {
  const el = useRef<MathfieldElement>(null);
  const handlers = useRef({ onChange, onSubmit, onFocus });
  handlers.current = { onChange, onSubmit, onFocus };

  useImperativeHandle(ref, () => ({
    focus: () => el.current?.focus(),
    insert: (latex: string) => {
      const mf = el.current;
      if (!mf) return;
      mf.focus();
      mf.insert(latex, { insertionMode: 'replaceSelection', selectionMode: 'placeholder' });
      handlers.current.onChange(mf.value);
    },
    getValue: () => el.current?.value ?? '',
    setValue: (latex: string) => {
      if (el.current) el.current.value = latex;
    },
  }));

  useEffect(() => {
    const mf = el.current;
    if (!mf) return;
    mf.smartFence = true;
    mf.inlineShortcuts = {
      ...mf.inlineShortcuts,
      sen: '\\operatorname{sen}',
      tg: '\\tan',
      raiz: '\\sqrt{#0}',
      '<=': '\\le',
      '>=': '\\ge',
      '!=': '\\neq',
      '=>': '\\Rightarrow',
      '<=>': '\\Leftrightarrow',
      '->': '\\Rightarrow',
    };
    const onInput = () => handlers.current.onChange(mf.value);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handlers.current.onSubmit?.();
      }
    };
    const onFocusIn = () => handlers.current.onFocus?.();
    mf.addEventListener('input', onInput);
    mf.addEventListener('keydown', onKey);
    mf.addEventListener('focusin', onFocusIn);
    if (autoFocus) setTimeout(() => mf.focus(), 50);
    return () => {
      mf.removeEventListener('input', onInput);
      mf.removeEventListener('keydown', onKey);
      mf.removeEventListener('focusin', onFocusIn);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mf = el.current;
    if (mf && mf.value !== value) mf.value = value;
  }, [value]);

  useEffect(() => {
    if (el.current) el.current.readOnly = !!disabled;
  }, [disabled]);

  const keyboardSetting = useProgress((s) => s.settings.virtualKeyboard);
  useEffect(() => {
    if (el.current) el.current.mathVirtualKeyboardPolicy = noKeyboard || !keyboardSetting ? 'manual' : 'auto';
  }, [noKeyboard, keyboardSetting]);

  return (
    <math-field
      ref={el}
      className={`math-input ${size === 'lg' ? 'lg' : ''} ${status ? `status-${status}` : ''} ${className ?? ''}`}
      placeholder={placeholder}
    />
  );
});
