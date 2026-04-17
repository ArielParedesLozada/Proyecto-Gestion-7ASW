import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { RamoListRow } from '../pages/ramos/models/ramo-list.model';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';

export interface RamoCreateRequest {
  nombre: string;
  descripcion: string;
  cambioValor: boolean;
}

/** Respuesta API (camelCase); `cambiaValor` es el nombre en C#/JSON. */
interface RamoApiDto {
  id: string;
  nombre: string;
  descripcion: string;
  cambiaValor: boolean;
}

function mapDto(row: RamoApiDto): RamoListRow {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    cambioValor: row.cambiaValor,
  };
}

@Injectable({
  providedIn: 'root',
})
export class RamoService {
  private readonly api = inject(ApiService);
  private readonly basePath = API_CONFIG.ENDPOINTS.POLIZAS.RAMOS;

  getList(): Observable<RamoListRow[]> {
    return this.api.get<RamoApiDto[]>(this.basePath).pipe(
      map((rows) => rows.map(mapDto)),
      catchError((err) =>
        throwError(
          () =>
            new Error(
              extractHttpErrorMessage(
                err,
                'No se pudieron cargar los ramos. Comprueba la sesión y el servidor.',
              ),
            ),
        ),
      ),
    );
  }

  create(body: RamoCreateRequest): Observable<RamoListRow> {
    return this.api
      .post<RamoApiDto>(this.basePath, {
        nombre: body.nombre,
        descripcion: body.descripcion,
        cambiaValor: body.cambioValor,
      })
      .pipe(
        map(mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }

  update(id: string, body: RamoCreateRequest): Observable<RamoListRow> {
    return this.api
      .put<RamoApiDto>(`${this.basePath}/${id}`, {
        nombre: body.nombre,
        descripcion: body.descripcion,
        cambiaValor: body.cambioValor,
      })
      .pipe(
        map(mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }
}
