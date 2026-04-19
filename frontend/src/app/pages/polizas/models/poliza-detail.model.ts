import { PolizaEstado } from './poliza-list.model';

export interface RenovacionHistorialItem {
  fechaRenovacion: string;
  vencimientoAnterior: string;
  nuevoVencimiento: string;
  valorAnterior: number;
  usuario: string;
}

export interface NotificacionPolizaItem {
  fecha: string;
  tipo: string;
  accion: string;
  detalle: string;
  /** Estado de la notificación (texto), no el estado derivado de la póliza. */
  estado: string;
}

export interface AuditoriaPolizaItem {
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
}

export interface PolizaDetail {
  id: string;
  numero: string;
  /** Nombre para visualización. */
  contratista: string;
  /** Id de empresa (API) para selects en edición. */
  contratistaId: string;
  ramo: string;
  ramoId: string;
  obra: string;
  aseguradora: string;
  fechaEmision: string;
  fechaExpiracion: string;
  /** Derivado en API (listado/detalle); no editar manualmente. */
  estado: PolizaEstado;
  valorOriginal: number;
  valorActual: number;
  observaciones: string;
  historialRenovaciones: RenovacionHistorialItem[];
  notificaciones: NotificacionPolizaItem[];
  auditoria: AuditoriaPolizaItem[];
}
