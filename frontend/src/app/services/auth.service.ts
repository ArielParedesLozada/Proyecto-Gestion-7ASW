import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthUser, AuthUserProfile, LoginRequest, LoginResponse, RegisterRequest, User } from '../interfaces/auth.interface';
import { StorageService } from '../shared/services/storage.service';
import { API_CONFIG } from '../shared/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageService = inject(StorageService);
  private readonly baseUrl = API_CONFIG.BASE_URL;

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, credentials)
      .pipe(
        tap(response => {
          this.storageService.setToken(response.token);
          const user: AuthUser = {
            username: response.username,
            role: response.role,
            email: response.email ?? '',
            mustChangePassword: response.mustChangePassword ?? false,
          };
          this.storageService.setUser(user);
        }),
        catchError(error => {
          console.error('Error en login:', error.error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.REGISTER}`, userData)
      .pipe(
        catchError(error => {
          console.error('Error en registro:', error);
          return throwError(() => this.handleError(error));
        })
      );
  }

  logout(): void {
    this.storageService.clear();
  }

  isAuthenticated(): boolean {
    return this.storageService.isAuthenticated();
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'ADMIN'
  }

  getCurrentUser(): AuthUser | null {
    return this.storageService.getUser() as AuthUser | null;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }

  /** Usuario en sesión con `id` (para comparar con filas del listado de usuarios). */
  getMe(): Observable<AuthUserProfile> {
    return this.http
      .get<AuthUserProfile>(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.ME}`)
      .pipe(
        catchError((error) => {
          console.error('Error en /auth/me:', error);
          return throwError(() => this.handleError(error));
        }),
      );
  }

  /**
   * Cambio obligatorio (JWT con must_change_password = true).
   * Devuelve el mismo cuerpo que el login y renueva token + sesión local.
   */
  changeMandatoryPassword(body: {
    oldPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}${API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD}`, {
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
        confirmNewPassword: body.confirmNewPassword,
      })
      .pipe(
        tap((response) => {
          this.storageService.setToken(response.token);
          const user: AuthUser = {
            username: response.username,
            role: response.role,
            email: response.email ?? '',
            mustChangePassword: response.mustChangePassword ?? false,
          };
          this.storageService.setUser(user);
        }),
        catchError((error) => {
          console.error('Error en /auth/change-password:', error.error);
          return throwError(() => this.handleError(error));
        }),
      );
  }

  private handleError(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.status === 401) {
      return 'No autenticado';
    }
    if (error.status === 404) {
      return 'Credenciales inválidas';
    }
    if (error.status == 403) {
      return 'No autorizado'
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return 'Error desconocido. Por favor, intenta nuevamente.';
  }
}

