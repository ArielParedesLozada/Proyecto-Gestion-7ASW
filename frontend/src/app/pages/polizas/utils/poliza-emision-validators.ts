import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const TZ_NEGOCIO = 'America/Bogota';

/** Misma semántica que `PolizaEstadoDerivadoHelper.FechaCalendarioNegocio` en el backend. */
function fechaYmdCalendarioNegocio(d: Date): { y: number; m: number; day: number } {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_NEGOCIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const [y, m, day] = s.split('-').map(Number);
  return { y, m, day };
}

export const EMISION_FUTURA_KEY = 'emisionFutura';

export function emisionNoFuturaValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || !(v instanceof Date) || Number.isNaN(v.getTime())) {
      return null;
    }
    const em = fechaYmdCalendarioNegocio(v);
    const hoy = fechaYmdCalendarioNegocio(new Date());
    const emMs = Date.UTC(em.y, em.m - 1, em.day);
    const hoyMs = Date.UTC(hoy.y, hoy.m - 1, hoy.day);
    if (emMs > hoyMs) {
      return { [EMISION_FUTURA_KEY]: true };
    }
    return null;
  };
}

/** Para `[matDatepickerFilter]`: deshabilita días posteriores a hoy (calendario Colombia). */
export function emisionDiaPermitidoEnCalendario(d: Date | null): boolean {
  if (!d) {
    return true;
  }
  const ymdCell = fechaYmdCalendarioNegocio(d);
  const ymdHoy = fechaYmdCalendarioNegocio(new Date());
  const cellMs = Date.UTC(ymdCell.y, ymdCell.m - 1, ymdCell.day);
  const hoyMs = Date.UTC(ymdHoy.y, ymdHoy.m - 1, ymdHoy.day);
  return cellMs <= hoyMs;
}
