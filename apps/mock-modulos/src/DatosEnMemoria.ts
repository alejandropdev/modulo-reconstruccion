import { readFileSync } from 'node:fs';

export interface DesastreMock {
  id: string;
  nombre: string;
  estado: string;
  municipio: string;
  fechaOcurrencia: string;
}

export interface EvaluacionMock {
  id: string;
  desastreId: string;
  activoId: string;
  nivelDano: string;
  estado: 'BORRADOR' | 'VALIDADA';
  requiereIntervencion: boolean;
}

const leer = <T>(archivo: string): T =>
  JSON.parse(readFileSync(new URL(`../datos/${archivo}`, import.meta.url), 'utf8')) as T;

/** Datos semilla cargados en memoria al arrancar; los cambios de estado no se persisten. */
export class DatosEnMemoria {
  readonly desastres = leer<DesastreMock[]>('desastres.json');
  readonly evaluaciones = leer<EvaluacionMock[]>('evaluaciones.json');
}
