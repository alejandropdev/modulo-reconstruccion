import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaIniciarEjecucion extends EntradaBase {
  readonly proyectoId: string;
  readonly contratista?: { readonly nit: string; readonly nombre: string } | undefined;
}

export interface SalidaIniciarEjecucion {
  readonly proyectoId: string;
  readonly estado: string;
}

export class IniciarEjecucion extends InteractorConAuditoria<
  EntradaIniciarEjecucion,
  SalidaIniciarEjecucion
> {
  protected ejecutarNegocio(entrada: EntradaIniciarEjecucion): Promise<SalidaIniciarEjecucion> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      proyecto.iniciarEjecucion(entrada.usuarioId, ahora, entrada.contratista);
      return { proyectoId: proyecto.id, estado: proyecto.estado };
    });
  }
}
