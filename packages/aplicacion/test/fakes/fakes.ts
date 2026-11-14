import {
  ConflictoConcurrencia,
  Dinero,
  FechaCalendario,
  ProyectoReconstruccion,
  ServicioExternoNoDisponible,
  type ErrorDominio,
  type EstadoDesastre,
  type EventoDominio,
  type InstantaneaProyecto,
} from '@reconstruccion/dominio';
import type {
  ActualizacionEstadoDesastre,
  AlmacenEvidencias,
  ConsultaDesastres,
  ConsultaEvaluaciones,
  Desastre,
  DirectorioUsuariosRoles,
  EntradaAuditoria,
  Evaluacion,
  FiltrosProyectos,
  GeneradorIds,
  MetadatosArchivo,
  Pagina,
  ParametrosNegocio,
  PresentadorResultado,
  PublicadorEventosDominio,
  Reloj,
  RegistroAuditoria,
  RepositorioProyectos,
  Rol,
  UnidadDeTrabajo,
  UsuarioConRoles,
} from '../../src/index.js';

interface Restaurable {
  guardarCopia(): () => void;
}

/** Repositorio en memoria con control de versión (concurrencia optimista). */
export class RepositorioFalso implements RepositorioProyectos, Restaurable {
  datos = new Map<string, InstantaneaProyecto>();

  guardarCopia(): () => void {
    const copia = new Map(this.datos);
    return () => {
      this.datos = copia;
    };
  }

  sembrar(p: ProyectoReconstruccion): void {
    this.datos.set(p.id, { ...p.aInstantanea(), version: 1 });
  }

  obtener(id: string): Promise<ProyectoReconstruccion | null> {
    const i = this.datos.get(id);
    return Promise.resolve(i ? ProyectoReconstruccion.reconstituir(i) : null);
  }

  guardar(p: ProyectoReconstruccion): Promise<void> {
    const actual = this.datos.get(p.id);
    if (actual && actual.version !== p.version) {
      return Promise.reject(new ConflictoConcurrencia('Versión desactualizada.'));
    }
    this.datos.set(p.id, { ...p.aInstantanea(), version: p.version + 1 });
    return Promise.resolve();
  }

  buscar(f: FiltrosProyectos, pagina: Pagina): Promise<{ items: ProyectoReconstruccion[]; total: number }> {
    const todos = [...this.datos.values()]
      .map((i) => ProyectoReconstruccion.reconstituir(i))
      .filter((p) => (!f.desastreId || p.desastreId === f.desastreId) && (!f.estado || p.estado === f.estado))
      .filter((p) => !f.responsableId || p.responsableId === f.responsableId)
      .filter((p) => !f.atrasadoAntesDe || p.estaAtrasado(f.atrasadoAntesDe));
    const desde = (pagina.pagina - 1) * pagina.tamano;
    return Promise.resolve({ items: todos.slice(desde, desde + pagina.tamano), total: todos.length });
  }

  listarPorDesastre(desastreId: string): Promise<ProyectoReconstruccion[]> {
    return Promise.resolve(
      [...this.datos.values()]
        .filter((i) => i.desastreId === desastreId)
        .map((i) => ProyectoReconstruccion.reconstituir(i)),
    );
  }

  evaluacionesEnProyectosActivos(ids: readonly string[]): Promise<string[]> {
    const usadas = new Set(
      [...this.datos.values()]
        .filter((i) => i.activo)
        .flatMap((i) => i.referenciasEvaluacion.map((r) => r.evaluacionId)),
    );
    return Promise.resolve(ids.filter((id) => usadas.has(id)));
  }
}

export class AuditoriaFalsa implements RegistroAuditoria, Restaurable {
  registros: EntradaAuditoria[] = [];
  guardarCopia(): () => void {
    const copia = [...this.registros];
    return () => {
      this.registros = copia;
    };
  }
  registrar(e: EntradaAuditoria): Promise<void> {
    this.registros.push(e);
    return Promise.resolve();
  }
}

