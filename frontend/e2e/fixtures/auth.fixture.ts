import { expect, test as base } from '@playwright/test';

/**
 * Fixture para specs del proyecto `chromium` (storageState de admin).
 * Abre la app en dashboard: con storageState la página inicia en about:blank.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.goto('/dashboard');
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await use(page);
  },
});

export { expect } from '@playwright/test';
