import { describe, expect, it } from 'vitest';
import { pairUrl, parsePairUrl } from './protocol';

describe('enlace de emparejamiento (QR)', () => {
  it('ida y vuelta', () => {
    const t = { host: '192.168.1.20', port: 8787, code: '048213' };
    expect(parsePairUrl(pairUrl(t))).toEqual(t);
  });

  it('acepta el código con espacios y el puerto por defecto', () => {
    expect(parsePairUrl('http://10.0.0.5/companion?code=123%20456')).toEqual({ host: '10.0.0.5', port: 80, code: '123456' });
  });

  it('rechaza QR que no son de la app', () => {
    expect(parsePairUrl('https://example.com')).toBeNull();
    expect(parsePairUrl('hola')).toBeNull();
    expect(parsePairUrl('http://10.0.0.5:8787/companion?code=12345')).toBeNull();
    expect(parsePairUrl('javascript:alert(1)?code=123456')).toBeNull();
  });
});
