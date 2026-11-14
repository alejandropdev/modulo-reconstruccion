import type { ErrorApi } from '@reconstruccion/contratos';

/** Error de la API con el formato { codigo, regla?, mensaje, detalles }. */
export class ErrorDeApi extends Error {
  constructor(
    readonly info: ErrorApi,
    readonly estado: number,
  ) {
    super(info.mensaje);
  }

  /** Texto para el usuario, p. ej. "R08 — El proyecto necesita contratista y al menos un hito". */
  get texto(): string {
    return `${this.info.regla ?? this.info.codigo} — ${this.info.mensaje}`;
  }
}

let token: string | null = sessionStorage.getItem('token');

export function guardarToken(nuevo: string | null): void {
  token = nuevo;
  if (nuevo) sessionStorage.setItem('token', nuevo);
  else sessionStorage.removeItem('token');
}

const BASE = '/api/v1';

async function pedir(metodo: string, ruta: string, cuerpo?: BodyInit | object): Promise<Response> {
  const esFormulario = cuerpo instanceof FormData;
  const respuesta = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(cuerpo && !esFormulario ? { 'content-type': 'application/json' } : {}),
    },
    body: cuerpo === undefined ? null : esFormulario ? cuerpo : JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) {
    const info = (await respuesta.json().catch(() => null)) as ErrorApi | null;
    if (respuesta.status === 401 && ruta !== '/auth/login') {
      guardarToken(null);
      sessionStorage.removeItem('usuario');
      window.location.assign('/login');
    }
    throw new ErrorDeApi(
      info ?? { codigo: 'ERROR_RED', mensaje: 'No se pudo completar la solicitud.', detalles: [] },
      respuesta.status,
    );
  }
  return respuesta;
}

const json = async <T>(r: Response): Promise<T> => (await r.json()) as T;

export const api = {
  get: async <T>(ruta: string): Promise<T> => json<T>(await pedir('GET', ruta)),
  post: async <T>(ruta: string, cuerpo: object | FormData = {}): Promise<T> =>
    json<T>(await pedir('POST', ruta, cuerpo)),
  patch: async <T>(ruta: string, cuerpo: object): Promise<T> => json<T>(await pedir('PATCH', ruta, cuerpo)),
  delete: async <T>(ruta: string): Promise<T> => json<T>(await pedir('DELETE', ruta)),
  /** Descarga un archivo autenticado y lo guarda en el navegador. */
  descargar: async (ruta: string, nombre: string): Promise<void> => {
    const blob = await (await pedir('GET', ruta)).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  },
};
