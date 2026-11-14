import { Module } from '@nestjs/common';
import { AuthModule } from './auth/AuthModule.js';
import { DesastresModule } from './desastres/DesastresModule.js';
import { EventosModule } from './eventos/EventosModule.js';
import { InfraestructuraModule } from './InfraestructuraModule.js';
import { ProyectosModule } from './proyectos/ProyectosModule.js';
import { SaludController } from './SaludController.js';

@Module({
  imports: [InfraestructuraModule, AuthModule, ProyectosModule, DesastresModule, EventosModule],
  controllers: [SaludController],
})
export class AppModule {}
