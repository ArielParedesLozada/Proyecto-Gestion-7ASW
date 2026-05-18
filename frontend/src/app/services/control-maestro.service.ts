import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';

export interface PolizaControlRow {
  id: string;
  numero: string;
  obra: string;
  aseguradoraId: string;
  aseguradoraNombre: string;
  periodicidadRenovacion: string;
  contratistaId: string;
  contratistaNombre: string;
  ramoId: string;
  ramoNombre: string;
  ramoCambiaValor: boolean;
  valorOriginal: number;
  valorActual: number;
  fechaEmision: string;   // ISO string con offset
  fechaExpiracion: string;
  observaciones: string | null;
  estado: number;         // 0=Vigente, 1=PorVencer, 2=Vencida
}

export interface ControlMaestroPaginated {
  items: PolizaControlRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ControlMaestroRes {
  vigentes: ControlMaestroPaginated;
  vencidas: ControlMaestroPaginated;
  totalVigentes: number;
  totalVencidas: number;
  saldoInicial: number;
  cuadreTotal: number;
}

// Parámetros que acepta el endpoint
export interface ControlMaestroParams {
  pageVigentes?: number;
  pageSizeVigentes?: number;
  pageVencidas?: number;
  pageSizeVencidas?: number;
  saldoInicial?: number;

  fechaInicio?: string | null;
  fechaFin?: string | null;
  ramoId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ControlMaestroService {
  private readonly api = inject(ApiService);
  /**
   * Obtiene los datos del control maestro (vigentes + vencidas) con paginación independiente.
   * @param params Parámetros de consulta (páginas, tamaños, saldoInicial)
   */
  getControlMaestro(params: ControlMaestroParams = {}): Observable<ControlMaestroRes> {
    const queryParams = this.buildQueryParams(params);
    const url = `${API_CONFIG.ENDPOINTS.REPORTES.CONTROL_MAESTRO}?${queryParams}`;
    return this.api.get<ControlMaestroRes>(url).pipe(
      catchError((err: unknown) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudo cargar el reporte de control maestro. Verifique su conexión.',
              ),
            ),
        ),
      ),
    );
  }

  /**
   * Descarga el reporte de control maestro en PDF.
   * @param params Los mismos parámetros que se usan para obtener los datos (paginación, saldo inicial)
   * @param nombreArchivo Nombre personalizado para el archivo (opcional)
   */
  downloadPdf(params: ControlMaestroParams = {}, nombreArchivo?: string): Observable<void> {
    const queryParams = this.buildQueryParams(params);
    const url = `${API_CONFIG.ENDPOINTS.REPORTES.CONTROL_MAESTRO_PDF}?${queryParams}`;
    const fileName = nombreArchivo ?? `ControlMaestro_${new Date().toISOString().slice(0, 19)}.pdf`;

    return this.api.getBlob(url).pipe(
      tap((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }),
      map(() => undefined),
      catchError((err: unknown) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudo generar el PDF del control maestro. Intente más tarde.',
              ),
            ),
        ),
      ),
    );
  }

  /**
   * Construye la cadena de query parameters a partir de un objeto.
   * Solo agrega parámetros con valor definido.
   */
  private buildQueryParams(params: ControlMaestroParams): string {
    const parts: string[] = [];
    if (params.pageVigentes !== undefined && params.pageVigentes !== null) {
      parts.push(`pageVigentes=${params.pageVigentes}`);
    }
    if (params.pageSizeVigentes !== undefined && params.pageSizeVigentes !== null) {
      parts.push(`pageSizeVigentes=${params.pageSizeVigentes}`);
    }
    if (params.pageVencidas !== undefined && params.pageVencidas !== null) {
      parts.push(`pageVencidas=${params.pageVencidas}`);
    }
    if (params.pageSizeVencidas !== undefined && params.pageSizeVencidas !== null) {
      parts.push(`pageSizeVencidas=${params.pageSizeVencidas}`);
    }
    if (params.saldoInicial !== undefined && params.saldoInicial !== null) {
      parts.push(`saldoInicial=${params.saldoInicial}`);
    }
    if (params.fechaInicio) {
      parts.push(`fechaInicio=${params.fechaInicio}`);
    }

    if (params.fechaFin) {
      parts.push(`fechaFin=${params.fechaFin}`);
    }

    if (params.ramoId) {
      parts.push(`ramoId=${params.ramoId}`);
    }
    return parts.join('&');
  }
}
