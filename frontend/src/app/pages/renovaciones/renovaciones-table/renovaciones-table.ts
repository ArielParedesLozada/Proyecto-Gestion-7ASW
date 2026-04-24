import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { RenovacionHistorialRow } from '../../../interfaces/renovacion.interface';

@Component({
  selector: 'app-renovaciones-table',
  imports: [MatIconModule, MatButtonModule, LocalPaginatorComponent, DatePipe, DecimalPipe],
  templateUrl: './renovaciones-table.html',
  styleUrl: './renovaciones-table.scss',
})
export class RenovacionesTable {
  readonly rows = input.required<RenovacionHistorialRow[]>();

  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);

  readonly pageChange = output<PageEvent>();
  /** Igual que `app-polizas-table`: el padre decide la navegación. */
  readonly ver = output<RenovacionHistorialRow>();

  onVer(row: RenovacionHistorialRow): void {
    this.ver.emit(row);
  }
}
