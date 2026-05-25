/** Cuenta filtros avanzados activos en Control Maestro (fechas y ramo). */
export function countControlMaestroAdvancedFilters(state: {
  fechaDesde: Date | null;
  fechaHasta: Date | null;
  ramoId: string | null;
}): number {
  let count = 0;

  if (state.fechaDesde || state.fechaHasta) {
    count++;
  }
  if (state.ramoId) {
    count++;
  }

  return count;
}
