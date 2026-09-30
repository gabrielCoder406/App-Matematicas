// Lectura de la escritura con un modelo local (DeepSeek-OCR vía Ollama). El modelo devuelve
// Markdown con fórmulas; aquí se limpia hasta dejar una línea de LaTeX por renglón escrito.
import { chat, type ChatMessage } from './ollama';

/**
 * DeepSeek-OCR es muy sensible al formato: sin el salto de línea inicial (como en el ejemplo
 * oficial «imagen\npedido») se saltea renglones. Con esta variante devuelve una fórmula por
 * renglón en LaTeX. Medido en un Ryzen 7 sin tarjeta gráfica: ~20 s por lectura.
 */
const PROMPT = '\nConvert the document to markdown.';

const UNICODE: [RegExp, string][] = [
  [/[−–—]/g, '-'],
  [/[×✕]/g, '\\cdot '],
  [/·/g, '\\cdot '],
  [/÷/g, '\\div '],
  [/≤/g, '\\le '],
  [/≥/g, '\\ge '],
  [/≠/g, '\\neq '],
  [/±/g, '\\pm '],
  [/∞/g, '\\infty '],
  [/π/g, '\\pi '],
  [/√/g, '\\sqrt '],
  [/⇒|→/g, '\\Rightarrow '],
  [/⇔|↔/g, '\\Leftrightarrow '],
  [/¬/g, '\\neg '],
  [/∧/g, '\\land '],
  [/∨/g, '\\lor '],
  [/∪/g, '\\cup '],
  [/∩/g, '\\cap '],
  [/∅/g, '\\emptyset '],
  [/∈/g, '\\in '],
  [/½/g, '\\frac{1}{2}'],
];

const SUPERSCRIPTS: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };

/** Convierte la salida del modelo (Markdown + LaTeX + etiquetas) en líneas de LaTeX. */
export function markdownToLatexLines(raw: string): string[] {
  let text = raw
    // Etiquetas de posición del modo «grounding»: <|ref|>tipo<|/ref|><|det|>[[x1,y1,x2,y2]]<|/det|>
    .replace(/<\|ref\|>[\s\S]*?<\|\/ref\|>/g, '')
    .replace(/<\|det\|>[\s\S]*?<\|\/det\|>/g, '')
    .replace(/<\|[^|>]*\|>/g, '')
    // A veces envuelve los renglones en una tabla HTML.
    .replace(/<\/?(table|thead|tbody|tr|td|th|br|p|div|span)\b[^>]*>/gi, '\n')
    .replace(/```[a-z]*\n?/gi, '')
    // Bloques \[ … \] y $$ … $$ pueden abarcar varias líneas: se unen en una.
    .replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) => `\n${inner.replace(/\s*\n\s*/g, ' ')}\n`)
    .replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner: string) => `\n${inner.replace(/\s*\n\s*/g, ' ')}\n`);

  // Entornos alineados: cada fila (\\) es un renglón.
  text = text
    .replace(/\\begin\{(aligned|align\*?|array|gathered|cases|eqnarray\*?)\}(\{[^}]*\})?/g, '\n')
    .replace(/\\end\{(aligned|align\*?|array|gathered|cases|eqnarray\*?)\}/g, '\n')
    .replace(/\\\\/g, '\n');

  const lines: string[] = [];
  for (let line of text.split('\n')) {
    line = line
      .replace(/^\s{0,3}(#{1,6}\s+|[-*+•]\s+|>\s*|\d+[.)]\s+)/, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\\\((.+?)\\\)/g, '$1')
      .replace(/\$(.+?)\$/g, '$1')
      .replace(/\$/g, '')
      .replace(/&/g, '')
      .replace(/\\(?:quad|qquad|,|;|!)/g, ' ')
      .replace(/\\text\s*\{\s*\}/g, '');
    for (const [re, rep] of UNICODE) line = line.replace(re, rep);
    line = line.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (s) => `^{${[...s].map((c) => SUPERSCRIPTS[c]).join('')}}`);
    line = line.replace(/\s+/g, ' ').trim();
    // Sin contenido matemático (restos de formato o texto suelto de una sola palabra corta)
    if (!line || /^[\s.,;:!?¿¡'"`()[\]{}_-]*$/.test(line)) continue;
    lines.push(line);
  }
  return lines;
}

export async function recognizeLocal(base: string, model: string, pngBase64: string): Promise<{ lines: string[]; model: string }> {
  const messages: ChatMessage[] = [{ role: 'user', content: PROMPT, images: [pngBase64] }];
  const raw = await chat(base, model, messages, { temperature: 0, num_ctx: 8192, num_predict: 1024 }, 240_000);
  return { lines: markdownToLatexLines(raw), model };
}
