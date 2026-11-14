import { AsyncLocalStorage } from 'node:async_hooks';
import type { ClientSession } from 'mongodb';

/** Sesión de la transacción en curso; los adaptadores la leen para participar en ella. */
export const ContextoSesion = new AsyncLocalStorage<ClientSession>();

export function sesionActual(): ClientSession | undefined {
  return ContextoSesion.getStore();
}

/** Opciones comunes de las operaciones de Mongo: incluyen la sesión si hay transacción. */
export function opciones(): { session: ClientSession } | Record<string, never> {
  const session = sesionActual();
  return session ? { session } : {};
}
