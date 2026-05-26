import { test, expect } from '../fixtures/auth.fixture';
import {
  buildCatalogData,
  setCatalogSnapshot,
} from '../fixtures/test-data';
import { createAseguradora, createEmpresa, createRamo } from '../helpers/catalog.helper';

test.describe.serial('Catálogos', () => {
  const catalog = buildCatalogData();

  test('PA-CAT-01 - Crear empresa', async ({ page }) => {
    // Objetivo: alta de empresa contratista.
    // Mejora si falla: validar creación de empresas.
    await createEmpresa(page, catalog);
  });

  test('PA-CAT-02 - Crear aseguradora', async ({ page }) => {
    // Objetivo: alta de aseguradora.
    // Mejora si falla: validar creación de aseguradoras.
    await createAseguradora(page, catalog);
  });

  test('PA-CAT-03 - Crear ramo', async ({ page }) => {
    // Objetivo: alta de ramo usable en pólizas.
    // Mejora si falla: validar creación de ramos.
    await createRamo(page, catalog);
    setCatalogSnapshot(catalog);
    await page.goto('/polizas/nueva');
    await page.getByLabel('Ramo').click();
    await expect(page.getByRole('option', { name: catalog.ramoNombre })).toBeVisible();
  });
});
