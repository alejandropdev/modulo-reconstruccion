export const EstadoDesastre = {
  REGISTRO: 'REGISTRO',
  CARACTERIZACION: 'CARACTERIZACION',
  RECONSTRUCCION: 'RECONSTRUCCION',
  CERRADO: 'CERRADO',
} as const;
export type EstadoDesastre = (typeof EstadoDesastre)[keyof typeof EstadoDesastre];
