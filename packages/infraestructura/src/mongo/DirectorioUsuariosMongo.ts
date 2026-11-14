import type { DirectorioUsuariosRoles, Rol, UsuarioConRoles } from '@reconstruccion/aplicacion';
import type { Db } from 'mongodb';

interface DocumentoUsuario {
  _id: string;
  nombre: string;
  correo: string;
  hashContrasena: string;
  roles: Rol[];
  activo: boolean;
}

export class DirectorioUsuariosMongo implements DirectorioUsuariosRoles {
  constructor(private readonly db: Db) {}

  async obtener(usuarioId: string): Promise<UsuarioConRoles | null> {
    const u = await this.db.collection<DocumentoUsuario>('usuarios').findOne({ _id: usuarioId });
    return u ? { id: u._id, nombre: u.nombre, roles: u.roles, activo: u.activo } : null;
  }
}
