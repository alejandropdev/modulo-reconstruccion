export interface MetadatosArchivo {
  readonly proyectoId: string;
  readonly autorId: string;
  readonly tipo: string;
  readonly nombreArchivo: string;
  readonly tipoMime: string;
}

export interface AlmacenEvidencias {
  guardar(contenido: Uint8Array, metadatos: MetadatosArchivo): Promise<string>;
  abrir(archivoId: string): Promise<AsyncIterable<Uint8Array>>;
  eliminar(archivoId: string): Promise<void>;
}
