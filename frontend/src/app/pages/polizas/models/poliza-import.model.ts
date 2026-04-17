export interface PolizaImportPreview {
  token: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  incompleteRows: number;
  insertCount: number;
  updateCount: number;
  sheetsDetected: string[];
  sheets: { name: string; rowCount: number }[];
  items: PolizaImportPreviewRow[];
}

export interface PolizaImportPreviewRow {
  excelRow: number;
  sheetName: string;
  numeroPoliza: string;
  contratista: string;
  ramo: string;
  aseguradora: string;
  fechaEmision: string | null;
  fechaExpiracion: string | null;
  estadoAnalisis: string;
  empresaResolucion: string;
  mensajes: string[];
}

export interface PolizaImportResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: { excelRow: number; sheetName: string; numeroPoliza: string; message: string }[];
}
