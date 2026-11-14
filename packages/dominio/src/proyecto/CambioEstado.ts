import type { EstadoProyecto } from './EstadoProyecto.js';

export interface CambioEstado {
  readonly anterior: EstadoProyecto | null;
  readonly nuevo: EstadoProyecto;
  readonly motivo: string;
  readonly usuarioId: string;
  readonly fechaHora: Date;
}
