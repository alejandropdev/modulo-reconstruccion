import { Porcentaje } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaRegistrarAvance extends EntradaBase {
  readonly proyectoId: string;
  readonly porcentaje: number;
}

export interface SalidaRegistrarAvance {
  readonly avanceFisico: number;
}

export class RegistrarAvance extends InteractorConAuditoria<EntradaRegistrarAvance, SalidaRegistrarAvance> {
  protected ejecutarNegocio(entrada: EntradaRegistrarAvance): Promise<SalidaRegistrarAvance> {
    return this.sobreProyecto(entrada, 'RESPONSABLE', (proyecto, ahora) => {
      proyecto.registrarAvance(Porcentaje.desde(entrada.porcentaje), entrada.usuarioId, ahora);
      return { avanceFisico: proyecto.avanceFisico().valor };
    });
  }
}
