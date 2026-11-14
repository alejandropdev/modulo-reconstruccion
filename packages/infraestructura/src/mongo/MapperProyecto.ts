import {
  Dinero,
  FechaCalendario,
  Hito,
  Porcentaje,
  type EstadoCambioPresupuesto,
  type EstadoProyecto,
  type InstantaneaProyecto,
  type NivelDano,
  type TipoEvidencia,
  type TipoIntervencion,
} from '@reconstruccion/dominio';
import type { DocumentoProyecto } from './DocumentoProyecto.js';

/** FechaCalendario ↔ Date a medianoche UTC. */
const aFecha = (f: FechaCalendario): Date => new Date(`${f.texto}T00:00:00.000Z`);
const desdeFecha = (d: Date): FechaCalendario => FechaCalendario.desde(d.toISOString().slice(0, 10));

export function aDocumento(i: InstantaneaProyecto): DocumentoProyecto {
  return {
    _id: i.id,
    version: i.version,
    activo: i.activo,
    desastreId: i.desastreId,
    tipoIntervencion: i.tipoIntervencion,
    estado: i.estado,
    activosIntervenidos: i.referenciasEvaluacion.map((r) => r.activoId),
    responsableId: i.responsableId,
    creadoPor: i.creadoPor,
    aprobadoPor: i.aprobadoPor,
    contratista: i.contratista ? { ...i.contratista } : null,
    referenciasEvaluacion: i.referenciasEvaluacion.map((r) => ({ ...r })),
    presupuesto: {
      valorVigente: i.presupuesto.valorVigente.centavos,
      fuenteFinanciacion: i.presupuesto.fuenteFinanciacion,
      costosEjecutados: i.presupuesto.costosEjecutados.centavos,
    },
    cambiosPresupuesto: i.cambiosPresupuesto.map((c) => ({
      ...c,
      valorAnterior: c.valorAnterior.centavos,
      valorNuevo: c.valorNuevo.centavos,
    })),
    hitos: i.hitos.map((h) => ({
      id: h.id,
      nombre: h.nombre,
      fechaPlanificada: aFecha(h.fechaPlanificada),
      fechaReal: h.fechaReal ? aFecha(h.fechaReal) : null,
    })),
    avances: i.avances.map((a) => ({
      avanceFisico: a.avanceFisico.valor,
      usuarioId: a.usuarioId,
      fechaHora: a.fechaHora,
    })),
    costos: i.costos.map((c) => ({ ...c, valor: c.valor.centavos })),
    evidencias: i.evidencias.map((e) => ({ ...e })),
    historialEstados: i.historialEstados.map((h) => ({ ...h })),
    creadoEn: i.creadoEn,
    actualizadoEn: i.actualizadoEn,
  };
}

export function aInstantanea(d: DocumentoProyecto): InstantaneaProyecto {
  return {
    id: d._id,
    version: d.version,
    activo: d.activo,
    desastreId: d.desastreId,
    tipoIntervencion: d.tipoIntervencion as TipoIntervencion,
    estado: d.estado as EstadoProyecto,
    responsableId: d.responsableId,
    creadoPor: d.creadoPor,
    aprobadoPor: d.aprobadoPor,
    contratista: d.contratista,
    referenciasEvaluacion: d.referenciasEvaluacion.map((r) => ({
      ...r,
      nivelDano: r.nivelDano as NivelDano,
    })),
    presupuesto: {
      valorVigente: Dinero.desdeCentavos(d.presupuesto.valorVigente),
      fuenteFinanciacion: d.presupuesto.fuenteFinanciacion,
      costosEjecutados: Dinero.desdeCentavos(d.presupuesto.costosEjecutados),
    },
    cambiosPresupuesto: d.cambiosPresupuesto.map((c) => ({
      ...c,
      estado: c.estado as EstadoCambioPresupuesto,
      valorAnterior: Dinero.desdeCentavos(c.valorAnterior),
      valorNuevo: Dinero.desdeCentavos(c.valorNuevo),
    })),
    hitos: d.hitos.map(
      (h) =>
        new Hito(
          h.id,
          h.nombre,
          desdeFecha(h.fechaPlanificada),
          h.fechaReal ? desdeFecha(h.fechaReal) : null,
        ),
    ),
    avances: d.avances.map((a) => ({
      avanceFisico: Porcentaje.desde(a.avanceFisico),
      usuarioId: a.usuarioId,
      fechaHora: a.fechaHora,
    })),
    costos: d.costos.map((c) => ({ ...c, valor: Dinero.desdeCentavos(c.valor) })),
    evidencias: d.evidencias.map((e) => ({ ...e, tipo: e.tipo as TipoEvidencia })),
    historialEstados: d.historialEstados.map((h) => ({
      ...h,
      anterior: h.anterior as EstadoProyecto | null,
      nuevo: h.nuevo as EstadoProyecto,
    })),
    creadoEn: d.creadoEn,
    actualizadoEn: d.actualizadoEn,
  };
}
