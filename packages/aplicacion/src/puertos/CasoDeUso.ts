import type { PresentadorResultado } from './salida/PresentadorResultado.js';

/** Puerto de entrada: todos los casos de uso comparten esta firma. */
export interface CasoDeUso<E, S> {
  ejecutar(entrada: E, presentador: PresentadorResultado<S>): Promise<void>;
}
