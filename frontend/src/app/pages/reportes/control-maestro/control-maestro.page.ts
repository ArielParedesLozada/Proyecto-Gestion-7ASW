import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PolizasTable } from '../../polizas/polizas-table/polizas-table';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../shared/services/notification.service';
import { ControlMaestroService, PolizaControlRow } from '../../../services/control-maestro.service';
import { CurrencyPipe } from '@angular/common';
import { PolizaListRow } from '../../polizas/models/poliza-list.model';
import { PageHeaderActions } from '../../../components/page-header-actions/page-header-actions';
import { RamoService } from '../../../services/ramo.service';
import { ControlMaestroToolbar } from './components/control-maestro-toolbar/control-maestro-toolbar';
import {
  hasPartialVencimientoRange,
  toApiVencimientoRange,
  validateVencimientoDateRange,
} from '../../../shared/utils/vencimiento-date-range.util';

@Component({
  selector: 'app-control-maestro.page',
  imports: [
    PolizasTable,
    MatIconModule,
    CurrencyPipe,
    PageHeaderActions,
    ControlMaestroToolbar,
  ],
  templateUrl: './control-maestro.page.html',
  styleUrl: './control-maestro.page.scss',
})
export class ControlMaestroPage implements OnInit {
  private readonly service = inject(ControlMaestroService);
  private readonly notify = inject(NotificationService);
  private readonly ramosService = inject(RamoService);

  saldoInicial = signal(0);

  readonly pageVigentes = signal(1);
  readonly pageSizeVigentes = signal(10);

  readonly pageVencidas = signal(1);
  readonly pageSizeVencidas = signal(10);

  readonly vigentes = signal<PolizaListRow[]>([]);
  readonly vencidas = signal<PolizaListRow[]>([]);
  readonly totalVigentes = signal(0);
  readonly totalVencidasCount = signal(0);

  readonly totalVigentesSum = signal(0);
  readonly totalVencidasSum = signal(0);

  readonly fechaDesde = signal<Date | null>(null);
  readonly fechaHasta = signal<Date | null>(null);
  readonly ramoId = signal<string | null>(null);

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
    if (!this.validarFiltrosFecha()) {
      return;
    }

    const fechas = toApiVencimientoRange(this.fechaDesde(), this.fechaHasta());

    this.service
      .getControlMaestro({
        pageVigentes: this.pageVigentes(),
        pageSizeVigentes: this.pageSizeVigentes(),
        pageVencidas: this.pageVencidas(),
        pageSizeVencidas: this.pageSizeVencidas(),
        saldoInicial: this.saldoInicial(),
        fechaInicio: fechas.fechaInicio ?? null,
        fechaFin: fechas.fechaFin ?? null,
        ramoId: this.ramoId() ?? undefined,
      })
      .subscribe({
        next: (res) => {
          this.vigentes.set(res.vigentes.items.map((r) => this.mapToPolizaRow(r)));
          this.vencidas.set(res.vencidas.items.map((r) => this.mapToPolizaRow(r)));

          this.totalVigentes.set(res.vigentes.total);
          this.totalVencidasCount.set(res.vencidas.total);
          this.totalVigentesSum.set(res.totalVigentes);
          this.totalVencidasSum.set(res.totalVencidas);
        },
        error: (err) => this.notify.fromHttpError(err),
      });
  }

  exportarPdf(): void {
    if (!this.validarFiltrosFecha()) {
      return;
    }

    const fechas = toApiVencimientoRange(this.fechaDesde(), this.fechaHasta());

    this.service
      .downloadPdf({
        saldoInicial: this.saldoInicial(),
        fechaInicio: fechas.fechaInicio ?? null,
        fechaFin: fechas.fechaFin ?? null,
        ramoId: this.ramoId() ?? undefined,
      })
      .subscribe({
        next: () => this.notify.success('PDF descargado.'),
        error: (err) => this.notify.fromHttpError(err),
      });
  }

  limpiarFiltros(): void {
    this.fechaDesde.set(null);
    this.fechaHasta.set(null);
    this.ramoId.set(null);
    this.saldoInicial.set(0);
    this.pageVigentes.set(1);
    this.pageVencidas.set(1);
    this.cargar();
  }

  onFechaDesdeChange(value: Date | null): void {
    this.fechaDesde.set(value);
    this.avisoRangoFechasIncompleto();
  }

  onFechaHastaChange(value: Date | null): void {
    this.fechaHasta.set(value);
    this.avisoRangoFechasIncompleto();
  }

  onPageVigentes(e: { pageIndex: number; pageSize: number }): void {
    this.pageVigentes.set(e.pageIndex + 1);
    this.pageSizeVigentes.set(e.pageSize);
    this.cargar();
  }

  onPageVencidas(e: { pageIndex: number; pageSize: number }): void {
    this.pageVencidas.set(e.pageIndex + 1);
    this.pageSizeVencidas.set(e.pageSize);
    this.cargar();
  }

  private validarFiltrosFecha(): boolean {
    const validation = validateVencimientoDateRange(
      this.fechaDesde(),
      this.fechaHasta(),
    );
    if (!validation.valid && validation.message) {
      this.notify.warn(validation.message);
      return false;
    }
    return true;
  }

  private avisoRangoFechasIncompleto(): void {
    const desde = this.fechaDesde();
    const hasta = this.fechaHasta();
    if (!hasPartialVencimientoRange(desde, hasta)) {
      return;
    }
    this.notify.warn(
      'Selecciona «Vence desde» y «Vence hasta» para filtrar por fecha de vencimiento.',
    );
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
      case 0:
        return 'vigente';
      case 1:
        return 'porVencer';
      case 2:
        return 'expirado';
      default:
        return 'vigente';
    }
  }
}
