import { expect, Page } from '@playwright/test';
import { E2ECatalogSnapshot } from '../fixtures/test-data';
import { goToAseguradoras, goToEmpresas, goToRamos } from './navigation.helper';

async function assertRowVisibleAfterSearch(
  page: Page,
  searchPlaceholder: string,
  nombre: string,
): Promise<void> {
  await page.getByPlaceholder(searchPlaceholder).fill(nombre);
  await expect(page.locator('table tbody')).toContainText(nombre);
}

export async function createEmpresa(page: Page, data: E2ECatalogSnapshot): Promise<void> {
  await goToEmpresas(page);
  await page.getByRole('button', { name: 'Nueva Empresa' }).click();
  await page.getByLabel('Nombre de la Empresa').fill(data.empresaNombre);
  await page.getByLabel('Correo Electrónico').fill(data.empresaEmail);
  await page.getByRole('button', { name: 'Registrar Empresa' }).click();
  await assertRowVisibleAfterSearch(page, 'Buscar por nombre o correo...', data.empresaNombre);
}

export async function createAseguradora(page: Page, data: E2ECatalogSnapshot): Promise<void> {
  await goToAseguradoras(page);
  await page.getByRole('button', { name: 'Nueva Aseguradora' }).click();
  await page.getByLabel('Nombre de la Aseguradora').fill(data.aseguradoraNombre);
  await page.getByLabel('Correo Electrónico').fill(data.aseguradoraEmail);
  await page.getByRole('button', { name: 'Registrar Aseguradora' }).click();
  await assertRowVisibleAfterSearch(page, 'Buscar por nombre o correo...', data.aseguradoraNombre);
}

export async function createRamo(page: Page, data: E2ECatalogSnapshot): Promise<void> {
  await goToRamos(page);
  await page.getByRole('button', { name: 'Nuevo Ramo' }).click();
  await page.getByLabel('Nombre', { exact: true }).fill(data.ramoNombre);
  await page.getByLabel('Descripción').fill(data.ramoDescripcion);
  await page.getByLabel('Cambio valor').click();
  await page.getByRole('option', { name: 'No', exact: true }).click();
  await page.getByRole('button', { name: 'Registrar Ramo' }).click();
  await assertRowVisibleAfterSearch(
    page,
    'Buscar por nombre o descripción...',
    data.ramoNombre,
  );
}

export async function createFullCatalog(page: Page, data: E2ECatalogSnapshot): Promise<void> {
  await createEmpresa(page, data);
  await createAseguradora(page, data);
  await createRamo(page, data);
}
