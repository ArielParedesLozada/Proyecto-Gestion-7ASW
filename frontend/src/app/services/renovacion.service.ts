import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RenovacionHistorialRow } from '../interfaces/renovacion.interface';
import { API_CONFIG } from '../shared/constants/api.constants';
import { ApiService } from './api.service';

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
    return this.api.get<RenovacionHistorialRow[]>(this.historialPath());
  }

  /**
   * Confirmar una renovación pendiente.
   * Ajustar verbo, ruta y cuerpo al endpoint real (p. ej. PUT o POST y payload esperado).
   */
  confirmarRenovacion(renovacionId: string): Observable<unknown> {
    const id = encodeURIComponent(renovacionId);
    return this.api.post<unknown>(`${this.historialPath()}/${id}/confirmar`, {});
  }
}
