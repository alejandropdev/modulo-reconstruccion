import { ReglaNegocioViolada } from '../comun/ErrorDominio.js';
import { EstadoDesastre } from '../desastre/EstadoDesastre.js';
import { EstadoProyecto } from '../proyecto/EstadoProyecto.js';

export interface EvaluacionResumen {
  readonly estado: 'BORRADOR' | 'VALIDADA';
  readonly requiereIntervencion: boolean;
}

export class PoliticaCicloDesastre {
  /** R01 y R02. */
  verificarPasoAReconstruccion(estado: EstadoDesastre, evaluaciones: readonly EvaluacionResumen[]): void {
    if (estado !== EstadoDesastre.CARACTERIZACION) {
      throw new ReglaNegocioViolada('R01', 'El desastre solo pasa a Reconstrucción desde Caracterización.');
    }
    if (!evaluaciones.some((e) => e.estado === 'VALIDADA' && e.requiereIntervencion)) {
      throw new ReglaNegocioViolada(
        'R02',
        'Se necesita al menos una evaluación de daños validada que requiera intervención.',
      );
    }
  }

  /** C15 y R03. */
  verificarCierre(estado: EstadoDesastre, estadosProyectos: readonly EstadoProyecto[]): void {
    if (estado !== EstadoDesastre.RECONSTRUCCION) {
      throw new ReglaNegocioViolada('C15', 'Solo se puede cerrar un desastre que está en Reconstrucción.');
    }
    const abiertos = estadosProyectos.filter(
      (e) => e !== EstadoProyecto.Finalizado && e !== EstadoProyecto.Cancelado,
    );
    if (abiertos.length > 0) {
      throw new ReglaNegocioViolada(
        'R03',
        'Todos los proyectos deben estar finalizados o cancelados para cerrar el desastre.',
      );
    }
  }
}
