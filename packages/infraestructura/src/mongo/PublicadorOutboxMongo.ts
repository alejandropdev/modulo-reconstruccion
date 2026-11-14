import type { PublicadorEventosDominio } from '@reconstruccion/aplicacion';
import type { EventoDominio } from '@reconstruccion/dominio';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';
import { opciones } from './ContextoSesion.js';

/** Guarda los eventos en la colección `outbox`, dentro de la misma transacción del agregado. */
export class PublicadorOutboxMongo implements PublicadorEventosDominio {
  constructor(private readonly db: Db) {}

  async publicar(eventos: readonly EventoDominio[]): Promise<void> {
    if (eventos.length === 0) return;
    await this.db.collection<{ _id: string }>('outbox').insertMany(
      eventos.map((e) => ({
        _id: randomUUID(),
        tipo: e.tipo,
        agregadoId: e.agregadoId,
        datos: e.datos,
        ocurridoEn: e.ocurridoEn,
        publicadoEn: null,
        intentos: 0,
      })),
      opciones(),
    );
  }
}
