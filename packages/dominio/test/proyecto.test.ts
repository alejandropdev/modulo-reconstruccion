import { describe, expect, it } from 'vitest';
import {
  Dinero,
  FechaCalendario,
  PoliticaAprobacionPresupuesto,
  Porcentaje,
  ProyectoReconstruccion,
  type DatosEvidencia,
} from '../src/index.js';
import { regla } from './regla.js';
import { AHORA, HOY, U, politicaTipo, unProyecto } from './unProyecto.js';

const politica = new PoliticaAprobacionPresupuesto(Dinero.desde('50000000'));
const pesos = Dinero.desde;
const pct = Porcentaje.desde;
const evidencia = (
  tipo: DatosEvidencia['tipo'] = 'ENTREGA',
  extra: Partial<DatosEvidencia> = {},
): DatosEvidencia => ({
  id: 'EV-9',
  tipo,
  autorId: U.responsable,
  archivoId: 'f9',
  nombreArchivo: 'a.pdf',
  tipoMime: 'application/pdf',
  tamanoBytes: 1000,
  ...extra,
});
const nuevo = (extra = {}) => ({
  desastreId: 'D-002',
  tipoIntervencion: 'RECONSTRUCCION' as const,
  referenciasEvaluacion: [{ evaluacionId: 'E-1', activoId: 'A-1', nivelDano: 'SEVERO' as const }],
  presupuesto: pesos('100'),
  fuenteFinanciacion: 'SGR',
  responsableId: U.responsable,
  creadoPor: U.autoridad,
  ...extra,
});
const crear = (extra = {}) => ProyectoReconstruccion.crear(nuevo(extra), politicaTipo, AHORA, 'P-9');

describe('creación', () => {
  it('R04: nace de al menos una evaluación y guarda la referencia', () => {
    expect(regla(() => crear({ referenciasEvaluacion: [] }))).toBe('R04');
    expect(crear().referenciasEvaluacion).toHaveLength(1);
  });
  it('R06: exige presupuesto > 0, fuente y responsable', () => {
    expect(regla(() => crear({ presupuesto: pesos('0') }))).toBe('R06');
    expect(regla(() => crear({ fuenteFinanciacion: ' ' }))).toBe('R06');
    expect(regla(() => crear({ responsableId: '' }))).toBe('R06');
  });
  it('C05: valida el tipo de intervención según el nivel de daño', () => {
    expect(regla(() => crear({ tipoIntervencion: 'REPARACION' }))).toBe('C05');
  });
  it('C06: las evaluaciones no se repiten dentro del proyecto', () => {
    const r = { evaluacionId: 'E-1', activoId: 'A-1', nivelDano: 'SEVERO' as const };
    expect(regla(() => crear({ referenciasEvaluacion: [r, r] }))).toBe('C06');
  });
  it('R17: la creación agrega el primer CambioEstado con anterior = null', () => {
    const h = crear().aInstantanea().historialEstados;
    expect(h).toHaveLength(1);
    expect(h[0]).toMatchObject({ anterior: null, nuevo: 'Formulado' });
  });
  it('C17: el proyecto nuevo está activo y emite ProyectoCreado', () => {
    const p = crear();
    expect(p.activo).toBe(true);
    expect(p.extraerEventos().map((e) => e.tipo)).toEqual(['ProyectoCreado']);
    expect(p.extraerEventos()).toEqual([]);
  });
});

describe('aprobar e iniciar', () => {
  it('R07: quien aprueba debe ser distinto de quien creó', () => {
    expect(regla(() => unProyecto().build().aprobar(U.autoridad, AHORA))).toBe('R07');
    const p = unProyecto().build();
    p.aprobar(U.aprobador, AHORA);
    expect(p.estado).toBe('Aprobado');
  });
  it('R08: iniciar exige contratista y al menos un hito', () => {
    expect(
      regla(() =>
        unProyecto()
          .enEstado('Aprobado')
          .sinContratista()
          .conHito()
          .build()
          .iniciarEjecucion(U.responsable, AHORA),
      ),
    ).toBe('R08');
    expect(
      regla(() => unProyecto().enEstado('Aprobado').build().iniciarEjecucion(U.responsable, AHORA)),
    ).toBe('R08');
    const p = unProyecto().enEstado('Aprobado').conHito().build();
    p.iniciarEjecucion(U.responsable, AHORA);
    expect(p.estado).toBe('EnEjecucion');
  });
  it('C16: el contratista se puede registrar al iniciar', () => {
    const p = unProyecto().enEstado('Aprobado').sinContratista().conHito().build();
    p.iniciarEjecucion(U.responsable, AHORA, { nit: '1', nombre: 'Otra' });
    expect(p.aInstantanea().contratista).toEqual({ nit: '1', nombre: 'Otra' });
  });
  it('C10: solo el responsable asignado opera el proyecto', () => {
    const p = unProyecto().enEstado('Aprobado').conHito().build();
    expect(regla(() => p.iniciarEjecucion(U.otro, AHORA))).toBe('C10');
    expect(
      regla(() =>
        unProyecto().enEstado('EnEjecucion').conHito().build().registrarAvance(pct(10), U.otro, AHORA),
      ),
    ).toBe('C10');
  });
});

