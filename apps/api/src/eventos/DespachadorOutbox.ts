import { Inject, Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import type { EventoDominio } from '@reconstruccion/dominio';
import type { ConexionMongo } from '@reconstruccion/infraestructura';
import { CONEXION } from '../tokens.js';
import { BusEventosEnProceso } from './BusEventosEnProceso.js';

interface DocumentoOutbox extends EventoDominio {
  _id: string;
  publicadoEn: Date | null;
  intentos: number;
}

/** Cada 1 s lee hasta 50 eventos sin publicar, los emite en el bus y los marca como publicados. */
@Injectable()
export class DespachadorOutbox implements OnModuleInit, OnApplicationShutdown {
  private readonly log = new Logger('Outbox');
  private temporizador: NodeJS.Timeout | undefined;
  private ocupado = false;

  constructor(
    @Inject(CONEXION) private readonly conexion: ConexionMongo,
    @Inject(BusEventosEnProceso) private readonly bus: BusEventosEnProceso,
  ) {}

  onModuleInit(): void {
    this.temporizador = setInterval(() => void this.despachar(), 1000);
  }

  onApplicationShutdown(): void {
    clearInterval(this.temporizador);
  }

  async despachar(): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    try {
      const coleccion = this.conexion.db.collection<DocumentoOutbox>('outbox');
      const pendientes = await coleccion
        .find({ publicadoEn: null })
        .sort({ ocurridoEn: 1 })
        .limit(50)
        .toArray();
      for (const evento of pendientes) {
        try {
          await this.bus.emitir(evento);
          await coleccion.updateOne({ _id: evento._id }, { $set: { publicadoEn: new Date() } });
        } catch (e) {
          this.log.warn(`Falló el evento ${evento._id}; se reintenta: ${(e as Error).message}`);
          await coleccion.updateOne({ _id: evento._id }, { $inc: { intentos: 1 } });
        }
      }
    } catch (e) {
      this.log.error(e);
    } finally {
      this.ocupado = false;
    }
  }
}
