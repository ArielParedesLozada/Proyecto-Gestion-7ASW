import { Component, input, output } from '@angular/core';
import { AseguradoraListRow } from '../models/aseguradora-list-row';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';

@Component({
  selector: 'app-aseguradoras-table',
  imports: [MatIconModule, MatButtonModule, LocalPaginatorComponent],
  templateUrl: './aseguradoras-table.html',
  styleUrl: './aseguradoras-table.scss',
})
export class AseguradorasTable {
  rows = input.required<AseguradoraListRow[]>();

  paginatorLength = input(0);
  pageIndex = input(0);
  pageSize = input(10);

  showPaginator = input(true);

  pageChange = output<PageEvent>();
  editar = output<AseguradoraListRow>();

  onEditar(row: AseguradoraListRow): void {
    this.editar.emit(row);
  }
}
