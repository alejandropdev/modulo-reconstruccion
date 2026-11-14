import type { EstadoProyecto, FechaCalendario, ProyectoReconstruccion } from '@reconstruccion/dominio';

export interface FiltrosProyectos {
  readonly desastreId?: string | undefined;
  readonly estado?: EstadoProyecto | undefined;
  readonly responsableId?: string | undefined;
  /** Si viene, solo proyectos con algún hito sin fecha real planificado antes de esta fecha. */
  readonly atrasadoAntesDe?: FechaCalendario | undefined;
}

export interface Pagina {
  readonly pagina: number;
  readonly tamano: number;
}

export interface RepositorioProyectos {
  obtener(id: string): Promise<ProyectoReconstruccion | null>;
  /** Inserta si es nuevo; si existe usa concurrencia optimista (lanza ConflictoConcurrencia). */
  guardar(proyecto: ProyectoReconstruccion): Promise<void>;
  buscar(
    filtros: FiltrosProyectos,
    pagina: Pagina,
  ): Promise<{ items: ProyectoReconstruccion[]; total: number }>;
  listarPorDesastre(desastreId: string): Promise<ProyectoReconstruccion[]>;
  /** De las evaluaciones dadas, devuelve las que ya están en un proyecto activo. */
  evaluacionesEnProyectosActivos(evaluacionIds: readonly string[]): Promise<string[]>;
}
