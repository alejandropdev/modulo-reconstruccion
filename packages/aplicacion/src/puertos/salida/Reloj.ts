import type { FechaCalendario } from '@reconstruccion/dominio';

export interface Reloj {
  ahora(): Date;
  /** Fecha de hoy en America/Bogota. */
  hoy(): FechaCalendario;
}
