import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { PolizaListRow } from '../models/poliza-list.model';
import { PolizaStatusBadge } from '../poliza-status-badge/poliza-status-badge';
import { diasRestantesDesdeIso } from '../utils/poliza-list-orden.util';

@Component({
  selector: 'app-polizas-table',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
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

  /** Total tras filtrar (solo aplica si `showPaginator` es true). */
  paginatorLength = input(0);
  pageIndex = input(0);
  pageSize = input(10);

  /** Desactivar en vistas ejecutivas (p. ej. Dashboard con pocas filas fijas). */
  showPaginator = input(true);

  /** Listado completo vs. vista resumida del dashboard. */
  variant = input<'full' | 'dashboard'>('full');
  showTableTitle = input(true);
  tableTitle = input('Listado de Pólizas');
  /** Subtítulo bajo el título (vista dashboard dentro de la misma tarjeta). */
  tableSubtitle = input<string | undefined>(undefined);
  /** Ruta del enlace “Ver todas” en modo dashboard (`null` para ocultar). */
  verTodasLink = input<string | null>('/polizas');
  /** Si no se define, se usa un texto según `variant`. */
  emptyMessage = input<string | undefined>(undefined);

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
  renovar = output<PolizaListRow>();

  diasRestantes(row: PolizaListRow): number {
    return diasRestantesDesdeIso(row.fechaExpiracion);
  }

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
