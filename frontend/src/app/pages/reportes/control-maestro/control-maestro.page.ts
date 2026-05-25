import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PolizasTable } from '../../polizas/polizas-table/polizas-table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';
import { ControlMaestroService, PolizaControlRow } from '../../../services/control-maestro.service';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { CurrencyPipe } from '@angular/common';
import { PolizaListRow } from '../../polizas/models/poliza-list.model';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderActions } from '../../../components/page-header-actions/page-header-actions';
import { RamoService } from '../../../services/ramo.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { ControlMaestroToolbar } from "./components/control-maestro-toolbar/control-maestro-toolbar";

@Component({
  selector: 'app-control-maestro.page',
  imports: [
    PolizasTable,
    MatIconModule,
    FormsModule,
    MatFormField,
    MatLabel,
    CurrencyPipe,
    MatInputModule,
    MatFormFieldModule,
    PageHeaderActions,
    MatDatepickerModule,
    MatNativeDateModule,
    MatOptionModule,
    ControlMaestroToolbar
],
  templateUrl: './control-maestro.page.html',
  styleUrl: './control-maestro.page.scss',
})
export class ControlMaestroPage implements OnInit {
  private readonly service = inject(ControlMaestroService);
  private readonly notify = inject(NotificationService);
  private readonly ramosService = inject(RamoService)

  saldoInicial = signal(0);

  // ===== PAGINACIÓN =====
  readonly pageVigentes = signal(1);
  readonly pageSizeVigentes = signal(10);

  readonly pageVencidas = signal(1);
  readonly pageSizeVencidas = signal(10);

  // ===== DATA =====
  readonly vigentes = signal<PolizaListRow[]>([]);
  readonly vencidas = signal<PolizaListRow[]>([]);
  readonly totalVigentes = signal(0);
  readonly totalVencidasCount = signal(0);

  readonly totalVigentesSum = signal(0);
  readonly totalVencidasSum = signal(0);

  // ===== FILTROS =====
  readonly fechaDesde = signal<Date | null>(null);
  readonly fechaHasta = signal<Date | null>(null);
  readonly ramoId = signal<string | null>(null);

  // catálogo de ramos (debes cargarlo desde API)
  readonly ramos = signal<{ id: string; nombre: string }[]>([]);

  readonly resumen = computed(() => ({
    saldoInicial: this.saldoInicial(),
    totalVigentes: this.totalVigentesSum(),
    totalVencidas: this.totalVencidasSum(),
    cuadreTotal:
      this.saldoInicial() +
      this.totalVigentesSum() -
      this.totalVencidasSum(),
  }));

  ngOnInit(): void {
    this.ramosService.getList().subscribe({
      next: (data) => this.ramos.set(data),
    });

    this.cargar();
  }

  cargar(): void {
    this.service.getControlMaestro({
      pageVigentes: this.pageVigentes(),
      pageSizeVigentes: this.pageSizeVigentes(),
      pageVencidas: this.pageVencidas(),
      pageSizeVencidas: this.pageSizeVencidas(),
      saldoInicial: this.saldoInicial(),

      fechaInicio: this.fechaDesde()?.toISOString(),
      fechaFin: this.fechaHasta()?.toISOString(),
      ramoId: this.ramoId() ?? undefined,
    })
      .subscribe({
        next: (res) => {
          this.vigentes.set(res.vigentes.items.map(r => this.mapToPolizaRow(r)));
          this.vencidas.set(res.vencidas.items.map(r => this.mapToPolizaRow(r)));

          this.totalVigentes.set(res.vigentes.total);
          this.totalVencidasCount.set(res.vencidas.total);
          this.totalVigentesSum.set(res.totalVigentes);
          this.totalVencidasSum.set(res.totalVencidas);
        },
        error: (err) => this.notify.fromHttpError(err),
      });
  }
  exportarPdf(): void {
    this.service.downloadPdf({
      saldoInicial: this.saldoInicial(),
      fechaInicio: this.fechaDesde()?.toISOString(),
      fechaFin: this.fechaHasta()?.toISOString(),
      ramoId: this.ramoId() ?? undefined,
    }).subscribe({
      error: (err) => this.notify.fromHttpError(err)
    });
  }

  onPageVigentes(e: any) {
    this.pageVigentes.set(e.page);
    this.pageSizeVigentes.set(e.pageSize);
    this.cargar();
  }

  onPageVencidas(e: any) {
    this.pageVencidas.set(e.page);
    this.pageSizeVencidas.set(e.pageSize);
    this.cargar();
  }

  private mapToPolizaRow(row: PolizaControlRow): PolizaListRow {
    return {
      id: row.id,
      numero: row.numero,
      contratista: row.contratistaNombre,
      obra: row.obra,
      ramo: row.ramoNombre,
      ramoId: row.ramoId,
      aseguradora: row.aseguradoraNombre,
      fechaExpiracion: row.fechaExpiracion,
      valor: row.valorActual,
      estado: this.mapEstado(row.estado),
    };
  }

  private mapEstado(estado: number): 'vigente' | 'porVencer' | 'expirado' {
    switch (estado) {
      case 0: return 'vigente';
      case 1: return 'porVencer';
      case 2: return 'expirado';
      default: return 'vigente';
    }
  }
}
