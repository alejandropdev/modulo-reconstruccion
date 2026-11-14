import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaCancelarProyecto extends EntradaBase {
  readonly proyectoId: string;
  readonly motivo: string;
}

export interface SalidaCancelarProyecto {
  readonly proyectoId: string;
  readonly estado: string;
}

export class CancelarProyecto extends InteractorConAuditoria<
  EntradaCancelarProyecto,
  SalidaCancelarProyecto
> {
  protected ejecutarNegocio(entrada: EntradaCancelarProyecto): Promise<SalidaCancelarProyecto> {
    return this.sobreProyecto(entrada, 'AUTORIDAD', (proyecto, ahora) => {
      proyecto.cancelar(entrada.motivo, entrada.usuarioId, ahora);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
