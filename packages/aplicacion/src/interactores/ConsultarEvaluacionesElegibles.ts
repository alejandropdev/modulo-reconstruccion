import { NoEncontrado } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';
import type { Evaluacion } from '../puertos/salida/ConsultaEvaluaciones.js';

export interface EntradaConsultarEvaluacionesElegibles extends EntradaBase {
  readonly desastreId: string;
}

export interface SalidaConsultarEvaluacionesElegibles {
  readonly evaluaciones: Evaluacion[];
}

/** Evaluaciones validadas, que requieren intervención y no están en un proyecto activo. */
export class ConsultarEvaluacionesElegibles extends InteractorConAuditoria<
  EntradaConsultarEvaluacionesElegibles,
  SalidaConsultarEvaluacionesElegibles
> {
  protected async ejecutarNegocio(
    entrada: EntradaConsultarEvaluacionesElegibles,
  ): Promise<SalidaConsultarEvaluacionesElegibles> {
    await this.autorizar(entrada.usuarioId);
    if (!(await this.p.consultaDesastres.obtener(entrada.desastreId))) {
      throw new NoEncontrado(`No existe el desastre ${entrada.desastreId}.`);
    }
    const todas = await this.p.consultaEvaluaciones.listarPorDesastre(entrada.desastreId);
    const candidatas = todas.filter((e) => e.estado === 'VALIDADA' && e.requiereIntervencion);
    const ocupadas = new Set(
      await this.p.repositorio.evaluacionesEnProyectosActivos(candidatas.map((e) => e.id)),
    );
    return { evaluaciones: candidatas.filter((e) => !ocupadas.has(e.id)) };
  }
}
