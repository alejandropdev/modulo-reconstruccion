import type { ErrorDominio } from '@reconstruccion/dominio';
import { ReglaNegocioViolada } from '@reconstruccion/dominio';
import { InteractorConAuditoria, type EntradaBase } from '../InteractorConAuditoria.js';
import { CrearProyecto, type EntradaCrearProyecto, type SalidaCrearProyecto } from './CrearProyecto.js';

export interface EntradaCrearProyectosMasivo extends EntradaBase {
  readonly proyectos: readonly Omit<EntradaCrearProyecto, 'usuarioId'>[];
}

export interface ResultadoItemMasivo {
  readonly indice: number;
  readonly exito: boolean;
  readonly proyectoId?: string;
  readonly errores?: { readonly codigo: string; readonly regla?: string; readonly mensaje: string }[];
}

export interface SalidaCrearProyectosMasivo {
  readonly resultados: ResultadoItemMasivo[];
}

const MAXIMO = 100;

/** C07: creación masiva parcial. Cada ítem se procesa en orden y en su propia transacción. */
export class CrearProyectosMasivo extends InteractorConAuditoria<
  EntradaCrearProyectosMasivo,
  SalidaCrearProyectosMasivo
> {
  protected async ejecutarNegocio(entrada: EntradaCrearProyectosMasivo): Promise<SalidaCrearProyectosMasivo> {
    await this.autorizar(entrada.usuarioId, 'AUTORIDAD');
    if (entrada.proyectos.length === 0 || entrada.proyectos.length > MAXIMO) {
      throw new ReglaNegocioViolada('C07', `La creación masiva admite entre 1 y ${MAXIMO} proyectos.`);
    }
    const crear = new CrearProyecto(this.p);
    const resultados: ResultadoItemMasivo[] = [];
    for (const [indice, item] of entrada.proyectos.entries()) {
      let resultado: ResultadoItemMasivo = { indice, exito: false };
      await crear.ejecutar(
        { ...item, usuarioId: entrada.usuarioId },
        {
          exito: (d: SalidaCrearProyecto) => {
            resultado = { indice, exito: true, proyectoId: d.proyectoId };
          },
          error: (f: ErrorDominio) => {
            resultado = {
              indice,
              exito: false,
              errores: [{ codigo: f.codigo, ...(f.regla ? { regla: f.regla } : {}), mensaje: f.message }],
            };
          },
        },
      );
      resultados.push(resultado);
    }
    await this.p.auditoria.registrar({
      usuarioId: entrada.usuarioId,
      operacion: 'CrearProyectosMasivo',
      resultado: 'EXITO',
      detalle: `${resultados.filter((r) => r.exito).length} de ${resultados.length} proyectos creados`,
      fechaHora: this.p.reloj.ahora(),
    });
    return { resultados };
  }
}
