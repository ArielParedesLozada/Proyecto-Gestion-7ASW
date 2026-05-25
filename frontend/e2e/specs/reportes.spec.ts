import { test, expect } from '../fixtures/auth.fixture';
import { goToReportes } from '../helpers/navigation.helper';

test.describe('Reportes', () => {
  test('PA-REP-01 - Abrir módulo de reportes', async ({ page }) => {
    // Objetivo: cargar control maestro.
    // Mejora si falla: mejorar diseño/carga del módulo de reportes.
    await goToReportes(page);
    await expect(page.getByRole('heading', { name: 'Control Maestro' })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Vigentes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Vencidas/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pólizas Vigentes' })).toBeVisible();

    await page.getByRole('tab', { name: /Vencidas/i }).click();
    await expect(page.getByRole('heading', { name: 'Pólizas Vencidas' })).toBeVisible();

    const emptyMsg = page.getByText(/No hay pólizas que coincidan/i);
    const tableRow = page.locator('table.polizas-table tbody tr').first();
    await expect(emptyMsg.or(tableRow)).toBeVisible();
  });

  test('PA-REP-02 - Saldo inicial actualiza el resumen', async ({ page }) => {
    // Objetivo: cuadre con saldo inicial manual (tiempo real).
    // Mejora si falla: mejorar cálculo del control maestro.
    await goToReportes(page);
    await page.getByLabel('Saldo inicial').fill('10000');
    await expect(page.locator('.cm-card--neutral strong')).toContainText(/10,?000/);
    await expect(page.getByText('Cuadre total')).toBeVisible();
    await expect(page.locator('.cm-summary strong').last()).toBeVisible();
  });
});
