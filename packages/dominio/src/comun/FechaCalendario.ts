import { DatosInvalidos } from './ErrorDominio.js';

const MS_DIA = 86_400_000;

/** Fecha sin hora, formato YYYY-MM-DD. */
export class FechaCalendario {
  private constructor(readonly texto: string) {}

  static desde(texto: string): FechaCalendario {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
    const ms = m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : Number.NaN;
    if (!m || Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== texto) {
      throw new DatosInvalidos(`Fecha inválida: "${texto}" (formato YYYY-MM-DD)`);
    }
    return new FechaCalendario(texto);
  }

  private get ms(): number {
    return Date.parse(`${this.texto}T00:00:00Z`);
  }

  /** Días desde `otra` hasta esta fecha (positivo si esta es posterior). */
  diferenciaEnDias(otra: FechaCalendario): number {
    return Math.round((this.ms - otra.ms) / MS_DIA);
  }

  menorQue(otra: FechaCalendario): boolean {
    return this.texto < otra.texto;
  }

  igual(otra: FechaCalendario): boolean {
    return this.texto === otra.texto;
  }
}
