import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { API_CONFIG } from '../shared/constants/api.constants';
import { ApiService } from './api.service';

export interface AuditoriaItem {
  id: string;
  userId: string;
  username: string;
  tabla: string;
  registroId: string;
  accion: string;
  datosPrevios: string;
  datosNuevos: string;
}

export interface AuditoriaPaginatedResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AuditoriaItem[];
}

/** Mientras no exista el controlador en backend, no spamear errores al usuario. */
function esApiAuditoriaNoDisponible(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 404 || err.status === 501);
}

@Injectable({
  providedIn: 'root',
})
export class AuditoriaService {
  private readonly api = inject(ApiService);
  getAuditoriasPaginadas(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    tabla?: string,
    userId?: string
  ): Observable<AuditoriaPaginatedResponse> {
    let url = `${API_CONFIG.ENDPOINTS.AUDITORIAS.INDEX}?page=${page}&pageSize=${pageSize}`;

    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tabla) url += `&tabla=${encodeURIComponent(tabla)}`;
    if (userId) url += `&userId=${userId}`;

    return this.api.get<AuditoriaPaginatedResponse>(url).pipe(
      catchError((err: unknown) =>
        esApiAuditoriaNoDisponible(err)
          ? of({ total: 0, page, pageSize, items: [] })
          : throwError(() => err)
      )
    );
  }
}
