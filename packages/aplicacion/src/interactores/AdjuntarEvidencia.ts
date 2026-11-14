import { type TipoEvidencia } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';

export interface EntradaAdjuntarEvidencia extends EntradaBase {
  readonly proyectoId: string;
  readonly tipo: string;
  readonly nombreArchivo: string;
  readonly tipoMime: string;
  readonly contenido: Uint8Array;
}

export interface SalidaAdjuntarEvidencia {
  readonly evidenciaId: string;
}

export class AdjuntarEvidencia extends InteractorConAuditoria<
  EntradaAdjuntarEvidencia,
  SalidaAdjuntarEvidencia
> {
  protected async ejecutarNegocio(entrada: EntradaAdjuntarEvidencia): Promise<SalidaAdjuntarEvidencia> {
    await this.autorizar(entrada.usuarioId, 'RESPONSABLE');
    const proyecto = await this.cargarProyecto(entrada.proyectoId);
    const ahora = this.p.reloj.ahora();
    proyecto.verificarPuedeAdjuntarEvidencia(entrada.usuarioId);
    proyecto.verificarDatosEvidencia(entrada.tipo, entrada.tipoMime, entrada.contenido.byteLength);

    // El archivo se guarda antes de la transacción; si ésta falla se elimina (compensación).
    const archivoId = await this.p.almacenEvidencias.guardar(entrada.contenido, {
      proyectoId: entrada.proyectoId,
      autorId: entrada.usuarioId,
      tipo: entrada.tipo,
      nombreArchivo: entrada.nombreArchivo,
      tipoMime: entrada.tipoMime,
    });
    const evidenciaId = this.p.generadorIds.nuevo();
    try {
      proyecto.adjuntarEvidencia(
        {
          id: evidenciaId,
          tipo: entrada.tipo as TipoEvidencia,
          autorId: entrada.usuarioId,
          archivoId,
          nombreArchivo: entrada.nombreArchivo,
          tipoMime: entrada.tipoMime,
          tamanoBytes: entrada.contenido.byteLength,
        },
        ahora,
      );
      await this.confirmar(entrada, () => this.p.repositorio.guardar(proyecto), proyecto.extraerEventos());
    } catch (e) {
      await this.p.almacenEvidencias.eliminar(archivoId);
      throw e;
    }
    return { evidenciaId };
  }
}
