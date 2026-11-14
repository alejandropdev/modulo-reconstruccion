export interface EventoDominio {
  readonly tipo: string;
  readonly agregadoId: string;
  readonly ocurridoEn: Date;
  readonly datos: Readonly<Record<string, unknown>>;
}
