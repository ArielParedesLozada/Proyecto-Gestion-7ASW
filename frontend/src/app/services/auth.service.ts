import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthUser, LoginRequest, LoginResponse, RegisterRequest, User } from '../interfaces/auth.interface';
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
          const user: AuthUser = { username: response.username, role: response.role, email: response.email, mustChangePassword: response.mustChangePassword };
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

  getCurrentUser(): AuthUser | null {
    return this.storageService.getUser() as AuthUser | null;
  }

  getToken(): string | null {
    return this.storageService.getToken();
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

