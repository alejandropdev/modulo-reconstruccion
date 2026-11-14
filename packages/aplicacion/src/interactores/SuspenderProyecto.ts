import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaSuspenderProyecto extends EntradaBase {
  readonly proyectoId: string;
  readonly motivo: string;
}

export interface SalidaSuspenderProyecto {
  readonly proyectoId: string;
  readonly estado: string;
}

export class SuspenderProyecto extends InteractorConAuditoria<
  EntradaSuspenderProyecto,
  SalidaSuspenderProyecto
> {
  protected ejecutarNegocio(entrada: EntradaSuspenderProyecto): Promise<SalidaSuspenderProyecto> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      proyecto.suspender(entrada.motivo, entrada.usuarioId, ahora);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
