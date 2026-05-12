import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_CONFIG } from '../shared/constants/api.constants';
import { ApiService } from './api.service';

export interface NotificacionItem {
  id: string;
  polizaId: string;
  numeroPoliza: string;
  obra: string;
  renovacionId: string;
  fechaRenovacion: string;
  fechaExpiracion: string;
  estado: number; // 0: Pendiente, 1: Enviada, 2: Error, 3: Invalidada
  tipo: number; // 0: Renovacion, 1: Expiracion
  createdAt: string;
  fechaEnvio: string | null;
}

export interface NotificacionPaginatedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: NotificacionItem[];
}

/** Mientras no exista el controlador en backend, no spamear errores al usuario. */
function esApiNotificacionNoDisponible(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 404 || err.status === 501);
}

@Injectable({
  providedIn: 'root',
})
export class NotificacionService {
  private readonly api = inject(ApiService);

  /**
   * Obtiene notificaciones paginadas con filtros opcionales
   * @param page Número de página (default: 1)
   * @param pageSize Tamaño de página (default: 10)
   * @param search Búsqueda por número de póliza u obra
   * @param estado Filtrar por estado de notificación (0: Pendiente, 1: Enviada, 2: Error, 3: Invalidada)
   * @param tipo Filtrar por tipo de notificación (0: Renovacion, 1: Expiracion)
   */
  getNotificacionesPaginadas(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    estado?: number,
    tipo?: number
  ): Observable<NotificacionPaginatedResponse> {
    let url = `${API_CONFIG.ENDPOINTS.NOTIFICACIONES.INDEX}?page=${page}&pageSize=${pageSize}`;

    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (estado !== undefined && estado !== null) url += `&estado=${estado}`;
    if (tipo !== undefined && tipo !== null) url += `&tipo=${tipo}`;

    return this.api.get<NotificacionPaginatedResponse>(url).pipe(
      catchError((err: unknown) =>
        esApiNotificacionNoDisponible(err)
          ? of({ total: 0, page, pageSize, items: [] })
          : throwError(() => err)
      )
    );
  }

  /**
   * Obtiene notificaciones paginadas para una póliza específica
   * @param polizaId ID de la póliza
   * @param page Número de página (default: 1)
   * @param pageSize Tamaño de página (default: 10)
   */
  getNotificacionesByPolizaId(
    polizaId: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<NotificacionPaginatedResponse> {
    const url = `${API_CONFIG.ENDPOINTS.NOTIFICACIONES.POR_POLIZA(polizaId)}?page=${page}&pageSize=${pageSize}`;

    return this.api.get<NotificacionPaginatedResponse>(url).pipe(
      catchError((err: unknown) =>
        esApiNotificacionNoDisponible(err)
          ? of({ total: 0, page, pageSize, items: [] })
          : throwError(() => err)
      )
    );
  }
  
  /**
   * Obtiene solo las notificaciones pendientes
   * Método de conveniencia para dashboards
   */
  getNotificacionesPendientes(
    page: number = 1,
    pageSize: number = 10
  ): Observable<NotificacionPaginatedResponse> {
    return this.getNotificacionesPaginadas(page, pageSize, undefined, 0, undefined);
  }

  /**
   * Obtiene solo las notificaciones de expiración
   * Método de conveniencia para dashboards
   */
  getNotificacionesExpiracion(
    page: number = 1,
    pageSize: number = 10
  ): Observable<NotificacionPaginatedResponse> {
    return this.getNotificacionesPaginadas(page, pageSize, undefined, undefined, 1);
  }
}
