import { test, expect } from '../fixtures/auth.fixture';
import {
  buildCatalogData,
  buildPolizaData,
  getCatalogSnapshot,
  getPolizaSnapshot,
} from '../fixtures/test-data';
import { createPolizaFromUi } from '../helpers/poliza.helper';
import { goToPolizas, goToRenovaciones, openPolizaRowByNumero } from '../helpers/navigation.helper';

test.describe.serial('Renovaciones', () => {
  test('PA-REN-01 - Ver listado de renovaciones', async ({ page }) => {
    // Objetivo: pantalla de renovaciones operativa.
    // Mejora si falla: mejorar vista de renovaciones vacías.
    await goToRenovaciones(page);
    const table = page.locator('table');
    const empty = page.getByText(/No hay renovaciones|Sin renovaciones|no hay/i);
    await expect(table.or(empty).first()).toBeVisible();
  });

  test('PA-REN-02 - Aprobar renovación pendiente', async ({ page }) => {
    // Objetivo: aprobar renovación desde detalle de póliza.
    // Mejora si falla: mejorar aprobación de renovaciones.
    // Precondición: póliza por vencer + job CheckRenovaciones (cada minuto).
    let catalog;
    let poliza;
    try {
      catalog = getCatalogSnapshot();
      poliza = getPolizaSnapshot();
    } catch {
      catalog = buildCatalogData();
      poliza = buildPolizaData(catalog);
    }

    const numeroPorVencer = `POL-REN-E2E-${catalog.unique}`;
    const polizaPorVencer = {
      ...poliza,
      numero: numeroPorVencer,
      obra: `Obra renovación E2E ${catalog.unique}`,
    };

    await test.step('Crear póliza que vence en 2 días', async () => {
      await createPolizaFromUi(page, catalog, polizaPorVencer, { expiracionEnDias: 2 });
    });

    await test.step('Esperar generación de renovación (job cada minuto)', async () => {
      await goToPolizas(page);
      await openPolizaRowByNumero(page, numeroPorVencer);
      await expect
        .poll(
          async () => {
            await page.reload();
            return page.getByRole('button', { name: 'Aprobar' }).isVisible();
          },
          { timeout: 120_000, intervals: [5000, 10000, 15000] },
        )
        .toBe(true);
    });

    await test.step('Aprobar renovación', async () => {
      await page.getByRole('button', { name: 'Aprobar' }).click();
      await expect(page.getByText(/Renovación aprobada|éxito/i).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  });
});
