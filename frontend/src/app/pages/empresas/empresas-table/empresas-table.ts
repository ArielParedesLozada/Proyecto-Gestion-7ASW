import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SicopDataTable } from '../../../shared/components/sicop-data-table/sicop-data-table';
import { EmpresaListRow } from '../models/empresa-list.model';

@Component({
  selector: 'app-empresas-table',
  imports: [MatIconModule, MatButtonModule, SicopDataTable],
  templateUrl: './empresas-table.html',
})
export class EmpresasTable {
  readonly rows = input.required<EmpresaListRow[]>();
  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);
  readonly pageChange = output<PageEvent>();
  readonly editar = output<EmpresaListRow>();

  onEditar(row: EmpresaListRow): void {
    this.editar.emit(row);
  }
}
