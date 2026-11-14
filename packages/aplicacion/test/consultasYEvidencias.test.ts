import { unProyecto } from '@reconstruccion/dominio/test';
import { describe, expect, it } from 'vitest';
import {
  ActualizarHito,
  AdjuntarEvidencia,
  ConsultarProyectos,
  ObtenerArchivoEvidencia,
} from '../src/index.js';
import { codigo, crearEntorno, ejecutar, U } from './entorno.js';

describe('ConsultarProyectos', () => {
  it('devuelve el detalle con historial, avances y cálculos', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito('2026-02-01').conAvance(40).build();
    e.repositorio.sembrar(p);
    const r = await ejecutar(new ConsultarProyectos(e.puertos), { usuarioId: U.aprobador, proyectoId: p.id });
    expect(r.datos?.tipo).toBe('DETALLE');
    if (r.datos?.tipo !== 'DETALLE') return;
    expect(r.datos.detalle).toMatchObject({
      avanceFisico: 40,
      avanceFinanciero: 0,
      estaAtrasado: true,
      estado: 'EnEjecucion',
      valorVigente: '1000000000.00',
    });
    expect(r.datos.detalle.historialEstados).toHaveLength(3);
  });
  it('lista paginada con filtros (estado y atrasado)', async () => {
    const e = crearEntorno();
    e.repositorio.sembrar(unProyecto().conHito('2026-02-01').build());
    const otro = unProyecto().enEstado('EnEjecucion').conHito('2026-12-01').build();
    e.repositorio.sembrar(otro);
    const caso = new ConsultarProyectos(e.puertos);
    const todos = await ejecutar(caso, { usuarioId: U.autoridad });
    expect(todos.datos).toMatchObject({ tipo: 'LISTA', total: 1, pagina: 1, tamano: 20 });
    expect(codigo(await ejecutar(caso, { usuarioId: U.autoridad, proyectoId: 'x' }))).toBe('NO_ENCONTRADO');
  });
  it('NO_AUTORIZADO: usuario inexistente', async () => {
    const e = crearEntorno();
    expect(codigo(await ejecutar(new ConsultarProyectos(e.puertos), { usuarioId: 'nadie' }))).toBe(
      'NO_AUTORIZADO',
    );
  });
});

describe('ActualizarHito', () => {
  it('C08: en ejecución registra la fecha real; editar la fecha planificada se rechaza', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito('2026-03-10').build();
    e.repositorio.sembrar(p);
    const caso = new ActualizarHito(e.puertos);
    const base = { usuarioId: U.responsable, proyectoId: p.id, accion: 'EDITAR', hitoId: 'H-1' } as const;
    expect(codigo(await ejecutar(caso, { ...base, fechaPlanificada: '2026-04-01' }))).toBe('C08');
    expect(codigo(await ejecutar(caso, { ...base, fechaReal: '2026-03-15' }))).toBe('EXITO');
    expect(codigo(await ejecutar(caso, { ...base, accion: 'ELIMINAR' }))).toBe('C08');
  });
  it('C08: en Formulado se edita y elimina', async () => {
    const e = crearEntorno();
    const p = unProyecto().conHito().build();
    e.repositorio.sembrar(p);
    const caso = new ActualizarHito(e.puertos);
    const u = { usuarioId: U.responsable, proyectoId: p.id };
    expect(codigo(await ejecutar(caso, { ...u, accion: 'EDITAR', hitoId: 'H-1', nombre: 'Nuevo' }))).toBe(
      'EXITO',
    );
    expect(codigo(await ejecutar(caso, { ...u, accion: 'ELIMINAR', hitoId: 'H-1' }))).toBe('EXITO');
    expect(codigo(await ejecutar(caso, { ...u, accion: 'ELIMINAR', hitoId: 'H-1' }))).toBe('NO_ENCONTRADO');
  });
});

describe('evidencias', () => {
  const entrada = (proyectoId: string, extra = {}) => ({
    usuarioId: U.responsable,
    proyectoId,
    tipo: 'ENTREGA',
    nombreArchivo: 'acta.pdf',
    tipoMime: 'application/pdf',
    contenido: new Uint8Array([1, 2, 3]),
    ...extra,
  });

  it('C09: guarda el archivo, lo referencia en el proyecto y se puede descargar', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito().build();
    e.repositorio.sembrar(p);
    const r = await ejecutar(new AdjuntarEvidencia(e.puertos), entrada(p.id));
    expect(e.almacen.archivos.size).toBe(1);
    const d = await ejecutar(new ObtenerArchivoEvidencia(e.puertos), {
      usuarioId: U.aprobador,
      proyectoId: p.id,
      evidenciaId: r.datos!.evidenciaId,
    });
    const partes: Uint8Array[] = [];
    for await (const parte of d.datos!.contenido) partes.push(parte);
    expect(partes[0]).toEqual(new Uint8Array([1, 2, 3]));
    expect(d.datos).toMatchObject({ nombreArchivo: 'acta.pdf', tipoMime: 'application/pdf' });
  });
  it('C09: archivo inválido (tipo, tamaño) se rechaza sin guardar nada en el almacén', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito().build();
    e.repositorio.sembrar(p);
    const caso = new AdjuntarEvidencia(e.puertos);
    expect(codigo(await ejecutar(caso, entrada(p.id, { tipoMime: 'text/plain' })))).toBe('C09');
    expect(
      codigo(await ejecutar(caso, entrada(p.id, { contenido: new Uint8Array(10 * 1024 * 1024 + 1) }))),
    ).toBe('C09');
    expect(e.almacen.archivos.size).toBe(0);
  });
  it('compensación: si falla la transacción se elimina el archivo guardado', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito().build();
    e.repositorio.sembrar(p);
    e.publicador.falla = true;
    await expect(
      new AdjuntarEvidencia(e.puertos).ejecutar(entrada(p.id), { exito: () => {}, error: () => {} }),
    ).rejects.toThrow();
    expect(e.almacen.archivos.size).toBe(0);
  });
  it('NO_ENCONTRADO: evidencia inexistente', async () => {
    const e = crearEntorno();
    const p = unProyecto().enEstado('EnEjecucion').conHito().build();
    e.repositorio.sembrar(p);
    const r = await ejecutar(new ObtenerArchivoEvidencia(e.puertos), {
      usuarioId: U.aprobador,
      proyectoId: p.id,
      evidenciaId: 'nada',
    });
    expect(codigo(r)).toBe('NO_ENCONTRADO');
  });
});
