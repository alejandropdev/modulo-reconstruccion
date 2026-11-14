import { Controller, Get } from '@nestjs/common';
import { Publico } from './auth/decoradores.js';

@Controller('salud')
export class SaludController {
  @Publico()
  @Get()
  salud() {
    return { estado: 'ok' };
  }
}
