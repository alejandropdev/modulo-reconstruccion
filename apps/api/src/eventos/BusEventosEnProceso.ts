import { Injectable } from '@nestjs/common';
import type { EventoDominio } from '@reconstruccion/dominio';

export type Suscriptor = (evento: EventoDominio) => void | Promise<void>;

/** Bus en proceso: el despachador del outbox emite aquí y los suscriptores reaccionan. */
@Injectable()
export class BusEventosEnProceso {
  private readonly suscriptores: Suscriptor[] = [];

  suscribir(suscriptor: Suscriptor): void {
    this.suscriptores.push(suscriptor);
  }

  async emitir(evento: EventoDominio): Promise<void> {
    for (const s of this.suscriptores) await s(evento);
  }
}
