import path from 'path';
import fs from 'fs';
import { E2ECatalogSnapshot } from '../fixtures/test-data';

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

export function pathToValidImportTemplate(): string {
  return path.join(ASSETS_DIR, 'polizas-import-valido.xlsx');
}

export function pathToInvalidImportTemplate(): string {
  return path.join(ASSETS_DIR, 'polizas-import-invalido.xlsx');
}

/**
 * Genera un Excel válido en tiempo de ejecución alineado con el catálogo creado en E2E.
 * Usa encabezados reconocidos por PolizaExcelImportService.
 */
export function writeDynamicValidImportFile(
  catalog: E2ECatalogSnapshot,
  numeroPoliza: string,
): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx') as typeof import('xlsx');
  const outPath = path.join(ASSETS_DIR, `polizas-import-runtime-${catalog.unique}.xlsx`);
  const rows = [
    ['Numero Poliza', 'Contratista', 'Obra', 'Aseguradora', 'Ramo', 'Valor', 'Fecha Emision', 'Vigencia Hasta'],
    [
      numeroPoliza,
      catalog.empresaNombre,
      `Obra Import ${catalog.unique}`,
      catalog.aseguradoraNombre,
      catalog.ramoNombre,
      '7500',
      '01/01/2025',
      '01/01/2026',
    ],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Import');
  XLSX.writeFile(wb, outPath);
  return outPath;
}

export function ensureImportAssetsExist(): void {
  const valid = pathToValidImportTemplate();
  const invalid = pathToInvalidImportTemplate();
  if (!fs.existsSync(valid) || !fs.existsSync(invalid)) {
    throw new Error(
      'Faltan archivos Excel en e2e/assets. Ejecuta: npm run e2e:fixtures',
    );
  }
}
