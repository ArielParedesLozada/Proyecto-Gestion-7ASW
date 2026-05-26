/**
 * Genera archivos Excel de prueba en e2e/assets/.
 * Ejecutar: npm run e2e:fixtures
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const validRows = [
  ['Numero Poliza', 'Contratista', 'Obra', 'Aseguradora', 'Ramo', 'Valor', 'Fecha Emision', 'Vigencia Hasta'],
  [
    'POL-IMPORT-FIXTURE',
    'Empresa Fixture',
    'Obra Fixture',
    'Aseguradora Fixture',
    'Ramo Fixture',
    '5000',
    '01/01/2025',
    '01/01/2026',
  ],
];

const invalidRows = [
  ['Columna A', 'Columna B'],
  ['sin', 'estructura'],
];

function writeSheet(fileName, rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Hoja1');
  XLSX.writeFile(wb, path.join(assetsDir, fileName));
}

writeSheet('polizas-import-valido.xlsx', validRows);
writeSheet('polizas-import-invalido.xlsx', invalidRows);

console.log('Fixtures Excel generados en', assetsDir);
