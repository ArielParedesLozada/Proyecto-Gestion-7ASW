import { expect, Page } from '@playwright/test';
import { getAdminCredentials } from '../fixtures/test-data';

export async function fillLoginForm(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  await page.getByTestId('login-username').fill(username);
  await page.getByTestId('login-password').fill(password);
}

export async function submitLogin(page: Page): Promise<void> {
  await page.getByTestId('login-submit').click();
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { username, password } = getAdminCredentials();
  await page.goto('/login');
  await fillLoginForm(page, username, password);
  await submitLogin(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

export async function completeMandatoryPasswordChange(
  page: Page,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await expect(page).toHaveURL(/\/mandatory-change-password/);
  await page.getByLabel('Contraseña actual').fill(currentPassword);
  await page.getByRole('textbox', { name: 'Nueva contraseña', exact: true }).fill(newPassword);
  await page.getByRole('textbox', { name: 'Confirmar nueva contraseña' }).fill(newPassword);
  await page.getByRole('button', { name: 'Actualizar contraseña' }).click();
  await expect(page.locator('.error-message')).toHaveCount(0, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByTestId('nav-dashboard')).toBeVisible();
}

export async function loginAsUser(
  page: Page,
  username: string,
  password: string,
  options?: { newPasswordAfterMandatoryChange?: string },
): Promise<void> {
  await page.goto('/login');
  await fillLoginForm(page, username, password);
  await submitLogin(page);
  await expect(page).toHaveURL(/\/(dashboard|mandatory-change-password)/);

  if (page.url().includes('mandatory-change-password')) {
    const newPassword = options?.newPasswordAfterMandatoryChange ?? `${password}-changed`;
    await completeMandatoryPasswordChange(page, password, newPassword);
  }
}

export async function logoutFromHeaderMenu(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Menú de usuario' }).click();
  await page.locator('.sicop-user-menu-card__logout').click();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
}
