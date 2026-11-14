import type { Dinero } from '../comun/Dinero.js';

export interface Costo {
  readonly id: string;
  readonly valor: Dinero;
  readonly concepto: string;
  readonly usuarioId: string;
  readonly fechaHora: Date;
}
