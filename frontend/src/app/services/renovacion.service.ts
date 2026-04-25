import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { RenovacionesHistorialPaginated, RenovacionHistorialRow } from '../interfaces/renovacion.interface';
import { API_CONFIG } from '../shared/constants/api.constants';
import { ApiService } from './api.service';

/** Mientras no exista el controlador en backend, no spamear errores al usuario. */
function esApiRenovacionesNoDisponible(err: unknown): boolean {
  return err instanceof HttpErrorResponse && (err.status === 404 || err.status === 501);
}

/** Emite el servicio cuando el POST de confirmar no existe aún; comparar con `===` en la página. */
export const RENOVACION_CONFIRMAR_SIN_ENDPOINT = { sinEndpoint: true } as const;

@Injectable({
  providedIn: 'root',
})
export class RenovacionService {
  private readonly api = inject(ApiService);

  /**
   * Listado del historial para la vista admin.
  * Si el endpoint no existe (404/501), lista vacía sin error al usuario.
   * Cuando el backend exponga otro contrato, mapear el DTO aquí a `RenovacionHistorialRow[]`.
   */
  getHistorialRenovaciones(): Observable<RenovacionHistorialRow[]> {
    return this.api.get<RenovacionesHistorialPaginated>(API_CONFIG.ENDPOINTS.RENOVACIONES.TODAS)
      .pipe(
        map(res => res.items),
        catchError((err: unknown) =>
          esApiRenovacionesNoDisponible(err) ? of([]) : throwError(() => err),
        ),
      );
  }

  getByPolizaId(polizaId: string, page = 1, pageSize = 10
  ) {
    return this.api.get<RenovacionesHistorialPaginated>(
      `${API_CONFIG.ENDPOINTS.RENOVACIONES.POLIZAS.HISTORIAL(polizaId)}?page=${page}&pageSize=${pageSize}`
    );
  }

  getById(renovacionId: string) {
    return this.api.get<RenovacionHistorialRow>(`${API_CONFIG.ENDPOINTS.RENOVACIONES.UNA(renovacionId)}`)
  }

  getLatestRenovacion(polizaId: string) {
    return this.api.get<RenovacionHistorialRow>(`${API_CONFIG.ENDPOINTS.RENOVACIONES.POLIZAS.LATEST(polizaId)}`)
  }
  /**
   * Confirmar una renovación pendiente.
   * Ajustar verbo, ruta y cuerpo al endpoint real (p. ej. PUT o POST y payload esperado).
   * Si el endpoint aún no existe (404/501), emite un marcador para que la UI actualice solo en cliente.
   */
  confirmarRenovacion(renovacionId: string, nuevoValor?: number): Observable<unknown> {
    return this.api.post<unknown>(`${API_CONFIG.ENDPOINTS.RENOVACIONES.CONFIRMAR(renovacionId)}`, {
      nuevoValor
    }).pipe(
      catchError((err: unknown) =>
        esApiRenovacionesNoDisponible(err)
          ? of(RENOVACION_CONFIRMAR_SIN_ENDPOINT)
          : throwError(() => err),
      ),
    );
  }

  rechazarRenovacion(renovacionId: string): Observable<unknown> {
    return this.api.post<unknown>(`${API_CONFIG.ENDPOINTS.RENOVACIONES.RECHAZAR(renovacionId)}`, {}).pipe(
      catchError((err: unknown) =>
        esApiRenovacionesNoDisponible(err)
          ? of(RENOVACION_CONFIRMAR_SIN_ENDPOINT)
          : throwError(() => err),
      ),
    );
  }
}
