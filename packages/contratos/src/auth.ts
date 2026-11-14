import { z } from 'zod';
import { Rol } from './comunes.js';

export const LoginEntrada = z.object({ correo: z.email(), contrasena: z.string().min(1) });
export const LoginSalida = z.object({
  token: z.string(),
  usuario: z.object({ id: z.string(), nombre: z.string(), roles: z.array(Rol) }),
});

export type LoginEntrada = z.infer<typeof LoginEntrada>;
export type LoginSalida = z.infer<typeof LoginSalida>;
