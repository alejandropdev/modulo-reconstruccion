import type { EventoDominio } from '../../comun/EventoDominio.js';

export type TipoEventoProyecto =
  | 'ProyectoCreado'
  | 'ProyectoAprobado'
  | 'EjecucionIniciada'
  | 'ProyectoSuspendido'
  | 'ProyectoReanudado'
  | 'ProyectoFinalizado'
  | 'ProyectoCancelado'
  | 'CambioPresupuestoSolicitado'
  | 'CambioPresupuestoAplicado'
  | 'CambioPresupuestoRechazado'
  | 'AvanceRegistrado'
  | 'CostoRegistrado'
  | 'HitoActualizado'
  | 'EvidenciaAdjuntada';

export function eventoProyecto(
  tipo: TipoEventoProyecto,
  proyectoId: string,
  ocurridoEn: Date,
  datos: Record<string, unknown> = {},
): EventoDominio {
  return { tipo, agregadoId: proyectoId, ocurridoEn, datos };
}
