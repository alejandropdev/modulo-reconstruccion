import type { DecisionCambio } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaResolverCambioPresupuesto extends EntradaBase {
  readonly proyectoId: string;
  readonly cambioId: string;
  readonly decision: DecisionCambio;
  readonly motivo?: string | undefined;
}

export interface SalidaResolverCambioPresupuesto {
  readonly cambioId: string;
  readonly estado: string;
  readonly valorVigente: string;
}

export class ResolverCambioPresupuesto extends InteractorConAuditoria<
  EntradaResolverCambioPresupuesto,
  SalidaResolverCambioPresupuesto
> {
  protected ejecutarNegocio(
    entrada: EntradaResolverCambioPresupuesto,
  ): Promise<SalidaResolverCambioPresupuesto> {
    return this.sobreProyecto(entrada, 'APROBADOR', (proyecto, ahora) => {
      const cambio = proyecto.resolverCambioPresupuesto(
        entrada.cambioId,
        entrada.decision,
        entrada.motivo,
        entrada.usuarioId,
        ahora,
      );
      return {
        cambioId: cambio.id,
        estado: cambio.estado,
        valorVigente: proyecto.valorVigente.aTextoPesos(),
      };
    });
  }
}
