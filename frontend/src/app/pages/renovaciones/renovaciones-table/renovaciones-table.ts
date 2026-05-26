import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SicopDataTable } from '../../../shared/components/sicop-data-table/sicop-data-table';
import { RenovacionHistorialRow } from '../../../interfaces/renovacion.interface';
import { RenovacionStatusBadge } from '../../../shared/components/renovacion-status-badge/renovacion-status-badge';

@Component({
  selector: 'app-renovaciones-table',
  imports: [
    MatIconModule,
    MatButtonModule,
    SicopDataTable,
    DatePipe,
    DecimalPipe,
    RenovacionStatusBadge,
  ],
  templateUrl: './renovaciones-table.html',
})
export class RenovacionesTable {
  readonly rows = input.required<RenovacionHistorialRow[]>();

  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);

  readonly pageChange = output<PageEvent>();
  readonly ver = output<RenovacionHistorialRow>();

  onVer(row: RenovacionHistorialRow): void {
    this.ver.emit(row);
  }
}
