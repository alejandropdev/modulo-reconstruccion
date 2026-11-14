import type { ConsultaEvaluaciones, Evaluacion } from '@reconstruccion/aplicacion';
import type { ClienteHttp } from './ClienteHttp.js';

export class ConsultaEvaluacionesHttp implements ConsultaEvaluaciones {
  constructor(private readonly http: ClienteHttp) {}

  async obtenerVarias(ids: readonly string[]): Promise<Evaluacion[]> {
    if (ids.length === 0) return [];
    return (
      (await this.http.solicitar<Evaluacion[]>(
        'GET',
        `/evaluaciones?ids=${ids.map(encodeURIComponent).join(',')}`,
      )) ?? []
    );
  }

  async listarPorDesastre(desastreId: string): Promise<Evaluacion[]> {
    return (
      (await this.http.solicitar<Evaluacion[]>(
        'GET',
        `/evaluaciones?desastreId=${encodeURIComponent(desastreId)}`,
      )) ?? []
    );
  }
}
