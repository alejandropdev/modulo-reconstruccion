import { FechaCalendario } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

interface Base extends EntradaBase {
  readonly proyectoId: string;
}

export type EntradaActualizarHito =
  | (Base & { readonly accion: 'AGREGAR'; readonly nombre: string; readonly fechaPlanificada: string })
  | (Base & {
      readonly accion: 'EDITAR';
      readonly hitoId: string;
      readonly nombre?: string | undefined;
      readonly fechaPlanificada?: string | undefined;
      readonly fechaReal?: string | undefined;
    })
  | (Base & { readonly accion: 'ELIMINAR'; readonly hitoId: string });

export interface SalidaActualizarHito {
  readonly hitoId: string;
}

export class ActualizarHito extends InteractorConAuditoria<EntradaActualizarHito, SalidaActualizarHito> {
  protected ejecutarNegocio(entrada: EntradaActualizarHito): Promise<SalidaActualizarHito> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      const u = entrada.usuarioId;
      if (entrada.accion === 'AGREGAR') {
        const hitoId = this.p.generadorIds.nuevo();
        proyecto.agregarHito(
          entrada.nombre,
          FechaCalendario.desde(entrada.fechaPlanificada),
          u,
          hitoId,
          ahora,
        );
        return { hitoId };
      }
      if (entrada.accion === 'ELIMINAR') {
        proyecto.eliminarHito(entrada.hitoId, u, ahora);
        return { hitoId: entrada.hitoId };
      }
      if (entrada.nombre !== undefined || entrada.fechaPlanificada !== undefined) {
        proyecto.editarHito(
          entrada.hitoId,
          {
            nombre: entrada.nombre,
            fechaPlanificada: entrada.fechaPlanificada
              ? FechaCalendario.desde(entrada.fechaPlanificada)
              : undefined,
          },
          u,
          ahora,
        );
      }
      if (entrada.fechaReal !== undefined) {
        proyecto.registrarFechaRealHito(entrada.hitoId, FechaCalendario.desde(entrada.fechaReal), u, ahora);
      }
      return { hitoId: entrada.hitoId };
    });
  }
}
