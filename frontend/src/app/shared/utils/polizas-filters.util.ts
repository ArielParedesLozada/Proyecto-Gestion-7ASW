import { PolizaEstado } from '../../pages/polizas/models/poliza-list.model';

export interface PolizasAdvancedFilterState {
  contratista: string;
  aseguradora: string;
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  ramo: string | 'todos';
  estado: PolizaEstado | 'todos';
}

/** Cuenta filtros avanzados activos (excluye búsqueda global). */
export function countPolizasAdvancedFilters(state: PolizasAdvancedFilterState): number {
  let count = 0;

  if (state.contratista.trim()) {
    count++;
  }
  if (state.aseguradora.trim()) {
    count++;
  }
  if (state.fechaDesde || state.fechaHasta) {
    count++;
  }
  if (state.ramo !== 'todos') {
    count++;
  }
  if (state.estado !== 'todos') {
    count++;
  }

  return count;
}
