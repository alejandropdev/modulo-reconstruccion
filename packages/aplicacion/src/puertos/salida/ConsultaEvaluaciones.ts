import type { NivelDano } from '@reconstruccion/dominio';

export interface Evaluacion {
  readonly id: string;
  readonly desastreId: string;
  readonly activoId: string;
  readonly nivelDano: NivelDano;
  readonly estado: 'BORRADOR' | 'VALIDADA';
  readonly requiereIntervencion: boolean;
}

export interface ConsultaEvaluaciones {
  obtenerVarias(ids: readonly string[]): Promise<Evaluacion[]>;
  listarPorDesastre(desastreId: string): Promise<Evaluacion[]>;
}
