/**
 * Límites alineados con `PolizaRequest` / `PolizaUpdateRequest` (ASP.NET `[MaxLength]`).
 * Mantener sincronizado con `backend/Presentation/Dtos/Requests/Poliza*.cs`.
 */
export const POLIZA_MAX = {
  numero: 120,
  obra: 500,
  aseguradora: 200,
  observaciones: 5000,
} as const;

export type PolizaCampoLimitado = keyof typeof POLIZA_MAX;

export function polizaMensajeMaxLength(campo: PolizaCampoLimitado): string {
  const n = POLIZA_MAX[campo];
  const textos: Record<PolizaCampoLimitado, string> = {
    numero: `El número de póliza no puede superar los ${n} caracteres.`,
    obra: `La obra no puede superar los ${n} caracteres.`,
    aseguradora: `La aseguradora no puede superar los ${n} caracteres.`,
    observaciones: `Las observaciones no pueden superar los ${n} caracteres.`,
  };
  return textos[campo];
}
