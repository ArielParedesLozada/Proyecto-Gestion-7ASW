import { test, expect } from '@playwright/test';
import {
  fillLoginForm,
  loginAsAdmin,
  logoutFromHeaderMenu,
  submitLogin,
} from '../helpers/login.helper';
import { getAdminCredentials } from '../fixtures/test-data';

test.describe('Autenticación (invitado)', () => {
  test('PA-AUTH-01 - Login exitoso con administrador', async ({ page }) => {
    // Objetivo: validar acceso admin al sistema.
    // Mejora si falla: mejorar redirección posterior al login.
    await test.step('Iniciar sesión como administrador', async () => {
      await loginAsAdmin(page);
    });
    await test.step('Verificar shell autenticado', async () => {
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByTestId('nav-polizas')).toBeVisible();
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test('PA-AUTH-02 - Login con credenciales incorrectas', async ({ page }) => {
    // Objetivo: rechazar credenciales inválidas.
    // Mejora si falla: mejorar mensajes de error en autenticación.
    await page.goto('/login');
    await fillLoginForm(page, 'usuario-invalido-e2e', 'clave-incorrecta-e2e');
    await submitLogin(page);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('login-error')).toBeVisible();
  });

  test('PA-AUTH-03 - Acceso directo a ruta protegida sin sesión', async ({ page }) => {
    // Objetivo: bloquear rutas privadas sin token.
    // Mejora si falla: reforzar protección de rutas privadas.
    await page.goto('/polizas');
    await expect(page).toHaveURL(/\/login/);
    await page.goto('/reportes');
    await expect(page).toHaveURL(/\/login/);
  });

  test('PA-AUTH-04 - Recuperación de contraseña desde la interfaz', async ({ page }) => {
    // Objetivo: flujo UI de recuperación (sin validar correo real).
    // Mejora si falla: validar correctamente correos en recuperación de contraseña.
    await page.goto('/forgot-password');
    await page.getByLabel('Correo Electrónico').fill('adminpapu@test.com');
    await page.getByRole('button', { name: 'Enviar enlace de reinicio' }).click();
    await expect(
      page.locator('.success-message, .error-message').first(),
    ).toBeVisible({ timeout: 20_000 });
  });

  test('PA-AUTH-05 - Cierre de sesión', async ({ page }) => {
    // Objetivo: cerrar sesión y limpiar acceso.
    // Mejora si falla: limpiar sesión al cerrar sesión.
    await loginAsAdmin(page);
    await logoutFromHeaderMenu(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
