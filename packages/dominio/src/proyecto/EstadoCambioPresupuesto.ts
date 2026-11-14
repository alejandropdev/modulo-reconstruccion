export const EstadoCambioPresupuesto = {
  Aplicado: 'Aplicado',
  Pendiente: 'Pendiente',
  Aprobado: 'Aprobado',
  Rechazado: 'Rechazado',
  Anulado: 'Anulado',
} as const;
export type EstadoCambioPresupuesto = (typeof EstadoCambioPresupuesto)[keyof typeof EstadoCambioPresupuesto];
