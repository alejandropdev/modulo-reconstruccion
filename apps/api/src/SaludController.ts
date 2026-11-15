import { Controller, Get } from '@nestjs/common';
import { SaludSalida } from '@reconstruccion/contratos';
import { documentar } from './http/documentacion.js';
import { Publico } from './auth/decoradores.js';

@Controller('salud')
export class SaludController {
  @Publico()
  @Get()
  @documentar({ salida: SaludSalida, descripcion: 'La API está en línea.' })
  salud() {
    return { estado: 'ok' };
  }
}
