import { HttpException } from '@nestjs/common';
import type { CasoDeUso, PresentadorResultado } from '@reconstruccion/aplicacion';
import type { ErrorDominio } from '@reconstruccion/dominio';

const ESTADOS_HTTP: Record<string, number> = {
  NO_ENCONTRADO: 404,
  NO_AUTORIZADO: 403,
  TRANSICION_INVALIDA: 422,
  DATOS_INVALIDOS: 400,
  REGLA_NEGOCIO: 422,
  CAMBIO_DESACTUALIZADO: 409,
  CONFLICTO_CONCURRENCIA: 409,
  EVALUACION_EN_PROYECTO_ACTIVO: 409,
  SERVICIO_EXTERNO_NO_DISPONIBLE: 503,
};

/** Guarda el resultado del caso de uso; si fue un error de dominio lo convierte en HttpException con el catálogo de errores. */
export class PresentadorHttp<S> implements PresentadorResultado<S> {
  private datos: S | undefined;
  private fallo: ErrorDominio | undefined;

  exito(datos: S): void {
    this.datos = datos;
  }

  error(fallo: ErrorDominio): void {
    this.fallo = fallo;
  }

  resultado(): S {
    if (this.fallo) {
      const { codigo, regla, message, detalles } = this.fallo;
      throw new HttpException({ codigo, regla, mensaje: message, detalles }, ESTADOS_HTTP[codigo] ?? 500);
    }
    return this.datos as S;
  }
}

export async function ejecutarCaso<E, S>(caso: CasoDeUso<E, S>, entrada: E): Promise<S> {
  const presentador = new PresentadorHttp<S>();
  await caso.ejecutar(entrada, presentador);
  return presentador.resultado();
}
