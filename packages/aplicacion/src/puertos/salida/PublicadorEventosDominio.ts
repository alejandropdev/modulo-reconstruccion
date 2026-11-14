import type { EventoDominio } from '@reconstruccion/dominio';

export interface PublicadorEventosDominio {
  publicar(eventos: readonly EventoDominio[]): Promise<void>;
}
