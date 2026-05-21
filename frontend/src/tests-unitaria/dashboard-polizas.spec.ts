/**
 * Tests unitarios: DashboardPolizasComponent — lógica pura
 *
 * Qué se prueba: Ordenamiento del dashboard por estado y
 *   cálculo de estado derivado desde fecha de expiración.
 * Cómo se simula: Se importan directamente las funciones puras
 *   sin TestBed.
 * Resultado esperado: Las funciones procesan correctamente las pólizas.
 */
import { sortPolizasForDashboard } from '../app/pages/polizas/utils/poliza-list-orden.util';
import {
  calcularEstadoDesdeFechaExpiracion,
} from '../app/pages/polizas/utils/poliza-estado-derivado.util';
import type { PolizaListRow } from '../app/pages/polizas/models/poliza-list.model';

function mockRow(overrides: Partial<PolizaListRow> = {}): PolizaListRow {
  return {
    id: Math.random().toString(36).slice(2),
    numero: 'POL-001',
    contratista: 'Empresa Test',
    obra: 'Obra Test',
    ramo: 'Cumplimiento',
    ramoId: Math.random().toString(36).slice(2),
    aseguradora: 'Seguros Test',
    fechaExpiracion: '2026-06-15',
    valor: 10000,
    estado: 'vigente',
    ...overrides,
  };
}

describe('Dashboard — sortPolizasForDashboard', () => {
  // ── 1. Expiradas primero ───────────────────────────────────────────
  it('ordena expiradas antes que porVencer y vigentes', () => {
    const rows = [
      mockRow({ estado: 'vigente', fechaExpiracion: '2026-12-01' }),
      mockRow({ estado: 'expirado', fechaExpiracion: '2026-01-01' }),
      mockRow({ estado: 'porVencer', fechaExpiracion: '2026-05-15' }),
    ];
    const estados = sortPolizasForDashboard(rows).map(r => r.estado);
    expect(estados[0]).toBe('expirado');
    expect(estados[1]).toBe('porVencer');
    expect(estados[2]).toBe('vigente');
  });
});

describe('Dashboard — calcularEstadoDesdeFechaExpiracion', () => {
  // ── 2. Fecha pasada → expirado ─────────────────────────────────────
  it('fecha pasada retorna expirado', () => {
    const pasada = new Date();
    pasada.setDate(pasada.getDate() - 5);
    expect(calcularEstadoDesdeFechaExpiracion(pasada)).toBe('expirado');
  });

  // ── 3. Fecha dentro de umbral → porVencer ──────────────────────────
  it('fecha dentro de 3 días retorna porVencer', () => {
    const pronto = new Date();
    pronto.setDate(pronto.getDate() + 2);
    expect(calcularEstadoDesdeFechaExpiracion(pronto)).toBe('porVencer');
  });
});
