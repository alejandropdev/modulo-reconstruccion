import { Module } from '@nestjs/common';
import { crearCasosProyectos } from './crearCasosProyectos.js';
import { CASOS_PROYECTOS, PUERTOS } from '../tokens.js';
import { ProyectosController } from './ProyectosController.js';

@Module({
  controllers: [ProyectosController],
  providers: [{ provide: CASOS_PROYECTOS, inject: [PUERTOS], useFactory: crearCasosProyectos }],
})
export class ProyectosModule {}
