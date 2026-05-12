import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { RamoListRow } from '../models/ramo-list.model';
import { RamoCambioValorBadge } from '../ramo-cambio-valor-badge/ramo-cambio-valor-badge';

@Component({
  selector: 'app-ramos-table',
  imports: [MatIconModule, MatButtonModule, LocalPaginatorComponent, RamoCambioValorBadge],
  templateUrl: './ramos-table.html',
  styleUrl: './ramos-table.scss',
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
