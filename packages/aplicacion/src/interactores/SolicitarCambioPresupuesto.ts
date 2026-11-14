import { Dinero, PoliticaAprobacionPresupuesto } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaSolicitarCambioPresupuesto extends EntradaBase {
  readonly proyectoId: string;
  /** Pesos con hasta 2 decimales, p. ej. "2500000000.00". */
  readonly valorNuevo: string;
  readonly motivo: string;
}

export interface SalidaSolicitarCambioPresupuesto {
  readonly cambioId: string;
  readonly estado: string;
  readonly valorVigente: string;
}

export class SolicitarCambioPresupuesto extends InteractorConAuditoria<
  EntradaSolicitarCambioPresupuesto,
  SalidaSolicitarCambioPresupuesto
> {
  protected async ejecutarNegocio(
    entrada: EntradaSolicitarCambioPresupuesto,
  ): Promise<SalidaSolicitarCambioPresupuesto> {
    const politica = new PoliticaAprobacionPresupuesto(await this.p.parametros.umbralCambioPresupuesto());
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      const cambio = proyecto.solicitarCambioPresupuesto(
        Dinero.desde(entrada.valorNuevo),
        entrada.motivo,
        entrada.usuarioId,
        politica,
        ahora,
        this.p.generadorIds.nuevo(),
      );
      return {
        cambioId: cambio.id,
        estado: cambio.estado,
        valorVigente: proyecto.valorVigente.aTextoPesos(),
      };
    });
  }
}
