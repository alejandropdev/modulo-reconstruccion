import {
  ErrorDominio,
  NoAutorizado,
  NoEncontrado,
  type EventoDominio,
  type ProyectoReconstruccion,
} from '@reconstruccion/dominio';
import type { CasoDeUso } from './puertos/CasoDeUso.js';
import type { Rol, UsuarioConRoles } from './puertos/salida/DirectorioUsuariosRoles.js';
import type { PresentadorResultado } from './puertos/salida/PresentadorResultado.js';
import type { PuertosSalida } from './puertos/salida/PuertosSalida.js';

export interface EntradaBase {
  readonly usuarioId: string;
  readonly proyectoId?: string | undefined;
  readonly desastreId?: string | undefined;
}

/**
 * Encapsula el try/catch, la auditoría de rechazos y el presentador.
 * Los interactores solo coordinan: autorizan, cargan, piden a la entidad aplicar la regla,
 * guardan, auditan y publican (pasos de la Figura 6 del diseño).
 */
export abstract class InteractorConAuditoria<E extends EntradaBase, S> implements CasoDeUso<E, S> {
  constructor(protected readonly p: PuertosSalida) {}

  protected abstract ejecutarNegocio(entrada: E): Promise<S>;

  async ejecutar(entrada: E, presentador: PresentadorResultado<S>): Promise<void> {
    let salida: S;
    try {
      salida = await this.ejecutarNegocio(entrada);
    } catch (e) {
      if (!(e instanceof ErrorDominio)) throw e;
      await this.p.auditoria.registrar({
        usuarioId: entrada.usuarioId,
        operacion: this.constructor.name,
        proyectoId: entrada.proyectoId,
        desastreId: entrada.desastreId,
        resultado: 'RECHAZO',
        codigoError: e.regla ?? e.codigo,
        detalle: e.message,
        fechaHora: this.p.reloj.ahora(),
      });
      presentador.error(e);
      return;
    }
    presentador.exito(salida);
  }

  /** Verifica que el usuario exista, esté activo y tenga el rol (si se pide uno). */
  protected async autorizar(usuarioId: string, rol?: Rol): Promise<UsuarioConRoles> {
    const usuario = await this.p.directorio.obtener(usuarioId);
    if (!usuario?.activo) throw new NoAutorizado('El usuario no existe o está inactivo.');
    if (rol && !usuario.roles.includes(rol)) throw new NoAutorizado(`Se requiere el rol ${rol}.`);
    return usuario;
  }

  protected async cargarProyecto(proyectoId: string): Promise<ProyectoReconstruccion> {
    const proyecto = await this.p.repositorio.obtener(proyectoId);
    if (!proyecto) throw new NoEncontrado(`No existe el proyecto ${proyectoId}.`);
    return proyecto;
  }

  /** Pasos 4–5: ejecutar el trabajo, auditar el éxito y publicar los eventos en una sola unidad de trabajo. */
  protected confirmar(
    entrada: EntradaBase,
    trabajo: () => Promise<void>,
    eventos: readonly EventoDominio[],
    detalle?: string,
  ): Promise<void> {
    return this.p.unidadDeTrabajo.ejecutar(async () => {
      await trabajo();
      await this.p.auditoria.registrar({
        usuarioId: entrada.usuarioId,
        operacion: this.constructor.name,
        proyectoId: entrada.proyectoId,
        desastreId: entrada.desastreId,
        resultado: 'EXITO',
        detalle,
        fechaHora: this.p.reloj.ahora(),
      });
      await this.p.publicador.publicar(eventos);
    });
  }

  /** Patrón común: autorizar rol → cargar proyecto → que la entidad aplique la regla → guardar/auditar/publicar. */
  protected async sobreProyecto<R>(
    entrada: EntradaBase & { readonly proyectoId: string },
    rol: Rol,
    accion: (proyecto: ProyectoReconstruccion, ahora: Date) => R | Promise<R>,
  ): Promise<R> {
    await this.autorizar(entrada.usuarioId, rol);
    const proyecto = await this.cargarProyecto(entrada.proyectoId);
    const resultado = await accion(proyecto, this.p.reloj.ahora());
    await this.confirmar(entrada, () => this.p.repositorio.guardar(proyecto), proyecto.extraerEventos());
    return resultado;
  }
}
