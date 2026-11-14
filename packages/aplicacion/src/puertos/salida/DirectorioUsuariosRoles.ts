export type Rol = 'AUTORIDAD' | 'APROBADOR' | 'RESPONSABLE';

export interface UsuarioConRoles {
  readonly id: string;
  readonly nombre: string;
  readonly roles: readonly Rol[];
  readonly activo: boolean;
}

export interface DirectorioUsuariosRoles {
  obtener(usuarioId: string): Promise<UsuarioConRoles | null>;
}
