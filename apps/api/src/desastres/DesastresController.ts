import { Controller, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CambioEstadoDesastreSalida, DesastreSalida, EvaluacionSalida } from '@reconstruccion/contratos';
import { z } from 'zod';
import { UsuarioActual } from '../auth/decoradores.js';
import { documentar, documentarErrores } from '../http/documentacion.js';
import { ejecutarCaso } from '../http/PresentadorHttp.js';
import { CASOS_DESASTRES } from '../tokens.js';
import type { CasosDesastres } from './crearCasosDesastres.js';

@ApiTags('desastres')
@ApiBearerAuth()
@documentarErrores()
@Controller('desastres')
export class DesastresController {
  constructor(@Inject(CASOS_DESASTRES) private readonly casos: CasosDesastres) {}

  @Get()
  @documentar({ salida: z.array(DesastreSalida), descripcion: 'Desastres con su estado.' })
  async listar(@UsuarioActual() usuarioId: string) {
    return (await ejecutarCaso(this.casos.consultar, { usuarioId })).desastres;
  }

  @Get(':id/evaluaciones-elegibles')
  @documentar({ salida: z.array(EvaluacionSalida), descripcion: 'Evaluaciones validadas, con intervención y sin proyecto activo.' })
  async elegibles(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return (await ejecutarCaso(this.casos.elegibles, { usuarioId, desastreId: id })).evaluaciones;
  }

  @Post(':id/pasar-a-reconstruccion')
  @documentar({ salida: CambioEstadoDesastreSalida, descripcion: 'Desastre en Reconstrucción.' })
  @HttpCode(200)
  pasar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.pasar, { usuarioId, desastreId: id });
  }

  @Post(':id/cerrar')
  @documentar({ salida: CambioEstadoDesastreSalida, descripcion: 'Desastre cerrado.' })
  @HttpCode(200)
  cerrar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.cerrar, { usuarioId, desastreId: id });
  }
}
