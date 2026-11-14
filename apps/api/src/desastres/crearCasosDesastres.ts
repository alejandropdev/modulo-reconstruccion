import {
  CerrarDesastre,
  ConsultarDesastres,
  ConsultarEvaluacionesElegibles,
  PasarAReconstruccion,
  type PuertosSalida,
} from '@reconstruccion/aplicacion';

export function crearCasosDesastres(p: PuertosSalida) {
  return {
    consultar: new ConsultarDesastres(p),
    elegibles: new ConsultarEvaluacionesElegibles(p),
    pasar: new PasarAReconstruccion(p),
    cerrar: new CerrarDesastre(p),
  };
}
export type CasosDesastres = ReturnType<typeof crearCasosDesastres>;
