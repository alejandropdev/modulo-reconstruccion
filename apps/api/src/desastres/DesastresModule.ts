import { Module } from '@nestjs/common';
import { crearCasosDesastres } from './crearCasosDesastres.js';
import { CASOS_DESASTRES, PUERTOS } from '../tokens.js';
import { DesastresController } from './DesastresController.js';

@Module({
  controllers: [DesastresController],
  providers: [{ provide: CASOS_DESASTRES, inject: [PUERTOS], useFactory: crearCasosDesastres }],
})
export class DesastresModule {}
