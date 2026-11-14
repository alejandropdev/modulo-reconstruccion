import type { UnidadDeTrabajo } from '@reconstruccion/aplicacion';
import type { MongoClient } from 'mongodb';
import { ContextoSesion, sesionActual } from './ContextoSesion.js';

export class UnidadDeTrabajoMongo implements UnidadDeTrabajo {
  constructor(private readonly cliente: MongoClient) {}

  async ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    if (sesionActual()) return trabajo(); // ya hay una transacción: se reutiliza
    const sesion = this.cliente.startSession();
    try {
      return await sesion.withTransaction(() => ContextoSesion.run(sesion, trabajo));
    } finally {
      await sesion.endSession();
    }
  }
}
