import type { EventoDominio } from '../../comun/EventoDominio.js';

export function desastrePasoAReconstruccion(
  desastreId: string,
  usuarioId: string,
  ocurridoEn: Date,
): EventoDominio {
  return { tipo: 'DesastrePasoAReconstruccion', agregadoId: desastreId, ocurridoEn, datos: { usuarioId } };
}

export function desastreCerrado(desastreId: string, usuarioId: string, ocurridoEn: Date): EventoDominio {
  return { tipo: 'DesastreCerrado', agregadoId: desastreId, ocurridoEn, datos: { usuarioId } };
}
