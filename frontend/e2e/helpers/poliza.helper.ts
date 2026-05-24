import { expect, Page } from '@playwright/test';
import { E2ECatalogSnapshot, E2EPolizaSnapshot } from '../fixtures/test-data';

function formatDateInput(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

async function selectMatOption(page: Page, fieldLabel: string, optionText: string): Promise<void> {
  await page.getByLabel(fieldLabel, { exact: false }).click();
  await page.getByRole('option', { name: optionText }).click();
}

const MONTH_LABELS = [
  ['ENERO', 'JAN'],
  ['FEBRERO', 'FEB'],
  ['MARZO', 'MAR'],
  ['ABRIL', 'APR'],
  ['MAYO', 'MAY'],
  ['JUNIO', 'JUN'],
  ['JULIO', 'JUL'],
  ['AGOSTO', 'AUG'],
  ['SEPTIEMBRE', 'SEP'],
  ['OCTUBRE', 'OCT'],
  ['NOVIEMBRE', 'NOV'],
  ['DICIEMBRE', 'DEC'],
] as const;

function calendarShowsMonthYear(periodText: string, date: Date): boolean {
  const period = periodText.toUpperCase();
  if (!period.includes(String(date.getFullYear()))) {
    return false;
  }
  const labels = MONTH_LABELS[date.getMonth()];
  return labels.some((label) => period.includes(label));
}

/** Angular Material + native adapter: elegir fecha desde el calendario. */
async function pickMatDateField(page: Page, label: string, date: Date): Promise<void> {
  const formField = page.locator('mat-form-field').filter({ has: page.getByLabel(label) });
  await formField.getByRole('button', { name: 'Open calendar' }).click();
  const calendar = page.locator('.mat-datepicker-content');
  await expect(calendar).toBeVisible();

  const periodButton = calendar.locator('.mat-calendar-period-button');
  const day = String(date.getDate());

  for (let i = 0; i < 24; i++) {
    const periodText = (await periodButton.textContent()) ?? '';
    if (calendarShowsMonthYear(periodText, date)) {
      const enabledCell = calendar.locator(
        '.mat-calendar-body-cell:not(.mat-calendar-body-disabled)',
      );
      const dayBtn = enabledCell
        .filter({ has: page.locator('.mat-calendar-body-cell-content', { hasText: day }) })
        .first();
      if ((await dayBtn.count()) > 0) {
        await dayBtn.click();
        return;
      }
    }

    const next = calendar.locator('.mat-calendar-next-button');
    if (!(await next.isEnabled())) {
      break;
    }
    await next.click();
  }

  throw new Error(`No se pudo seleccionar ${formatDateInput(date)} en "${label}"`);
}

export async function fillPolizaForm(
  page: Page,
  catalog: E2ECatalogSnapshot,
  poliza: E2EPolizaSnapshot,
  options?: { expiracionEnDias?: number },
): Promise<void> {
  const emision = new Date();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + (options?.expiracionEnDias ?? 365));

  await page.getByLabel('Número de Póliza').fill(poliza.numero);
  await selectMatOption(page, 'Contratista', catalog.empresaNombre);
  await page.getByLabel('Obra').fill(poliza.obra);
  await selectMatOption(page, 'Ramo', catalog.ramoNombre);
  await page.locator('app-poliza-aseguradora-select').getByLabel('Aseguradora').click();
  await page.getByRole('option', { name: catalog.aseguradoraNombre }).click();

  await pickMatDateField(page, 'Fecha de Emisión', emision);
  await pickMatDateField(page, 'Fecha de Expiración', expiracion);
  await page.getByLabel('Valor Original (USD)').fill('10000');
  await page.getByLabel('Observaciones').fill(poliza.observacionesInicial);
}

export async function submitNuevaPoliza(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Registrar Póliza' }).click();
}

export async function createPolizaFromUi(
  page: Page,
  catalog: E2ECatalogSnapshot,
  poliza: E2EPolizaSnapshot,
  options?: { expiracionEnDias?: number },
): Promise<void> {
  await page.goto('/polizas/nueva');
  await expect(page.getByRole('heading', { name: 'Nueva Póliza' })).toBeVisible();
  await fillPolizaForm(page, catalog, poliza, options);
  await submitNuevaPoliza(page);
  await expect(page).toHaveURL(/\/polizas$/);
  await searchPolizaByNumero(page, poliza.numero);
}

export async function searchPolizaByNumero(page: Page, numero: string): Promise<void> {
  const search = page.getByPlaceholder('Buscar por número, contratista u obra...');
  await search.fill(numero);
  await expect(page.locator('table.polizas-table tbody tr').filter({ hasText: numero }).first()).toBeVisible();
}

export async function setEstadoFiltro(page: Page, label: string): Promise<void> {
  const estadoSelect = page.locator('mat-select').filter({ hasText: /Todos los estados|Vigente|Por vencer|Expirado/ }).first();
  await estadoSelect.click();
  await page.getByRole('option', { name: label, exact: true }).click();
}
