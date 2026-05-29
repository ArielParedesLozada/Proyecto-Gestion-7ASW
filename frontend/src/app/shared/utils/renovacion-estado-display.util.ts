export interface RenovacionEstadoDisplay {
  variant: string;
  label: string;
}

const RENOVACION_ESTADO_BY_NUMBER: Record<number, RenovacionEstadoDisplay> = {
  0: { variant: 'vigente', label: 'Vigente' },
  1: { variant: 'porVencer', label: 'Por vencer' },
  2: { variant: 'vencida', label: 'Vencida' },
  3: { variant: 'pendiente', label: 'Pendiente' },
};

const RENOVACION_ESTADO_BY_KEY: Record<string, RenovacionEstadoDisplay> = {
  vigente: { variant: 'vigente', label: 'Vigente' },
  porvencer: { variant: 'porVencer', label: 'Por vencer' },
  vencida: { variant: 'vencida', label: 'Vencida' },
  pendiente: { variant: 'pendiente', label: 'Pendiente' },
  confirmada: { variant: 'confirmada', label: 'Confirmada' },
};

/** Resuelve variante y etiqueta para `app-status-badge` / renovaciones. */
export function resolveRenovacionEstadoDisplay(
  estado: number | string | null | undefined,
): RenovacionEstadoDisplay {
  if (estado === null || estado === undefined) {
    return { variant: 'pendiente', label: 'Desconocido' };
  }

  if (typeof estado === 'number') {
    return RENOVACION_ESTADO_BY_NUMBER[estado] ?? {
      variant: 'pendiente',
      label: `Estado ${estado}`,
    };
  }

  const key = estado.trim().toLowerCase();
  return (
    RENOVACION_ESTADO_BY_KEY[key] ?? {
      variant: 'pendiente',
      label: estado,
    }
  );
}

/** Renovaciones que aún pueden confirmarse en UI (Por vencer / Pendiente). */
export function isRenovacionEditable(estado: number | string | null | undefined): boolean {
  if (estado === null || estado === undefined) {
    return false;
  }
  if (typeof estado === 'number') {
    return estado === 1 || estado === 3;
  }
  const key = estado.trim().toLowerCase();
  return key === 'pendiente' || key === 'porvencer';
}
