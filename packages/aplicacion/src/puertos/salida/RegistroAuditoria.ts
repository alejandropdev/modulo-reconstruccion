export interface EntradaAuditoria {
  readonly usuarioId: string;
  readonly operacion: string;
  readonly proyectoId?: string | undefined;
  readonly desastreId?: string | undefined;
  readonly resultado: 'EXITO' | 'RECHAZO';
  readonly codigoError?: string | undefined;
  readonly detalle?: string | undefined;
  readonly fechaHora: Date;
}

export interface RegistroAuditoria {
  registrar(entrada: EntradaAuditoria): Promise<void>;
}
