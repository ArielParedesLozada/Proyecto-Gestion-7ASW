/** Datos compartidos entre specs E2E (catálogo + póliza). */
export interface E2ECatalogSnapshot {
  unique: number;
  empresaNombre: string;
  empresaEmail: string;
  aseguradoraNombre: string;
  aseguradoraEmail: string;
  ramoNombre: string;
  ramoDescripcion: string;
}

export interface E2EPolizaSnapshot {
  numero: string;
  obra: string;
  observacionesInicial: string;
  observacionesEditada: string;
}

let catalog: E2ECatalogSnapshot | null = null;
let poliza: E2EPolizaSnapshot | null = null;
let normalUser: { username: string; password: string; email: string } | null = null;

export function createUniqueSuffix(): number {
  return Date.now();
}

export function buildCatalogData(unique = createUniqueSuffix()): E2ECatalogSnapshot {
  return {
    unique,
    empresaNombre: `Empresa E2E ${unique}`,
    empresaEmail: `empresa.e2e.${unique}@test.com`,
    aseguradoraNombre: `Aseguradora E2E ${unique}`,
    aseguradoraEmail: `aseguradora.e2e.${unique}@test.com`,
    ramoNombre: `Ramo E2E ${unique}`,
    ramoDescripcion: `Descripción ramo E2E ${unique}`,
  };
}

export function buildPolizaData(
  catalogData: E2ECatalogSnapshot,
  unique = catalogData.unique,
): E2EPolizaSnapshot {
  return {
    numero: `POL-E2E-${unique}`,
    obra: `Obra E2E ${unique}`,
    observacionesInicial: `Observación inicial E2E ${unique}`,
    observacionesEditada: `Observación editada E2E ${unique}`,
  };
}

export function setCatalogSnapshot(data: E2ECatalogSnapshot): void {
  catalog = data;
}

export function getCatalogSnapshot(): E2ECatalogSnapshot {
  if (!catalog) {
    throw new Error('Catálogo E2E no inicializado. Ejecuta catalogos.spec antes o llama setCatalogSnapshot.');
  }
  return catalog;
}

export function setPolizaSnapshot(data: E2EPolizaSnapshot): void {
  poliza = data;
}

export function getPolizaSnapshot(): E2EPolizaSnapshot {
  if (!poliza) {
    throw new Error('Póliza E2E no inicializada. Ejecuta polizas.spec en orden o llama setPolizaSnapshot.');
  }
  return poliza;
}

export function setNormalUserSnapshot(data: { username: string; password: string; email: string }): void {
  normalUser = data;
}

export function getNormalUserSnapshot(): { username: string; password: string; email: string } {
  if (!normalUser) {
    throw new Error('Usuario USER E2E no creado. Ejecuta usuarios.spec o crea el usuario en beforeAll.');
  }
  return normalUser;
}

export function getAdminCredentials(): { username: string; password: string } {
  const username = process.env['E2E_ADMIN_USER'] ?? 'adminpapu';
  const password = process.env['E2E_ADMIN_PASSWORD'] ?? process.env['ADMIN_PASSWORD'] ?? '';
  if (!password) {
    throw new Error(
      'Define E2E_ADMIN_PASSWORD (o ADMIN_PASSWORD) antes de ejecutar las pruebas E2E.',
    );
  }
  return { username, password };
}

export function getNormalUserPassword(): string {
  const password = process.env['E2E_USER_PASSWORD'] ?? 'E2E-User-1234';
  return password;
}
