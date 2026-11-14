import type { GeneradorIds } from '@reconstruccion/aplicacion';
import { randomUUID } from 'node:crypto';

export class GeneradorIdsUuid implements GeneradorIds {
  nuevo(): string {
    return randomUUID();
  }
}
