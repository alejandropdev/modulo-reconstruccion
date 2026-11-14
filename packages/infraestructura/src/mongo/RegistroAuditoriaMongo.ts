import type { EntradaAuditoria, RegistroAuditoria } from '@reconstruccion/aplicacion';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { opciones } from './ContextoSesion.js';

/** Solo inserta: la auditoría no se modifica ni se borra. */
export class RegistroAuditoriaMongo implements RegistroAuditoria {
  constructor(private readonly db: Db) {}

  async registrar(entrada: EntradaAuditoria): Promise<void> {
    await this.db
      .collection<{ _id: string }>('auditoria')
      .insertOne({ _id: randomUUID(), ...entrada }, opciones());
  }
}
