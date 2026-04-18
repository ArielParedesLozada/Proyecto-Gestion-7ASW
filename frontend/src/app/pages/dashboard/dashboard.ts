import { AfterViewInit, Component, inject, LOCALE_ID, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { Table } from '../../components/table/table';
import { ApiService } from '../../services/api.service';
import { Poliza, PolizaItemSet } from '../../interfaces/poliza.interface';
import { API_CONFIG } from '../../shared/constants/api.constants';
import { formatDate } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface PolizaTableRow {
  id: string
  numero: string
  contratista: string
  obra: string
  ramo: string
  fechaExpiracion: string
  diasRestantes: number
}

@Component({
  selector: 'app-dashboard',
  imports: [Table, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, AfterViewInit {
  private readonly apiService = inject(ApiService)
  private readonly locale = inject(LOCALE_ID)

  // @ViewChild('estadoTpl') estadoTpl!: TemplateRef<any>;
  // @ViewChild('accionesTpl') accionesTpl!: TemplateRef<any>;

  columns = signal<any[]>([]);
  data: PolizaTableRow[] = []

  ngOnInit(): void {
    const url = `${API_CONFIG.ENDPOINTS.POLIZAS.POLIZAS}?page=1&pageSize=100`;
    this.apiService.get<PolizaItemSet>(url).subscribe({
      next: (response) => {
        this.data = response.items.map((p) => ({
          id: p.id,
          contratista: p.contratista,
          numero: p.numero,
          obra: p.obra,
          ramo: p.ramo,
          fechaExpiracion: formatDate(p.fechaExpiracion, 'dd/MM/yyyy', this.locale),
          diasRestantes: this.calcularDias(p.fechaExpiracion),
        }));
      },
      error: () => {
        this.data = [];
      },
    });
  }

  ngAfterViewInit() {
    this.columns.set([
      { key: 'numero', label: 'Número' },
      { key: 'contratista', label: 'Contratista' },
      { key: 'obra', label: 'Obra' },
      { key: 'ramo', label: 'Ramo' },
      { key: 'fechaExpiracion', label: 'Fecha Expiración' },
      { key: 'diasRestantes', label: 'Días Restantes' },
      // { key: 'estado', label: 'Estado', template: this.estadoTpl },
      // { key: 'acciones', label: 'Acciones', template: this.accionesTpl }
    ])
  }

  private calcularDias(fecha: string): number {
    const hoy = new Date();
    const exp = new Date(fecha)
    const diff = exp.getTime() - hoy.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
