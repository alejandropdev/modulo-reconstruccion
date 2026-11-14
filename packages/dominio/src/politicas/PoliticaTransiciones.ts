import { TransicionInvalida } from '../comun/ErrorDominio.js';
import { EstadoProyecto } from '../proyecto/EstadoProyecto.js';

export type AccionProyecto = 'aprobar' | 'iniciar' | 'suspender' | 'reanudar' | 'finalizar' | 'cancelar';

const E = EstadoProyecto;

/** Diagrama de estados (R17). Lo que no está en la tabla es inválido. */
const TABLA: Readonly<Record<EstadoProyecto, Partial<Record<AccionProyecto, EstadoProyecto>>>> = {
  Formulado: { aprobar: E.Aprobado, cancelar: E.Cancelado },
  Aprobado: { iniciar: E.EnEjecucion, cancelar: E.Cancelado },
  EnEjecucion: { suspender: E.Suspendido, finalizar: E.Finalizado, cancelar: E.Cancelado },
  Suspendido: { reanudar: E.EnEjecucion, cancelar: E.Cancelado },
  Finalizado: {},
  Cancelado: {},
};

export class PoliticaTransiciones {
  verificar(estado: EstadoProyecto, accion: AccionProyecto): EstadoProyecto {
    const nuevo = TABLA[estado][accion];
    if (!nuevo) throw new TransicionInvalida(`No se puede ${accion} un proyecto en estado ${estado}.`);
    return nuevo;
  }
}
