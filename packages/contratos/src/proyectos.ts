import { z } from 'zod';
import {
  Dinero,
  EstadoProyecto,
  FechaCalendario,
  FechaHora,
  NivelDano,
  TipoEvidencia,
  TipoIntervencion,
} from './comunes.js';

// ------------------------------------------------------------------ entradas

export const Contratista = z.object({ nit: z.string().min(1), nombre: z.string().min(1) });

export const CrearProyectoEntrada = z.object({
  desastreId: z.string().min(1),
  tipoIntervencion: TipoIntervencion,
  evaluacionIds: z.array(z.string()),
  presupuesto: Dinero,
  fuenteFinanciacion: z.string(),
  responsableId: z.string(),
  contratista: Contratista.optional(),
});

export const CrearProyectosMasivoEntrada = z.object({ proyectos: z.array(CrearProyectoEntrada) });
export const IniciarEjecucionEntrada = z.object({ contratista: Contratista.optional() });
export const MotivoEntrada = z.object({ motivo: z.string() });
export const SolicitarCambioPresupuestoEntrada = z.object({ valorNuevo: Dinero, motivo: z.string() });
export const ResolverCambioPresupuestoEntrada = z.object({
  decision: z.enum(['APROBAR', 'RECHAZAR']),
  motivo: z.string().optional(),
});
export const RegistrarAvanceEntrada = z.object({ porcentaje: z.number() });
export const RegistrarCostoEntrada = z.object({ valor: Dinero, concepto: z.string() });
export const CrearHitoEntrada = z.object({ nombre: z.string(), fechaPlanificada: FechaCalendario });
export const EditarHitoEntrada = z.object({
  nombre: z.string().optional(),
  fechaPlanificada: FechaCalendario.optional(),
  fechaReal: FechaCalendario.optional(),
});
/** Campo de texto del multipart de evidencias (el archivo va en el campo `archivo`). */
export const AdjuntarEvidenciaEntrada = z.object({ tipo: TipoEvidencia });

export const ConsultarProyectosQuery = z.object({
  desastreId: z.string().optional(),
  estado: EstadoProyecto.optional(),
  responsableId: z.string().optional(),
  atrasado: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  pagina: z.coerce.number().int().min(1).optional(),
  tamano: z.coerce.number().int().min(1).max(100).optional(),
});

// -------------------------------------------------------------------- salidas

export const ResumenProyectoSalida = z.object({
  id: z.string(),
  desastreId: z.string(),
  tipoIntervencion: TipoIntervencion,
  estado: EstadoProyecto,
  activo: z.boolean(),
  responsableId: z.string(),
  valorVigente: Dinero,
  avanceFisico: z.number(),
  avanceFinanciero: z.number(),
  estaAtrasado: z.boolean(),
});

export const DetalleProyectoSalida = ResumenProyectoSalida.extend({
  version: z.number(),
  creadoPor: z.string(),
  aprobadoPor: z.string().nullable(),
  contratista: Contratista.nullable(),
  referenciasEvaluacion: z.array(
    z.object({ evaluacionId: z.string(), activoId: z.string(), nivelDano: NivelDano }),
  ),
  presupuesto: z.object({ valorVigente: Dinero, fuenteFinanciacion: z.string(), costosEjecutados: Dinero }),
  cambiosPresupuesto: z.array(
    z.object({
      id: z.string(),
      valorAnterior: Dinero,
      valorNuevo: Dinero,
      motivo: z.string(),
      estado: z.enum(['Aplicado', 'Pendiente', 'Aprobado', 'Rechazado', 'Anulado']),
      solicitanteId: z.string(),
      autorizanteId: z.string().nullable(),
      solicitadoEn: FechaHora,
      resueltoEn: FechaHora.nullable(),
      motivoResolucion: z.string().nullable(),
    }),
  ),
  cambiosPendientes: z.array(z.string()),
  hitos: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      fechaPlanificada: FechaCalendario,
      fechaReal: FechaCalendario.nullable(),
      desviacion: z.number().nullable(),
    }),
  ),
  avances: z.array(z.object({ porcentaje: z.number(), usuarioId: z.string(), fechaHora: FechaHora })),
  costos: z.array(
    z.object({
      id: z.string(),
      valor: Dinero,
      concepto: z.string(),
      usuarioId: z.string(),
      fechaHora: FechaHora,
    }),
  ),
  evidencias: z.array(
    z.object({
      id: z.string(),
      tipo: TipoEvidencia,
      autorId: z.string(),
      fechaHora: FechaHora,
      nombreArchivo: z.string(),
      tipoMime: z.string(),
      tamanoBytes: z.number(),
    }),
  ),
  historialEstados: z.array(
    z.object({
      anterior: EstadoProyecto.nullable(),
      nuevo: EstadoProyecto,
      motivo: z.string(),
      usuarioId: z.string(),
      fechaHora: FechaHora,
    }),
  ),
  creadoEn: FechaHora,
  actualizadoEn: FechaHora,
});

export const ListaProyectosSalida = z.object({
  items: z.array(ResumenProyectoSalida),
  total: z.number(),
  pagina: z.number(),
  tamano: z.number(),
});

export const ReporteMasivoSalida = z.object({
  resultados: z.array(
    z.object({
      indice: z.number(),
      exito: z.boolean(),
      proyectoId: z.string().optional(),
      errores: z
        .array(z.object({ codigo: z.string(), regla: z.string().optional(), mensaje: z.string() }))
        .optional(),
    }),
  ),
});

export type CrearProyectoEntrada = z.infer<typeof CrearProyectoEntrada>;
export type ResumenProyectoSalida = z.infer<typeof ResumenProyectoSalida>;
export type DetalleProyectoSalida = z.infer<typeof DetalleProyectoSalida>;
export type ListaProyectosSalida = z.infer<typeof ListaProyectosSalida>;
export type ReporteMasivoSalida = z.infer<typeof ReporteMasivoSalida>;
