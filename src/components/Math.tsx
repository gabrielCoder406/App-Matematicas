// Renderizado de fórmulas (KaTeX) y de texto enriquecido con $…$.
import katex from 'katex';
import { Fragment, memo, useMemo, type ReactNode } from 'react';

const MACROS = { '\\sen': '\\operatorname{sen}', '\\tg': '\\tan' };

const cache = new Map<string, string>();

export function renderTex(tex: string, display = false): string {
  const key = `${display ? 'D' : 'I'}${tex}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let html: string;
  try {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore', macros: { ...MACROS } });
  } catch {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', macros: { ...MACROS } });
  }
  if (cache.size > 3000) cache.clear();
  cache.set(key, html);
  return html;
}

export const Tex = memo(function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  const Tag = display ? 'div' : 'span';
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

const DOLLAR = '\u0000';

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\*\*([^*]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  const plain = (s: string) => s.replaceAll(DOLLAR, '$');
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<Fragment key={`${keyBase}t${i++}`}>{plain(text.slice(last, m.index))}</Fragment>);
    if (m[1] !== undefined) out.push(<Tex key={`${keyBase}d${i++}`} tex={m[1]} display />);
    else if (m[2] !== undefined) out.push(<Tex key={`${keyBase}m${i++}`} tex={m[2]} />);
    else out.push(<strong key={`${keyBase}b${i++}`}>{inline(m[3], `${keyBase}b${i}`)}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={`${keyBase}t${i++}`}>{plain(text.slice(last))}</Fragment>);
  return out;
}

/** Texto con $…$ (fórmulas), $$…$$ (bloque), **negrita**, listas «- » y párrafos. */
export const RichText = memo(function RichText({ text, className, as = 'div' }: { text: string; className?: string; as?: 'div' | 'span' }) {
  const nodes = useMemo(() => {
    const src = text.replace(/\\\$/g, DOLLAR);
    if (as === 'span') return inline(src.replace(/\n+/g, ' '), 's');
    const blocks = src.split(/\n{2,}/);
    return blocks.map((block, bi) => {
      const lines = block.split('\n').filter((l) => l.length > 0);
      if (lines.length && lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        return (
          <ul key={bi}>
            {lines.map((l, li) => (
              <li key={li}>{inline(l.replace(/^\s*[-•]\s+/, ''), `${bi}-${li}`)}</li>
            ))}
          </ul>
        );
      }
      // Párrafo con posibles viñetas mezcladas
      const parts: ReactNode[] = [];
      let list: string[] = [];
      const flush = (k: string) => {
        if (list.length) {
          parts.push(
            <ul key={`ul${k}`}>
              {list.map((l, li) => (
                <li key={li}>{inline(l, `${bi}-${k}-${li}`)}</li>
              ))}
            </ul>,
          );
          list = [];
        }
      };
      const textLines: string[] = [];
      lines.forEach((l, li) => {
        if (/^\s*[-•]\s+/.test(l)) {
          if (textLines.length) {
            parts.push(<p key={`p${li}`}>{inline(textLines.join(' '), `${bi}-p${li}`)}</p>);
            textLines.length = 0;
          }
          list.push(l.replace(/^\s*[-•]\s+/, ''));
        } else {
          flush(String(li));
          textLines.push(l);
        }
      });
      flush('end');
      if (textLines.length) parts.push(<p key="plast">{inline(textLines.join(' '), `${bi}-plast`)}</p>);
      return <Fragment key={bi}>{parts}</Fragment>;
    });
  }, [text, as]);
  if (as === 'span') return <span className={className}>{nodes}</span>;
  return <div className={`rich ${className ?? ''}`}>{nodes}</div>;
});
