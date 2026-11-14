import type { Dinero } from '@reconstruccion/dominio';

export interface ParametrosNegocio {
  umbralCambioPresupuesto(): Promise<Dinero>;
}
