import { NoEncontrado } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaObtenerArchivoEvidencia extends EntradaBase {
  readonly proyectoId: string;
  readonly evidenciaId: string;
}

export interface SalidaObtenerArchivoEvidencia {
  readonly nombreArchivo: string;
  readonly tipoMime: string;
  readonly contenido: AsyncIterable<Uint8Array>;
}

export class ObtenerArchivoEvidencia extends InteractorConAuditoria<
  EntradaObtenerArchivoEvidencia,
  SalidaObtenerArchivoEvidencia
> {
  protected async ejecutarNegocio(
    entrada: EntradaObtenerArchivoEvidencia,
  ): Promise<SalidaObtenerArchivoEvidencia> {
    await this.autorizar(entrada.usuarioId);
    const proyecto = await this.cargarProyecto(entrada.proyectoId);
    const evidencia = proyecto.evidencias.find((e) => e.id === entrada.evidenciaId);
    if (!evidencia) throw new NoEncontrado(`No existe la evidencia ${entrada.evidenciaId}.`);
    return {
      nombreArchivo: evidencia.nombreArchivo,
      tipoMime: evidencia.tipoMime,
      contenido: await this.p.almacenEvidencias.abrir(evidencia.archivoId),
    };
  }
}
