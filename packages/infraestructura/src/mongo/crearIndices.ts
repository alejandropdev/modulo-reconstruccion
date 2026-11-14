import type { Db } from 'mongodb';

/** Idempotente. Incluye el índice único parcial que garantiza R05 ante concurrencia. */
export async function crearIndices(db: Db): Promise<void> {
  const proyectos = db.collection('proyectos');
  await proyectos.createIndex({ desastreId: 1, estado: 1 });
  await proyectos.createIndex({ responsableId: 1 });
  await proyectos.createIndex({ 'hitos.fechaPlanificada': 1 });
  await proyectos.createIndex(
    { 'referenciasEvaluacion.evaluacionId': 1 },
    { unique: true, partialFilterExpression: { activo: true }, name: 'evaluacion_unica_en_proyecto_activo' },
  );
  await db.collection('outbox').createIndex({ publicadoEn: 1, ocurridoEn: 1 });
  await db.collection('usuarios').createIndex({ correo: 1 }, { unique: true });
}
