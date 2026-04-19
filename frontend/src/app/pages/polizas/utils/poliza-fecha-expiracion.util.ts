/** Ramos con vigencia de un mes desde la fecha de emisión. */
export const RAMOS_POLIZA_VIGENCIA_UN_MES = ['Buen Uso de Anticipo', 'Fiel Cumplimiento'] as const;

/** Ramo con vigencia de un año desde la fecha de emisión. */
export const RAMO_POLIZA_VIGENCIA_UN_ANIO = 'Cumplimiento al Manejo Ambiental';

/**
 * Calcula la fecha de expiración según el nombre del ramo y la fecha de emisión (solo fecha local).
 * Devuelve `null` si falta emisión o ramo, o si el nombre del ramo no coincide con ninguna regla.
 */
export function calcularFechaExpiracionPoliza(
  fechaEmision: Date | null,
  nombreRamo: string | null | undefined,
): Date | null {
  if (!fechaEmision || Number.isNaN(fechaEmision.getTime())) {
    return null;
  }
  const nombre = nombreRamo?.trim();
  if (!nombre) {
    return null;
  }

  const base = new Date(
    fechaEmision.getFullYear(),
    fechaEmision.getMonth(),
    fechaEmision.getDate(),
  );

  if ((RAMOS_POLIZA_VIGENCIA_UN_MES as readonly string[]).includes(nombre)) {
    const out = new Date(base);
    out.setMonth(out.getMonth() + 1);
    return out;
  }

  if (nombre === RAMO_POLIZA_VIGENCIA_UN_ANIO) {
    const out = new Date(base);
    out.setFullYear(out.getFullYear() + 1);
    return out;
  }

  return null;
}

export interface RamoNombrePorId {
  id: string;
  nombre: string;
}

/** Actualiza el control de expiración según emisión y ramo seleccionado. */
export function sincronizarFechaExpiracionPoliza(
  fechaEmision: Date | null,
  ramoId: string | null | undefined,
  ramos: readonly RamoNombrePorId[],
  controlExpiracion: { setValue: (v: Date | null, opts?: { emitEvent?: boolean }) => void },
): void {
  const nombre = ramos.find((r) => r.id === ramoId)?.nombre ?? null;
  controlExpiracion.setValue(calcularFechaExpiracionPoliza(fechaEmision, nombre), { emitEvent: false });
}
