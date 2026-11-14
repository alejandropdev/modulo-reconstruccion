import { ReglaNegocioViolada } from '../comun/ErrorDominio.js';
import { NivelDano } from '../proyecto/NivelDano.js';
import { TipoIntervencion } from '../proyecto/TipoIntervencion.js';

const ORDEN: readonly NivelDano[] = [NivelDano.LEVE, NivelDano.MODERADO, NivelDano.SEVERO, NivelDano.TOTAL];

const PERMITIDOS: Readonly<Record<NivelDano, readonly TipoIntervencion[]>> = {
  LEVE: [TipoIntervencion.REPARACION],
  MODERADO: [TipoIntervencion.REHABILITACION, TipoIntervencion.REFORZAMIENTO],
  SEVERO: [TipoIntervencion.RECONSTRUCCION],
  TOTAL: [TipoIntervencion.RECONSTRUCCION, TipoIntervencion.REUBICACION],
};

/** C05: el tipo de intervención depende del mayor nivel de daño de las evaluaciones. */
export class PoliticaTipoIntervencion {
  nivelMayor(niveles: readonly NivelDano[]): NivelDano {
    return niveles.reduce(
      (mayor, n) => (ORDEN.indexOf(n) > ORDEN.indexOf(mayor) ? n : mayor),
      NivelDano.LEVE,
    );
  }

  permitidos(niveles: readonly NivelDano[]): readonly TipoIntervencion[] {
    return PERMITIDOS[this.nivelMayor(niveles)];
  }

  verificar(tipo: TipoIntervencion, niveles: readonly NivelDano[]): void {
    const permitidos = this.permitidos(niveles);
    if (!permitidos.includes(tipo)) {
      throw new ReglaNegocioViolada(
        'C05',
        `Con nivel de daño ${this.nivelMayor(niveles)} solo se permite: ${permitidos.join(', ')}.`,
      );
    }
  }
}
