import { unProyecto } from '@reconstruccion/dominio/test';
import {
  Dinero,
  FechaCalendario,
  PoliticaAprobacionPresupuesto,
  Porcentaje,
  ProyectoReconstruccion,
  type InstantaneaProyecto,
} from '@reconstruccion/dominio';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import type { Db, MongoClient } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AlmacenEvidenciasGridFS,
  conectarMongo,
  crearIndices,
  ParametrosNegocioMongo,
  PublicadorOutboxMongo,
  RegistroAuditoriaMongo,
  RepositorioProyectosMongo,
  UnidadDeTrabajoMongo,
} from '../src/index.js';

let servidor: MongoMemoryReplSet;
let cliente: MongoClient;
let db: Db;
let repo: RepositorioProyectosMongo;
let n = 0;
const AHORA = new Date('2026-03-01T10:00:00Z');
const politica = new PoliticaAprobacionPresupuesto(Dinero.desde('50000000'));

beforeAll(async () => {
  servidor = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const c = await conectarMongo(servidor.getUri(), 'pruebas');
  cliente = c.cliente;
  db = c.db;
  await crearIndices(db);
  repo = new RepositorioProyectosMongo(db);
}, 180_000);

afterAll(async () => {
  await cliente?.close();
  await servidor?.stop();
});

/** Proyecto con una evaluación propia para no chocar con el índice único. */
function proyectoNuevo() {
  const evaluacionId = `E-${++n}`;
  return unProyecto().conReferencias([{ evaluacionId, activoId: `A-${n}`, nivelDano: 'SEVERO' }]);
}

/** Construye con el builder pero con un id propio, guardándolo vía reconstituir. */
function conId(p: ProyectoReconstruccion, id: string, version = 0): ProyectoReconstruccion {
  return ProyectoReconstruccion.reconstituir({ ...p.aInstantanea(), id, version });
}

