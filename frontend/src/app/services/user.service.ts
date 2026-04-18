import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { AppUserRole, UserListRow } from '../pages/users/models/user-list.model';
import { extractHttpErrorMessage } from '../shared/utils/http-error-message';

const PAGE_SIZE = 100;

export interface UserCreateRequest {
  username: string;
  email: string;
  password: string;
  role: AppUserRole;
}

export interface UserUpdateRequest {
  username: string;
  email: string;
  role: AppUserRole;
  /** Si se envía, el backend actualiza la contraseña. En la UI actual no se usa. */
  password?: string | null;
}

interface UserPagedApi {
  items: UserApiDto[];
  totalCount: number;
}

interface UserApiDto {
  id: string;
  username: string;
  email: string;
  mustChangePassword: boolean;
  role: string;
}

function mapRole(role: string): AppUserRole {
  return role === 'ADMIN' ? 'ADMIN' : 'USER';
}

function mapDto(row: UserApiDto): UserListRow {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: mapRole(row.role),
    password: '',
    mustChangePassword: row.mustChangePassword,
  };
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly api = inject(ApiService);
  private readonly basePath = API_CONFIG.ENDPOINTS.POLIZAS.USERS;

  getList(): Observable<UserListRow[]> {
    const qs = (page: number) => `${this.basePath}?pageNumber=${page}&pageSize=${PAGE_SIZE}`;

    return this.api.get<UserPagedApi>(qs(1)).pipe(
      switchMap((first) => {
        const firstRows = first.items.map(mapDto);
        const total = first.totalCount;
        if (firstRows.length >= total) {
          return of(firstRows);
        }
        const pages = Math.ceil(total / PAGE_SIZE);
        const rest: Observable<UserPagedApi>[] = [];
        for (let p = 2; p <= pages; p++) {
          rest.push(this.api.get<UserPagedApi>(qs(p)));
        }
        return forkJoin(rest).pipe(
          map((chunks) => {
            const more = chunks.flatMap((c) => c.items.map(mapDto));
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
                'No se pudieron cargar los usuarios. Comprueba la sesión y el servidor.',
              ),
            ),
        ),
      ),
    );
  }

  create(body: UserCreateRequest): Observable<UserListRow> {
    return this.api
      .post<UserApiDto>(this.basePath, {
        username: body.username.trim(),
        password: body.password,
        email: body.email.trim(),
        role: body.role,
      })
      .pipe(
        map(mapDto),
        catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
      );
  }

  update(id: string, body: UserUpdateRequest): Observable<UserListRow> {
    const payload: Record<string, unknown> = {
      username: body.username.trim(),
      email: body.email.trim(),
      role: body.role,
    };
    if (body.password != null && body.password !== '') {
      payload['password'] = body.password;
    }
    return this.api.put<UserApiDto>(`${this.basePath}/${id}`, payload).pipe(
      map(mapDto),
      catchError((err) => throwError(() => new Error(extractHttpErrorMessage(err)))),
    );
  }
}
