import { z } from 'zod';

/** Formato de error de la API: { codigo, regla?, mensaje, detalles } */
export const ErrorApi = z.object({
  codigo: z.string(),
  regla: z.string().optional(),
  mensaje: z.string(),
  detalles: z.array(z.unknown()).default([]),
});
export type ErrorApi = z.infer<typeof ErrorApi>;