describe('RepositorioProyectosMongo', () => {
  it('ida y vuelta del agregado completo (montos como Long, fechas de calendario, historiales)', async () => {
    const p = conId(
      proyectoNuevo().enEstado('EnEjecucion').conHito('2026-02-01').conHito('2026-08-01').build(),
      'ida-vuelta',
    );
    p.registrarAvance(Porcentaje.desde(33.33), 'u-resp', AHORA);
    p.registrarCosto(Dinero.desde('123456789.50'), 'cemento', 'u-resp', AHORA, 'K-1');
    p.solicitarCambioPresupuesto(Dinero.desde('1500000000'), 'ampliación', 'u-resp', politica, AHORA, 'C-1');
    p.adjuntarEvidencia(
      {
        id: 'EV-1',
        tipo: 'AVANCE',
        autorId: 'u-resp',
        archivoId: 'f1',
        nombreArchivo: 'a.pdf',
        tipoMime: 'application/pdf',
        tamanoBytes: 5,
      },
      AHORA,
    );
    p.registrarFechaRealHito('H-1', FechaCalendario.desde('2026-02-10'), 'u-resp', AHORA);
    await repo.guardar(p);

    const leido = await repo.obtener('ida-vuelta');
    expect(leido?.aInstantanea()).toEqual({ ...p.aInstantanea(), version: 1 });
    expect(leido?.valorVigente.centavos).toBe(100000000000n);
    expect(await repo.obtener('no-existe')).toBeNull();
  });

  it('ConflictoConcurrencia: guardar con una versión desactualizada', async () => {
    await repo.guardar(conId(proyectoNuevo().build(), 'conflicto'));
    const a = (await repo.obtener('conflicto'))!;
    const b = (await repo.obtener('conflicto'))!;
    a.aprobar('u-apr', AHORA);
    b.cancelar('motivo', 'u-aut', AHORA);
    await repo.guardar(a);
    await expect(repo.guardar(b)).rejects.toMatchObject({ codigo: 'CONFLICTO_CONCURRENCIA' });
  });

  it('R05: el índice único parcial rechaza dos inserciones concurrentes con la misma evaluación', async () => {
    const mismaEval = [{ evaluacionId: 'E-compartida', activoId: 'A-x', nivelDano: 'SEVERO' as const }];
    const crear = (id: string) => conId(unProyecto().conReferencias(mismaEval).build(), id);
    const resultados = await Promise.allSettled([repo.guardar(crear('r05-a')), repo.guardar(crear('r05-b'))]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rechazo.reason).toMatchObject({ codigo: 'EVALUACION_EN_PROYECTO_ACTIVO' });
    expect(await repo.evaluacionesEnProyectosActivos(['E-compartida', 'E-otra'])).toEqual(['E-compartida']);
  });

  it('R05: al cancelar el proyecto (activo = false) la evaluación se libera', async () => {
    const mismaEval = [{ evaluacionId: 'E-liberable', activoId: 'A-y', nivelDano: 'SEVERO' as const }];
    const p = conId(unProyecto().conReferencias(mismaEval).build(), 'liberable');
    await repo.guardar(p);
    const leido = (await repo.obtener('liberable'))!;
    leido.cancelar('motivo', 'u-aut', AHORA);
    await repo.guardar(leido);
    await repo.guardar(conId(unProyecto().conReferencias(mismaEval).build(), 'liberable-2'));
    expect(await repo.evaluacionesEnProyectosActivos(['E-liberable'])).toEqual(['E-liberable']);
  });

  it('R16: tras varias operaciones los arreglos de historial solo crecen', async () => {
    await repo.guardar(conId(proyectoNuevo().enEstado('Aprobado').conHito().build(), 'r16'));
    const tamanos: number[][] = [];
    const operaciones: ((p: ProyectoReconstruccion) => void)[] = [
      (p) => p.iniciarEjecucion('u-resp', AHORA),
      (p) => p.registrarAvance(Porcentaje.desde(10), 'u-resp', AHORA),
      (p) => p.solicitarCambioPresupuesto(Dinero.desde('1010000000'), 'x', 'u-resp', politica, AHORA, 'C-9'),
      (p) => p.suspender('pausa', 'u-resp', AHORA),
      (p) => p.reanudar('sigue', 'u-resp', AHORA),
      (p) => p.registrarAvance(Porcentaje.desde(20), 'u-resp', AHORA),
    ];
    for (const op of operaciones) {
      const p = (await repo.obtener('r16'))!;
      op(p);
      await repo.guardar(p);
      const i = (await repo.obtener('r16'))!.aInstantanea();
      tamanos.push([i.historialEstados.length, i.cambiosPresupuesto.length, i.avances.length]);
    }
    for (let k = 1; k < tamanos.length; k++) {
      tamanos[k]!.forEach((valor, j) => expect(valor).toBeGreaterThanOrEqual(tamanos[k - 1]![j]!));
    }
    expect(tamanos.at(-1)).toEqual([5, 1, 2]);
  });

  it('filtro atrasado: solo proyectos activos con hito vencido y sin fecha real', async () => {
    const atrasado = conId(proyectoNuevo().conHito('2026-01-15').build(), 'atrasado-si');
    const aTiempo = conId(proyectoNuevo().conHito('2026-12-31').build(), 'atrasado-no');
    const cumplido = conId(
      proyectoNuevo().enEstado('EnEjecucion').conHito('2026-01-15').build(),
      'atrasado-cumplido',
    );
    cumplido.registrarFechaRealHito('H-1', FechaCalendario.desde('2026-01-20'), 'u-resp', AHORA);
    for (const p of [atrasado, aTiempo, cumplido]) await repo.guardar(p);
    const { items } = await repo.buscar(
      { atrasadoAntesDe: FechaCalendario.desde('2026-03-01') },
      { pagina: 1, tamano: 100 },
    );
    const ids = items.map((i) => i.id);
    expect(ids).toContain('atrasado-si');
    expect(ids).not.toContain('atrasado-no');
    expect(ids).not.toContain('atrasado-cumplido');
  });

  it('buscar pagina y filtra por estado y responsable', async () => {
    const todos = await repo.buscar({ responsableId: 'u-resp' }, { pagina: 1, tamano: 2 });
    expect(todos.items).toHaveLength(2);
    expect(todos.total).toBeGreaterThan(2);
    const aprobados = await repo.buscar({ estado: 'Aprobado' }, { pagina: 1, tamano: 100 });
    expect(aprobados.items.every((p) => p.estado === 'Aprobado')).toBe(true);
    expect((await repo.listarPorDesastre('D-002')).length).toBeGreaterThan(0);
  });
});

