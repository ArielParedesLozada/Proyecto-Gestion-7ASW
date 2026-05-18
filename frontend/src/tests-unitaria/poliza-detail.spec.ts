/**
 * Tests unitarios: PolizaDetailComponent — lógica pura
 *
 * Qué se prueba: Flujo de aprobación/rechazo de renovaciones
 *   y decisión sobre modal de cambiaValor.
 * Cómo se simula: Se instancia el componente manualmente con mocks
 *   de servicios. No se usa TestBed ni zone.js.
 * Resultado esperado: Los métodos delegan correctamente al servicio mock.
 */
import { of } from 'rxjs';

const MOCK_POLIZA = {
  id: 'pol-1', numero: 'POL-2026-001', contratista: 'Test',
  contratistaId: 'c-1', ramo: 'Cumplimiento', ramoId: 'r-1',
  cambiaValor: false, obra: 'Obra', aseguradora: 'Seg', aseguradoraId: 'a-1',
  periodicidadRenovacion: '365.00:00:00', fechaEmision: '2025-06-01',
  fechaExpiracion: '2026-06-01', estado: 'vigente' as const,
  valorOriginal: 50000, valorActual: 50000, observaciones: '',
};

const MOCK_RENOVACION = {
  id: 'ren-1', polizaId: 'pol-1', estado: 'PorVencer',
  valor: 50000, fechaRenovacion: '2026-05-01', fechaExpiracion: '2027-06-01',
};

describe('PolizasDetailPage — lógica pura', () => {
  let routerMock: any;
  let polizaServiceMock: any;
  let renovacionServiceMock: any;
  let notifyMock: any;
  let dialogMock: any;
  let comp: any;

  beforeEach(() => {
    routerMock = { navigate: jest.fn().mockResolvedValue(true) };
    polizaServiceMock = {
      getById: jest.fn().mockReturnValue(of(MOCK_POLIZA)),
      downloadPdfPoliza: jest.fn().mockReturnValue(of(undefined)),
    };
    renovacionServiceMock = {
      getByPolizaId: jest.fn().mockReturnValue(of({ items: [] })),
      getLatestRenovacion: jest.fn().mockReturnValue(of(null)),
      confirmarRenovacion: jest.fn().mockReturnValue(of({})),
      rechazarRenovacion: jest.fn().mockReturnValue(of({})),
    };
    notifyMock = { success: jest.fn(), info: jest.fn(), fromHttpError: jest.fn() };
    dialogMock = { open: jest.fn() };

    const { PolizasDetailPage } = require('../app/pages/polizas/polizas-detail.page');
    comp = Object.create(PolizasDetailPage.prototype);
    Object.defineProperty(comp, 'router', { value: routerMock });
    Object.defineProperty(comp, 'polizaService', { value: polizaServiceMock });
    Object.defineProperty(comp, 'renovacionService', { value: renovacionServiceMock });
    Object.defineProperty(comp, 'notify', { value: notifyMock });
    Object.defineProperty(comp, 'dialog', { value: dialogMock });
    comp.pageSize = 10;
    comp.pageIndex = 0;
    comp.ultimaRenovacion = null;
    comp.procesandoRenovacion = false;
    comp.historialRenovaciones = [];

    const { signal } = require('@angular/core');
    comp.poliza = signal(MOCK_POLIZA);
  });

  // ── 1. Aprobar sin cambiaValor llama confirmarRenovacion ───────────
  it('onAprobarUltimaRenovacion sin cambiaValor confirma directamente', () => {
    comp.ultimaRenovacion = MOCK_RENOVACION;
    comp.onAprobarUltimaRenovacion();
    expect(renovacionServiceMock.confirmarRenovacion).toHaveBeenCalledWith('ren-1', undefined);
  });

  // ── 2. Aprobar con cambiaValor abre modal ──────────────────────────
  it('onAprobarUltimaRenovacion con cambiaValor abre modal', () => {
    comp.poliza = require('@angular/core').signal({ ...MOCK_POLIZA, cambiaValor: true });
    comp.ultimaRenovacion = MOCK_RENOVACION;
    dialogMock.open.mockReturnValue({ afterClosed: () => of(15000) });

    comp.onAprobarUltimaRenovacion();

    expect(dialogMock.open).toHaveBeenCalled();
    expect(renovacionServiceMock.confirmarRenovacion).toHaveBeenCalledWith('ren-1', 15000);
  });

  // ── 3. Rechazar llama rechazarRenovacion ───────────────────────────
  it('onRechazarUltimaRenovacion llama rechazarRenovacion', () => {
    comp.ultimaRenovacion = MOCK_RENOVACION;
    comp.onRechazarUltimaRenovacion();
    expect(renovacionServiceMock.rechazarRenovacion).toHaveBeenCalledWith('ren-1');
  });
});
