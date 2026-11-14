import type { EstadoDesastre } from '@reconstruccion/dominio';

export interface ActualizacionEstadoDesastre {
  cambiarEstado(desastreId: string, nuevoEstado: EstadoDesastre): Promise<void>;
}