describe('UnidadDeTrabajoMongo', () => {
  const uow = () => new UnidadDeTrabajoMongo(cliente);

  it('confirma agregado + auditoría + outbox juntos', async () => {
    const p = conId(proyectoNuevo().build(), 'uow-ok');
    await uow().ejecutar(async () => {
      await repo.guardar(p);
      await new RegistroAuditoriaMongo(db).registrar({
        usuarioId: 'u',
        operacion: 'Prueba',
        resultado: 'EXITO',
        fechaHora: AHORA,
        proyectoId: 'uow-ok',
      });
      await new PublicadorOutboxMongo(db).publicar([
        { tipo: 'ProyectoCreado', agregadoId: 'uow-ok', ocurridoEn: AHORA, datos: {} },
      ]);
    });
    expect(await repo.obtener('uow-ok')).not.toBeNull();
    expect(await db.collection('auditoria').countDocuments({ proyectoId: 'uow-ok' })).toBe(1);
    expect(await db.collection('outbox').countDocuments({ agregadoId: 'uow-ok', publicadoEn: null })).toBe(1);
  });

  it('la transacción revierte agregado + auditoría + outbox juntos si el trabajo falla', async () => {
    const p = conId(proyectoNuevo().build(), 'uow-falla');
    await expect(
      uow().ejecutar(async () => {
        await repo.guardar(p);
        await new RegistroAuditoriaMongo(db).registrar({
          usuarioId: 'u',
          operacion: 'Prueba',
          resultado: 'EXITO',
          fechaHora: AHORA,
          proyectoId: 'uow-falla',
        });
        await new PublicadorOutboxMongo(db).publicar([
          { tipo: 'ProyectoCreado', agregadoId: 'uow-falla', ocurridoEn: AHORA, datos: {} },
        ]);
        throw new Error('falla a propósito');
      }),
    ).rejects.toThrow('falla a propósito');
    expect(await repo.obtener('uow-falla')).toBeNull();
    expect(await db.collection('auditoria').countDocuments({ proyectoId: 'uow-falla' })).toBe(0);
    expect(await db.collection('outbox').countDocuments({ agregadoId: 'uow-falla' })).toBe(0);
  });
});

describe('otros adaptadores', () => {
  it('GridFS: guardar, abrir y eliminar', async () => {
    const almacen = new AlmacenEvidenciasGridFS(db);
    const id = await almacen.guardar(new Uint8Array([1, 2, 3, 4]), {
      proyectoId: 'p',
      autorId: 'u',
      tipo: 'ENTREGA',
      nombreArchivo: 'a.pdf',
      tipoMime: 'application/pdf',
    });
    const partes: Uint8Array[] = [];
    for await (const parte of await almacen.abrir(id)) partes.push(parte);
    expect(Buffer.concat(partes)).toEqual(Buffer.from([1, 2, 3, 4]));
    await almacen.eliminar(id);
    await expect(async () => {
      for await (const _ of await almacen.abrir(id)) void _;
    }).rejects.toThrow();
  });

  it('ParametrosNegocio: siembra el umbral una sola vez y lo lee como Dinero', async () => {
    const params = new ParametrosNegocioMongo(db, Dinero.desde('50000000'));
    await params.sembrar();
    await new ParametrosNegocioMongo(db, Dinero.desde('1')).sembrar();
    expect((await params.umbralCambioPresupuesto()).aTextoPesos()).toBe('50000000.00');
  });

  it('crearIndices es idempotente y crea el índice único parcial', async () => {
    await crearIndices(db);
    const indices = await db.collection('proyectos').indexes();
    expect(indices.find((i) => i.name === 'evaluacion_unica_en_proyecto_activo')).toMatchObject({
      unique: true,
      partialFilterExpression: { activo: true },
    });
  });
});

// Evita que TypeScript elimine el import de tipo usado solo en anotaciones.
export type _Instantanea = InstantaneaProyecto;
