import katex from 'katex';
import { describe, expect, it } from 'vitest';
import { SKILLS } from './curriculum';
import { glossary, relatedEntries, searchWiki, WIKI, WIKI_BY_ID } from './wiki';

const MACROS = { '\\sen': '\\operatorname{sen}', '\\tg': '\\tan' };

function renders(tex: string, where: string) {
  try {
    katex.renderToString(tex, { throwOnError: true, strict: false, macros: { ...MACROS } });
  } catch (e) {
    throw new Error(`LaTeX inválido en ${where}: «${tex}» → ${(e as Error).message}`);
  }
}

/** Comprueba los $…$ y $$…$$ de un texto enriquecido. */
function checkRich(raw: string, where: string) {
  const text = raw.replace(/\\\$/g, '§');
  expect(text.split('$').length % 2, `delimitadores $ desbalanceados en ${where}: ${raw}`).toBe(1);
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) renders(m[1] ?? m[2], where);
}

const top = (q: string) => searchWiki(q)[0]?.entry.id;
const ids = (q: string) => searchWiki(q).map((h) => h.entry.id);

describe('wiki de temas', () => {
  it('cada habilidad del temario tiene su ficha', () => {
    expect(SKILLS.filter((s) => !WIKI_BY_ID[s.id]).map((s) => s.id)).toEqual([]);
  });

  it('los ids son únicos y los «ver también» existen', () => {
    expect(new Set(WIKI.map((e) => e.id)).size).toBe(WIKI.length);
    for (const e of WIKI) for (const r of e.seeAlso ?? []) expect(WIKI_BY_ID[r], `${e.id} → ${r}`).toBeDefined();
  });

  for (const e of WIKI) {
    it(`ficha ${e.id}`, () => {
      expect(e.summary.length).toBeGreaterThan(20);
      expect(e.keywords.length).toBeGreaterThan(2);
      const texts: string[] = [e.summary, ...(e.remember ?? [])];
      for (const f of e.formulas ?? []) {
        renders(f.tex, `${e.id} (fórmula «${f.name}»)`);
        if (f.note) texts.push(f.note);
      }
      for (const t of e.terms ?? []) texts.push(t.def);
      for (const t of e.tables ?? []) {
        texts.push(t.title, ...t.headers, ...t.rows.flat());
        for (const r of t.rows) expect(r.length, `${e.id}: fila de «${t.title}»`).toBe(t.headers.length);
      }
      if (e.steps) texts.push(...e.steps.items);
      if (e.example) {
        texts.push(e.example.problem);
        for (const s of e.example.steps) {
          if (s.math) renders(s.math, `${e.id} (ejemplo)`);
          if (s.note) texts.push(s.note);
        }
      }
      for (const m of e.mistakes ?? []) texts.push(m.wrong, m.right, m.note ?? '');
      for (const t of texts) checkRich(t, e.id);
    });
  }

  it('el glosario está ordenado y agrupado por letra', () => {
    const g = glossary();
    expect(g.length).toBeGreaterThan(80);
    expect(g.find((t) => t.term === 'Hipotenusa')?.entry.id).toBe('geo.pythagoras');
    expect(g.every((t) => /^[A-Z]$/.test(t.letter))).toBe(true);
  });

  it('relaciona requisitos, dependientes y «ver también» sin repetir', () => {
    const r = relatedEntries('alg.quadratic');
    expect(r.prereqs.map((e) => e.id)).toContain('alg.factoring');
    expect(r.usedIn.map((e) => e.id)).toContain('fn.quadratic');
    expect(r.seeAlso.map((e) => e.id)).not.toContain('fn.quadratic');
  });
});

describe('buscador de la wiki', () => {
  it('encuentra por título sin importar tildes ni mayúsculas', () => {
    expect(top('pitagoras')).toBe('geo.pythagoras');
    expect(top('PITÁGORAS')).toBe('geo.pythagoras');
    expect(top('logaritmos')).toBe('fn.exp-log');
  });

  it('encuentra por sinónimos y nombres propios', () => {
    expect(top('bhaskara')).toBe('alg.quadratic');
    expect(top('ruffini')).toBe('alg.polynomials');
    expect(top('sarrus')).toBe('la.determinants');
    expect(top('de morgan')).toBe('logic.laws');
    expect(top('teorema del seno')).toBe('trig.triangles');
    expect(top('regla de tres')).toBe('arith.proportion');
  });

  it('tolera plurales y palabras a medio escribir', () => {
    expect(ids('raices')).toContain('arith.roots');
    expect(ids('fracción')).toContain('arith.fractions');
    expect(top('deriv')).toBe('calc.derivatives');
    expect(top('matriz')).toBe('la.matrices');
  });

  it('muestra la fórmula o la definición que coincide', () => {
    const hit = searchWiki('discriminante').find((h) => h.entry.id === 'alg.quadratic');
    expect(hit?.matches.some((m) => m.kind === 'formula' && m.formula.name === 'Discriminante')).toBe(true);
    const hip = searchWiki('hipotenusa')[0];
    expect(hip.matches.some((m) => m.kind === 'term' && m.term.term === 'Hipotenusa')).toBe(true);
    const prod = searchWiki('derivada del producto')[0];
    expect(prod.entry.id).toBe('calc.derivatives');
    expect(prod.matches[0]).toMatchObject({ kind: 'formula', formula: { name: 'Producto' } });
  });

  it('no confunde palabras cortas con partes de otras', () => {
    expect(top('para todo')).toBe('logic.quantifiers');
    expect(top('seno')).toBe('trig.ratios');
  });

  it('exige todas las palabras y devuelve vacío sin consulta', () => {
    expect(searchWiki('')).toEqual([]);
    expect(searchWiki('   ')).toEqual([]);
    expect(searchWiki('pitagoras logaritmo')).toEqual([]);
    expect(searchWiki('zzzqqq')).toEqual([]);
  });
});
