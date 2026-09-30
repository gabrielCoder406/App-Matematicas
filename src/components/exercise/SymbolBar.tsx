import { Tex } from '../Math';

const SETS: Record<string, { tex: string; insert: string; title: string }[]> = {
  logic: [
    { tex: '\\neg', insert: '\\neg', title: 'Negación' },
    { tex: '\\land', insert: '\\land', title: 'Conjunción (y)' },
    { tex: '\\lor', insert: '\\lor', title: 'Disyunción (o)' },
    { tex: '\\Rightarrow', insert: '\\Rightarrow', title: 'Implicación' },
    { tex: '\\Leftrightarrow', insert: '\\Leftrightarrow', title: 'Bicondicional' },
    { tex: '\\veebar', insert: '\\veebar', title: 'Disyunción exclusiva' },
    { tex: '(\\ )', insert: '\\left(#0\\right)', title: 'Paréntesis' },
  ],
  set: [
    { tex: '\\cup', insert: '\\cup', title: 'Unión' },
    { tex: '\\cap', insert: '\\cap', title: 'Intersección' },
    { tex: '-', insert: '-', title: 'Diferencia' },
    { tex: 'A^{c}', insert: '^{c}', title: 'Complemento' },
    { tex: '\\triangle', insert: '\\triangle', title: 'Diferencia simétrica' },
    { tex: '\\emptyset', insert: '\\emptyset', title: 'Vacío' },
    { tex: '\\{\\ \\}', insert: '\\lbrace #0\\rbrace', title: 'Llaves' },
  ],
  arith: [
    { tex: '\\frac{a}{b}', insert: '\\frac{#0}{#?}', title: 'Fracción' },
    { tex: 'x^{n}', insert: '^{#0}', title: 'Potencia' },
    { tex: '\\sqrt{x}', insert: '\\sqrt{#0}', title: 'Raíz cuadrada' },
    { tex: '\\sqrt[n]{x}', insert: '\\sqrt[#?]{#0}', title: 'Raíz n-ésima' },
    { tex: '\\pi', insert: '\\pi', title: 'Pi' },
    { tex: '\\pm', insert: '\\pm', title: 'Más/menos' },
    { tex: '\\le', insert: '\\le', title: 'Menor o igual' },
    { tex: '\\ge', insert: '\\ge', title: 'Mayor o igual' },
    { tex: '\\infty', insert: '\\infty', title: 'Infinito' },
    { tex: '\\lor', insert: '\\lor', title: '«o» entre soluciones' },
  ],
};

export function SymbolBar({ kind, onInsert }: { kind: 'logic' | 'set' | 'arith'; onInsert(latex: string): void }) {
  return (
    <div className="symbol-bar" role="toolbar" aria-label="Símbolos">
      {SETS[kind].map((s) => (
        <button key={s.title} type="button" className="symbol-btn" title={s.title} onMouseDown={(e) => e.preventDefault()} onClick={() => onInsert(s.insert)}>
          <Tex tex={s.tex} />
        </button>
      ))}
    </div>
  );
}
