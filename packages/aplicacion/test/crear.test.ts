import { describe, expect, it } from 'vitest';
import { CrearProyecto, CrearProyectosMasivo, type EntradaCrearProyecto } from '../src/index.js';
import { codigo, crearEntorno, ejecutar, U } from './entorno.js';

const base: EntradaCrearProyecto = {
  usuarioId: U.autoridad,
  desastreId: 'D-002',
  tipoIntervencion: 'RECONSTRUCCION',
  evaluacionIds: ['E-1'],
  presupuesto: '2500000000.00',
  fuenteFinanciacion: 'SGR',
  responsableId: U.responsable,
};

describe('CrearProyecto', () => {
  it('camino feliz: crea el proyecto con la referencia a la evaluación, audita y publica ProyectoCreado', async () => {
    const e = crearEntorno();
    const r = await ejecutar(new CrearProyecto(e.puertos), base);
    expect(codigo(r)).toBe('EXITO');
    const guardado = e.repositorio.datos.get(r.datos!.proyectoId)!;
    expect(guardado.referenciasEvaluacion).toEqual([
      { evaluacionId: 'E-1', activoId: 'A-1', nivelDano: 'SEVERO' },
    ]);
    expect(guardado.estado).toBe('Formulado');
    expect(e.auditoria.registros).toMatchObject([{ operacion: 'CrearProyecto', resultado: 'EXITO' }]);
    expect(e.publicador.eventos.map((x) => x.tipo)).toEqual(['ProyectoCreado']);
  });

  it('NO_AUTORIZADO: solo la AUTORIDAD crea proyectos', async () => {
    const e = crearEntorno();
    expect(codigo(await ejecutar(new CrearProyecto(e.puertos), { ...base, usuarioId: U.aprobador }))).toBe(
      'NO_AUTORIZADO',
    );
    expect(e.auditoria.registros[0]).toMatchObject({ resultado: 'RECHAZO', codigoError: 'NO_AUTORIZADO' });
  });

  it('NO_ENCONTRADO: desastre o evaluación inexistente', async () => {
    const e = crearEntorno();
    const caso = new CrearProyecto(e.puertos);
    expect(codigo(await ejecutar(caso, { ...base, desastreId: 'D-999' }))).toBe('NO_ENCONTRADO');
    expect(codigo(await ejecutar(caso, { ...base, evaluacionIds: ['E-999'] }))).toBe('NO_ENCONTRADO');
  });

  it('C06: el desastre debe estar en Reconstrucción y las evaluaciones validadas, con intervención y del desastre', async () => {
    const e = crearEntorno();
    const caso = new CrearProyecto(e.puertos);
    expect(codigo(await ejecutar(caso, { ...base, desastreId: 'D-001', evaluacionIds: ['E-5'] }))).toBe(
      'C06',
    );
    for (const malas of [['E-3'], ['E-4'], ['E-5']]) {
      expect(codigo(await ejecutar(caso, { ...base, evaluacionIds: malas }))).toBe('C06');
    }
    expect(codigo(await ejecutar(caso, { ...base, evaluacionIds: ['E-1', 'E-1'] }))).toBe('C06');
  });

  it('R04: sin evaluaciones no se crea el proyecto', async () => {
    const e = crearEntorno();
    expect(codigo(await ejecutar(new CrearProyecto(e.puertos), { ...base, evaluacionIds: [] }))).toBe('R04');
  });

  it('R05: una evaluación no puede estar en dos proyectos activos', async () => {
    const e = crearEntorno();
    const caso = new CrearProyecto(e.puertos);
    await ejecutar(caso, base);
    const r = await ejecutar(caso, base);
    expect(r.fallo?.codigo).toBe('EVALUACION_EN_PROYECTO_ACTIVO');
    expect(e.repositorio.datos.size).toBe(1);
  });

  it('R05: al cancelar el proyecto la evaluación vuelve a estar disponible', async () => {
    const e = crearEntorno();
    const caso = new CrearProyecto(e.puertos);
    const r = await ejecutar(caso, base);
    const id = r.datos!.proyectoId;
    e.repositorio.datos.set(id, { ...e.repositorio.datos.get(id)!, activo: false });
    expect(codigo(await ejecutar(caso, base))).toBe('EXITO');
  });

  it('R06: el responsable debe existir, estar activo y tener rol RESPONSABLE; presupuesto > 0', async () => {
    const e = crearEntorno();
    const caso = new CrearProyecto(e.puertos);
    expect(codigo(await ejecutar(caso, { ...base, responsableId: U.aprobador }))).toBe('R06');
    expect(codigo(await ejecutar(caso, { ...base, responsableId: 'nadie' }))).toBe('R06');
    expect(codigo(await ejecutar(caso, { ...base, presupuesto: '0' }))).toBe('R06');
  });

  it('C05: el tipo de intervención debe corresponder al nivel de daño', async () => {
    const e = crearEntorno();
    expect(
      codigo(await ejecutar(new CrearProyecto(e.puertos), { ...base, tipoIntervencion: 'REPARACION' })),
    ).toBe('C05');
  });

  it('DATOS_INVALIDOS: monto mal formado', async () => {
    const e = crearEntorno();
    expect(codigo(await ejecutar(new CrearProyecto(e.puertos), { ...base, presupuesto: '12,5' }))).toBe(
      'DATOS_INVALIDOS',
    );
  });

  it('SERVICIO_EXTERNO_NO_DISPONIBLE: si el módulo de desastres está caído', async () => {
    const e = crearEntorno();
    e.externos.caido = true;
    expect(codigo(await ejecutar(new CrearProyecto(e.puertos), base))).toBe('SERVICIO_EXTERNO_NO_DISPONIBLE');
  });
});

describe('CrearProyectosMasivo', () => {
  it('C07: crea los válidos y reporta por ítem; el segundo con la misma evaluación falla por R05', async () => {
    const e = crearEntorno();
    const { usuarioId: _u, ...item } = base;
    const r = await ejecutar(new CrearProyectosMasivo(e.puertos), {
      usuarioId: U.autoridad,
      proyectos: [
        item,
        item,
        { ...item, evaluacionIds: ['E-2'], tipoIntervencion: 'REPARACION' },
        { ...item, evaluacionIds: ['E-3'] },
      ],
    });
    const res = r.datos!.resultados;
    expect(res.map((x) => x.exito)).toEqual([true, false, true, false]);
    expect(res[1]?.errores?.[0]?.codigo).toBe('EVALUACION_EN_PROYECTO_ACTIVO');
    expect(res[3]?.errores?.[0]?.regla).toBe('C06');
    expect(res[0]?.proyectoId).toBeDefined();
    expect(e.repositorio.datos.size).toBe(2);
  });

  it('C07: acepta hasta 100 proyectos', async () => {
    const e = crearEntorno();
    const { usuarioId: _u, ...item } = base;
    const r = await ejecutar(new CrearProyectosMasivo(e.puertos), {
      usuarioId: U.autoridad,
      proyectos: Array(101).fill(item),
    });
    expect(codigo(r)).toBe('C07');
    expect(
      codigo(await ejecutar(new CrearProyectosMasivo(e.puertos), { usuarioId: U.autoridad, proyectos: [] })),
    ).toBe('C07');
  });

  it('NO_AUTORIZADO: solo la AUTORIDAD', async () => {
    const e = crearEntorno();
    expect(
      codigo(
        await ejecutar(new CrearProyectosMasivo(e.puertos), { usuarioId: U.responsable, proyectos: [] }),
      ),
    ).toBe('NO_AUTORIZADO');
  });
});
