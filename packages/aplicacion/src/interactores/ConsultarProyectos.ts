import type { EstadoProyecto } from '@reconstruccion/dominio';
import { aDetalle, aResumen, type DetalleProyecto, type ResumenProyecto } from '../dto/ProyectoDto.js';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaConsultarProyectos extends EntradaBase {
  /** Si viene, devuelve el detalle de ese proyecto; si no, una lista paginada. */
  readonly proyectoId?: string | undefined;
  readonly desastreId?: string | undefined;
  readonly estado?: EstadoProyecto | undefined;
  readonly responsableId?: string | undefined;
  readonly atrasado?: boolean | undefined;
  readonly pagina?: number | undefined;
  readonly tamano?: number | undefined;
}

export type SalidaConsultarProyectos =
  | { readonly tipo: 'DETALLE'; readonly detalle: DetalleProyecto }
  | {
      readonly tipo: 'LISTA';
      readonly items: ResumenProyecto[];
      readonly total: number;
      readonly pagina: number;
      readonly tamano: number;
    };

export class ConsultarProyectos extends InteractorConAuditoria<
  EntradaConsultarProyectos,
  SalidaConsultarProyectos
> {
  protected async ejecutarNegocio(entrada: EntradaConsultarProyectos): Promise<SalidaConsultarProyectos> {
    await this.autorizar(entrada.usuarioId);
    const hoy = this.p.reloj.hoy();
    if (entrada.proyectoId) {
      const proyecto = await this.cargarProyecto(entrada.proyectoId);
      return { tipo: 'DETALLE', detalle: aDetalle(proyecto, hoy) };
    }
    const pagina = entrada.pagina ?? 1;
    const tamano = entrada.tamano ?? 20;
    const { items, total } = await this.p.repositorio.buscar(
      {
        desastreId: entrada.desastreId,
        estado: entrada.estado,
        responsableId: entrada.responsableId,
        atrasadoAntesDe: entrada.atrasado ? hoy : undefined,
      },
      { pagina, tamano },
    );
    return { tipo: 'LISTA', items: items.map((p) => aResumen(p, hoy)), total, pagina, tamano };
  }
}
