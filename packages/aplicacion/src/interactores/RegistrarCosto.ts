import { Dinero } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaRegistrarCosto extends EntradaBase {
  readonly proyectoId: string;
  readonly valor: string;
  readonly concepto: string;
}

export interface SalidaRegistrarCosto {
  readonly costoId: string;
  readonly costosEjecutados: string;
}

export class RegistrarCosto extends InteractorConAuditoria<EntradaRegistrarCosto, SalidaRegistrarCosto> {
  protected ejecutarNegocio(entrada: EntradaRegistrarCosto): Promise<SalidaRegistrarCosto> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      const costoId = this.p.generadorIds.nuevo();
      proyecto.registrarCosto(
        Dinero.desde(entrada.valor),
        entrada.concepto,
        entrada.usuarioId,
        ahora,
        costoId,
      );
      return { costoId, costosEjecutados: proyecto.costosEjecutados.aTextoPesos() };
    });
  }
}
