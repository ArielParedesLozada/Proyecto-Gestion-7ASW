import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RenovacionHistorialRow } from '../interfaces/renovacion.interface';
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

  private historialPath(): string {
    return API_CONFIG.ENDPOINTS.RENOVACIONES.HISTORIAL;
  }

  /**
   * Listado del historial para la vista admin.
   * Cuando el backend exponga otro contrato, mapear el DTO aquí a `RenovacionHistorialRow[]`.
   */
  getHistorialRenovaciones(): Observable<RenovacionHistorialRow[]> {
    return this.api.get<RenovacionHistorialRow[]>(this.historialPath()).pipe(
      catchError((err: unknown) =>
        esApiRenovacionesNoDisponible(err) ? of([]) : throwError(() => err),
      ),
    );
  }

  /**
   * Confirmar una renovación pendiente.
   * Ajustar verbo, ruta y cuerpo al endpoint real (p. ej. PUT o POST y payload esperado).
   * Si el endpoint aún no existe (404/501), emite un marcador para que la UI actualice solo en cliente.
   */
  confirmarRenovacion(renovacionId: string): Observable<unknown> {
    const id = encodeURIComponent(renovacionId);
    return this.api.post<unknown>(`${this.historialPath()}/${id}/confirmar`, {}).pipe(
      catchError((err: unknown) =>
        esApiRenovacionesNoDisponible(err)
          ? of(RENOVACION_CONFIRMAR_SIN_ENDPOINT)
          : throwError(() => err),
      ),
    );
  }
}
