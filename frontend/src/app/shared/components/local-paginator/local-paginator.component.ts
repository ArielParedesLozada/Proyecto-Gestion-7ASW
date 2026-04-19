import { Component, input, output } from '@angular/core';
import { MatPaginatorIntl, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { SpanishPaginatorIntl } from '../../pagination/spanish-paginator-intl';

/**
 * Paginador local reutilizable (Material), tamaño de página fijo por defecto.
 * Pensado para datos ya cargados en cliente; más adelante se puede enlazar a `length`
 * y `pageIndex` devueltos por un backend.
 */
@Component({
  selector: 'app-local-paginator',
  imports: [MatPaginatorModule],
  providers: [{ provide: MatPaginatorIntl, useClass: SpanishPaginatorIntl }],
  templateUrl: './local-paginator.component.html',
  styleUrl: './local-paginator.component.scss',
})
export class LocalPaginatorComponent {
  /** Total de registros (tras filtrar). */
  length = input.required<number>();
  /** Índice de página actual (0-based). */
  pageIndex = input.required<number>();
  /** Tamaño de página (por defecto 10). */
  pageSize = input(10);

  page = output<PageEvent>();
}
