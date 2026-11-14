import {
  desastreCerrado,
  EstadoDesastre,
  NoEncontrado,
  PoliticaCicloDesastre,
} from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaCerrarDesastre extends EntradaBase {
  readonly desastreId: string;
}

export interface SalidaCerrarDesastre {
  readonly desastreId: string;
  readonly estado: string;
}

export class CerrarDesastre extends InteractorConAuditoria<EntradaCerrarDesastre, SalidaCerrarDesastre> {
  protected async ejecutarNegocio(entrada: EntradaCerrarDesastre): Promise<SalidaCerrarDesastre> {
    await this.autorizar(entrada.usuarioId, 'AUTORIDAD');
    const desastre = await this.p.consultaDesastres.obtener(entrada.desastreId);
    if (!desastre) throw new NoEncontrado(`No existe el desastre ${entrada.desastreId}.`);
    const proyectos = await this.p.repositorio.listarPorDesastre(desastre.id);
    new PoliticaCicloDesastre().verificarCierre(
      desastre.estado,
      proyectos.map((p) => p.estado),
    );

    await this.confirmar(
      entrada,
      () => this.p.actualizacionEstadoDesastre.cambiarEstado(desastre.id, EstadoDesastre.CERRADO),
      [desastreCerrado(desastre.id, entrada.usuarioId, this.p.reloj.ahora())],
    );
    return { desastreId: desastre.id, estado: EstadoDesastre.CERRADO };
  }
}
