import { ErrorDominio } from '../src/index.js';

/** Devuelve la regla (o el código) del error de dominio lanzado, o 'NO_LANZO'. */
export function regla(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof ErrorDominio) return e.regla ?? e.codigo;
    throw e;
  }
  return 'NO_LANZO';
}
