import type { FechaCalendario } from '../comun/FechaCalendario.js';

export class Hito {
  constructor(
    readonly id: string,
    readonly nombre: string,
    readonly fechaPlanificada: FechaCalendario,
    readonly fechaReal: FechaCalendario | null = null,
  ) {}

  /** Días entre la fecha planificada y la real (positivo = atraso); null si no hay fecha real. */
  desviacion(): number | null {
    return this.fechaReal ? this.fechaReal.diferenciaEnDias(this.fechaPlanificada) : null;
  }
}
