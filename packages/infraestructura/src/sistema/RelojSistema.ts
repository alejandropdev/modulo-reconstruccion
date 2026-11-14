import type { Reloj } from '@reconstruccion/aplicacion';
import { FechaCalendario } from '@reconstruccion/dominio';

export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }

  /** Fecha de hoy en America/Bogota (formato en-CA = YYYY-MM-DD). */
  hoy(): FechaCalendario {
    return FechaCalendario.desde(
      new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(this.ahora()),
    );
  }
}
