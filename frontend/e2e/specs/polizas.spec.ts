import { test, expect } from '../fixtures/auth.fixture';
import {
  buildCatalogData,
  buildPolizaData,
  getCatalogSnapshot,
  getPolizaSnapshot,
  setCatalogSnapshot,
  setPolizaSnapshot,
} from '../fixtures/test-data';
import { createFullCatalog } from '../helpers/catalog.helper';
import {
  createPolizaFromUi,
  searchPolizaByNumero,
  setEstadoFiltro,
} from '../helpers/poliza.helper';
import { goToPolizas, openPolizaRowByNumero } from '../helpers/navigation.helper';
import {
  ensureImportAssetsExist,
  pathToInvalidImportTemplate,
  writeDynamicValidImportFile,
} from '../helpers/excel.helper';
import path from 'path';

const authFile = path.join(__dirname, '..', '.auth', 'admin.json');

test.describe.serial('Pólizas', () => {
  let catalog = buildCatalogData();
  let poliza = buildPolizaData(catalog);

  test.beforeAll(async ({ browser }) => {
    try {
      catalog = getCatalogSnapshot();
      poliza = buildPolizaData(catalog);
    } catch {
      const context = await browser.newContext({ storageState: authFile });
      const page = await context.newPage();
      await page.goto('/dashboard');
      catalog = buildCatalogData();
      await createFullCatalog(page, catalog);
      poliza = buildPolizaData(catalog);
      await context.close();
    }
    setCatalogSnapshot(catalog);
  });

  test('PA-POL-01 - Crear póliza completa', async ({ page }) => {
    // Objetivo: registrar póliza válida end-to-end.
    // Mejora si falla: mejorar formulario de registro de pólizas.
    await createPolizaFromUi(page, catalog, poliza);
    setPolizaSnapshot(poliza);
    await expect(
      page.locator('table.polizas-table tbody tr').filter({ hasText: poliza.numero }).first(),
    ).toBeVisible();
  });

  test('PA-POL-02 - Ver póliza creada en listado', async ({ page }) => {
    // Objetivo: listado muestra la póliza recién creada.
    // Mejora si falla: actualizar listado después de guardar.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await searchPolizaByNumero(page, saved.numero);
    await expect(page.getByText(catalog.empresaNombre)).toBeVisible();
    await expect(page.getByText(saved.obra)).toBeVisible();
  });

  test('PA-POL-03 - Buscar póliza por número', async ({ page }) => {
    // Objetivo: filtrar por número en toolbar.
    // Mejora si falla: mejorar búsqueda de pólizas.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await searchPolizaByNumero(page, saved.numero);
    await expect(
      page.locator('table.polizas-table tbody tr').filter({ hasText: saved.numero }),
    ).toHaveCount(1);
  });

  test('PA-POL-04 - Filtrar pólizas por estado', async ({ page }) => {
    // Objetivo: filtro por estado vigente.
    // Mejora si falla: mejorar filtros por estado.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await searchPolizaByNumero(page, saved.numero);
    await setEstadoFiltro(page, 'Vigente');
    await expect(page.getByText(saved.numero, { exact: true })).toBeVisible();
  });

  test('PA-POL-05 - Ver detalle de póliza', async ({ page }) => {
    // Objetivo: detalle coherente con datos registrados.
    // Mejora si falla: mejorar vista de detalle.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await openPolizaRowByNumero(page, saved.numero);
    await expect(page.getByRole('heading', { name: `Póliza ${saved.numero}` })).toBeVisible();
    await expect(page.getByText(catalog.empresaNombre)).toBeVisible();
    await expect(page.getByText(saved.obra)).toBeVisible();
    await expect(page.getByText(catalog.ramoNombre)).toBeVisible();
    await expect(page.getByText(catalog.aseguradoraNombre)).toBeVisible();
  });

  test('PA-POL-06 - Editar póliza', async ({ page }) => {
    // Objetivo: modificar observaciones y persistir.
    // Mejora si falla: mejorar edición de pólizas.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await openPolizaRowByNumero(page, saved.numero);
    await page.getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Observaciones').fill(saved.observacionesEditada);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(new RegExp(`/polizas/.+`));
    await expect(page.getByText(saved.observacionesEditada)).toBeVisible();
  });

  test('PA-POL-07 - Exportar PDF de póliza', async ({ page }) => {
    // Objetivo: descarga PDF individual de póliza.
    // Mejora si falla: mejorar generación de PDF.
    const saved = getPolizaSnapshot();
    await goToPolizas(page);
    await openPolizaRowByNumero(page, saved.numero);
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'PDF' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/);
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
  });

  test('PA-POL-08 - Importar pólizas desde Excel válido', async ({ page }) => {
    // Objetivo: importación Excel con vista previa.
    // Mejora si falla: mejorar importación desde Excel.
    ensureImportAssetsExist();
    const importNumero = `POL-IMP-${catalog.unique}`;
    const filePath = writeDynamicValidImportFile(catalog, importNumero);
    await goToPolizas(page);
    await page.getByRole('button', { name: 'Cargar por Excel' }).click();
    await page.getByTestId('polizas-excel-input').setInputFiles(filePath);
    await expect(page.getByRole('heading', { name: 'Vista previa de importación' })).toBeVisible({
      timeout: 30_000,
    });
    const confirmBtn = page.getByRole('button', { name: 'Confirmar importación' });
    if (await confirmBtn.isEnabled()) {
      await confirmBtn.click();
    }
    await goToPolizas(page);
    await searchPolizaByNumero(page, importNumero);
    await expect(page.getByText(importNumero, { exact: true })).toBeVisible({ timeout: 30_000 });
  });

  test('PA-POL-09 - Importar Excel inválido', async ({ page }) => {
    // Objetivo: rechazar archivo sin estructura válida.
    // Mejora si falla: mejorar manejo de Excel inválido.
    ensureImportAssetsExist();
    await goToPolizas(page);
    await page.getByRole('button', { name: 'Cargar por Excel' }).click();
    await page.getByTestId('polizas-excel-input').setInputFiles(pathToInvalidImportTemplate());
    await expect(
      page.locator('.mat-mdc-snack-bar-container, [role="alert"], .error-message').first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
