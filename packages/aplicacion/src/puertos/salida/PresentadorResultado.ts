import type { ErrorDominio } from '@reconstruccion/dominio';

export interface PresentadorResultado<S> {
  exito(datos: S): void;
  error(fallo: ErrorDominio): void;
}
