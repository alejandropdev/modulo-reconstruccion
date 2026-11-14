import type { TipoEvidencia } from './TipoEvidencia.js';

export interface Evidencia {
  readonly id: string;
  readonly tipo: TipoEvidencia;
  readonly autorId: string;
  readonly fechaHora: Date;
  readonly archivoId: string;
  readonly nombreArchivo: string;
  readonly tipoMime: string;
  readonly tamanoBytes: number;
}
