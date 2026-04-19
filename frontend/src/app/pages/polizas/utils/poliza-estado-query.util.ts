import { PolizaEstado } from '../models/poliza-list.model';

const VALID = new Set<string>(['vigente', 'porVencer', 'expirado']);

/** Lee `estado` de la URL (`/polizas?estado=…`). Valores inválidos → `todos`. */
export function polizaEstadoFromQueryParam(raw: string | null | undefined): PolizaEstado | 'todos' {
  if (raw != null && VALID.has(raw)) {
    return raw as PolizaEstado;
  }
  return 'todos';
}
