import { Component, computed, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';
import { PolizasToolbar } from './polizas-toolbar/polizas-toolbar';
import { PolizasTable } from './polizas-table/polizas-table';
import { PolizaEstado, PolizaListRow } from './models/poliza-list.model';
import { sortPolizasByExpiracionAsc } from './utils/poliza-list-orden.util';
import { PolizaService } from '../../services/poliza.service';
import { NotificationService } from '../../shared/services/notification.service';
import { PolizasExcelImportDialogComponent } from './polizas-excel-import-dialog/polizas-excel-import-dialog';
import { polizaEstadoFromQueryParam } from './utils/poliza-estado-query.util';
import { RamoService } from '../../services/ramo.service';
import {
  hasPartialVencimientoRange,
  matchesVencimientoRange,
  validateVencimientoDateRange,
} from '../../shared/utils/vencimiento-date-range.util';

import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-polizas-page',
  imports: [PolizasToolbar, PolizasTable, MatIconModule, PageHeaderActions, MatCheckboxModule],
  templateUrl: './polizas.page.html',
  styleUrl: './polizas.page.scss',
})
export class PolizasPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly polizaService = inject(PolizaService);
  private readonly notify = inject(NotificationService);
  private readonly ramoService = inject(RamoService);
  private readonly dialog = inject(MatDialog);

  private readonly excelFileInput = viewChild<ElementRef<HTMLInputElement>>('excelFileInput');

  // ✅ NUEVO: Signals para datos paginados del backend
  readonly pagedRows = signal<PolizaListRow[]>([]);
  readonly totalFiltered = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  // ✅ NUEVO: Estado de ordenamiento
  readonly sortBy = signal<string>('fechaExpiracion');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // ✅ NUEVO: Control para mostrar solo vigentes o todas
  readonly onlyActive = signal<boolean>(true);

  readonly pageSize = 10;
  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });

  // Filtros existentes
  readonly searchQuery = signal('');
  readonly estadoFiltro = signal<PolizaEstado | 'todos'>('todos');
  readonly ramoFiltro = signal<string | 'todos'>('todos');
  readonly pageIndex = signal(0);
  readonly contratistaFiltro = signal('');
  readonly aseguradoraFiltro = signal('');
  readonly fechaDesdeFiltro = signal<Date | null>(null);
  readonly fechaHastaFiltro = signal<Date | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      this.estadoFiltro.set(polizaEstadoFromQueryParam(pm.get('estado')));
    });

    // ✅ MODIFICADO: Effect para cargar datos paginados cuando cambien los filtros
    effect(() => {
      const search = this.searchQuery();
      const ramoId = this.ramoFiltro();
      const page = this.pageIndex() + 1;
      const sortBy = this.sortBy();
      const sortDirection = this.sortDirection();
      const onlyActive = this.onlyActive();

      // Evitar cargar si hay filtros de frontend que requieren todos los datos
      const tieneFiltrosFrontend =
        this.contratistaFiltro().trim() !== '' ||
        this.aseguradoraFiltro().trim() !== '' ||
        this.fechaDesdeFiltro() !== null ||
        this.fechaHastaFiltro() !== null ||
        this.estadoFiltro() !== 'todos';

      if (tieneFiltrosFrontend) {
        // Si hay filtros de frontend, necesitamos más datos
        this.cargarPaginaCompletaConFiltros();
      } else {
        // Carga normal paginada
        untracked(() => {
          this.cargarPolizasPaginadas({
            search,
            ramoId: ramoId === 'todos' ? null : ramoId,
            page,
            sortBy,
            sortDirection,
            onlyActive
          });
        });
      }
    });

    // Efecto para resetear página cuando cambian filtros
    effect(() => {
      this.searchQuery();
      this.estadoFiltro();
      this.ramoFiltro();
      this.contratistaFiltro();
      this.aseguradoraFiltro();
      this.fechaDesdeFiltro();
      this.fechaHastaFiltro();
      this.sortBy();
      this.sortDirection();
      this.onlyActive();
      untracked(() => this.pageIndex.set(0));
    });
  }
  private cargarPolizasPaginadas(params: {
    search: string;
    ramoId: string | null;
    page: number;
    sortBy: string;
    sortDirection: 'asc' | 'desc';
    onlyActive: boolean;
  }): void {
    this.isLoading.set(true);

    this.polizaService.getListPaginated({
      page: params.page,
      pageSize: this.pageSize,
      search: params.search || undefined,
      ramoId: params.ramoId,
      sortBy: params.sortBy,
      sortDirection: params.sortDirection,
      onlyActive: params.onlyActive
    }).subscribe({
      next: (result) => {
        this.pagedRows.set(result.items);
        this.totalFiltered.set(result.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.pagedRows.set([]);
        this.totalFiltered.set(0);
        this.isLoading.set(false);
        this.notify.fromHttpError(err);
      }
    });
  }

  // ✅ NUEVO: Cuando hay filtros de frontend, cargar página completa
  private cargarPaginaCompletaConFiltros(): void {
    this.isLoading.set(true);

    // Cargar primera página con tamaño grande para filtros locales
    this.polizaService.getListPaginated({
      page: 1,
      pageSize: 1000, // Temporal: cargar muchos para filtrar localmente
      search: this.searchQuery() || undefined,
      ramoId: this.ramoFiltro() === 'todos' ? null : this.ramoFiltro(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
      onlyActive: this.onlyActive()
    }).subscribe({
      next: (result) => {
        // Aplicar filtros locales
        let filtered = result.items;

        // Filtrar por estado
        const estado = this.estadoFiltro();
        if (estado !== 'todos') {
          filtered = filtered.filter(row => row.estado === estado);
        }

        // Filtrar por contratista
        const contratista = this.contratistaFiltro().trim().toLowerCase();
        if (contratista) {
          filtered = filtered.filter(row =>
            row.contratista.toLowerCase().includes(contratista)
          );
        }

        // Filtrar por aseguradora
        const aseguradora = this.aseguradoraFiltro().trim().toLowerCase();
        if (aseguradora) {
          filtered = filtered.filter(row =>
            row.aseguradora.toLowerCase().includes(aseguradora)
          );
        }

        // Filtrar por rango de fechas
        filtered = filtered.filter(row =>
          matchesVencimientoRange(
            row.fechaExpiracion,
            this.fechaDesdeFiltro(),
            this.fechaHastaFiltro()
          )
        );

        // Paginación local
        const start = this.pageIndex() * this.pageSize;
        this.pagedRows.set(filtered.slice(start, start + this.pageSize));
        this.totalFiltered.set(filtered.length);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.pagedRows.set([]);
        this.totalFiltered.set(0);
        this.isLoading.set(false);
        this.notify.fromHttpError(err);
      }
    });
  }

  // ✅ NUEVO: Cambiar entre mostrar solo vigentes o todas
  onOnlyActiveChange(value: boolean): void {
    this.onlyActive.set(value);
  }

  // ✅ NUEVO: Cambiar ordenamiento
  onSortChange(sortBy: string, sortDirection: 'asc' | 'desc'): void {
    this.sortBy.set(sortBy);
    this.sortDirection.set(sortDirection);
  }

  // Métodos existentes modificados
  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    // Recargar si es necesario
    if (this.contratistaFiltro().trim() === '' &&
      this.aseguradoraFiltro().trim() === '' &&
      this.fechaDesdeFiltro() === null &&
      this.fechaHastaFiltro() === null &&
      this.estadoFiltro() === 'todos') {
      this.cargarPolizasPaginadas({
        search: this.searchQuery(),
        ramoId: this.ramoFiltro() === 'todos' ? null : this.ramoFiltro(),
        page: this.pageIndex() + 1,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
        onlyActive: this.onlyActive()
      });
    } else {
      this.cargarPaginaCompletaConFiltros();
    }
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.contratistaFiltro.set('');
    this.aseguradoraFiltro.set('');
    this.fechaDesdeFiltro.set(null);
    this.fechaHastaFiltro.set(null);
    this.pageIndex.set(0);
    this.estadoFiltro.set('todos');
    this.ramoFiltro.set('todos');
    this.sortBy.set('createdAt');
    this.sortDirection.set('desc');
    this.onlyActive.set(true);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }


  onFechaDesdeChange(value: Date | null): void {
    this.fechaDesdeFiltro.set(value);
    this.avisoRangoFechasIncompleto();
  }

  onFechaHastaChange(value: Date | null): void {
    this.fechaHastaFiltro.set(value);
    this.avisoRangoFechasIncompleto();
  }

  private avisoRangoFechasIncompleto(): void {
    const desde = this.fechaDesdeFiltro();
    const hasta = this.fechaHastaFiltro();
    if (!hasPartialVencimientoRange(desde, hasta)) {
      const check = validateVencimientoDateRange(desde, hasta);
      if (!check.valid && check.message) {
        this.notify.warn(check.message);
      }
      return;
    }
    this.notify.warn(
      'Selecciona «Vence desde» y «Vence hasta» para filtrar por fecha de vencimiento.',
    );
  }

  onEstadoFiltroFromUser(value: PolizaEstado | 'todos'): void {
    this.estadoFiltro.set(value);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: value === 'todos' ? { estado: null } : { estado: value },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onCargarExcel(): void {
    const input = this.excelFileInput()?.nativeElement;
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onExcelFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.notify.warn('Selecciona un archivo Excel con extensión .xlsx.');
      return;
    }
    this.polizaService.previewImportExcel(file).subscribe({
      next: (preview) => {
        this.dialog.open(PolizasExcelImportDialogComponent, {
          width: 'min(960px, 96vw)',
          maxHeight: '90vh',
          panelClass: 'sicop-excel-import-dialog',
          data: { preview },
        }).afterClosed().subscribe((imported) => {
          if (imported) {
            this.cargarPolizasPaginadas({
              search: this.searchQuery(),
              ramoId: this.ramoFiltro() === 'todos' ? null : this.ramoFiltro(),
              page: this.pageIndex() + 1,
              sortBy: this.sortBy(),
              sortDirection: this.sortDirection(),
              onlyActive: this.onlyActive()
            });
          }
        });
      },
      error: (err: unknown) => this.notify.fromHttpError(err),
    });
  }

  onNuevaPoliza(): void {
    void this.router.navigate(['/polizas/nueva']);
  }

  onVer(row: PolizaListRow): void {
    void this.router.navigate(['/polizas', row.id]);
  }

  onEditar(row: PolizaListRow): void {
    void this.router.navigate(['/polizas', row.id, 'editar']);
  }
}
