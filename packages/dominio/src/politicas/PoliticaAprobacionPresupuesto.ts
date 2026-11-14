import type { Dinero } from '../comun/Dinero.js';

/** C01: requiere aprobación si |valorNuevo − valorVigente| supera el umbral absoluto. */
export class PoliticaAprobacionPresupuesto {
  constructor(private readonly umbral: Dinero) {}

  requiereAprobacion(variacion: Dinero): boolean {
    return variacion.abs().mayorQue(this.umbral);
  }
}
