/** Base de los errores de negocio. El `codigo` sigue el catálogo de PLAN.md sección 3. */
export abstract class ErrorDominio extends Error {
  abstract readonly codigo: string;

  constructor(
    mensaje: string,
    readonly regla: string | undefined = undefined,
    readonly detalles: readonly unknown[] = [],
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

export class ReglaNegocioViolada extends ErrorDominio {
  readonly codigo = 'REGLA_NEGOCIO';
  constructor(regla: string, mensaje: string, detalles: readonly unknown[] = []) {
    super(mensaje, regla, detalles);
  }
}

export class TransicionInvalida extends ErrorDominio {
  readonly codigo = 'TRANSICION_INVALIDA';
  constructor(mensaje: string) {
    super(mensaje, 'R17');
  }
}

export class DatosInvalidos extends ErrorDominio {
  readonly codigo = 'DATOS_INVALIDOS';
}

export class NoAutorizado extends ErrorDominio {
  readonly codigo = 'NO_AUTORIZADO';
}

export class NoEncontrado extends ErrorDominio {
  readonly codigo = 'NO_ENCONTRADO';
}

export class CambioDesactualizado extends ErrorDominio {
  readonly codigo = 'CAMBIO_DESACTUALIZADO';
  constructor(mensaje: string) {
    super(mensaje, 'C12');
  }
}

export class EvaluacionEnProyectoActivo extends ErrorDominio {
  readonly codigo = 'EVALUACION_EN_PROYECTO_ACTIVO';
  constructor(mensaje: string) {
    super(mensaje, 'R05');
  }
}

export class ConflictoConcurrencia extends ErrorDominio {
  readonly codigo = 'CONFLICTO_CONCURRENCIA';
}

export class ServicioExternoNoDisponible extends ErrorDominio {
  readonly codigo = 'SERVICIO_EXTERNO_NO_DISPONIBLE';
}