export class PublicadorFalso implements PublicadorEventosDominio, Restaurable {
  eventos: EventoDominio[] = [];
  falla = false;
  guardarCopia(): () => void {
    const copia = [...this.eventos];
    return () => {
      this.eventos = copia;
    };
  }
  publicar(eventos: readonly EventoDominio[]): Promise<void> {
    if (this.falla) return Promise.reject(new Error('fallo al publicar'));
    this.eventos.push(...eventos);
    return Promise.resolve();
  }
}

/** Hace rollback de los fakes si el trabajo lanza. */
export class UnidadDeTrabajoFalsa implements UnidadDeTrabajo {
  constructor(private readonly participantes: Restaurable[]) {}
  async ejecutar<T>(trabajo: () => Promise<T>): Promise<T> {
    const restauraciones = this.participantes.map((p) => p.guardarCopia());
    try {
      return await trabajo();
    } catch (e) {
      restauraciones.forEach((r) => r());
      throw e;
    }
  }
}

export class RelojFijo implements Reloj {
  ahora(): Date {
    return new Date('2026-03-01T10:00:00Z');
  }
  hoy(): FechaCalendario {
    return FechaCalendario.desde('2026-03-01');
  }
}

export class DirectorioFalso implements DirectorioUsuariosRoles {
  usuarios = new Map<string, UsuarioConRoles>();
  agregar(id: string, roles: Rol[], activo = true): void {
    this.usuarios.set(id, { id, nombre: id, roles, activo });
  }
  obtener(id: string): Promise<UsuarioConRoles | null> {
    return Promise.resolve(this.usuarios.get(id) ?? null);
  }
}

export class ParametrosFalsos implements ParametrosNegocio {
  umbralCambioPresupuesto(): Promise<Dinero> {
    return Promise.resolve(Dinero.desde('50000000'));
  }
}

export class GeneradorIdsSecuencial implements GeneradorIds {
  private n = 0;
  nuevo(): string {
    return `id-${++this.n}`;
  }
}

export class ModulosExternosFalsos
  implements ConsultaDesastres, ConsultaEvaluaciones, ActualizacionEstadoDesastre
{
  desastres = new Map<string, Desastre>();
  evaluaciones: Evaluacion[] = [];
  caido = false;

  private verificar(): void {
    if (this.caido) throw new ServicioExternoNoDisponible('Módulo externo caído.');
  }
  obtener(id: string): Promise<Desastre | null> {
    this.verificar();
    return Promise.resolve(this.desastres.get(id) ?? null);
  }
  listar(): Promise<Desastre[]> {
    return Promise.resolve([...this.desastres.values()]);
  }
  obtenerVarias(ids: readonly string[]): Promise<Evaluacion[]> {
    return Promise.resolve(this.evaluaciones.filter((e) => ids.includes(e.id)));
  }
  listarPorDesastre(desastreId: string): Promise<Evaluacion[]> {
    return Promise.resolve(this.evaluaciones.filter((e) => e.desastreId === desastreId));
  }
  cambiarEstado(desastreId: string, nuevoEstado: EstadoDesastre): Promise<void> {
    this.verificar();
    const d = this.desastres.get(desastreId);
    if (d) this.desastres.set(desastreId, { ...d, estado: nuevoEstado });
    return Promise.resolve();
  }
}

export class AlmacenFalso implements AlmacenEvidencias {
  archivos = new Map<string, Uint8Array>();
  private n = 0;
  guardar(contenido: Uint8Array, _metadatos: MetadatosArchivo): Promise<string> {
    const id = `arch-${++this.n}`;
    this.archivos.set(id, contenido);
    return Promise.resolve(id);
  }
  abrir(archivoId: string): Promise<AsyncIterable<Uint8Array>> {
    const c = this.archivos.get(archivoId) ?? new Uint8Array();
    return Promise.resolve(
      (async function* () {
        yield c;
      })(),
    );
  }
  eliminar(archivoId: string): Promise<void> {
    this.archivos.delete(archivoId);
    return Promise.resolve();
  }
}

export class PresentadorFalso<S> implements PresentadorResultado<S> {
  datos: S | undefined;
  fallo: ErrorDominio | undefined;
  exito(d: S): void {
    this.datos = d;
  }
  error(f: ErrorDominio): void {
    this.fallo = f;
  }
}
