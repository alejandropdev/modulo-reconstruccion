import { Controller, Get, Inject, Query } from '@nestjs/common';
import { DatosEnMemoria } from './DatosEnMemoria.js';

@Controller('evaluaciones')
export class EvaluacionesController {
  constructor(@Inject(DatosEnMemoria) private readonly datos: DatosEnMemoria) {}

  @Get()
  listar(@Query('desastreId') desastreId?: string, @Query('ids') ids?: string) {
    if (ids) {
      const lista = ids.split(',');
      return this.datos.evaluaciones.filter((e) => lista.includes(e.id));
    }
    return desastreId
      ? this.datos.evaluaciones.filter((e) => e.desastreId === desastreId)
      : this.datos.evaluaciones;
  }
}
