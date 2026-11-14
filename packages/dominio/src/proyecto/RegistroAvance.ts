import type { Porcentaje } from '../comun/Porcentaje.js';

export interface RegistroAvance {
  readonly avanceFisico: Porcentaje;
  readonly usuarioId: string;
  readonly fechaHora: Date;
}
