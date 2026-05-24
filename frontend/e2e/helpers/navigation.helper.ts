import { expect, Page } from '@playwright/test';

export async function goToDashboard(page: Page): Promise<void> {
  await page.getByTestId('nav-dashboard').click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

export async function goToPolizas(page: Page): Promise<void> {
  await page.getByTestId('nav-polizas').click();
  await expect(page).toHaveURL(/\/polizas$/);
  await expect(page.getByRole('heading', { name: 'Pólizas' })).toBeVisible();
}

export async function goToRenovaciones(page: Page): Promise<void> {
  await page.getByTestId('nav-renovaciones').click();
  await expect(page).toHaveURL(/\/renovaciones$/);
  await expect(page.getByRole('heading', { name: 'Renovaciones', exact: true })).toBeVisible();
}

export async function goToReportes(page: Page): Promise<void> {
  await page.getByTestId('nav-reportes').click();
  await expect(page).toHaveURL(/\/reportes/);
  await expect(page.getByRole('heading', { name: 'Control Maestro' })).toBeVisible();
}

export async function goToEmpresas(page: Page): Promise<void> {
  await page.goto('/empresas');
  await expect(page).toHaveURL(/\/empresas/);
}

export async function goToAseguradoras(page: Page): Promise<void> {
  await page.goto('/aseguradoras');
  await expect(page).toHaveURL(/\/aseguradoras/);
}

export async function goToRamos(page: Page): Promise<void> {
  await page.goto('/ramos');
  await expect(page).toHaveURL(/\/ramos/);
}

export async function goToUsers(page: Page): Promise<void> {
  await page.getByTestId('nav-users').click();
  await expect(page).toHaveURL(/\/users/);
}

export async function openPolizaRowByNumero(page: Page, numero: string): Promise<void> {
  const row = page.locator('table.polizas-table tbody tr').filter({ hasText: numero }).first();
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Ver' }).click();
  await expect(page).toHaveURL(/\/polizas\/.+/);
}
