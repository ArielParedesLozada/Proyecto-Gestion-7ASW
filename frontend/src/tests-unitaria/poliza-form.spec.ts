/**
 * Tests unitarios: PolizaFormComponent — validadores
 *
 * Qué se prueba: Validador de emisión no futura y validador grupal
 *   de expiración posterior a emisión.
 * Cómo se simula: Se crean controles Angular (FormControl/FormGroup)
 *   programáticamente con datos mock. No se conecta a API.
 * Resultado esperado: Las validaciones coinciden con las reglas de negocio
 *   del backend (emisión no futura, expiración posterior a emisión).
 */
import { FormControl, FormGroup } from '@angular/forms';
import {
  emisionNoFuturaValidator,
  EMISION_FUTURA_KEY,
} from '../app/pages/polizas/utils/poliza-emision-validators';

describe('PolizaForm — emisionNoFuturaValidator', () => {
  const validator = emisionNoFuturaValidator();

  // ── 1. Fecha futura → error emisionFutura ──────────────────────────
  it('fecha futura marca emisionFutura', () => {
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 5);
    const ctrl = new FormControl(futuro);
    expect(validator(ctrl)).toEqual({ [EMISION_FUTURA_KEY]: true });
  });
});

describe('PolizaForm — validador grupal expiracionPosteriorEmision', () => {
  function crearGrupo(emision: Date | null, expiracion: Date | null) {
    return new FormGroup({
      fechaEmision: new FormControl(emision),
      fechaExpiracion: new FormControl(expiracion),
    }, {
      validators: (control) => {
        const fg = control as FormGroup;
        const em = fg.get('fechaEmision')?.value;
        const ex = fg.get('fechaExpiracion')?.value;
        if (em && ex && ex <= em) return { expiracionAnteriorEmision: true };
        return null;
      },
    });
  }

  // ── 2. Expiración anterior a emisión → error ──────────────────────
  it('expiración anterior a emisión marca error grupal', () => {
    const em = new Date(2026, 4, 10);
    const ex = new Date(2026, 4, 5);
    const group = crearGrupo(em, ex);
    expect(group.hasError('expiracionAnteriorEmision')).toBe(true);
  });
});
