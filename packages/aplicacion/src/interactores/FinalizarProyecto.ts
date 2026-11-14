import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaFinalizarProyecto extends EntradaBase {
  readonly proyectoId: string;
}

export interface SalidaFinalizarProyecto {
  readonly proyectoId: string;
  readonly estado: string;
}

export class FinalizarProyecto extends InteractorConAuditoria<
  EntradaFinalizarProyecto,
  SalidaFinalizarProyecto
> {
  protected ejecutarNegocio(entrada: EntradaFinalizarProyecto): Promise<SalidaFinalizarProyecto> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      proyecto.finalizar(entrada.usuarioId, ahora);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
