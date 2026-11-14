import type { ConsultaDesastres, Desastre } from '@reconstruccion/aplicacion';
import type { ClienteHttp } from './ClienteHttp.js';

export class ConsultaDesastresHttp implements ConsultaDesastres {
  constructor(private readonly http: ClienteHttp) {}

  obtener(id: string): Promise<Desastre | null> {
    return this.http.solicitar<Desastre>('GET', `/desastres/${encodeURIComponent(id)}`);
  }

  async listar(): Promise<Desastre[]> {
    return (await this.http.solicitar<Desastre[]>('GET', '/desastres')) ?? [];
  }
}
