import { Module } from '@nestjs/common';
import { DatosEnMemoria } from './DatosEnMemoria.js';
import { DesastresController } from './DesastresController.js';
import { EvaluacionesController } from './EvaluacionesController.js';

@Module({
  controllers: [DesastresController, EvaluacionesController],
  providers: [DatosEnMemoria],
})
export class AppModule {}
