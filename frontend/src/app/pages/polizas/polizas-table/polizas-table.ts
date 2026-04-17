import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { PolizaListRow } from '../models/poliza-list.model';
import { PolizaStatusBadge } from '../poliza-status-badge/poliza-status-badge';

@Component({
  selector: 'app-polizas-table',
  imports: [
    DatePipe,
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    PolizaStatusBadge,
    LocalPaginatorComponent,
  ],
  templateUrl: './polizas-table.html',
  styleUrl: './polizas-table.scss',
})
export class PolizasTable {
  rows = input.required<PolizaListRow[]>();

  /** Total tras filtrar (para el paginador). */
  paginatorLength = input.required<number>();
  pageIndex = input.required<number>();
  pageSize = input(10);

  pageChange = output<PageEvent>();

  ver = output<PolizaListRow>();
  editar = output<PolizaListRow>();
  renovar = output<PolizaListRow>();

  onVer(row: PolizaListRow): void {
    this.ver.emit(row);
  }

  onEditar(row: PolizaListRow): void {
    this.editar.emit(row);
  }

  onRenovar(row: PolizaListRow): void {
    this.renovar.emit(row);
  }
}
