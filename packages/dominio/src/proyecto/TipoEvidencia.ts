export const TipoEvidencia = {
  ENTREGA: 'ENTREGA',
  AVANCE: 'AVANCE',
  FOTOGRAFICA: 'FOTOGRAFICA',
  DOCUMENTO: 'DOCUMENTO',
} as const;
export type TipoEvidencia = (typeof TipoEvidencia)[keyof typeof TipoEvidencia];
