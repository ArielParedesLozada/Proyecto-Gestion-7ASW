import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SicopDataTable } from '../../../shared/components/sicop-data-table/sicop-data-table';
import { PolizaListRow } from '../models/poliza-list.model';
import { PolizaStatusBadge } from '../poliza-status-badge/poliza-status-badge';
import { formatDiasRestantesDesdeIso, polizaDiasRestantesUrgenciaKey } from '../utils/poliza-list-orden.util';
import { SicopTableCellClampComponent } from '../../../shared/components/sicop-table-cell-clamp/sicop-table-cell-clamp.component';

@Component({
  selector: 'app-polizas-table',
  imports: [
    DatePipe,
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    PolizaStatusBadge,
    SicopDataTable,
    SicopTableCellClampComponent,
  ],
  templateUrl: './polizas-table.html',
  styleUrl: './polizas-table.scss',
})
export class PolizasTable {
  rows = input.required<PolizaListRow[]>();

  paginatorLength = input(0);
  pageIndex = input(0);
  pageSize = input(10);

  showPaginator = input(true);

  variant = input<'full' | 'dashboard'>('full');
  showEditAction = input(true);
  showTableTitle = input(true);
  tableTitle = input('Listado de Pólizas');
  tableSubtitle = input<string | undefined>(undefined);
  verTodasLink = input<string | null>('/polizas');
  emptyMessage = input<string | undefined>(undefined);

  // ✅ NUEVOS: Inputs y outputs para ordenamiento
  sortColumn = input<string | null>(null);
  sortDirection = input<'asc' | 'desc'>('desc');
  sortChange = output<{ column: string; direction: 'asc' | 'desc' }>();

  readonly emptyColspan = computed(() => (this.variant() === 'full' ? 9 : 8));
  readonly resolvedEmptyMessage = computed(() => {
    const custom = this.emptyMessage();
    if (custom != null && custom !== '') {
      return custom;
    }
    return this.variant() === 'dashboard'
      ? 'No hay pólizas registradas.'
      : 'No hay pólizas que coincidan con los filtros.';
  });

  pageChange = output<PageEvent>();

  ver = output<PolizaListRow>();
  editar = output<PolizaListRow>();

  readonly diasRestantesUrgenciaKey = polizaDiasRestantesUrgenciaKey;

  diasRestantesEtiqueta(row: PolizaListRow): string {
    return formatDiasRestantesDesdeIso(row.fechaExpiracion);
  }

  onVer(row: PolizaListRow): void {
    this.ver.emit(row);
  }

  onEditar(row: PolizaListRow): void {
    this.editar.emit(row);
  }
  // ✅ NUEVO: Método para manejar ordenamiento
  onSort(column: string): void {
    let newDirection: 'asc' | 'desc' = 'asc';

    if (this.sortColumn() === column) {
      newDirection = this.sortDirection() === 'asc' ? 'desc' : 'asc';
    }

    this.sortChange.emit({ column, direction: newDirection });
  }
}
