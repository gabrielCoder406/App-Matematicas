// IA local: limpieza de la salida de DeepSeek-OCR y contexto del tutor (DeepSeek Math).
import { describe, expect, it } from 'vitest';
import { markdownToLatexLines } from './localOcr';
import { sameModel } from './ollama';
import { buildTutorPrompt, deepseekMathPrompt, parseTutorRequest } from './tutor';

describe('salida del OCR local → líneas de LaTeX', () => {
  it('quita delimitadores y separa renglones', () => {
    expect(markdownToLatexLines('\\[ 2x + 3 = 7 \\]\n\\[ 2x = 4 \\]\n\n$x = 2$')).toEqual(['2x + 3 = 7', '2x = 4', 'x = 2']);
  });

  it('quita las etiquetas de posición y el formato Markdown', () => {
    const raw = '<|ref|>equation<|/ref|><|det|>[[12, 30, 400, 80]]<|/det|>\n$$\n3(x-1) = 9\n$$\n- **x = 4**';
    expect(markdownToLatexLines(raw)).toEqual(['3(x-1) = 9', 'x = 4']);
  });

  it('separa las filas de un entorno alineado', () => {
    expect(markdownToLatexLines('$$\\begin{aligned} x^2 - 4 &= 0 \\\\ x &= \\pm 2 \\end{aligned}$$')).toEqual(['x^2 - 4 = 0', 'x = \\pm 2']);
  });

  it('convierte símbolos Unicode a LaTeX', () => {
    expect(markdownToLatexLines('x² − 5 ≤ 3·x')).toEqual(['x^{2} - 5 \\le 3\\cdot x']);
    expect(markdownToLatexLines('10 ÷ 2 ≠ 4')).toEqual(['10 \\div 2 \\neq 4']);
  });

  it('limpia salidas reales de DeepSeek-OCR', () => {
    expect(markdownToLatexLines('<|im_end|>\n\n2x + 3 = 7  \n2x = 4  \nx = 2')).toEqual(['2x + 3 = 7', '2x = 4', 'x = 2']);
    expect(markdownToLatexLines('<|im_end|>\n\n\\( x^{2} - 9 = 0 \\)\n\n\\( x^{2} = 9 \\)\n\n\\( x = \\pm 3 \\)')).toEqual(['x^{2} - 9 = 0', 'x^{2} = 9', 'x = \\pm 3']);
    expect(markdownToLatexLines('<|im_end|>\n\\[\n\\begin{cases}\nx^2 - 9 = 0 \\\\\nx = \\pm 3\n\\end{cases}\n\\]')).toEqual(['x^2 - 9 = 0', 'x = \\pm 3']);
    expect(markdownToLatexLines('<|im_end|>\n<table>2x + 3 = 7<td rowspan="3">2x = 4</table>')).toEqual(['2x + 3 = 7', '2x = 4']);
  });

  it('descarta renglones vacíos o sin contenido', () => {
    expect(markdownToLatexLines('```\n\n---\n.\n```')).toEqual([]);
  });
});

describe('modelos de Ollama', () => {
  it('«:latest» es opcional', () => {
    expect(sameModel('deepseek-ocr', 'deepseek-ocr:latest')).toBe(true);
    expect(sameModel('t1c/deepseek-math-7b-rl:latest', 't1c/deepseek-math-7b-rl')).toBe(true);
    expect(sameModel('deepseek-ocr:3b', 'deepseek-ocr')).toBe(false);
  });
});

describe('tutor', () => {
  it('incluye el diagnóstico del motor y no la solución si no se mostró', () => {
    const req = parseTutorRequest({ prompt: 'Resuelve $2x+3=7$', answer: 'x = 5', correct: false, feedback: 'No verifica la ecuación.', error: 'Signo al trasponer', tip: 'Al pasar un término cambia de signo.' });
    const text = buildTutorPrompt(req);
    expect(text).toContain('Ejercicio: Resuelve $2x+3=7$');
    expect(text).toContain('INCORRECTA');
    expect(text).toContain('Error detectado: Signo al trasponer');
    expect(text).not.toContain('Solución de referencia');
    expect(text).toContain('sin darme el resultado final');
  });

  it('describe los pasos de la pizarra con su verificación', () => {
    const req = parseTutorRequest({ mode: 'ecuación', steps: [{ latex: '2x+3=7' }, { latex: '2x=10', status: 'error', message: 'Signo al trasponer' }] });
    const text = buildTutorPrompt(req);
    expect(text).toContain('0) $2x+3=7$');
    expect(text).toContain('1) $2x=10$ — INCORRECTO: Signo al trasponer');
  });

  it('arma el formato de chat de DeepSeekMath', () => {
    const text = deepseekMathPrompt(parseTutorRequest({ prompt: 'Calcula $2+2$' }));
    expect(text).toMatch(/^Eres un tutor de matemáticas/);
    expect(text).toContain('\n\nUser: Ejercicio: Calcula $2+2$');
    expect(text).toMatch(/sin repetir ideas\.\)\n\nAssistant:$/);
  });

  it('rechaza pedidos vacíos y recorta textos largos', () => {
    expect(() => parseTutorRequest({})).toThrow();
    const req = parseTutorRequest({ prompt: 'x'.repeat(5000), steps: Array.from({ length: 50 }, () => ({ latex: 'x=1' })) });
    expect(req.prompt!.length).toBeLessThanOrEqual(1500);
    expect(req.steps!.length).toBe(20);
  });
});
