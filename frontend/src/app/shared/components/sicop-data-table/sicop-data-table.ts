import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { LocalPaginatorComponent } from '../local-paginator/local-paginator.component';

export type SicopDataTableLayout = 'default' | 'dashboard';

@Component({
  selector: 'app-sicop-data-table',
  imports: [NgClass, LocalPaginatorComponent, RouterLink],
  templateUrl: './sicop-data-table.html',
  styleUrl: './sicop-data-table.scss',
})
export class SicopDataTable {
  readonly title = input.required<string>();
  readonly subtitle = input<string | undefined>(undefined);
  readonly titleId = input<string | undefined>(undefined);
  readonly showTitle = input(true);
  readonly layout = input<SicopDataTableLayout>('default');
  readonly verTodasLink = input<string | null>(null);

  readonly tableMinWidth = input('560px');
  /** Clase extra en `<table>` para estilos del módulo (p. ej. `polizas-table`). */
  readonly tableClass = input('');

  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);
  readonly showPaginator = input(true);

  readonly pageChange = output<PageEvent>();
}
