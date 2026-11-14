import { unProyecto } from '@reconstruccion/dominio/test';
import { Dinero, PoliticaAprobacionPresupuesto, type ProyectoReconstruccion } from '@reconstruccion/dominio';
import { describe, expect, it } from 'vitest';
import {
  ActualizarHito,
  AdjuntarEvidencia,
  AprobarProyecto,
  CancelarProyecto,
  FinalizarProyecto,
  IniciarEjecucion,
  ReanudarProyecto,
  RegistrarAvance,
  RegistrarCosto,
  ResolverCambioPresupuesto,
  SolicitarCambioPresupuesto,
  SuspenderProyecto,
  type CasoDeUso,
} from '../src/index.js';
import { codigo, crearEntorno, ejecutar, U } from './entorno.js';

type Constructor = new (p: ReturnType<typeof crearEntorno>['puertos']) => CasoDeUso<never, unknown>;
type Builder = ReturnType<typeof unProyecto>;

interface Caso {
  nombre: string;
  clase: Constructor;
  usuario: string;
  usuarioSinRol: string;
  entrada: (extra: object) => object;
  listo: () => Builder;
  /** Estado del proyecto en que la operación viola una regla, y la regla esperada. */
  invalido: () => Builder;
  esperado: string;
  preparar?: (p: ProyectoReconstruccion) => void;
}

const pendiente = (p: ProyectoReconstruccion): void => {
  p.solicitarCambioPresupuesto(
    Dinero.desde('1100000000'),
    'ampliación',
    U.responsable,
    new PoliticaAprobacionPresupuesto(Dinero.desde('50000000')),
    new Date('2026-03-01T10:00:00Z'),
    'C-1',
  );
};
const enEjecucion = () => unProyecto().enEstado('EnEjecucion').conHito();

const casos: Caso[] = [
  {
    nombre: 'AprobarProyecto',
    clase: AprobarProyecto,
    usuario: U.aprobador,
    usuarioSinRol: U.responsable,
    entrada: (e) => ({ ...e }),
    listo: () => unProyecto(),
    invalido: () => unProyecto().enEstado('Finalizado').conHito(),
    esperado: 'R17',
  },
  {
    nombre: 'IniciarEjecucion',
    clase: IniciarEjecucion,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e }),
    listo: () => unProyecto().enEstado('Aprobado').conHito(),
    invalido: () => unProyecto().enEstado('Aprobado'),
    esperado: 'R08',
  },
  {
    nombre: 'SuspenderProyecto',
    clase: SuspenderProyecto,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e, motivo: 'lluvias' }),
    listo: enEjecucion,
    invalido: () => unProyecto().enEstado('Aprobado'),
    esperado: 'R17',
  },
  {
    nombre: 'ReanudarProyecto',
    clase: ReanudarProyecto,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e, motivo: 'listo' }),
    listo: () => unProyecto().enEstado('Suspendido').conHito(),
    invalido: enEjecucion,
    esperado: 'R17',
  },
  {
    nombre: 'FinalizarProyecto',
    clase: FinalizarProyecto,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e }),
    listo: () => enEjecucion().conAvance(100).conEvidenciaEntrega(),
    invalido: () => enEjecucion().conAvance(50),
    esperado: 'R09',
  },
  {
    nombre: 'CancelarProyecto',
    clase: CancelarProyecto,
    usuario: U.autoridad,
    usuarioSinRol: U.responsable,
    entrada: (e) => ({ ...e, motivo: 'sin fondos' }),
    listo: () => unProyecto(),
    invalido: () => unProyecto().enEstado('Finalizado').conHito(),
    esperado: 'R17',
  },
  {
    nombre: 'SolicitarCambioPresupuesto',
    clase: SolicitarCambioPresupuesto,
    usuario: U.responsable,
    usuarioSinRol: U.autoridad,
    entrada: (e) => ({ ...e, valorNuevo: '1010000000', motivo: 'ajuste' }),
    listo: enEjecucion,
    invalido: () => unProyecto().enEstado('Suspendido').conHito(),
    esperado: 'C04',
  },
  {
    nombre: 'ResolverCambioPresupuesto',
    clase: ResolverCambioPresupuesto,
    usuario: U.aprobador,
    usuarioSinRol: U.responsable,
    entrada: (e) => ({ ...e, cambioId: 'C-1', decision: 'APROBAR' }),
    listo: enEjecucion,
    preparar: pendiente,
    invalido: () => unProyecto().enEstado('Cancelado'),
    esperado: 'C04',
  },
  {
    nombre: 'RegistrarAvance',
    clase: RegistrarAvance,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e, porcentaje: 10 }),
    listo: enEjecucion,
    invalido: () => unProyecto().enEstado('Aprobado').conHito(),
    esperado: 'R14',
  },
  {
    nombre: 'RegistrarCosto',
    clase: RegistrarCosto,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e, valor: '1000', concepto: 'cemento' }),
    listo: enEjecucion,
    invalido: () => unProyecto().enEstado('Aprobado').conHito(),
    esperado: 'C11',
  },
  {
    nombre: 'ActualizarHito',
    clase: ActualizarHito,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({ ...e, accion: 'AGREGAR', nombre: 'Cimientos', fechaPlanificada: '2026-09-01' }),
    listo: () => unProyecto(),
    invalido: enEjecucion,
    esperado: 'C08',
  },
  {
    nombre: 'AdjuntarEvidencia',
    clase: AdjuntarEvidencia,
    usuario: U.responsable,
    usuarioSinRol: U.aprobador,
    entrada: (e) => ({
      ...e,
      tipo: 'AVANCE',
      nombreArchivo: 'a.pdf',
      tipoMime: 'application/pdf',
      contenido: new Uint8Array(10),
    }),
    listo: enEjecucion,
    invalido: () => unProyecto(),
    esperado: 'C09',
  },
];

