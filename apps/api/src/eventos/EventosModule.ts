import { Module } from '@nestjs/common';
import { BusEventosEnProceso } from './BusEventosEnProceso.js';
import { DespachadorOutbox } from './DespachadorOutbox.js';
import { RegistradorEventosLog } from './RegistradorEventosLog.js';

@Module({ providers: [BusEventosEnProceso, DespachadorOutbox, RegistradorEventosLog] })
export class EventosModule {}
