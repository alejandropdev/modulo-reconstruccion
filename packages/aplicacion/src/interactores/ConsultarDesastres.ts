import type { Desastre } from '../puertos/salida/ConsultaDesastres.js';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export type EntradaConsultarDesastres = EntradaBase;

export interface SalidaConsultarDesastres {
  readonly desastres: Desastre[];
}

export class ConsultarDesastres extends InteractorConAuditoria<
  EntradaConsultarDesastres,
  SalidaConsultarDesastres
> {
  protected async ejecutarNegocio(entrada: EntradaConsultarDesastres): Promise<SalidaConsultarDesastres> {
    await this.autorizar(entrada.usuarioId);
    return { desastres: await this.p.consultaDesastres.listar() };
  }
}
