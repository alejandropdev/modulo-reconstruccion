import { DatosInvalidos } from './ErrorDominio.js';

/** Dinero en centavos (bigint). Nunca se usa `number` para montos. */
export class Dinero {
  private constructor(readonly centavos: bigint) {}

  static desdeCentavos(centavos: bigint): Dinero {
    return new Dinero(centavos);
  }

  static cero(): Dinero {
    return new Dinero(0n);
  }

  /** Acepta pesos como texto: "2500000000" o "2500000000.50" (hasta 2 decimales). */
  static desde(texto: string): Dinero {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(texto.trim());
    if (!m) throw new DatosInvalidos(`Monto inválido: "${texto}"`);
    const pesos = BigInt(m[1] as string);
    const decimales = BigInt((m[2] ?? '').padEnd(2, '0') || '0');
    return new Dinero(pesos * 100n + decimales);
  }

  aTextoPesos(): string {
    const negativo = this.centavos < 0n;
    const abs = negativo ? -this.centavos : this.centavos;
    const pesos = abs / 100n;
    const centavos = (abs % 100n).toString().padStart(2, '0');
    return `${negativo ? '-' : ''}${pesos}.${centavos}`;
  }

  sumar(otro: Dinero): Dinero {
    return new Dinero(this.centavos + otro.centavos);
  }

  restar(otro: Dinero): Dinero {
    return new Dinero(this.centavos - otro.centavos);
  }

  abs(): Dinero {
    return new Dinero(this.centavos < 0n ? -this.centavos : this.centavos);
  }

  comparar(otro: Dinero): -1 | 0 | 1 {
    return this.centavos < otro.centavos ? -1 : this.centavos > otro.centavos ? 1 : 0;
  }

  igual(otro: Dinero): boolean {
    return this.centavos === otro.centavos;
  }

  mayorQue(otro: Dinero): boolean {
    return this.centavos > otro.centavos;
  }

  menorQue(otro: Dinero): boolean {
    return this.centavos < otro.centavos;
  }

  esPositivo(): boolean {
    return this.centavos > 0n;
  }
}
