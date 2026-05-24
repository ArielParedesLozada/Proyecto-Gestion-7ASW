import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { AseguradoraListRow } from '../pages/aseguradoras/models/aseguradora-list-row';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';
import { PaginatedApiResponse, PaginatedResult } from '../interfaces/paginated-result';

export interface AseguradoraCreateRequest {
  nombre: string
  email?: string | null
}

interface AseguradoraApiDto {
  id: string
  nombre: string
  email: string
}

function mapDto(row: AseguradoraApiDto): AseguradoraListRow {
  return { id: row.id, nombre: row.nombre, email: row.email ?? '' };
}

@Injectable({
  providedIn: 'root',
})
export class AseguradoraService {
  private readonly api = inject(ApiService);

  private mapDto(row: AseguradoraApiDto): AseguradoraListRow {
    return { id: row.id, nombre: row.nombre, email: row.email ?? '' }
  }

  getList(page = 1, pageSize = 10, search = ""): Observable<PaginatedResult<AseguradoraListRow>> {
    return this.api
      .getWithParams<PaginatedApiResponse<AseguradoraApiDto>>(API_CONFIG.ENDPOINTS.ASEGURADORAS.INDEX, {
        params: { page, pageSize, search },
      })
      .pipe(
        map((res) => ({
          items: res.items.map(mapDto),
          total: res.total,
          page: res.page,
          pageSize: res.pageSize,
        })),
        catchError((err) =>
          throwError(
            () =>
              new Error(
                extractHttpErrorMessage(
                  err,
                  'No se pudieron cargar las empresas. Comprueba la sesión y el servidor.',
                ),
              ),
          ),
        ),
      )
  }

  getListSimple(): Observable<AseguradoraListRow[]> {
    return this.getList(1, 1000).pipe(
      map((res) => res.items)
    )
  }

  getById(id: string): Observable<AseguradoraListRow> {
    return this.api.get<AseguradoraListRow>(API_CONFIG.ENDPOINTS.ASEGURADORAS.UNA(id));
  }
  create(body: AseguradoraCreateRequest): Observable<AseguradoraListRow> {
    return this.api
      .post<AseguradoraApiDto>(API_CONFIG.ENDPOINTS.ASEGURADORAS.INDEX, { nombre: body.nombre, email: body.email ?? null})
      .pipe(
        map(this.mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }
  update(id: string, body: AseguradoraCreateRequest): Observable<AseguradoraListRow> {
    return this.api
      .put<AseguradoraApiDto>(API_CONFIG.ENDPOINTS.ASEGURADORAS.UNA(id), { nombre: body.nombre, email: body.email })
      .pipe(
        tap((body) => console.log(body)),
        map(this.mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }

}
