import { z } from 'zod';

/** Dinero: texto en pesos con hasta 2 decimales, p. ej. "2500000000.00". */
export const Dinero = z.string().regex(/^\d+(\.\d{1,2})?$/, 'Monto en pesos con hasta 2 decimales');
/** Fecha de calendario YYYY-MM-DD. */
export const FechaCalendario = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha con formato YYYY-MM-DD');
export const FechaHora = z.string();

export const EstadoProyecto = z.enum([
  'Formulado',
  'Aprobado',
  'EnEjecucion',
  'Suspendido',
  'Finalizado',
  'Cancelado',
]);
export const TipoIntervencion = z.enum([
  'REPARACION',
  'REHABILITACION',
  'REFORZAMIENTO',
  'RECONSTRUCCION',
  'REUBICACION',
]);
export const NivelDano = z.enum(['LEVE', 'MODERADO', 'SEVERO', 'TOTAL']);
export const TipoEvidencia = z.enum(['ENTREGA', 'AVANCE', 'FOTOGRAFICA', 'DOCUMENTO']);
export const EstadoDesastre = z.enum(['REGISTRO', 'CARACTERIZACION', 'RECONSTRUCCION', 'CERRADO']);
export const Rol = z.enum(['AUTORIDAD', 'APROBADOR', 'RESPONSABLE']);

export type EstadoProyecto = z.infer<typeof EstadoProyecto>;
export type TipoIntervencion = z.infer<typeof TipoIntervencion>;
export type NivelDano = z.infer<typeof NivelDano>;
export type TipoEvidencia = z.infer<typeof TipoEvidencia>;
export type EstadoDesastre = z.infer<typeof EstadoDesastre>;
export type Rol = z.infer<typeof Rol>;
