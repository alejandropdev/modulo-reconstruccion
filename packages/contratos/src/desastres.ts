import { z } from 'zod';
import { EstadoDesastre, NivelDano } from './comunes.js';

export const DesastreSalida = z.object({
  id: z.string(),
  nombre: z.string(),
  estado: EstadoDesastre,
  municipio: z.string(),
  fechaOcurrencia: z.string(),
});

export const EvaluacionSalida = z.object({
  id: z.string(),
  desastreId: z.string(),
  activoId: z.string(),
  nivelDano: NivelDano,
  estado: z.enum(['BORRADOR', 'VALIDADA']),
  requiereIntervencion: z.boolean(),
});

export const CambioEstadoDesastreSalida = z.object({ desastreId: z.string(), estado: EstadoDesastre });

export type DesastreSalida = z.infer<typeof DesastreSalida>;
export type EvaluacionSalida = z.infer<typeof EvaluacionSalida>;
