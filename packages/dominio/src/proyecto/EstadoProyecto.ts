export const EstadoProyecto = {
  Formulado: 'Formulado',
  Aprobado: 'Aprobado',
  EnEjecucion: 'EnEjecucion',
  Suspendido: 'Suspendido',
  Finalizado: 'Finalizado',
  Cancelado: 'Cancelado',
} as const;
export type EstadoProyecto = (typeof EstadoProyecto)[keyof typeof EstadoProyecto];
