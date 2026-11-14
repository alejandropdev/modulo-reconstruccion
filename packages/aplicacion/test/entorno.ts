import type { ErrorDominio } from '@reconstruccion/dominio';
import type { CasoDeUso, PuertosSalida } from '../src/index.js';
import {
  AlmacenFalso,
  AuditoriaFalsa,
  DirectorioFalso,
  GeneradorIdsSecuencial,
  ModulosExternosFalsos,
  ParametrosFalsos,
  PresentadorFalso,
  PublicadorFalso,
  RelojFijo,
  RepositorioFalso,
  UnidadDeTrabajoFalsa,
} from './fakes/fakes.js';

export const U = {
  autoridad: 'u-aut',
  aprobador: 'u-apr',
  responsable: 'u-resp',
  otro: 'u-otro',
  ambos: 'u-ambos',
} as const;

/** Entorno de pruebas: todos los puertos de salida en memoria + datos semilla mínimos. */
export function crearEntorno() {
  const repositorio = new RepositorioFalso();
  const auditoria = new AuditoriaFalsa();
  const publicador = new PublicadorFalso();
  const directorio = new DirectorioFalso();
  const externos = new ModulosExternosFalsos();
  const almacen = new AlmacenFalso();

  directorio.agregar(U.autoridad, ['AUTORIDAD']);
  directorio.agregar(U.aprobador, ['APROBADOR']);
  directorio.agregar(U.responsable, ['RESPONSABLE']);
  directorio.agregar(U.otro, ['RESPONSABLE']);
  directorio.agregar(U.ambos, ['AUTORIDAD', 'APROBADOR']);

  externos.desastres.set('D-002', {
    id: 'D-002',
    nombre: 'Inundación',
    estado: 'RECONSTRUCCION',
    municipio: 'X',
    fechaOcurrencia: '2026-01-01',
  });
  externos.desastres.set('D-001', {
    id: 'D-001',
    nombre: 'Sismo',
    estado: 'CARACTERIZACION',
    municipio: 'Y',
    fechaOcurrencia: '2026-01-01',
  });
  externos.desastres.set('D-003', {
    id: 'D-003',
    nombre: 'Deslizamiento',
    estado: 'REGISTRO',
    municipio: 'Z',
    fechaOcurrencia: '2026-01-01',
  });
  externos.evaluaciones = [
    {
      id: 'E-1',
      desastreId: 'D-002',
      activoId: 'A-1',
      nivelDano: 'SEVERO',
      estado: 'VALIDADA',
      requiereIntervencion: true,
    },
    {
      id: 'E-2',
      desastreId: 'D-002',
      activoId: 'A-2',
      nivelDano: 'LEVE',
      estado: 'VALIDADA',
      requiereIntervencion: true,
    },
    {
      id: 'E-3',
      desastreId: 'D-002',
      activoId: 'A-3',
      nivelDano: 'SEVERO',
      estado: 'BORRADOR',
      requiereIntervencion: true,
    },
    {
      id: 'E-4',
      desastreId: 'D-002',
      activoId: 'A-4',
      nivelDano: 'SEVERO',
      estado: 'VALIDADA',
      requiereIntervencion: false,
    },
    {
      id: 'E-5',
      desastreId: 'D-001',
      activoId: 'A-5',
      nivelDano: 'SEVERO',
      estado: 'VALIDADA',
      requiereIntervencion: true,
    },
  ];

  const puertos: PuertosSalida = {
    repositorio,
    consultaEvaluaciones: externos,
    consultaDesastres: externos,
    actualizacionEstadoDesastre: externos,
    directorio,
    parametros: new ParametrosFalsos(),
    auditoria,
    publicador,
    reloj: new RelojFijo(),
    unidadDeTrabajo: new UnidadDeTrabajoFalsa([repositorio, auditoria, publicador]),
    almacenEvidencias: almacen,
    generadorIds: new GeneradorIdsSecuencial(),
  };
  return { puertos, repositorio, auditoria, publicador, directorio, externos, almacen };
}

export interface Resultado<S> {
  datos: S | undefined;
  fallo: ErrorDominio | undefined;
}

export async function ejecutar<E, S>(caso: CasoDeUso<E, S>, entrada: E): Promise<Resultado<S>> {
  const presentador = new PresentadorFalso<S>();
  await caso.ejecutar(entrada, presentador);
  return { datos: presentador.datos, fallo: presentador.fallo };
}

/** Código de regla o de error del fallo (o 'EXITO'). */
export function codigo<S>(r: Resultado<S>): string {
  return r.fallo ? (r.fallo.regla ?? r.fallo.codigo) : 'EXITO';
}
