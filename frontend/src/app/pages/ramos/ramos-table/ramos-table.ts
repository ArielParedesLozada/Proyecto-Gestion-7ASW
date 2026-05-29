import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SicopDataTable } from '../../../shared/components/sicop-data-table/sicop-data-table';
import { RamoListRow } from '../models/ramo-list.model';
import { RamoCambioValorBadge } from '../ramo-cambio-valor-badge/ramo-cambio-valor-badge';

@Component({
  selector: 'app-ramos-table',
  imports: [MatIconModule, MatButtonModule, SicopDataTable, RamoCambioValorBadge],
  templateUrl: './ramos-table.html',
})
export class RamosTable {
  readonly rows = input.required<RamoListRow[]>();

  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);

  readonly pageChange = output<PageEvent>();

  readonly editar = output<RamoListRow>();

  onEditar(row: RamoListRow): void {
    this.editar.emit(row);
  }
}
