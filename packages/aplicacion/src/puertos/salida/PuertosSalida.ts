import type { ActualizacionEstadoDesastre } from './ActualizacionEstadoDesastre.js';
import type { AlmacenEvidencias } from './AlmacenEvidencias.js';
import type { ConsultaDesastres } from './ConsultaDesastres.js';
import type { ConsultaEvaluaciones } from './ConsultaEvaluaciones.js';
import type { DirectorioUsuariosRoles } from './DirectorioUsuariosRoles.js';
import type { GeneradorIds } from './GeneradorIds.js';
import type { ParametrosNegocio } from './ParametrosNegocio.js';
import type { PublicadorEventosDominio } from './PublicadorEventosDominio.js';
import type { RegistroAuditoria } from './RegistroAuditoria.js';
import type { RepositorioProyectos } from './RepositorioProyectos.js';
import type { Reloj } from './Reloj.js';
import type { UnidadDeTrabajo } from './UnidadDeTrabajo.js';

/** Todos los puertos de salida; la composición se los pasa a cada interactor. */
export interface PuertosSalida {
  readonly repositorio: RepositorioProyectos;
  readonly consultaEvaluaciones: ConsultaEvaluaciones;
  readonly consultaDesastres: ConsultaDesastres;
  readonly actualizacionEstadoDesastre: ActualizacionEstadoDesastre;
  readonly directorio: DirectorioUsuariosRoles;
  readonly parametros: ParametrosNegocio;
  readonly auditoria: RegistroAuditoria;
  readonly publicador: PublicadorEventosDominio;
  readonly reloj: Reloj;
  readonly unidadDeTrabajo: UnidadDeTrabajo;
  readonly almacenEvidencias: AlmacenEvidencias;
  readonly generadorIds: GeneradorIds;
}
