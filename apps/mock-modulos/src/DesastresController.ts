import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { DatosEnMemoria } from './DatosEnMemoria.js';

const ESTADOS = ['REGISTRO', 'CARACTERIZACION', 'RECONSTRUCCION', 'CERRADO'];

@Controller('desastres')
export class DesastresController {
  constructor(@Inject(DatosEnMemoria) private readonly datos: DatosEnMemoria) {}

  @Get()
  listar() {
    return this.datos.desastres;
  }

  @Get(':id')
  obtener(@Param('id') id: string) {
    const desastre = this.datos.desastres.find((d) => d.id === id);
    if (!desastre) throw new NotFoundException();
    return desastre;
  }

  @Patch(':id/estado')
  cambiarEstado(@Param('id') id: string, @Body() cuerpo: { estado?: string }) {
    const desastre = this.obtener(id);
    if (!cuerpo?.estado || !ESTADOS.includes(cuerpo.estado)) throw new BadRequestException('Estado inválido');
    desastre.estado = cuerpo.estado;
    return desastre;
  }
}
