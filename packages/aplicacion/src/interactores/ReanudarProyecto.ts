import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaReanudarProyecto extends EntradaBase {
  readonly proyectoId: string;
  readonly motivo: string;
}

export interface SalidaReanudarProyecto {
  readonly proyectoId: string;
  readonly estado: string;
}

export class ReanudarProyecto extends InteractorConAuditoria<
  EntradaReanudarProyecto,
  SalidaReanudarProyecto
> {
  protected ejecutarNegocio(entrada: EntradaReanudarProyecto): Promise<SalidaReanudarProyecto> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      proyecto.reanudar(entrada.motivo, entrada.usuarioId, ahora);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
