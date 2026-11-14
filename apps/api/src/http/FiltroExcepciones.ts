import type { ArgumentsHost } from '@nestjs/common';
import {
  Catch,
  HttpException,
  Logger,
  PayloadTooLargeException,
  UnauthorizedException,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

/** Todas las respuestas de error siguen { codigo, regla?, mensaje, detalles }. */
@Catch()
export class FiltroExcepciones implements ExceptionFilter {
  private readonly log = new Logger('Errores');

  catch(e: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const enviar = (
      estado: number,
      codigo: string,
      mensaje: string,
      regla?: string,
      detalles: unknown[] = [],
    ) => res.status(estado).json({ codigo, ...(regla ? { regla } : {}), mensaje, detalles });

    if (e instanceof ZodValidationException) {
      const issues = (e.getZodError() as { issues?: unknown[] }).issues ?? [];
      return void enviar(400, 'DATOS_INVALIDOS', 'Los datos enviados no son válidos.', undefined, issues);
    }
    if (e instanceof UnauthorizedException)
      return void enviar(
        401,
        'NO_AUTENTICADO',
        e.message === 'Unauthorized' ? 'Debe iniciar sesión.' : e.message,
      );
    if (e instanceof PayloadTooLargeException) {
      return void enviar(422, 'REGLA_NEGOCIO', 'El archivo no puede superar 10 MB.', 'C09');
    }
    if (e instanceof HttpException) {
      const cuerpo = e.getResponse();
      if (typeof cuerpo === 'object' && cuerpo !== null && 'codigo' in cuerpo)
        return void res.status(e.getStatus()).json(cuerpo);
      const estado = e.getStatus();
      return void enviar(
        estado,
        estado === 404 ? 'NO_ENCONTRADO' : estado === 400 ? 'DATOS_INVALIDOS' : 'ERROR_HTTP',
        e.message,
      );
    }
    this.log.error(e);
    enviar(500, 'ERROR_INTERNO', 'Ocurrió un error inesperado.');
  }
}
