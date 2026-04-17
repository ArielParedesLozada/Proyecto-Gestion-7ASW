import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { EmpresaListRow } from '../pages/empresas/models/empresa-list.model';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';

export interface EmpresaCreateRequest {
  nombre: string;
  correo: string;
}

/** Formato del API (camelCase desde ASP.NET Core). */
interface EmpresaApiDto {
  id: string;
  nombre: string;
  email: string;
}

function mapDto(row: EmpresaApiDto): EmpresaListRow {
  return { id: row.id, nombre: row.nombre, correo: row.email };
}

@Injectable({
  providedIn: 'root',
})
export class EmpresaService {
  private readonly api = inject(ApiService);
  private readonly basePath = API_CONFIG.ENDPOINTS.POLIZAS.EMPRESAS;

  getList(): Observable<EmpresaListRow[]> {
    return this.api.get<EmpresaApiDto[]>(this.basePath).pipe(
      map((rows) => rows.map(mapDto)),
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
    );
  }

  create(body: EmpresaCreateRequest): Observable<EmpresaListRow> {
    return this.api
      .post<EmpresaApiDto>(this.basePath, { nombre: body.nombre, email: body.correo })
      .pipe(
        map(mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }

  update(id: string, body: EmpresaCreateRequest): Observable<EmpresaListRow> {
    return this.api
      .put<EmpresaApiDto>(`${this.basePath}/${id}`, { nombre: body.nombre, email: body.correo })
      .pipe(
        map(mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }
}
