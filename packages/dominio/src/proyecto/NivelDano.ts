export const NivelDano = {
  LEVE: 'LEVE',
  MODERADO: 'MODERADO',
  SEVERO: 'SEVERO',
  TOTAL: 'TOTAL',
} as const;
export type NivelDano = (typeof NivelDano)[keyof typeof NivelDano];