describe('suspender, reanudar, finalizar y cancelar', () => {
  const enEjecucion = () => unProyecto().enEstado('EnEjecucion').conHito().build();
  it('C14: suspender, reanudar y cancelar exigen motivo', () => {
    expect(regla(() => enEjecucion().suspender(' ', U.responsable, AHORA))).toBe('C14');
    expect(
      regla(() => unProyecto().enEstado('Suspendido').conHito().build().reanudar('', U.responsable, AHORA)),
    ).toBe('C14');
    expect(regla(() => enEjecucion().cancelar('', U.autoridad, AHORA))).toBe('C14');
  });
  it('R17: suspender y reanudar siguen el diagrama de estados', () => {
    const p = enEjecucion();
    p.suspender('lluvias', U.responsable, AHORA);
    expect(p.estado).toBe('Suspendido');
    p.reanudar('sin lluvias', U.responsable, AHORA);
    expect(p.estado).toBe('EnEjecucion');
    expect(p.aInstantanea().historialEstados.map((h) => h.nuevo)).toEqual([
      'Formulado',
      'Aprobado',
      'EnEjecucion',
      'Suspendido',
      'EnEjecucion',
    ]);
  });
  it('R09: finalizar exige avance 100 % y evidencia de entrega', () => {
    expect(
      regla(() =>
        unProyecto()
          .enEstado('EnEjecucion')
          .conHito()
          .conAvance(90)
          .conEvidenciaEntrega()
          .build()
          .finalizar(U.responsable, AHORA),
      ),
    ).toBe('R09');
    const sinEvidencia = unProyecto().enEstado('EnEjecucion').conHito().conAvance(100).build();
    expect(regla(() => sinEvidencia.finalizar(U.responsable, AHORA))).toBe('R09');
    const p = unProyecto().enEstado('EnEjecucion').conHito().conAvance(100).conEvidenciaEntrega().build();
    p.finalizar(U.responsable, AHORA);
    expect(p.estado).toBe('Finalizado');
  });
  it('C17: al finalizar o cancelar se libera la evaluación (activo = false)', () => {
    expect(unProyecto().enEstado('Finalizado').conHito().build().activo).toBe(false);
    expect(unProyecto().enEstado('Cancelado').build().activo).toBe(false);
    expect(unProyecto().enEstado('Suspendido').conHito().build().activo).toBe(true);
  });
  it('R10: se puede cancelar en cualquier momento antes de finalizar, con motivo', () => {
    for (const e of ['Formulado', 'Aprobado', 'EnEjecucion', 'Suspendido'] as const) {
      const p = unProyecto().enEstado(e).conHito().build();
      p.cancelar('Presupuesto agotado', U.autoridad, AHORA);
      expect(p.estado).toBe('Cancelado');
    }
    expect(
      regla(() => unProyecto().enEstado('Finalizado').conHito().build().cancelar('x', U.autoridad, AHORA)),
    ).toBe('R17');
  });
  it('C13: finalizar exige sin cambios pendientes; cancelar los anula', () => {
    const p = unProyecto().enEstado('EnEjecucion').conHito().conAvance(100).conEvidenciaEntrega().build();
    p.solicitarCambioPresupuesto(pesos('2000000000'), 'ampliación', U.responsable, politica, AHORA, 'C-1');
    expect(regla(() => p.finalizar(U.responsable, AHORA))).toBe('C13');
    p.cancelar('Se cancela', U.autoridad, AHORA);
    expect(p.aInstantanea().cambiosPresupuesto[0]).toMatchObject({
      estado: 'Anulado',
      motivoResolucion: 'Proyecto cancelado',
    });
  });
});

