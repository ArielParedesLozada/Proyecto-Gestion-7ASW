/**
 * Tipos del dominio Renovaciones (alineados a futura API).
 * Campos de auditoría/borrado no se exponen en el formulario.
 */

/** Póliza disponible para registrar una renovación (listado para select). */
export interface RenovacionPolizaOption {
  id: string;
  numero: string;
  contratista: string;
  obra: string;
  /** Fecha de expiración vigente antes de esta renovación (ISO yyyy-mm-dd). */
  fechaExpiracionActual: string;
  valorActualUsd: number;
}

/** Fila del historial de renovaciones en pantalla. */
export interface RenovacionHistorialRow {
  id: string;
  polizaId: string;
  polizaNumero: string;
  contratista: string;
  obra: string;
  fechaRenovacion: string;
  vencimientoAnterior: string;
  nuevoVencimiento: string;
  valorNuevoUsd: number;
  /** Ciclo de la renovación en pantalla: solo pendiente de confirmación o ya confirmada. */
  estado: RenovacionEstado;
  observaciones: string | null;
}

export type RenovacionEstado = 'pendiente' | 'confirmada';

/** Cuerpo esperado para POST futuro al backend. */
export interface RenovacionCreatePayload {
  poliza_id: string;
  fecha_expiracion: string;
  valor: number;
  observaciones?: string | null;
}
