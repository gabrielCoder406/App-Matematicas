import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { MathfieldElement } from 'mathlive';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'math-field': DetailedHTMLProps<HTMLAttributes<MathfieldElement>, MathfieldElement> & {
        'math-virtual-keyboard-policy'?: 'auto' | 'manual' | 'sandboxed';
        'default-mode'?: 'math' | 'text' | 'inline-math';
        'smart-fence'?: string;
        'read-only'?: boolean | string;
        placeholder?: string;
      };
    }
  }
}
