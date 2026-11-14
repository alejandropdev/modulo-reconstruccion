import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { verify } from '@node-rs/argon2';
import type { LoginSalida, Rol } from '@reconstruccion/contratos';
import type { ConexionMongo } from '@reconstruccion/infraestructura';
import { CONEXION, JWT } from '../tokens.js';

interface DocumentoUsuario {
  _id: string;
  nombre: string;
  correo: string;
  hashContrasena: string;
  roles: Rol[];
  activo: boolean;
}

@Injectable()
export class ServicioAuth {
  constructor(
    @Inject(CONEXION) private readonly conexion: ConexionMongo,
    @Inject(JWT) private readonly jwt: JwtService,
  ) {}

  async login(correo: string, contrasena: string): Promise<LoginSalida> {
    const usuario = await this.conexion.db.collection<DocumentoUsuario>('usuarios').findOne({ correo });
    const valido = usuario?.activo && (await verify(usuario.hashContrasena, contrasena).catch(() => false));
    if (!usuario || !valido) throw new UnauthorizedException('Credenciales inválidas');
    const token = await this.jwt.signAsync({ sub: usuario._id });
    return { token, usuario: { id: usuario._id, nombre: usuario.nombre, roles: usuario.roles } };
  }
}
