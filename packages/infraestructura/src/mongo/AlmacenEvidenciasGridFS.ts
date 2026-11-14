import type { AlmacenEvidencias, MetadatosArchivo } from '@reconstruccion/aplicacion';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { GridFSBucket, ObjectId, type Db } from 'mongodb';

export class AlmacenEvidenciasGridFS implements AlmacenEvidencias {
  private readonly bucket: GridFSBucket;

  constructor(db: Db) {
    this.bucket = new GridFSBucket(db, { bucketName: 'evidencias' });
  }

  async guardar(contenido: Uint8Array, metadatos: MetadatosArchivo): Promise<string> {
    const subida = this.bucket.openUploadStream(metadatos.nombreArchivo, {
      metadata: {
        proyectoId: metadatos.proyectoId,
        autorId: metadatos.autorId,
        tipo: metadatos.tipo,
        tipoMime: metadatos.tipoMime,
      },
    });
    await pipeline(Readable.from([contenido]), subida);
    return subida.id.toString();
  }

  abrir(archivoId: string): Promise<AsyncIterable<Uint8Array>> {
    return Promise.resolve(this.bucket.openDownloadStream(new ObjectId(archivoId)));
  }

  async eliminar(archivoId: string): Promise<void> {
    await this.bucket.delete(new ObjectId(archivoId));
  }
}
