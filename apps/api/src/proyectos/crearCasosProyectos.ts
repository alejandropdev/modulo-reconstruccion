import {
  ActualizarHito,
  AdjuntarEvidencia,
  AprobarProyecto,
  CancelarProyecto,
  ConsultarProyectos,
  CrearProyecto,
  CrearProyectosMasivo,
  FinalizarProyecto,
  IniciarEjecucion,
  ObtenerArchivoEvidencia,
  ReanudarProyecto,
  RegistrarAvance,
  RegistrarCosto,
  ResolverCambioPresupuesto,
  SolicitarCambioPresupuesto,
  SuspenderProyecto,
  type PuertosSalida,
} from '@reconstruccion/aplicacion';

/** Los interactores son clases puras (sin decoradores de Nest); aquí se construyen con los puertos. */
export function crearCasosProyectos(p: PuertosSalida) {
  return {
    crear: new CrearProyecto(p),
    masivo: new CrearProyectosMasivo(p),
    consultar: new ConsultarProyectos(p),
    aprobar: new AprobarProyecto(p),
    iniciar: new IniciarEjecucion(p),
    suspender: new SuspenderProyecto(p),
    reanudar: new ReanudarProyecto(p),
    finalizar: new FinalizarProyecto(p),
    cancelar: new CancelarProyecto(p),
    solicitarCambio: new SolicitarCambioPresupuesto(p),
    resolverCambio: new ResolverCambioPresupuesto(p),
    avance: new RegistrarAvance(p),
    costo: new RegistrarCosto(p),
    hito: new ActualizarHito(p),
    evidencia: new AdjuntarEvidencia(p),
    archivo: new ObtenerArchivoEvidencia(p),
  };
}
export type CasosProyectos = ReturnType<typeof crearCasosProyectos>;
