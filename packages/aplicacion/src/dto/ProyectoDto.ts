import type { FechaCalendario } from '@reconstruccion/dominio';
import { type ProyectoReconstruccion } from '@reconstruccion/dominio';

export interface ResumenProyecto {
  id: string;
  desastreId: string;
  tipoIntervencion: string;
  estado: string;
  activo: boolean;
  responsableId: string;
  valorVigente: string;
  avanceFisico: number;
  avanceFinanciero: number;
  estaAtrasado: boolean;
}

export interface DetalleProyecto extends ResumenProyecto {
  version: number;
  creadoPor: string;
  aprobadoPor: string | null;
  contratista: { nit: string; nombre: string } | null;
  referenciasEvaluacion: { evaluacionId: string; activoId: string; nivelDano: string }[];
  presupuesto: { valorVigente: string; fuenteFinanciacion: string; costosEjecutados: string };
  cambiosPresupuesto: {
    id: string;
    valorAnterior: string;
    valorNuevo: string;
    motivo: string;
    estado: string;
    solicitanteId: string;
    autorizanteId: string | null;
    solicitadoEn: string;
    resueltoEn: string | null;
    motivoResolucion: string | null;
  }[];
  cambiosPendientes: string[];
  hitos: {
    id: string;
    nombre: string;
    fechaPlanificada: string;
    fechaReal: string | null;
    desviacion: number | null;
  }[];
  avances: { porcentaje: number; usuarioId: string; fechaHora: string }[];
  costos: { id: string; valor: string; concepto: string; usuarioId: string; fechaHora: string }[];
  evidencias: {
    id: string;
    tipo: string;
    autorId: string;
    fechaHora: string;
    nombreArchivo: string;
    tipoMime: string;
    tamanoBytes: number;
  }[];
  historialEstados: {
    anterior: string | null;
    nuevo: string;
    motivo: string;
    usuarioId: string;
    fechaHora: string;
  }[];
  creadoEn: string;
  actualizadoEn: string;
}

export function aResumen(p: ProyectoReconstruccion, hoy: FechaCalendario): ResumenProyecto {
  return {
    id: p.id,
    desastreId: p.desastreId,
    tipoIntervencion: p.aInstantanea().tipoIntervencion,
    estado: p.estado,
    activo: p.activo,
    responsableId: p.responsableId,
    valorVigente: p.valorVigente.aTextoPesos(),
    avanceFisico: p.avanceFisico().valor,
    avanceFinanciero: p.avanceFinanciero(),
    estaAtrasado: p.estaAtrasado(hoy),
  };
}

export function aDetalle(p: ProyectoReconstruccion, hoy: FechaCalendario): DetalleProyecto {
  const i = p.aInstantanea();
  const iso = (d: Date): string => d.toISOString();
  return {
    ...aResumen(p, hoy),
    version: i.version,
    creadoPor: i.creadoPor,
    aprobadoPor: i.aprobadoPor,
    contratista: i.contratista,
    referenciasEvaluacion: i.referenciasEvaluacion.map((r) => ({ ...r })),
    presupuesto: {
      valorVigente: i.presupuesto.valorVigente.aTextoPesos(),
      fuenteFinanciacion: i.presupuesto.fuenteFinanciacion,
      costosEjecutados: i.presupuesto.costosEjecutados.aTextoPesos(),
    },
    cambiosPresupuesto: i.cambiosPresupuesto.map((c) => ({
      id: c.id,
      valorAnterior: c.valorAnterior.aTextoPesos(),
      valorNuevo: c.valorNuevo.aTextoPesos(),
      motivo: c.motivo,
      estado: c.estado,
      solicitanteId: c.solicitanteId,
      autorizanteId: c.autorizanteId,
      solicitadoEn: iso(c.solicitadoEn),
      resueltoEn: c.resueltoEn ? iso(c.resueltoEn) : null,
      motivoResolucion: c.motivoResolucion,
    })),
    cambiosPendientes: p.cambiosPendientes().map((c) => c.id),
    hitos: i.hitos.map((h) => ({
      id: h.id,
      nombre: h.nombre,
      fechaPlanificada: h.fechaPlanificada.texto,
      fechaReal: h.fechaReal?.texto ?? null,
      desviacion: h.desviacion(),
    })),
    avances: i.avances.map((a) => ({
      porcentaje: a.avanceFisico.valor,
      usuarioId: a.usuarioId,
      fechaHora: iso(a.fechaHora),
    })),
    costos: i.costos.map((c) => ({
      id: c.id,
      valor: c.valor.aTextoPesos(),
      concepto: c.concepto,
      usuarioId: c.usuarioId,
      fechaHora: iso(c.fechaHora),
    })),
    evidencias: i.evidencias.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      autorId: e.autorId,
      fechaHora: iso(e.fechaHora),
      nombreArchivo: e.nombreArchivo,
      tipoMime: e.tipoMime,
      tamanoBytes: e.tamanoBytes,
    })),
    historialEstados: i.historialEstados.map((h) => ({ ...h, fechaHora: iso(h.fechaHora) })),
    creadoEn: iso(i.creadoEn),
    actualizadoEn: iso(i.actualizadoEn),
  };
}
