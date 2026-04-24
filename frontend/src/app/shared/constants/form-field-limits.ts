/**
 * Límites de formularios alineados con DTOs del backend cuando existen
 * (`RamoRequest`, `EmpresaRequest`, etc.).
 */
export const RAMO_MAX = {
  nombre: 500,
  descripcion: 2000,
} as const;

/** `UserRequest` no define MaxLength en API; valores defensivos razonables. */
export const USER_MAX = {
  username: 128,
  email: 320,
} as const;
