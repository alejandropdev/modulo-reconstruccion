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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdjuntarEvidenciaEntrada,
  CambioEstadoProyectoSalida,
  CambioPresupuestoSalida,
  ConsultarProyectosQuery,
  CrearHitoEntrada,
  CrearProyectoEntrada,
  CrearProyectoSalida,
  CrearProyectosMasivoEntrada,
  DetalleProyectoSalida,
  EditarHitoEntrada,
  EvidenciaSalida,
  HitoSalida,
  IniciarEjecucionEntrada,
  ListaProyectosSalida,
  MotivoEntrada,
  RegistrarAvanceEntrada,
  RegistrarAvanceSalida,
  RegistrarCostoEntrada,
  RegistrarCostoSalida,
  ReporteMasivoSalida,
  ResolverCambioPresupuestoEntrada,
  SolicitarCambioPresupuestoEntrada,
  TipoEvidencia,
} from '@reconstruccion/contratos';
import { ZodValidationPipe } from 'nestjs-zod';
import { Readable } from 'node:stream';
import type { z } from 'zod';
import { UsuarioActual } from '../auth/decoradores.js';
import { documentar, documentarDescarga, documentarErrores, documentarSubida } from '../http/documentacion.js';
import { ejecutarCaso } from '../http/PresentadorHttp.js';
import { CASOS_PROYECTOS } from '../tokens.js';
import type { CasosProyectos } from './crearCasosProyectos.js';

const validar = <T extends z.ZodType>(esquema: T) => new ZodValidationPipe(esquema);

@ApiTags('proyectos')
@ApiBearerAuth()
@documentarErrores()
@Controller('proyectos')
export class ProyectosController {
  constructor(@Inject(CASOS_PROYECTOS) private readonly casos: CasosProyectos) {}

  @documentar({ entrada: CrearProyectoEntrada, salida: CrearProyectoSalida, creado: true, descripcion: 'Proyecto creado en estado Formulado.' })
  @Post()
  crear(@UsuarioActual() usuarioId: string, @Body(validar(CrearProyectoEntrada)) c: CrearProyectoEntrada) {
    return ejecutarCaso(this.casos.crear, { usuarioId, ...c });
  }

