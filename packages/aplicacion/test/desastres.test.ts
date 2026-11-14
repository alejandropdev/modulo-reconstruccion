import { unProyecto } from '@reconstruccion/dominio/test';
import { describe, expect, it } from 'vitest';
import {
  CerrarDesastre,
  ConsultarDesastres,
  ConsultarEvaluacionesElegibles,
  PasarAReconstruccion,
} from '../src/index.js';
import { codigo, crearEntorno, ejecutar, U } from './entorno.js';

describe('PasarAReconstruccion', () => {
  it('camino feliz: Caracterización → Reconstrucción, audita y publica el evento', async () => {
    const e = crearEntorno();
    const r = await ejecutar(new PasarAReconstruccion(e.puertos), {
      usuarioId: U.autoridad,
      desastreId: 'D-001',
    });
    expect(r.datos).toEqual({ desastreId: 'D-001', estado: 'RECONSTRUCCION' });
    expect(e.externos.desastres.get('D-001')?.estado).toBe('RECONSTRUCCION');
    expect(e.auditoria.registros).toMatchObject([
      { operacion: 'PasarAReconstruccion', desastreId: 'D-001', resultado: 'EXITO' },
    ]);
    expect(e.publicador.eventos.map((x) => x.tipo)).toEqual(['DesastrePasoAReconstruccion']);
  });
  it('R01: no se pasa directamente desde Registro', async () => {
    const e = crearEntorno();
    const r = await ejecutar(new PasarAReconstruccion(e.puertos), {
      usuarioId: U.autoridad,
      desastreId: 'D-003',
    });
    expect(codigo(r)).toBe('R01');
    expect(e.auditoria.registros[0]).toMatchObject({ resultado: 'RECHAZO', codigoError: 'R01' });
  });
  it('R02: exige una evaluación validada que requiera intervención', async () => {
    const e = crearEntorno();
    e.externos.desastres.set('D-004', {
      id: 'D-004',
      nombre: 'X',
      estado: 'CARACTERIZACION',
      municipio: 'M',
      fechaOcurrencia: '2026-01-01',
    });
    expect(
      codigo(
        await ejecutar(new PasarAReconstruccion(e.puertos), { usuarioId: U.autoridad, desastreId: 'D-004' }),
      ),
    ).toBe('R02');
  });
  it('NO_AUTORIZADO y NO_ENCONTRADO', async () => {
    const e = crearEntorno();
    const caso = new PasarAReconstruccion(e.puertos);
    expect(codigo(await ejecutar(caso, { usuarioId: U.responsable, desastreId: 'D-001' }))).toBe(
      'NO_AUTORIZADO',
    );
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-999' }))).toBe(
      'NO_ENCONTRADO',
    );
  });
  it('SERVICIO_EXTERNO_NO_DISPONIBLE: si falla la actualización, no queda auditoría de éxito', async () => {
    const e = crearEntorno();
    e.externos.caido = true;
    expect(
      codigo(
        await ejecutar(new PasarAReconstruccion(e.puertos), { usuarioId: U.autoridad, desastreId: 'D-001' }),
      ),
    ).toBe('SERVICIO_EXTERNO_NO_DISPONIBLE');
    expect(e.auditoria.registros.every((x) => x.resultado === 'RECHAZO')).toBe(true);
  });
});

describe('CerrarDesastre', () => {
  it('R03: no se cierra con proyectos sin finalizar o cancelar', async () => {
    const e = crearEntorno();
    e.repositorio.sembrar(unProyecto().enEstado('EnEjecucion').conHito().build());
    const r = await ejecutar(new CerrarDesastre(e.puertos), { usuarioId: U.autoridad, desastreId: 'D-002' });
    expect(codigo(r)).toBe('R03');
  });
  it('camino feliz: con todos los proyectos finalizados o cancelados se cierra', async () => {
    const e = crearEntorno();
    e.repositorio.sembrar(unProyecto().enEstado('Finalizado').conHito().build());
    const r = await ejecutar(new CerrarDesastre(e.puertos), { usuarioId: U.autoridad, desastreId: 'D-002' });
    expect(r.datos?.estado).toBe('CERRADO');
    expect(e.publicador.eventos.map((x) => x.tipo)).toEqual(['DesastreCerrado']);
  });
  it('C15: sin proyectos se puede cerrar, pero solo desde Reconstrucción', async () => {
    const e = crearEntorno();
    const caso = new CerrarDesastre(e.puertos);
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-001' }))).toBe('C15');
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-002' }))).toBe('EXITO');
  });
  it('NO_AUTORIZADO y NO_ENCONTRADO', async () => {
    const e = crearEntorno();
    const caso = new CerrarDesastre(e.puertos);
    expect(codigo(await ejecutar(caso, { usuarioId: U.aprobador, desastreId: 'D-002' }))).toBe(
      'NO_AUTORIZADO',
    );
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-999' }))).toBe(
      'NO_ENCONTRADO',
    );
  });
});

describe('consultas de desastres', () => {
  it('ConsultarDesastres lista todos los desastres para cualquier usuario activo', async () => {
    const e = crearEntorno();
    const r = await ejecutar(new ConsultarDesastres(e.puertos), { usuarioId: U.responsable });
    expect(r.datos?.desastres).toHaveLength(3);
    expect(codigo(await ejecutar(new ConsultarDesastres(e.puertos), { usuarioId: 'nadie' }))).toBe(
      'NO_AUTORIZADO',
    );
  });
  it('ConsultarEvaluacionesElegibles: solo validadas, con intervención y no usadas en proyectos activos', async () => {
    const e = crearEntorno();
    const caso = new ConsultarEvaluacionesElegibles(e.puertos);
    let r = await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-002' });
    expect(r.datos?.evaluaciones.map((x) => x.id)).toEqual(['E-1', 'E-2']);
    e.repositorio.sembrar(unProyecto().enEstado('EnEjecucion').conHito().build()); // usa E-1
    r = await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-002' });
    expect(r.datos?.evaluaciones.map((x) => x.id)).toEqual(['E-2']);
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, desastreId: 'D-999' }))).toBe(
      'NO_ENCONTRADO',
    );
  });
});
