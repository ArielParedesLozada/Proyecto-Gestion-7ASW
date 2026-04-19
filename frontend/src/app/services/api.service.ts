import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_CONFIG } from '../shared/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_CONFIG.BASE_URL;

  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  /** Descarga binaria (p. ej. PDF). */
  getBlob(endpoint: string) {
    return this.http.get(`${this.baseUrl}${endpoint}`, { responseType: 'blob' });
  }

  post<T>(endpoint: string, body: unknown) {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body);
  }

  /** Multipart (p. ej. Excel); el navegador fija el boundary automáticamente. */
  postFormData<T>(endpoint: string, formData: FormData) {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, formData);
  }

  put<T>(endpoint: string, body: any) {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body);
  }

  delete<T>(endpoint: string) {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }
}
