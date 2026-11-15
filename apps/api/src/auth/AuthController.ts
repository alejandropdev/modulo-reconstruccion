import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginEntrada, LoginSalida } from '@reconstruccion/contratos';
import { ZodValidationPipe } from 'nestjs-zod';
import { documentar, documentarErrores } from '../http/documentacion.js';
import { Publico } from './decoradores.js';
import { ServicioAuth } from './ServicioAuth.js';

@ApiTags('auth')
@documentarErrores()
@Controller('auth')
export class AuthController {
  constructor(@Inject(ServicioAuth) private readonly auth: ServicioAuth) {}

  @Publico()
  @Post('login')
  @HttpCode(200)
  @documentar({ entrada: LoginEntrada, salida: LoginSalida, descripcion: 'Token JWT y datos del usuario.' })
  login(@Body(new ZodValidationPipe(LoginEntrada)) cuerpo: LoginEntrada) {
    return this.auth.login(cuerpo.correo, cuerpo.contrasena);
  }
}
