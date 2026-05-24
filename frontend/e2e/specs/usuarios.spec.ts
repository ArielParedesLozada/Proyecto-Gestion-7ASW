import { test, expect } from '@playwright/test';
import {
  getNormalUserPassword,
  setNormalUserSnapshot,
} from '../fixtures/test-data';
import { getAdminToken, registerUserViaApi } from '../helpers/api.helper';
import { loginAsUser } from '../helpers/login.helper';

test.describe('Usuarios y permisos', () => {
  // Sin sesión de admin: este spec inicia sesión como USER.
  test.use({ storageState: { cookies: [], origins: [] } });

  const unique = Date.now();
  const initialPassword = getNormalUserPassword();
  const normalUser = {
    username: `user.e2e.${unique}`,
    email: `user.e2e.${unique}@test.com`,
    password: initialPassword,
  };

  test.beforeAll(async ({ request }) => {
    const token = await getAdminToken(request);
    await registerUserViaApi(request, token, {
      username: normalUser.username,
      email: normalUser.email,
      password: initialPassword,
      role: 'USER',
    });

    setNormalUserSnapshot(normalUser);
  });

  test('PA-USR-03 - Validar menú restringido para usuario normal', async ({ page }) => {
    // Objetivo: ocultar opciones admin para rol USER.
    // Mejora si falla: mejorar control de permisos por rol.
    await loginAsUser(page, normalUser.username, normalUser.password);
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('nav-polizas')).toBeVisible();
    await expect(page.getByTestId('nav-users')).toHaveCount(0);
    await expect(page.getByTestId('nav-auditoria')).toHaveCount(0);
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login/);
  });
});
