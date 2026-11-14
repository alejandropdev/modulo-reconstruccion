import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaAprobarProyecto extends EntradaBase {
  readonly proyectoId: string;
}

export interface SalidaAprobarProyecto {
  readonly proyectoId: string;
  readonly estado: string;
}

export class AprobarProyecto extends InteractorConAuditoria<EntradaAprobarProyecto, SalidaAprobarProyecto> {
  protected ejecutarNegocio(entrada: EntradaAprobarProyecto): Promise<SalidaAprobarProyecto> {
    return this.sobreProyecto(entrada, 'APROBADOR', (proyecto, ahora) => {
      proyecto.aprobar(entrada.usuarioId, ahora);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
