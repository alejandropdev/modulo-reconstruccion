import {
  desastrePasoAReconstruccion,
  EstadoDesastre,
  NoEncontrado,
  PoliticaCicloDesastre,
} from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaPasarAReconstruccion extends EntradaBase {
  readonly desastreId: string;
}

export interface SalidaPasarAReconstruccion {
  readonly desastreId: string;
  readonly estado: string;
}

export class PasarAReconstruccion extends InteractorConAuditoria<
  EntradaPasarAReconstruccion,
  SalidaPasarAReconstruccion
> {
  protected async ejecutarNegocio(entrada: EntradaPasarAReconstruccion): Promise<SalidaPasarAReconstruccion> {
    await this.autorizar(entrada.usuarioId, 'AUTORIDAD');
    const desastre = await this.p.consultaDesastres.obtener(entrada.desastreId);
    if (!desastre) throw new NoEncontrado(`No existe el desastre ${entrada.desastreId}.`);
    const evaluaciones = await this.p.consultaEvaluaciones.listarPorDesastre(entrada.desastreId);
    new PoliticaCicloDesastre().verificarPasoAReconstruccion(desastre.estado, evaluaciones);

    const ahora = this.p.reloj.ahora();
    await this.confirmar(
      entrada,
      () => this.p.actualizacionEstadoDesastre.cambiarEstado(desastre.id, EstadoDesastre.RECONSTRUCCION),
      [desastrePasoAReconstruccion(desastre.id, entrada.usuarioId, ahora)],
    );
    return { desastreId: desastre.id, estado: EstadoDesastre.RECONSTRUCCION };
  }
}
