import type { LoginSalida, Rol } from '@reconstruccion/contratos';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, guardarToken } from '../api/cliente';

type Usuario = LoginSalida['usuario'];

interface ContextoSesion {
  usuario: Usuario | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => void;
  tieneRol: (rol: Rol) => boolean;
}

const Contexto = createContext<ContextoSesion | null>(null);

function usuarioGuardado(): Usuario | null {
  try {
    return JSON.parse(sessionStorage.getItem('usuario') ?? 'null') as Usuario | null;
  } catch {
    return null;
  }
}

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioGuardado);

  const login = async (correo: string, contrasena: string) => {
    const r = await api.post<LoginSalida>('/auth/login', { correo, contrasena });
    guardarToken(r.token);
    sessionStorage.setItem('usuario', JSON.stringify(r.usuario));
    setUsuario(r.usuario);
  };
  const logout = () => {
    guardarToken(null);
    sessionStorage.removeItem('usuario');
    setUsuario(null);
  };
  const tieneRol = (rol: Rol) => usuario?.roles.includes(rol) ?? false;

  return <Contexto.Provider value={{ usuario, login, logout, tieneRol }}>{children}</Contexto.Provider>;
}

export function useSesion(): ContextoSesion {
  const c = useContext(Contexto);
  if (!c) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return c;
}
