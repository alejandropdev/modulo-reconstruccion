import type { Dinero } from '../comun/Dinero.js';
import type { EstadoCambioPresupuesto } from './EstadoCambioPresupuesto.js';

export interface CambioPresupuesto {
  readonly id: string;
  readonly valorAnterior: Dinero;
  readonly valorNuevo: Dinero;
  readonly motivo: string;
  readonly estado: EstadoCambioPresupuesto;
  readonly solicitanteId: string;
  readonly autorizanteId: string | null;
  readonly solicitadoEn: Date;
  readonly resueltoEn: Date | null;
  readonly motivoResolucion: string | null;
}
