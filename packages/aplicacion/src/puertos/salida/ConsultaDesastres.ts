import type { EstadoDesastre } from '@reconstruccion/dominio';

export interface Desastre {
  readonly id: string;
  readonly nombre: string;
  readonly estado: EstadoDesastre;
  readonly municipio: string;
  readonly fechaOcurrencia: string;
}

export interface ConsultaDesastres {
  obtener(id: string): Promise<Desastre | null>;
  listar(): Promise<Desastre[]>;
}
