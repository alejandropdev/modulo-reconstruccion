import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  AdjuntarEvidenciaEntrada,
  ConsultarProyectosQuery,
  CrearHitoEntrada,
  CrearProyectoEntrada,
  CrearProyectosMasivoEntrada,
  EditarHitoEntrada,
  IniciarEjecucionEntrada,
  MotivoEntrada,
  RegistrarAvanceEntrada,
  RegistrarCostoEntrada,
  ResolverCambioPresupuestoEntrada,
  SolicitarCambioPresupuestoEntrada,
} from '@reconstruccion/contratos';
import { ZodValidationPipe } from 'nestjs-zod';
import { Readable } from 'node:stream';
import { z } from 'zod';
import { UsuarioActual } from '../auth/decoradores.js';
import { ejecutarCaso } from '../http/PresentadorHttp.js';
import { CASOS_PROYECTOS } from '../tokens.js';
import type { CasosProyectos } from './crearCasosProyectos.js';

const doc = (esquema: z.ZodType) => ApiBody({ schema: z.toJSONSchema(esquema) as object });
const validar = <T extends z.ZodType>(esquema: T) => new ZodValidationPipe(esquema);

@ApiTags('proyectos')
@ApiBearerAuth()
@Controller('proyectos')
export class ProyectosController {
  constructor(@Inject(CASOS_PROYECTOS) private readonly casos: CasosProyectos) {}

  @Post()
  @doc(CrearProyectoEntrada)
  crear(@UsuarioActual() usuarioId: string, @Body(validar(CrearProyectoEntrada)) c: CrearProyectoEntrada) {
    return ejecutarCaso(this.casos.crear, { usuarioId, ...c });
  }

  @Post('masivo')
  @HttpCode(200)
  @doc(CrearProyectosMasivoEntrada)
  masivo(
    @UsuarioActual() usuarioId: string,
    @Body(validar(CrearProyectosMasivoEntrada)) c: z.infer<typeof CrearProyectosMasivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.masivo, { usuarioId, proyectos: c.proyectos });
  }

  @Get()
  listar(
    @UsuarioActual() usuarioId: string,
    @Query(validar(ConsultarProyectosQuery)) q: z.infer<typeof ConsultarProyectosQuery>,
  ) {
    return ejecutarCaso(this.casos.consultar, { usuarioId, ...q }).then((r) =>
      r.tipo === 'LISTA' ? { items: r.items, total: r.total, pagina: r.pagina, tamano: r.tamano } : undefined,
    );
  }

  @Get(':id')
  detalle(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.consultar, { usuarioId, proyectoId: id }).then((r) =>
      r.tipo === 'DETALLE' ? r.detalle : undefined,
    );
  }

  @Post(':id/aprobar')
  @HttpCode(200)
  aprobar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.aprobar, { usuarioId, proyectoId: id });
  }

  @Post(':id/iniciar')
  @HttpCode(200)
  @doc(IniciarEjecucionEntrada)
  iniciar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(IniciarEjecucionEntrada)) c: z.infer<typeof IniciarEjecucionEntrada>,
  ) {
    return ejecutarCaso(this.casos.iniciar, { usuarioId, proyectoId: id, contratista: c.contratista });
  }

  @Post(':id/suspender')
  @HttpCode(200)
  @doc(MotivoEntrada)
  suspender(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.suspender, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @Post(':id/reanudar')
  @HttpCode(200)
  @doc(MotivoEntrada)
  reanudar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.reanudar, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @Post(':id/finalizar')
  @HttpCode(200)
  finalizar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.finalizar, { usuarioId, proyectoId: id });
  }

  @Post(':id/cancelar')
  @HttpCode(200)
  @doc(MotivoEntrada)
  cancelar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.cancelar, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @Post(':id/cambios-presupuesto')
  @doc(SolicitarCambioPresupuestoEntrada)
  solicitarCambio(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(SolicitarCambioPresupuestoEntrada)) c: z.infer<typeof SolicitarCambioPresupuestoEntrada>,
  ) {
    return ejecutarCaso(this.casos.solicitarCambio, { usuarioId, proyectoId: id, ...c });
  }

  @Post(':id/cambios-presupuesto/:cambioId/resolucion')
  @HttpCode(200)
  @doc(ResolverCambioPresupuestoEntrada)
  resolverCambio(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('cambioId') cambioId: string,
    @Body(validar(ResolverCambioPresupuestoEntrada)) c: z.infer<typeof ResolverCambioPresupuestoEntrada>,
  ) {
    return ejecutarCaso(this.casos.resolverCambio, { usuarioId, proyectoId: id, cambioId, ...c });
  }

  @Post(':id/avances')
  @doc(RegistrarAvanceEntrada)
  avance(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(RegistrarAvanceEntrada)) c: z.infer<typeof RegistrarAvanceEntrada>,
  ) {
    return ejecutarCaso(this.casos.avance, { usuarioId, proyectoId: id, porcentaje: c.porcentaje });
  }

  @Post(':id/costos')
  @doc(RegistrarCostoEntrada)
  costo(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(RegistrarCostoEntrada)) c: z.infer<typeof RegistrarCostoEntrada>,
  ) {
    return ejecutarCaso(this.casos.costo, { usuarioId, proyectoId: id, ...c });
  }

  @Post(':id/hitos')
  @doc(CrearHitoEntrada)
  agregarHito(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(CrearHitoEntrada)) c: z.infer<typeof CrearHitoEntrada>,
  ) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'AGREGAR', ...c });
  }

  @Patch(':id/hitos/:hitoId')
  @doc(EditarHitoEntrada)
  editarHito(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('hitoId') hitoId: string,
    @Body(validar(EditarHitoEntrada)) c: z.infer<typeof EditarHitoEntrada>,
  ) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'EDITAR', hitoId, ...c });
  }

  @Delete(':id/hitos/:hitoId')
  eliminarHito(@UsuarioActual() usuarioId: string, @Param('id') id: string, @Param('hitoId') hitoId: string) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'ELIMINAR', hitoId });
  }

  @Post(':id/evidencias')
  @UseInterceptors(FileInterceptor('archivo', { limits: { fileSize: 10 * 1024 * 1024 } }))
  adjuntarEvidencia(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(AdjuntarEvidenciaEntrada)) c: z.infer<typeof AdjuntarEvidenciaEntrada>,
    @UploadedFile() archivo: Express.Multer.File | undefined,
  ) {
    if (!archivo) throw new BadRequestException('Falta el archivo (campo "archivo").');
    return ejecutarCaso(this.casos.evidencia, {
      usuarioId,
      proyectoId: id,
      tipo: c.tipo,
      nombreArchivo: archivo.originalname,
      tipoMime: archivo.mimetype,
      contenido: new Uint8Array(archivo.buffer),
    });
  }

  @Get(':id/evidencias/:evidenciaId/archivo')
  async archivo(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('evidenciaId') evidenciaId: string,
  ) {
    const r = await ejecutarCaso(this.casos.archivo, { usuarioId, proyectoId: id, evidenciaId });
    return new StreamableFile(Readable.from(r.contenido), {
      type: r.tipoMime,
      disposition: `attachment; filename="${encodeURIComponent(r.nombreArchivo)}"`,
    });
  }
}
