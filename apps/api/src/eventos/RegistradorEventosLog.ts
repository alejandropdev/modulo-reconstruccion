import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { BusEventosEnProceso } from './BusEventosEnProceso.js';

/** Suscriptor inicial: escribe cada evento como una línea de log estructurado. */
@Injectable()
export class RegistradorEventosLog implements OnModuleInit {
  private readonly log = new Logger('Eventos');

  constructor(@Inject(BusEventosEnProceso) private readonly bus: BusEventosEnProceso) {}

  onModuleInit(): void {
    this.bus.suscribir((e) =>
      this.log.log(
        JSON.stringify({ tipo: e.tipo, agregadoId: e.agregadoId, ocurridoEn: e.ocurridoEn, datos: e.datos }),
      ),
    );
  }
}
