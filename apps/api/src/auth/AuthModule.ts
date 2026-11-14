import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Configuracion } from '../config/Configuracion.js';
import { CONFIG, JWT } from '../tokens.js';
import { AuthController } from './AuthController.js';
import { GuardJwt } from './GuardJwt.js';
import { ServicioAuth } from './ServicioAuth.js';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: JWT,
      inject: [CONFIG],
      useFactory: (c: Configuracion) =>
        new JwtService({
          secret: c.JWT_SECRET,
          signOptions: { expiresIn: c.JWT_EXPIRA_EN as never, algorithm: 'HS256' },
        }),
    },
    ServicioAuth,
    { provide: APP_GUARD, useClass: GuardJwt },
  ],
  exports: [JWT],
})
export class AuthModule {}
