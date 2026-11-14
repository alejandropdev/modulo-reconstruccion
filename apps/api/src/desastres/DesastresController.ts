import { Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsuarioActual } from '../auth/decoradores.js';
import { ejecutarCaso } from '../http/PresentadorHttp.js';
import { CASOS_DESASTRES } from '../tokens.js';
import type { CasosDesastres } from './crearCasosDesastres.js';

@ApiTags('desastres')
@ApiBearerAuth()
@Controller('desastres')
export class DesastresController {
  constructor(@Inject(CASOS_DESASTRES) private readonly casos: CasosDesastres) {}

  @Get()
  async listar(@UsuarioActual() usuarioId: string) {
    return (await ejecutarCaso(this.casos.consultar, { usuarioId })).desastres;
  }

  @Get(':id/evaluaciones-elegibles')
  async elegibles(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return (await ejecutarCaso(this.casos.elegibles, { usuarioId, desastreId: id })).evaluaciones;
  }

  @Post(':id/pasar-a-reconstruccion')
  @HttpCode(200)
  pasar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.pasar, { usuarioId, desastreId: id });
  }

  @Post(':id/cerrar')
  @HttpCode(200)
  cerrar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.cerrar, { usuarioId, desastreId: id });
  }
}
