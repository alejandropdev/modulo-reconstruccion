import { ServicioExternoNoDisponible } from '@reconstruccion/dominio';

/** Cliente HTTP mínimo con timeout. Errores de red o 5xx → ServicioExternoNoDisponible. */
export class ClienteHttp {
  constructor(
    private readonly urlBase: string,
    private readonly timeoutMs = 3000,
  ) {}

  /** Devuelve `null` si la respuesta es 404. */
  async solicitar<T>(metodo: 'GET' | 'PATCH', ruta: string, cuerpo?: unknown): Promise<T | null> {
    let respuesta: Response;
    try {
      respuesta = await fetch(`${this.urlBase}${ruta}`, {
        method: metodo,
        headers: cuerpo === undefined ? {} : { 'content-type': 'application/json' },
        body: cuerpo === undefined ? null : JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (e) {
      throw new ServicioExternoNoDisponible(
        `No se pudo contactar el módulo externo: ${(e as Error).message}`,
      );
    }
    if (respuesta.status === 404) return null;
    if (!respuesta.ok)
      throw new ServicioExternoNoDisponible(`El módulo externo respondió ${respuesta.status}.`);
    return (await respuesta.json()) as T;
  }
}
