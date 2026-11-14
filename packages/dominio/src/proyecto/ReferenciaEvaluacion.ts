import type { NivelDano } from './NivelDano.js';

export interface ReferenciaEvaluacion {
  readonly evaluacionId: string;
  readonly activoId: string;
  readonly nivelDano: NivelDano;
}
