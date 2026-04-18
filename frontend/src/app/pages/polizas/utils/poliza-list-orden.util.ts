import { PolizaEstado, PolizaListRow } from '../models/poliza-list.model';

/** Compara fechas ISO `yyyy-MM-dd` (ascendente). */
export function compareFechaExpiracionAsc(aIso: string, bIso: string): number {
  return aIso.localeCompare(bIso);
}

/** Orden de listado general: vencimiento más cercano primero. */
export function sortPolizasByExpiracionAsc(rows: readonly PolizaListRow[]): PolizaListRow[] {
  return [...rows].sort((a, b) => compareFechaExpiracionAsc(a.fechaExpiracion, b.fechaExpiracion));
}

function prioridadEstadoDashboard(e: PolizaEstado): number {
  switch (e) {
    case 'expirado':
      return 0;
    case 'porVencer':
      return 1;
    default:
      return 2;
  }
}

/**
 * Dashboard: expiradas → por vencer → vigentes; dentro de cada grupo, expiración ascendente.
 */
export function sortPolizasForDashboard(rows: readonly PolizaListRow[]): PolizaListRow[] {
  return [...rows].sort((a, b) => {
    const pe = prioridadEstadoDashboard(a.estado) - prioridadEstadoDashboard(b.estado);
    if (pe !== 0) {
      return pe;
    }
    return compareFechaExpiracionAsc(a.fechaExpiracion, b.fechaExpiracion);
  });
}

/** Días hasta la fecha de expiración (ISO fecha); negativo si ya venció. Solo parte fecha (medianoche local). */
export function diasRestantesDesdeIso(fechaIso: string): number {
  const part = fechaIso.slice(0, 10);
  const [y, m, d] = part.split('-').map(Number);
  if (!y || !m || !d) {
    return NaN;
  }
  const exp = new Date(y, m - 1, d);
  exp.setHours(0, 0, 0, 0);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((exp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Texto humano para la columna «días restantes» (misma base numérica que {@link diasRestantesDesdeIso}).
 * No muestra valores negativos en bruto.
 */
export function formatDiasRestantesDesdeIso(fechaIso: string): string {
  const n = diasRestantesDesdeIso(fechaIso);
  if (Number.isNaN(n)) {
    return '—';
  }
  if (n < 0) {
    const x = Math.abs(n);
    return x === 1 ? 'Vencido hace 1 día' : `Vencido hace ${x} días`;
  }
  if (n === 0) {
    return 'Vence hoy';
  }
  if (n === 1) {
    return 'Vence mañana';
  }
  return `En ${n} días`;
}