describe('cambios de presupuesto', () => {
  const enEjecucion = () => unProyecto().enEstado('EnEjecucion').conHito().build();
  it('C01: bajo el umbral se aplica de inmediato', () => {
    const p = enEjecucion();
    const c = p.solicitarCambioPresupuesto(
      pesos('1010000000'),
      'ajuste',
      U.responsable,
      politica,
      AHORA,
      'C-1',
    );
    expect(c.estado).toBe('Aplicado');
    expect(p.valorVigente).toEqual(pesos('1010000000'));
  });
  it('R12: sobre el umbral queda pendiente hasta que otro usuario lo apruebe', () => {
    const p = enEjecucion();
    const c = p.solicitarCambioPresupuesto(
      pesos('1100000000'),
      'ampliación',
      U.responsable,
      politica,
      AHORA,
      'C-1',
    );
    expect(c.estado).toBe('Pendiente');
    expect(p.valorVigente).toEqual(pesos('1000000000'));
    p.resolverCambioPresupuesto('C-1', 'APROBAR', undefined, U.aprobador, AHORA);
    expect(p.valorVigente).toEqual(pesos('1100000000'));
    expect(p.cambiosPendientes()).toHaveLength(0);
  });
  it('R12: rechazar deja el presupuesto igual', () => {
    const p = enEjecucion();
    p.solicitarCambioPresupuesto(pesos('1100000000'), 'ampliación', U.responsable, politica, AHORA, 'C-1');
    p.resolverCambioPresupuesto('C-1', 'RECHAZAR', 'no hay fondos', U.aprobador, AHORA);
    expect(p.valorVigente).toEqual(pesos('1000000000'));
    expect(p.cambiosPresupuesto[0]?.estado).toBe('Rechazado');
  });
  it('R11: guarda motivo, valor anterior y nuevo, quién y cuándo; el motivo es obligatorio', () => {
    const p = enEjecucion();
    expect(
      regla(() =>
        p.solicitarCambioPresupuesto(pesos('1100000000'), ' ', U.responsable, politica, AHORA, 'C-1'),
      ),
    ).toBe('R11');
    p.solicitarCambioPresupuesto(pesos('1010000000'), 'ajuste', U.responsable, politica, AHORA, 'C-2');
    expect(p.cambiosPresupuesto[0]).toMatchObject({
      valorAnterior: pesos('1000000000'),
      valorNuevo: pesos('1010000000'),
      motivo: 'ajuste',
      solicitanteId: U.responsable,
      solicitadoEn: AHORA,
    });
  });
  it('C02: el nuevo presupuesto es > 0 y no menor que los costos ejecutados', () => {
    const p = enEjecucion();
    p.registrarCosto(pesos('500000000'), 'obra', U.responsable, AHORA, 'K-1');
    expect(
      regla(() => p.solicitarCambioPresupuesto(pesos('0'), 'x', U.responsable, politica, AHORA, 'C-1')),
    ).toBe('C02');
    expect(
      regla(() =>
        p.solicitarCambioPresupuesto(pesos('400000000'), 'x', U.responsable, politica, AHORA, 'C-1'),
      ),
    ).toBe('C02');
  });
  it('C02: se valida otra vez al aprobar', () => {
    const p = enEjecucion();
    p.solicitarCambioPresupuesto(pesos('900000000'), 'recorte', U.responsable, politica, AHORA, 'C-1');
    p.registrarCosto(pesos('950000000'), 'obra', U.responsable, AHORA, 'K-1');
    expect(regla(() => p.resolverCambioPresupuesto('C-1', 'APROBAR', undefined, U.aprobador, AHORA))).toBe(
      'C02',
    );
  });
  it('C03: quien resuelve debe ser distinto de quien solicitó', () => {
    const p = enEjecucion();
    p.solicitarCambioPresupuesto(pesos('1100000000'), 'x', U.responsable, politica, AHORA, 'C-1');
    expect(regla(() => p.resolverCambioPresupuesto('C-1', 'APROBAR', undefined, U.responsable, AHORA))).toBe(
      'C03',
    );
  });
  it('C04: suspendido, finalizado o cancelado no acepta solicitudes ni resoluciones', () => {
    for (const e of ['Suspendido', 'Finalizado', 'Cancelado'] as const) {
      const p = unProyecto().enEstado(e).conHito().build();
      expect(
        regla(() =>
          p.solicitarCambioPresupuesto(pesos('1010000000'), 'x', U.responsable, politica, AHORA, 'C-1'),
        ),
      ).toBe('C04');
      expect(regla(() => p.resolverCambioPresupuesto('C-1', 'APROBAR', undefined, U.aprobador, AHORA))).toBe(
        'C04',
      );
    }
  });
  it('C12: al aprobar se verifica que el valor vigente no haya cambiado', () => {
    const p = enEjecucion();
    p.solicitarCambioPresupuesto(pesos('1100000000'), 'a', U.responsable, politica, AHORA, 'C-1');
    p.solicitarCambioPresupuesto(pesos('1200000000'), 'b', U.responsable, politica, AHORA, 'C-2');
    p.resolverCambioPresupuesto('C-1', 'APROBAR', undefined, U.aprobador, AHORA);
    expect(regla(() => p.resolverCambioPresupuesto('C-2', 'APROBAR', undefined, U.aprobador, AHORA))).toBe(
      'C12',
    );
  });
});

