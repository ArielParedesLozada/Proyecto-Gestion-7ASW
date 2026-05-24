import { test as setup } from '@playwright/test';
import path from 'path';
import { loginAsAdmin } from '../helpers/login.helper';

const authFile = path.join(__dirname, '..', '.auth', 'admin.json');

setup('autenticar administrador y guardar sesión', async ({ page }) => {
  await loginAsAdmin(page);
  await page.context().storageState({ path: authFile });
});
