import { Global, Module } from '@nestjs/common';
import type { PuertosSalida } from '@reconstruccion/aplicacion';
import { Dinero } from '@reconstruccion/dominio';
import {
  ActualizacionEstadoDesastreHttp,
  AlmacenEvidenciasGridFS,
  ClienteHttp,
  conectarMongo,
  ConsultaDesastresHttp,
  ConsultaEvaluacionesHttp,
  DirectorioUsuariosMongo,
  GeneradorIdsUuid,
  ParametrosNegocioMongo,
  PublicadorOutboxMongo,
  RegistroAuditoriaMongo,
  RelojSistema,
  RepositorioProyectosMongo,
  UnidadDeTrabajoMongo,
  type ConexionMongo,
} from '@reconstruccion/infraestructura';
import { leerConfiguracion, type Configuracion } from './config/Configuracion.js';
import { CONEXION, CONFIG, PUERTOS } from './tokens.js';

/** Anillo de frameworks: aquí se enlazan los puertos de salida con sus adaptadores. */
@Global()
@Module({
  providers: [
    { provide: CONFIG, useFactory: () => leerConfiguracion() },
    {
      provide: CONEXION,
      inject: [CONFIG],
      useFactory: (c: Configuracion) => conectarMongo(c.MONGO_URI, c.NOMBRE_BD),
    },
    {
      provide: PUERTOS,
      inject: [CONFIG, CONEXION],
      useFactory: (c: Configuracion, { cliente, db }: ConexionMongo): PuertosSalida => {
        const http = new ClienteHttp(c.URL_MODULOS_EXTERNOS, 3000);
        const modulosExternos = {
          consultaDesastres: new ConsultaDesastresHttp(http),
          consultaEvaluaciones: new ConsultaEvaluacionesHttp(http),
          actualizacionEstadoDesastre: new ActualizacionEstadoDesastreHttp(http),
        };
        return {
          repositorio: new RepositorioProyectosMongo(db),
          ...modulosExternos,
          directorio: new DirectorioUsuariosMongo(db),
          parametros: new ParametrosNegocioMongo(db, Dinero.desde(c.UMBRAL_CAMBIO_PRESUPUESTO)),
          auditoria: new RegistroAuditoriaMongo(db),
          publicador: new PublicadorOutboxMongo(db),
          reloj: new RelojSistema(),
          unidadDeTrabajo: new UnidadDeTrabajoMongo(cliente),
          almacenEvidencias: new AlmacenEvidenciasGridFS(db),
          generadorIds: new GeneradorIdsUuid(),
        };
      },
    },
  ],
  exports: [CONFIG, CONEXION, PUERTOS],
})
export class InfraestructuraModule {}
