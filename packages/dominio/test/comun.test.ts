import { describe, expect, it } from 'vitest';
import { DatosInvalidos, Dinero, FechaCalendario, Porcentaje } from '../src/index.js';

describe('Dinero', () => {
  it('suma y resta exactas (0,10 + 0,20 = 0,30)', () => {
    expect(Dinero.desde('0.10').sumar(Dinero.desde('0.20')).aTextoPesos()).toBe('0.30');
    expect(Dinero.desde('10').restar(Dinero.desde('0.01')).aTextoPesos()).toBe('9.99');
  });
  it('convierte desde y hacia texto en pesos', () => {
    expect(Dinero.desde('2500000000').aTextoPesos()).toBe('2500000000.00');
    expect(Dinero.desde('1.5').centavos).toBe(150n);
    expect(Dinero.desdeCentavos(-5n).aTextoPesos()).toBe('-0.05');
  });
  it('rechaza valores inválidos', () => {
    for (const malo of ['', 'abc', '1.234', '-1', '1,5'])
      expect(() => Dinero.desde(malo)).toThrow(DatosInvalidos);
  });
  it('compara y calcula abs', () => {
    const a = Dinero.desde('5');
    expect(a.comparar(Dinero.desde('6'))).toBe(-1);
    expect(a.igual(Dinero.desde('5.00'))).toBe(true);
    expect(Dinero.desde('1').restar(a).abs().igual(Dinero.desde('4'))).toBe(true);
    expect(Dinero.cero().esPositivo()).toBe(false);
  });
});

describe('Porcentaje', () => {
  it('acepta 0..100 con 2 decimales', () => {
    expect(Porcentaje.desde(33.33).valor).toBe(33.33);
    expect(Porcentaje.desde(100).esCien()).toBe(true);
  });
  it('rechaza fuera de rango o con más decimales', () => {
    for (const malo of [-1, 100.01, 1.234, Number.NaN])
      expect(() => Porcentaje.desde(malo)).toThrow(DatosInvalidos);
  });
});

describe('FechaCalendario', () => {
  it('calcula diferencia en días y compara', () => {
    const a = FechaCalendario.desde('2026-03-10');
    const b = FechaCalendario.desde('2026-03-01');
    expect(a.diferenciaEnDias(b)).toBe(9);
    expect(b.menorQue(a)).toBe(true);
  });
  it('rechaza fechas inexistentes', () => {
    for (const mala of ['2026-02-30', '2026/01/01', 'hoy'])
      expect(() => FechaCalendario.desde(mala)).toThrow(DatosInvalidos);
  });
});
