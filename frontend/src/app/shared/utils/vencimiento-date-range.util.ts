/** Rango de vencimiento (fecha de expiración de póliza). */

export interface VencimientoDateRangeValidation {
  valid: boolean;
  message?: string;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** true si hay al menos una fecha y falta la otra. */
export function hasPartialVencimientoRange(desde: Date | null, hasta: Date | null): boolean {
  const hasDesde = !!desde;
  const hasHasta = !!hasta;
  return hasDesde !== hasHasta;
}

export function validateVencimientoDateRange(
  desde: Date | null,
  hasta: Date | null,
): VencimientoDateRangeValidation {
  if (!desde && !hasta) {
    return { valid: true };
  }

  if (!desde) {
    return {
      valid: false,
      message: 'Selecciona también «Vence desde» para aplicar el filtro por fechas.',
    };
  }

  if (!hasta) {
    return {
      valid: false,
      message: 'Selecciona también «Vence hasta» para aplicar el filtro por fechas.',
    };
  }

  const desdeDay = startOfDay(desde).getTime();
  const hastaDay = startOfDay(hasta).getTime();

  if (desdeDay > hastaDay) {
    return {
      valid: false,
      message: '«Vence desde» no puede ser posterior a «Vence hasta».',
    };
  }

  return { valid: true };
}

/** Filtra por expiración solo cuando el rango está completo y es válido. */
export function matchesVencimientoRange(
  fechaExpiracion: string | Date,
  desde: Date | null,
  hasta: Date | null,
): boolean {
  const validation = validateVencimientoDateRange(desde, hasta);
  if (!validation.valid || (!desde && !hasta)) {
    return true;
  }
  if (!desde || !hasta) {
    return true;
  }

  const exp = new Date(fechaExpiracion).getTime();
  return exp >= startOfDay(desde).getTime() && exp <= endOfDay(hasta).getTime();
}

/** Parámetros API (control maestro): solo si el rango es válido y completo. */
export function toApiVencimientoRange(desde: Date | null, hasta: Date | null): {
  fechaInicio?: string;
  fechaFin?: string;
} {
  const validation = validateVencimientoDateRange(desde, hasta);
  if (!validation.valid || !desde || !hasta) {
    return {};
  }
  return {
    fechaInicio: startOfDay(desde).toISOString(),
    fechaFin: endOfDay(hasta).toISOString(),
  };
}