describe('avance y costos', () => {
  const enEjecucion = () => unProyecto().enEstado('EnEjecucion').conHito().build();
  it('R14: el avance solo en ejecución, de 0 a 100 y sin bajar', () => {
    expect(
      regla(() =>
        unProyecto().enEstado('Aprobado').conHito().build().registrarAvance(pct(10), U.responsable, AHORA),
      ),
    ).toBe('R14');
    const p = enEjecucion();
    p.registrarAvance(pct(40), U.responsable, AHORA);
    expect(regla(() => p.registrarAvance(pct(30), U.responsable, AHORA))).toBe('R14');
    expect(() => pct(101)).toThrow();
    p.registrarAvance(pct(40), U.responsable, AHORA);
    expect(p.avanceFisico().valor).toBe(40);
  });
  it('R15: un proyecto suspendido no recibe avances ni costos', () => {
    const p = unProyecto().enEstado('Suspendido').conHito().build();
    expect(regla(() => p.registrarAvance(pct(10), U.responsable, AHORA))).toBe('R15');
    expect(regla(() => p.registrarCosto(pesos('1'), 'x', U.responsable, AHORA, 'K-1'))).toBe('R15');
  });
  it('R13: los costos no superan el presupuesto', () => {
    const p = enEjecucion();
    p.registrarCosto(pesos('1000000000'), 'todo', U.responsable, AHORA, 'K-1');
    expect(regla(() => p.registrarCosto(pesos('0.01'), 'extra', U.responsable, AHORA, 'K-2'))).toBe('R13');
  });
  it('C11: costos solo en ejecución, con valor > 0 y concepto', () => {
    expect(
      regla(() => unProyecto().build().registrarCosto(pesos('1'), 'x', U.responsable, AHORA, 'K-1')),
    ).toBe('C11');
    const p = enEjecucion();
    expect(regla(() => p.registrarCosto(pesos('0'), 'x', U.responsable, AHORA, 'K-1'))).toBe('C11');
    expect(regla(() => p.registrarCosto(pesos('1'), ' ', U.responsable, AHORA, 'K-1'))).toBe('C11');
  });
  it('R16: el historial de estados, presupuesto y avance solo crece', () => {
    const p = enEjecucion();
    const antes = p.aInstantanea();
    p.registrarAvance(pct(10), U.responsable, AHORA);
    p.solicitarCambioPresupuesto(pesos('1010000000'), 'x', U.responsable, politica, AHORA, 'C-1');
    p.suspender('pausa', U.responsable, AHORA);
    const despues = p.aInstantanea();
    expect(despues.historialEstados.slice(0, antes.historialEstados.length)).toEqual(antes.historialEstados);
    expect(despues.historialEstados.length).toBeGreaterThan(antes.historialEstados.length);
    expect(despues.avances.length).toBe(antes.avances.length + 1);
    expect(despues.cambiosPresupuesto.length).toBe(antes.cambiosPresupuesto.length + 1);
  });
  it('R16: las copias expuestas no permiten modificar el agregado', () => {
    const p = enEjecucion();
    (p.aInstantanea().historialEstados as unknown[]).push('x');
    (p.hitos as unknown[]).length = 0;
    expect(p.aInstantanea().historialEstados).toHaveLength(3);
    expect(p.hitos).toHaveLength(1);
  });
  it('avanceFinanciero: costosEjecutados / valorVigente × 100 a 2 decimales', () => {
    const p = enEjecucion();
    p.registrarCosto(pesos('333333333.33'), 'x', U.responsable, AHORA, 'K-1');
    expect(p.avanceFinanciero()).toBe(33.33);
  });
});

