import { PolizaEstado } from '../models/poliza-list.model';

/** Debe coincidir con `PolizaEstadoDerivadoHelper.DiasUmbralPorVencer` en el backend. */
export const DIAS_UMBRAL_POR_VENCER = 10;

/**
 * Vista previa local del estado (misma regla que el API). El valor oficial viene del backend al guardar/cargar.
 */
export function calcularEstadoDesdeFechaExpiracion(fechaExp: Date | null): PolizaEstado {
  if (!fechaExp || !(fechaExp instanceof Date) || Number.isNaN(fechaExp.getTime())) {
    return 'vigente';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(fechaExp.getFullYear(), fechaExp.getMonth(), fechaExp.getDate());
  if (exp < today) {
    return 'expirado';
  }
  const diffMs = exp.getTime() - today.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days <= DIAS_UMBRAL_POR_VENCER) {
    return 'porVencer';
  }
  return 'vigente';
}
