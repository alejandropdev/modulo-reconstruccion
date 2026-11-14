export const TipoIntervencion = {
  REPARACION: 'REPARACION',
  REHABILITACION: 'REHABILITACION',
  REFORZAMIENTO: 'REFORZAMIENTO',
  RECONSTRUCCION: 'RECONSTRUCCION',
  REUBICACION: 'REUBICACION',
} as const;
export type TipoIntervencion = (typeof TipoIntervencion)[keyof typeof TipoIntervencion];
