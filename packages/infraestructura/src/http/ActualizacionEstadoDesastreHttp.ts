import type { ActualizacionEstadoDesastre } from '@reconstruccion/aplicacion';
import { NoEncontrado, type EstadoDesastre } from '@reconstruccion/dominio';
import type { ClienteHttp } from './ClienteHttp.js';

export class ActualizacionEstadoDesastreHttp implements ActualizacionEstadoDesastre {
  constructor(private readonly http: ClienteHttp) {}

  async cambiarEstado(desastreId: string, nuevoEstado: EstadoDesastre): Promise<void> {
    const r = await this.http.solicitar('PATCH', `/desastres/${encodeURIComponent(desastreId)}/estado`, {
      estado: nuevoEstado,
    });
    if (r === null) throw new NoEncontrado(`No existe el desastre ${desastreId}.`);
  }
}
