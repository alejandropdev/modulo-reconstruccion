import { describe, expect, it } from 'vitest';
import {
  Dinero,
  EstadoDesastre,
  EstadoProyecto,
  PoliticaAprobacionPresupuesto,
  PoliticaCicloDesastre,
  PoliticaTipoIntervencion,
  PoliticaTransiciones,
  TransicionInvalida,
  type AccionProyecto,
  type NivelDano,
  type TipoIntervencion,
} from '../src/index.js';
import { regla } from './regla.js';

describe('PoliticaTransiciones', () => {
  const acciones: AccionProyecto[] = ['aprobar', 'iniciar', 'suspender', 'reanudar', 'finalizar', 'cancelar'];
  const esperado: Record<string, Partial<Record<AccionProyecto, string>>> = {
    Formulado: { aprobar: 'Aprobado', cancelar: 'Cancelado' },
    Aprobado: { iniciar: 'EnEjecucion', cancelar: 'Cancelado' },
    EnEjecucion: { suspender: 'Suspendido', finalizar: 'Finalizado', cancelar: 'Cancelado' },
    Suspendido: { reanudar: 'EnEjecucion', cancelar: 'Cancelado' },
    Finalizado: {},
    Cancelado: {},
  };
  const politica = new PoliticaTransiciones();
  for (const estado of Object.values(EstadoProyecto)) {
    for (const accion of acciones) {
      const destino = esperado[estado]?.[accion];
      it(`R17: ${estado} + ${accion} → ${destino ?? 'inválida'}`, () => {
        if (destino) expect(politica.verificar(estado, accion)).toBe(destino);
        else expect(() => politica.verificar(estado, accion)).toThrow(TransicionInvalida);
      });
    }
  }
});

describe('PoliticaAprobacionPresupuesto', () => {
  const politica = new PoliticaAprobacionPresupuesto(Dinero.desde('50000000'));
  it('C01: requiere aprobación solo si la variación absoluta supera el umbral', () => {
    expect(politica.requiereAprobacion(Dinero.desde('50000000'))).toBe(false);
    expect(politica.requiereAprobacion(Dinero.desde('50000000.01'))).toBe(true);
    expect(politica.requiereAprobacion(Dinero.desde('0').restar(Dinero.desde('60000000')))).toBe(true);
  });
});

describe('PoliticaTipoIntervencion', () => {
  const politica = new PoliticaTipoIntervencion();
  const casos: [NivelDano[], TipoIntervencion, boolean][] = [
    [['LEVE'], 'REPARACION', true],
    [['LEVE'], 'RECONSTRUCCION', false],
    [['MODERADO'], 'REHABILITACION', true],
    [['MODERADO'], 'REFORZAMIENTO', true],
    [['MODERADO'], 'REPARACION', false],
    [['SEVERO'], 'RECONSTRUCCION', true],
    [['SEVERO'], 'REUBICACION', false],
    [['TOTAL'], 'REUBICACION', true],
    [['LEVE', 'TOTAL', 'MODERADO'], 'RECONSTRUCCION', true],
    [['LEVE', 'TOTAL'], 'REPARACION', false],
  ];
  for (const [niveles, tipo, ok] of casos) {
    it(`C05: ${niveles.join('+')} con ${tipo} ${ok ? 'se permite' : 'se rechaza'}`, () => {
      expect(regla(() => politica.verificar(tipo, niveles))).toBe(ok ? 'NO_LANZO' : 'C05');
    });
  }
});

describe('PoliticaCicloDesastre', () => {
  const politica = new PoliticaCicloDesastre();
  const valida = { estado: 'VALIDADA', requiereIntervencion: true } as const;
  it('R01: no se pasa a Reconstrucción desde Registro', () => {
    expect(regla(() => politica.verificarPasoAReconstruccion(EstadoDesastre.REGISTRO, [valida]))).toBe('R01');
  });
  it('R02: exige una evaluación validada que requiera intervención', () => {
    const sin = [
      { estado: 'BORRADOR', requiereIntervencion: true },
      { estado: 'VALIDADA', requiereIntervencion: false },
    ] as const;
    expect(regla(() => politica.verificarPasoAReconstruccion(EstadoDesastre.CARACTERIZACION, sin))).toBe(
      'R02',
    );
    expect(regla(() => politica.verificarPasoAReconstruccion(EstadoDesastre.CARACTERIZACION, [valida]))).toBe(
      'NO_LANZO',
    );
  });
  it('R03: no se cierra con proyectos sin finalizar o cancelar', () => {
    expect(
      regla(() => politica.verificarCierre(EstadoDesastre.RECONSTRUCCION, ['Finalizado', 'EnEjecucion'])),
    ).toBe('R03');
    expect(
      regla(() => politica.verificarCierre(EstadoDesastre.RECONSTRUCCION, ['Finalizado', 'Cancelado'])),
    ).toBe('NO_LANZO');
  });
  it('C15: solo se cierra desde Reconstrucción; sin proyectos se puede cerrar', () => {
    expect(regla(() => politica.verificarCierre(EstadoDesastre.CARACTERIZACION, []))).toBe('C15');
    expect(regla(() => politica.verificarCierre(EstadoDesastre.RECONSTRUCCION, []))).toBe('NO_LANZO');
  });
});
