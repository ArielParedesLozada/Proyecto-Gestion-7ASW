import { test, expect } from '../fixtures/auth.fixture';
import { goToDashboard } from '../helpers/navigation.helper';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await goToDashboard(page);
  });

  test('PA-DASH-01 - Carga del dashboard después del login', async ({ page }) => {
    // Objetivo: confirmar pantalla principal tras autenticación.
    // Mejora si falla: optimizar carga del dashboard.
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Bienvenido al Sistema de Control de Pólizas')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nueva Póliza' })).toBeVisible();
  });

  test('PA-DASH-02 - Navegación desde dashboard a nueva póliza', async ({ page }) => {
    // Objetivo: acceso rápido a registro de póliza.
    // Mejora si falla: corregir accesos rápidos del dashboard.
    await page.getByRole('heading', { name: 'Nueva Póliza' }).click();
    await expect(page).toHaveURL(/\/polizas\/nueva/);
    await expect(page.getByRole('heading', { name: 'Nueva Póliza' })).toBeVisible();
  });

  test('PA-DASH-03 - Navegación desde dashboard a reportes', async ({ page }) => {
    // Objetivo: acceso rápido a reportes.
    // Mejora si falla: mejorar navegación hacia reportes.
    await page.getByRole('heading', { name: 'Reportes' }).click();
    await expect(page).toHaveURL(/\/reportes/);
    await expect(page.getByRole('heading', { name: 'Control Maestro' })).toBeVisible();
  });
});
