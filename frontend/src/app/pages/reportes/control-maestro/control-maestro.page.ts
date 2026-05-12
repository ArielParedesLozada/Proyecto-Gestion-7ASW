import { Component, computed, inject, signal } from '@angular/core';
import { PolizasTable } from '../../polizas/polizas-table/polizas-table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';
import { ControlMaestroService, PolizaControlRow } from '../../../services/control-maestro.service';
import { MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { CurrencyPipe } from '@angular/common';
import { PolizaListRow } from '../../polizas/models/poliza-list.model';
import { MatInputModule } from '@angular/material/input';
import { HeaderUserMenuComponent } from "../../../components/header-user-menu/header-user-menu.component";

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
    HeaderUserMenuComponent
],
  templateUrl: './control-maestro.page.html',
  styleUrl: './control-maestro.page.scss',
})
export class ControlMaestroPage {
  private readonly service = inject(ControlMaestroService);
  private readonly notify = inject(NotificationService);

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

  readonly resumen = computed(() => ({
    saldoInicial: this.saldoInicial(),
    totalVigentes: this.totalVigentesSum(),
    totalVencidas: this.totalVencidasSum(),
    cuadreTotal:
      this.saldoInicial() +
      this.totalVigentesSum() -
      this.totalVencidasSum(),
  }));

  cargar(): void {
    this.service.getControlMaestro({
      pageVigentes: this.pageVigentes(),
      pageSizeVigentes: this.pageSizeVigentes(),
      pageVencidas: this.pageVencidas(),
      pageSizeVencidas: this.pageSizeVencidas(),
      saldoInicial: this.saldoInicial(),
    })
      .subscribe({
        next: (res) => {
          this.vigentes.set(
            res.vigentes.items.map(r => this.mapToPolizaRow(r))
          );

          this.vencidas.set(
            res.vencidas.items.map(r => this.mapToPolizaRow(r))
          );

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
      pageVigentes: this.pageVigentes(),
      pageSizeVigentes: this.pageSizeVigentes(),
      pageVencidas: this.pageVencidas(),
      pageSizeVencidas: this.pageSizeVencidas(),
      saldoInicial: this.saldoInicial(),
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
