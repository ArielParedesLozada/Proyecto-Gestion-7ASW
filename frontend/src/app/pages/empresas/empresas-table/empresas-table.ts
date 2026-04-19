import { Component, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { EmpresaListRow } from '../models/empresa-list.model';

@Component({
  selector: 'app-empresas-table',
  imports: [MatIconModule, MatButtonModule, LocalPaginatorComponent],
  templateUrl: './empresas-table.html',
  styleUrl: './empresas-table.scss',
})
export class EmpresasTable {
  readonly rows = input.required<EmpresaListRow[]>();

  /** Total de registros (lista completa, sin paginar). */
  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);

  readonly pageChange = output<PageEvent>();

  readonly editar = output<EmpresaListRow>();

  onEditar(row: EmpresaListRow): void {
    this.editar.emit(row);
  }
}