describe.each(casos)('$nombre (contrato común de los interactores)', (c) => {
  const preparar = (b: Builder, valido = true) => {
    const e = crearEntorno();
    const p = b.build();
    if (valido) c.preparar?.(p);
    e.repositorio.sembrar(p);
    return { e, p, caso: new c.clase(e.puertos) as CasoDeUso<object, unknown> };
  };

  it('camino feliz: guarda, audita el éxito y publica eventos', async () => {
    const { e, p, caso } = preparar(c.listo());
    const r = await ejecutar(caso, c.entrada({ usuarioId: c.usuario, proyectoId: p.id }));
    expect(codigo(r)).toBe('EXITO');
    expect(e.repositorio.datos.get(p.id)?.version).toBe(2);
    expect(e.auditoria.registros).toMatchObject([
      { operacion: c.nombre, resultado: 'EXITO', usuarioId: c.usuario, proyectoId: p.id },
    ]);
    expect(e.publicador.eventos.length).toBeGreaterThan(0);
  });

  it('NO_AUTORIZADO: rol incorrecto, sin cambios y con auditoría de rechazo', async () => {
    const { e, p, caso } = preparar(c.listo());
    const r = await ejecutar(caso, c.entrada({ usuarioId: c.usuarioSinRol, proyectoId: p.id }));
    expect(codigo(r)).toBe('NO_AUTORIZADO');
    expect(e.repositorio.datos.get(p.id)?.version).toBe(1);
    expect(e.auditoria.registros).toMatchObject([{ resultado: 'RECHAZO', codigoError: 'NO_AUTORIZADO' }]);
    expect(e.publicador.eventos).toHaveLength(0);
  });

  it('NO_AUTORIZADO: usuario inexistente o inactivo', async () => {
    const { e, p, caso } = preparar(c.listo());
    e.directorio.agregar('u-inactivo', ['AUTORIDAD', 'APROBADOR', 'RESPONSABLE'], false);
    expect(codigo(await ejecutar(caso, c.entrada({ usuarioId: 'u-fantasma', proyectoId: p.id })))).toBe(
      'NO_AUTORIZADO',
    );
    expect(codigo(await ejecutar(caso, c.entrada({ usuarioId: 'u-inactivo', proyectoId: p.id })))).toBe(
      'NO_AUTORIZADO',
    );
  });

  it('NO_ENCONTRADO: el proyecto no existe', async () => {
    const { e, caso } = preparar(c.listo());
    const r = await ejecutar(caso, c.entrada({ usuarioId: c.usuario, proyectoId: 'no-existe' }));
    expect(codigo(r)).toBe('NO_ENCONTRADO');
    expect(e.auditoria.registros[0]?.resultado).toBe('RECHAZO');
  });

  it(`${c.esperado}: la regla violada la hace cumplir la entidad y se audita el rechazo`, async () => {
    const { e, p, caso } = preparar(c.invalido(), false);
    const r = await ejecutar(caso, c.entrada({ usuarioId: c.usuario, proyectoId: p.id }));
    expect(codigo(r)).toBe(c.esperado);
    expect(e.auditoria.registros).toMatchObject([{ resultado: 'RECHAZO', codigoError: c.esperado }]);
    expect(e.repositorio.datos.get(p.id)?.version).toBe(1);
  });

  it('atomicidad: si falla la publicación se revierte el agregado y la auditoría', async () => {
    const { e, p, caso } = preparar(c.listo());
    e.publicador.falla = true;
    await expect(
      caso.ejecutar(c.entrada({ usuarioId: c.usuario, proyectoId: p.id }), {
        exito: () => {},
        error: () => {},
      }),
    ).rejects.toThrow('fallo al publicar');
    expect(e.repositorio.datos.get(p.id)?.version).toBe(1);
    expect(e.auditoria.registros).toHaveLength(0);
    if (c.nombre === 'AdjuntarEvidencia') expect(e.almacen.archivos.size).toBe(0);
  });
});