describe('hitos', () => {
  it('C08: en Formulado y Aprobado se agregan, editan y eliminan', () => {
    const p = unProyecto().conHito('2026-05-01').build();
    p.editarHito(
      'H-1',
      { nombre: 'Nuevo', fechaPlanificada: FechaCalendario.desde('2026-07-01') },
      U.responsable,
      AHORA,
    );
    expect(p.hitos[0]).toMatchObject({ nombre: 'Nuevo' });
    p.eliminarHito('H-1', U.responsable, AHORA);
    expect(p.hitos).toHaveLength(0);
  });
  it('C08: en ejecución solo se registra la fecha real', () => {
    const p = unProyecto().enEstado('EnEjecucion').conHito('2026-03-10').build();
    expect(regla(() => p.agregarHito('X', HOY, U.responsable, 'H-9', AHORA))).toBe('C08');
    expect(regla(() => p.eliminarHito('H-1', U.responsable, AHORA))).toBe('C08');
    expect(regla(() => p.editarHito('H-1', { nombre: 'Y' }, U.responsable, AHORA))).toBe('C08');
    p.registrarFechaRealHito('H-1', FechaCalendario.desde('2026-03-15'), U.responsable, AHORA);
    expect(p.hitos[0]?.desviacion()).toBe(5);
  });
  it('C08: en estados finales o suspendido no se modifican', () => {
    const p = unProyecto().enEstado('Suspendido').conHito().build();
    expect(regla(() => p.registrarFechaRealHito('H-1', HOY, U.responsable, AHORA))).toBe('C08');
  });
  it('C08: desviacion es null sin fecha real', () => {
    expect(unProyecto().conHito().build().hitos[0]?.desviacion()).toBeNull();
  });
  it('estaAtrasado: hito sin fecha real vencido; nunca en estados finales', () => {
    expect(unProyecto().conHito('2026-02-01').build().estaAtrasado(HOY)).toBe(true);
    expect(unProyecto().conHito('2026-06-01').build().estaAtrasado(HOY)).toBe(false);
    expect(unProyecto().enEstado('Finalizado').conHito('2026-02-01').build().estaAtrasado(HOY)).toBe(false);
    expect(unProyecto().enEstado('Cancelado').conHito('2026-02-01').build().estaAtrasado(HOY)).toBe(false);
  });
});

describe('evidencias', () => {
  const enEjecucion = () => unProyecto().enEstado('EnEjecucion').conHito().build();
  it('C09: solo en ejecución', () => {
    expect(regla(() => unProyecto().build().adjuntarEvidencia(evidencia(), AHORA))).toBe('C09');
    const p = enEjecucion();
    p.adjuntarEvidencia(evidencia('FOTOGRAFICA', { tipoMime: 'image/png' }), AHORA);
    expect(p.evidencias).toHaveLength(1);
  });
  it('C09: valida tipo de archivo y tamaño máximo de 10 MB', () => {
    const p = enEjecucion();
    expect(regla(() => p.adjuntarEvidencia(evidencia('ENTREGA', { tipoMime: 'text/plain' }), AHORA))).toBe(
      'C09',
    );
    expect(
      regla(() => p.adjuntarEvidencia(evidencia('ENTREGA', { tamanoBytes: 10 * 1024 * 1024 + 1 }), AHORA)),
    ).toBe('C09');
    expect(regla(() => p.adjuntarEvidencia(evidencia('OTRO' as never), AHORA))).toBe('C09');
  });
  it('C10: solo el responsable adjunta evidencias', () => {
    expect(
      regla(() => enEjecucion().adjuntarEvidencia(evidencia('ENTREGA', { autorId: U.otro }), AHORA)),
    ).toBe('C10');
  });
});

describe('reconstitución', () => {
  it('reconstituir no emite eventos y conserva el estado', () => {
    const p = unProyecto().enEstado('EnEjecucion').conHito().conAvance(20).build();
    const copia = ProyectoReconstruccion.reconstituir(p.aInstantanea());
    expect(copia.extraerEventos()).toEqual([]);
    expect(copia.aInstantanea()).toEqual(p.aInstantanea());
  });
});
