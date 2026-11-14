import { MongoClient, type Db } from 'mongodb';

export interface ConexionMongo {
  readonly cliente: MongoClient;
  readonly db: Db;
}

/** `useBigInt64` hace que los Long de Mongo lleguen como bigint (los montos son bigint en el dominio). */
export async function conectarMongo(uri: string, nombreBd = 'reconstruccion'): Promise<ConexionMongo> {
  const cliente = new MongoClient(uri, { useBigInt64: true });
  await cliente.connect();
  return { cliente, db: cliente.db(nombreBd) };
}
