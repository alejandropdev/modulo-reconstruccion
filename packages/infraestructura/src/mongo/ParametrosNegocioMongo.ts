import type { ParametrosNegocio } from '@reconstruccion/aplicacion';
import { Dinero } from '@reconstruccion/dominio';
import type { Db } from 'mongodb';

const ID = 'umbralCambioPresupuesto';

export class ParametrosNegocioMongo implements ParametrosNegocio {
  /** `valorInicial` (de `.env`) se usa para sembrar y como respaldo si el parámetro no existe. */
  constructor(
    private readonly db: Db,
    private readonly valorInicial: Dinero,
  ) {}

  async sembrar(): Promise<void> {
    await this.db
      .collection<{ _id: string; valorCentavos: bigint }>('parametros')
      .updateOne(
        { _id: ID },
        { $setOnInsert: { valorCentavos: this.valorInicial.centavos } },
        { upsert: true },
      );
  }

  async umbralCambioPresupuesto(): Promise<Dinero> {
    const doc = await this.db
      .collection<{ _id: string; valorCentavos: bigint }>('parametros')
      .findOne({ _id: ID });
    return doc ? Dinero.desdeCentavos(doc.valorCentavos) : this.valorInicial;
  }
}
