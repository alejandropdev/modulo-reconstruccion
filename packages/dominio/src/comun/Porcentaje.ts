import { DatosInvalidos } from './ErrorDominio.js';

/** Porcentaje de 0 a 100 con 2 decimales, guardado como entero en centésimas. */
export class Porcentaje {
  private constructor(private readonly centesimas: number) {}

  static readonly CERO = new Porcentaje(0);

  static desde(valor: number): Porcentaje {
    const c = Math.round(valor * 100);
    if (!Number.isFinite(valor) || Math.abs(valor * 100 - c) > 1e-6 || c < 0 || c > 10000) {
      throw new DatosInvalidos(
        `Porcentaje inválido: ${valor} (debe estar entre 0 y 100 con hasta 2 decimales)`,
      );
    }
    return new Porcentaje(c);
  }

  get valor(): number {
    return this.centesimas / 100;
  }

  menorQue(otro: Porcentaje): boolean {
    return this.centesimas < otro.centesimas;
  }

  esCien(): boolean {
    return this.centesimas === 10000;
  }
}
