import type { Dinero } from '../comun/Dinero.js';

export interface Presupuesto {
  readonly valorVigente: Dinero;
  readonly fuenteFinanciacion: string;
  readonly costosEjecutados: Dinero;
}
