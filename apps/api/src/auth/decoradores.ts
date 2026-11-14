import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const ES_PUBLICO = 'esPublico';
/** Marca una ruta como pública (sin token). */
export const Publico = () => SetMetadata(ES_PUBLICO, true);

export type PeticionAutenticada = Request & { usuarioId?: string };

/** Entrega el id del usuario autenticado (lo pone el guard). */
export const UsuarioActual = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<PeticionAutenticada>().usuarioId ?? '';
});
