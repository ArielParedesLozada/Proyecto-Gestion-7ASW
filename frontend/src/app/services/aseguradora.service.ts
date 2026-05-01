import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { API_CONFIG } from '../shared/constants/api.constants';
import { Observable } from 'rxjs';
import { AseguradoraListRow } from '../pages/aseguradoras/models/aseguradora-list-row';

@Injectable({
  providedIn: 'root',
})
export class AseguradoraService {
  private readonly api = inject(ApiService);

  getList(): Observable<AseguradoraListRow[]> {
    return this.api.get<AseguradoraListRow[]>(API_CONFIG.ENDPOINTS.ASEGURADORAS.INDEX);
  }

  getById(id: string): Observable<AseguradoraListRow> {
    return this.api.get<AseguradoraListRow>(API_CONFIG.ENDPOINTS.ASEGURADORAS.UNA(id));
  }
}
