import {
  Dinero,
  EstadoDesastre,
  EvaluacionEnProyectoActivo,
  NoEncontrado,
  PoliticaTipoIntervencion,
  ProyectoReconstruccion,
  ReglaNegocioViolada,
  type TipoIntervencion,
} from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaCrearProyecto extends EntradaBase {
  readonly desastreId: string;
  readonly tipoIntervencion: TipoIntervencion;
  readonly evaluacionIds: readonly string[];
  /** Pesos con hasta 2 decimales. */
  readonly presupuesto: string;
  readonly fuenteFinanciacion: string;
  readonly responsableId: string;
  readonly contratista?: { readonly nit: string; readonly nombre: string } | undefined;
}

export interface SalidaCrearProyecto {
  readonly proyectoId: string;
}

export class CrearProyecto extends InteractorConAuditoria<EntradaCrearProyecto, SalidaCrearProyecto> {
  protected async ejecutarNegocio(entrada: EntradaCrearProyecto): Promise<SalidaCrearProyecto> {
    await this.autorizar(entrada.usuarioId, 'AUTORIDAD');

    // Condiciones que dependen de otros módulos (desastres y evaluaciones).
    const desastre = await this.p.consultaDesastres.obtener(entrada.desastreId);
    if (!desastre) throw new NoEncontrado(`No existe el desastre ${entrada.desastreId}.`);
    if (desastre.estado !== EstadoDesastre.RECONSTRUCCION) {
      throw new ReglaNegocioViolada('C06', 'El desastre debe estar en Reconstrucción para crear proyectos.');
    }
    const evaluaciones = await this.p.consultaEvaluaciones.obtenerVarias(entrada.evaluacionIds);
    for (const id of entrada.evaluacionIds) {
      if (!evaluaciones.some((e) => e.id === id)) throw new NoEncontrado(`No existe la evaluación ${id}.`);
    }
    for (const e of evaluaciones) {
      if (e.desastreId !== entrada.desastreId || e.estado !== 'VALIDADA' || !e.requiereIntervencion) {
        throw new ReglaNegocioViolada(
          'C06',
          `La evaluación ${e.id} debe pertenecer al desastre, estar validada y requerir intervención.`,
        );
      }
    }
    const responsable = await this.p.directorio.obtener(entrada.responsableId);
    if (!responsable?.activo || !responsable.roles.includes('RESPONSABLE')) {
      throw new ReglaNegocioViolada(
        'R06',
        'El responsable debe existir, estar activo y tener el rol RESPONSABLE.',
      );
    }
    const ocupadas = await this.p.repositorio.evaluacionesEnProyectosActivos(entrada.evaluacionIds);
    if (ocupadas.length > 0) {
      throw new EvaluacionEnProyectoActivo(
        `Las evaluaciones ${ocupadas.join(', ')} ya están en un proyecto activo.`,
      );
    }

    const proyecto = ProyectoReconstruccion.crear(
      {
        desastreId: entrada.desastreId,
        tipoIntervencion: entrada.tipoIntervencion,
        referenciasEvaluacion: entrada.evaluacionIds
          .flatMap((id) => evaluaciones.filter((e) => e.id === id))
          .map((e) => ({
            evaluacionId: e.id,
            activoId: e.activoId,
            nivelDano: e.nivelDano,
          })),
        presupuesto: Dinero.desde(entrada.presupuesto),
        fuenteFinanciacion: entrada.fuenteFinanciacion,
        responsableId: entrada.responsableId,
        creadoPor: entrada.usuarioId,
        contratista: entrada.contratista,
      },
      new PoliticaTipoIntervencion(),
      this.p.reloj.ahora(),
      this.p.generadorIds.nuevo(),
    );
    await this.confirmar(
      { ...entrada, proyectoId: proyecto.id },
      () => this.p.repositorio.guardar(proyecto),
      proyecto.extraerEventos(),
    );
    return { proyectoId: proyecto.id };
  }
}
