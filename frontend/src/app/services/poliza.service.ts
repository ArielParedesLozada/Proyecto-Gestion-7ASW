import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PolizaDetail } from '../pages/polizas/models/poliza-detail.model';
import { PolizaEstado, PolizaListRow } from '../pages/polizas/models/poliza-list.model';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';
import { PolizaImportPreview, PolizaImportResult } from '../pages/polizas/models/poliza-import.model';

const PAGE_SIZE = 100;

/**
 * Única conversión del campo `estado` del DTO (siempre calculado en backend).
 * API: 0=Vigente, 1=Por vencer, 2=Expirado.
 */
function mapApiEstadoToUi(apiEstado: number): PolizaEstado {
  switch (apiEstado) {
    case 2:
      return 'expirado';
    case 1:
      return 'porVencer';
    default:
      return 'vigente';
  }
}

function dateToBackendOffset(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T12:00:00-05:00`;
}

interface PolizaPagedApi {
  items: PolizaApiDto[];
  totalCount: number;
}

/** Respuesta API (PascalCase) para import Excel. */
interface PolizaImportPreviewApi {
  token: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  incompleteRows: number;
  ignoredRows: number;
  insertCount: number;
  updateCount: number;
  sheetsDetected: string[];
  sheets: { name: string; rowCount: number }[];
  items: PolizaImportPreviewRowApi[];
}

interface PolizaImportPreviewRowApi {
  excelRow: number;
  sheetName: string;
  numeroPoliza: string;
  contratista: string;
  obra?: string;
  ramo: string;
  aseguradora: string;
  fechaEmision: string | null;
  fechaExpiracion: string | null;
  estadoAnalisis: string;
  empresaResolucion: string;
  mensajes: string[];
}

interface PolizaImportResultApi {
  inserted: number;
  updated: number;
  failed: number;
  errors: { excelRow: number; sheetName: string; numeroPoliza: string; message: string }[];
}

function mapImportPreview(api: PolizaImportPreviewApi): PolizaImportPreview {
  return {
    token: api.token,
    fileName: api.fileName,
    totalRows: api.totalRows,
    validRows: api.validRows,
    errorRows: api.errorRows,
    incompleteRows: api.incompleteRows,
    ignoredRows: api.ignoredRows ?? 0,
    insertCount: api.insertCount,
    updateCount: api.updateCount,
    sheetsDetected: api.sheetsDetected,
    sheets: api.sheets,
    items: api.items.map((i) => ({
      excelRow: i.excelRow,
      sheetName: i.sheetName,
      numeroPoliza: i.numeroPoliza,
      contratista: i.contratista,
      obra: i.obra ?? '',
      ramo: i.ramo,
      aseguradora: i.aseguradora,
      fechaEmision: i.fechaEmision,
      fechaExpiracion: i.fechaExpiracion,
      estadoAnalisis: i.estadoAnalisis,
      empresaResolucion: i.empresaResolucion,
      mensajes: i.mensajes ?? [],
    })),
  };
}

function mapImportResult(api: PolizaImportResultApi): PolizaImportResult {
  return {
    inserted: api.inserted,
    updated: api.updated,
    failed: api.failed,
    errors: api.errors ?? [],
  };
}

interface PolizaApiDto {
  id: string;
  numero: string;
  obra: string;
  aseguradora: string;
  contratistaId: string;
  contratista: string;
  ramoId: string;
  ramo: string;
  valorOriginal: number;
  valorActual: number;
  fechaEmision: string;
  fechaExpiracion: string;
  estado: number;
}

export interface PolizaRegistrarPayload {
  numero: string;
  contratista: string;
  obra: string;
  ramo: string;
  aseguradora: string;
  fechaEmision: Date | null;
  fechaExpiracion: Date | null;
  valorOriginal: string | number;
  valorActual: string | number;
  observaciones?: string;
}

export interface PolizaActualizarPayload {
  contratista: string;
  obra: string;
  ramo: string;
  aseguradora: string;
  fechaEmision: Date | null;
  fechaExpiracion: Date | null;
  valorOriginal: number;
  valorActual: number;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PolizaService {
  private readonly api = inject(ApiService);
  private readonly basePath = API_CONFIG.ENDPOINTS.POLIZAS.POLIZAS;

  getList(): Observable<PolizaListRow[]> {
    return this.fetchAllPages();
  }

  getById(id: string): Observable<PolizaDetail | null> {
    if (!id) {
      return of(null);
    }
    return this.api.get<PolizaApiDto>(`${this.basePath}/${id}`).pipe(
      map((dto) => this.mapDetail(dto)),
      catchError((err: unknown) => {
        const status = (err as HttpErrorResponse)?.status;
        if (status === 404) {
          return of(null);
        }
        return throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudo cargar la póliza. Comprueba la sesión y el servidor.',
              ),
            ),
        );
      }),
    );
  }

  registrar(payload: PolizaRegistrarPayload): Observable<PolizaApiDto> {
    const vo = Number(payload.valorOriginal);
    const va = Number(payload.valorActual);
    if (!payload.fechaEmision || !payload.fechaExpiracion) {
      return throwError(() => new Error('Las fechas son obligatorias.'));
    }
    const body = {
      numero: payload.numero.trim(),
      contratista: payload.contratista,
      obra: payload.obra.trim(),
      ramo: payload.ramo,
      aseguradora: payload.aseguradora.trim(),
      fechaEmision: dateToBackendOffset(payload.fechaEmision),
      fechaExpiracion: dateToBackendOffset(payload.fechaExpiracion),
      valorOriginal: vo,
      valorActual: Number.isFinite(va) ? va : vo,
    };
    return this.api.post<PolizaApiDto>(this.basePath, body).pipe(
      catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
    );
  }

  previewImportExcel(file: File): Observable<PolizaImportPreview> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.api.postFormData<PolizaImportPreviewApi>(`${this.basePath}/import/preview`, fd).pipe(
      map(mapImportPreview),
      catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
    );
  }

  confirmImport(token: string): Observable<PolizaImportResult> {
    return this.api
      .post<PolizaImportResultApi>(`${this.basePath}/import/confirm`, { token })
      .pipe(
        map(mapImportResult),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }

  actualizar(id: string, payload: PolizaActualizarPayload): Observable<PolizaApiDto> {
    if (!payload.fechaEmision || !payload.fechaExpiracion) {
      return throwError(() => new Error('Las fechas son obligatorias.'));
    }
    const body = {
      contratista: payload.contratista,
      obra: payload.obra.trim(),
      ramo: payload.ramo,
      aseguradora: payload.aseguradora.trim(),
      fechaEmision: dateToBackendOffset(payload.fechaEmision),
      fechaExpiracion: dateToBackendOffset(payload.fechaExpiracion),
      valorOriginal: payload.valorOriginal,
      valorActual: payload.valorActual,
    };
    return this.api.put<PolizaApiDto>(`${this.basePath}/${id}`, body).pipe(
      catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
    );
  }

  private fetchAllPages(): Observable<PolizaListRow[]> {
    const qs = (page: number) => `${this.basePath}?page=${page}&pageSize=${PAGE_SIZE}`;

    return this.api.get<PolizaPagedApi>(qs(1)).pipe(
      switchMap((first) => {
        const firstRows = first.items.map((i) => this.mapListRow(i));
        const total = first.totalCount;
        if (firstRows.length >= total) {
          return of(firstRows);
        }
        const pages = Math.ceil(total / PAGE_SIZE);
        const rest: Observable<PolizaPagedApi>[] = [];
        for (let p = 2; p <= pages; p++) {
          rest.push(this.api.get<PolizaPagedApi>(qs(p)));
        }
        return forkJoin(rest).pipe(
          map((chunks) => {
            const more = chunks.flatMap((c) => c.items.map((i) => this.mapListRow(i)));
            return firstRows.concat(more);
          }),
        );
      }),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudieron cargar las pólizas. Comprueba la sesión y el servidor.',
              ),
            ),
        ),
      ),
    );
  }

  private mapListRow(d: PolizaApiDto): PolizaListRow {
    return {
      id: d.id,
      numero: d.numero,
      contratista: d.contratista,
      obra: d.obra,
      ramo: d.ramo,
      aseguradora: d.aseguradora,
      fechaExpiracion: d.fechaExpiracion,
      valor: d.valorActual,
      estado: mapApiEstadoToUi(d.estado),
    };
  }

  private mapDetail(d: PolizaApiDto): PolizaDetail {
    return {
      id: d.id,
      numero: d.numero,
      contratista: d.contratista,
      contratistaId: d.contratistaId,
      ramo: d.ramo,
      ramoId: d.ramoId,
      obra: d.obra,
      aseguradora: d.aseguradora,
      fechaEmision: d.fechaEmision,
      fechaExpiracion: d.fechaExpiracion,
      estado: mapApiEstadoToUi(d.estado),
      valorOriginal: d.valorOriginal,
      valorActual: d.valorActual,
      observaciones: '',
      historialRenovaciones: [],
      notificaciones: [],
      auditoria: [],
    };
  }
}