  @documentar({ entrada: CrearProyectosMasivoEntrada, salida: ReporteMasivoSalida, descripcion: 'Reporte con el resultado de cada fila (C07: creación parcial).' })
  @Post('masivo')
  @HttpCode(200)
  masivo(
    @UsuarioActual() usuarioId: string,
    @Body(validar(CrearProyectosMasivoEntrada)) c: z.infer<typeof CrearProyectosMasivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.masivo, { usuarioId, proyectos: c.proyectos });
  }

  @documentar({ consulta: ConsultarProyectosQuery, salida: ListaProyectosSalida, descripcion: 'Página de proyectos.' })
  @Get()
  listar(
    @UsuarioActual() usuarioId: string,
    @Query(validar(ConsultarProyectosQuery)) q: z.infer<typeof ConsultarProyectosQuery>,
  ) {
    return ejecutarCaso(this.casos.consultar, { usuarioId, ...q }).then((r) =>
      r.tipo === 'LISTA' ? { items: r.items, total: r.total, pagina: r.pagina, tamano: r.tamano } : undefined,
    );
  }

  @documentar({ salida: DetalleProyectoSalida, descripcion: 'Detalle del proyecto con historiales y avances.' })
  @Get(':id')
  detalle(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.consultar, { usuarioId, proyectoId: id }).then((r) =>
      r.tipo === 'DETALLE' ? r.detalle : undefined,
    );
  }

  @documentar({ salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto aprobado.' })
  @Post(':id/aprobar')
  @HttpCode(200)
  aprobar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.aprobar, { usuarioId, proyectoId: id });
  }

  @documentar({ entrada: IniciarEjecucionEntrada, salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto en ejecución.' })
  @Post(':id/iniciar')
  @HttpCode(200)
  iniciar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(IniciarEjecucionEntrada)) c: z.infer<typeof IniciarEjecucionEntrada>,
  ) {
    return ejecutarCaso(this.casos.iniciar, { usuarioId, proyectoId: id, contratista: c.contratista });
  }

  @documentar({ entrada: MotivoEntrada, salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto suspendido.' })
  @Post(':id/suspender')
  @HttpCode(200)
  suspender(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.suspender, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @documentar({ entrada: MotivoEntrada, salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto reanudado.' })
  @Post(':id/reanudar')
  @HttpCode(200)
  reanudar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.reanudar, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @documentar({ salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto finalizado.' })
  @Post(':id/finalizar')
  @HttpCode(200)
  finalizar(@UsuarioActual() usuarioId: string, @Param('id') id: string) {
    return ejecutarCaso(this.casos.finalizar, { usuarioId, proyectoId: id });
  }

  @documentar({ entrada: MotivoEntrada, salida: CambioEstadoProyectoSalida, descripcion: 'Proyecto cancelado.' })
  @Post(':id/cancelar')
  @HttpCode(200)
  cancelar(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(MotivoEntrada)) c: z.infer<typeof MotivoEntrada>,
  ) {
    return ejecutarCaso(this.casos.cancelar, { usuarioId, proyectoId: id, motivo: c.motivo });
  }

  @documentar({ entrada: SolicitarCambioPresupuestoEntrada, salida: CambioPresupuestoSalida, creado: true, descripcion: 'Cambio aplicado de inmediato o pendiente de aprobación (R12).' })
  @Post(':id/cambios-presupuesto')
  solicitarCambio(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(SolicitarCambioPresupuestoEntrada)) c: z.infer<typeof SolicitarCambioPresupuestoEntrada>,
  ) {
    return ejecutarCaso(this.casos.solicitarCambio, { usuarioId, proyectoId: id, ...c });
  }

  @documentar({ entrada: ResolverCambioPresupuestoEntrada, salida: CambioPresupuestoSalida, descripcion: 'Cambio aprobado o rechazado.' })
  @Post(':id/cambios-presupuesto/:cambioId/resolucion')
  @HttpCode(200)
  resolverCambio(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('cambioId') cambioId: string,
    @Body(validar(ResolverCambioPresupuestoEntrada)) c: z.infer<typeof ResolverCambioPresupuestoEntrada>,
  ) {
    return ejecutarCaso(this.casos.resolverCambio, { usuarioId, proyectoId: id, cambioId, ...c });
  }

  @documentar({ entrada: RegistrarAvanceEntrada, salida: RegistrarAvanceSalida, creado: true, descripcion: 'Avance registrado.' })
  @Post(':id/avances')
  avance(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(RegistrarAvanceEntrada)) c: z.infer<typeof RegistrarAvanceEntrada>,
  ) {
    return ejecutarCaso(this.casos.avance, { usuarioId, proyectoId: id, porcentaje: c.porcentaje });
  }

  @documentar({ entrada: RegistrarCostoEntrada, salida: RegistrarCostoSalida, creado: true, descripcion: 'Costo registrado.' })
  @Post(':id/costos')
  costo(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(RegistrarCostoEntrada)) c: z.infer<typeof RegistrarCostoEntrada>,
  ) {
    return ejecutarCaso(this.casos.costo, { usuarioId, proyectoId: id, ...c });
  }

  @documentar({ entrada: CrearHitoEntrada, salida: HitoSalida, creado: true, descripcion: 'Hito agregado.' })
  @Post(':id/hitos')
  agregarHito(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Body(validar(CrearHitoEntrada)) c: z.infer<typeof CrearHitoEntrada>,
  ) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'AGREGAR', ...c });
  }

  @documentar({ entrada: EditarHitoEntrada, salida: HitoSalida, descripcion: 'Hito actualizado.' })
  @Patch(':id/hitos/:hitoId')
  editarHito(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('hitoId') hitoId: string,
    @Body(validar(EditarHitoEntrada)) c: z.infer<typeof EditarHitoEntrada>,
  ) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'EDITAR', hitoId, ...c });
  }

  @documentar({ salida: HitoSalida, descripcion: 'Hito eliminado.' })
  @Delete(':id/hitos/:hitoId')
  eliminarHito(@UsuarioActual() usuarioId: string, @Param('id') id: string, @Param('hitoId') hitoId: string) {
    return ejecutarCaso(this.casos.hito, { usuarioId, proyectoId: id, accion: 'ELIMINAR', hitoId });
  }

  @Post(':id/evidencias')
  @documentar({ salida: EvidenciaSalida, creado: true, descripcion: 'Evidencia adjuntada.' })
  @documentarSubida(TipoEvidencia.options)
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
      // Multer entrega el nombre en latin1; los navegadores lo envían en UTF-8 (tildes, ñ).
      nombreArchivo: Buffer.from(archivo.originalname, 'latin1').toString('utf8'),
      tipoMime: archivo.mimetype,
      contenido: new Uint8Array(archivo.buffer),
    });
  }

  @Get(':id/evidencias/:evidenciaId/archivo')
  @documentarDescarga('Contenido del archivo de la evidencia.')
  async archivo(
    @UsuarioActual() usuarioId: string,
    @Param('id') id: string,
    @Param('evidenciaId') evidenciaId: string,
  ) {
    const r = await ejecutarCaso(this.casos.archivo, { usuarioId, proyectoId: id, evidenciaId });
    return new StreamableFile(Readable.from(r.contenido), {
      type: r.tipoMime,
      disposition: `attachment; filename*=UTF-8''${encodeURIComponent(r.nombreArchivo)}`,
    });
  }
}
