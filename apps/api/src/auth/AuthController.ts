import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LoginEntrada } from '@reconstruccion/contratos';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { Publico } from './decoradores.js';
import { ServicioAuth } from './ServicioAuth.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(ServicioAuth) private readonly auth: ServicioAuth) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  @ApiBody({ schema: z.toJSONSchema(LoginEntrada) as object })
  login(@Body(new ZodValidationPipe(LoginEntrada)) cuerpo: LoginEntrada) {
    return this.auth.login(cuerpo.correo, cuerpo.contrasena);
  }
}
