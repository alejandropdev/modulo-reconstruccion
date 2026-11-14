/** Forma del documento `proyectos` en Mongo (un documento por agregado). */
export interface DocumentoProyecto {
  _id: string;
  version: number;
  activo: boolean;
  desastreId: string;
  tipoIntervencion: string;
  estado: string;
  activosIntervenidos: string[];
  responsableId: string;
  creadoPor: string;
  aprobadoPor: string | null;
  contratista: { nit: string; nombre: string } | null;
  referenciasEvaluacion: { evaluacionId: string; activoId: string; nivelDano: string }[];
  presupuesto: { valorVigente: bigint; fuenteFinanciacion: string; costosEjecutados: bigint };
  cambiosPresupuesto: {
    id: string;
    valorAnterior: bigint;
    valorNuevo: bigint;
    motivo: string;
    estado: string;
    solicitanteId: string;
    autorizanteId: string | null;
    solicitadoEn: Date;
    resueltoEn: Date | null;
    motivoResolucion: string | null;
  }[];
  hitos: { id: string; nombre: string; fechaPlanificada: Date; fechaReal: Date | null }[];
  avances: { avanceFisico: number; usuarioId: string; fechaHora: Date }[];
  costos: { id: string; valor: bigint; concepto: string; usuarioId: string; fechaHora: Date }[];
  evidencias: {
    id: string;
    tipo: string;
    autorId: string;
    fechaHora: Date;
    archivoId: string;
    nombreArchivo: string;
    tipoMime: string;
    tamanoBytes: number;
  }[];
  historialEstados: {
    anterior: string | null;
    nuevo: string;
    motivo: string;
    usuarioId: string;
    fechaHora: Date;
  }[];
  creadoEn: Date;
  actualizadoEn: Date;
}
