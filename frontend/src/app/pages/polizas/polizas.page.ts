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

@Component({
  selector: 'app-polizas-page',
  imports: [PolizasToolbar, PolizasTable, MatIconModule, PageHeaderActions],
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

  private readonly allRows = signal<PolizaListRow[]>([]);

  /** Tamaño de página fijo (local; luego se puede alinear con el backend). */
  readonly pageSize = 10;

  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });
  readonly searchQuery = signal('');
  readonly estadoFiltro = signal<PolizaEstado | 'todos'>('todos');
  readonly ramoFiltro = signal<string | 'todos'>('todos');
  readonly pageIndex = signal(0);
  /*Filtros comunes */
  readonly contratistaFiltro = signal('');
  readonly aseguradoraFiltro = signal('');

  readonly fechaDesdeFiltro = signal<Date | null>(null);
  readonly fechaHastaFiltro = signal<Date | null>(null);

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();

    const est = this.estadoFiltro();
    const ramo = this.ramoFiltro();

    const contratista = this.contratistaFiltro().trim().toLowerCase();
    const aseguradora = this.aseguradoraFiltro().trim().toLowerCase();

    const desde = this.fechaDesdeFiltro();
    const hasta = this.fechaHastaFiltro();

    const filtered = this.allRows().filter((row) => {

      // Estado
      if (est !== 'todos' && row.estado !== est) {
        return false;
      }

      // Ramo
      if (ramo !== 'todos' && row.ramoId !== ramo) {
        return false;
      }

      // Contratista
      if (
        contratista &&
        !row.contratista.toLowerCase().includes(contratista)
      ) {
        return false;
      }

      // Aseguradora
      if (
        aseguradora &&
        !row.aseguradora.toLowerCase().includes(aseguradora)
      ) {
        return false;
      }

      // Fecha
      const fechaExp = new Date(row.fechaExpiracion);
      if (desde) {
        const desdeDate = new Date(desde);
        desdeDate.setHours(0, 0, 0, 0);

        if (fechaExp < desdeDate) {
          return false;
        }
      }

      if (hasta) {
        const hastaDate = new Date(hasta);
        hastaDate.setHours(23, 59, 59, 999);

        if (fechaExp > hastaDate) {
          return false;
        }
      }
      if (desde && fechaExp < desde) {
        return false;
      }

      if (hasta && fechaExp > hasta) {
        return false;
      }

      // Search global
      if (!q) {
        return true;
      }

      return (
        row.numero.toLowerCase().includes(q) ||
        row.contratista.toLowerCase().includes(q) ||
        row.obra.toLowerCase().includes(q) ||
        row.ramo.toLowerCase().includes(q) ||
        row.aseguradora.toLowerCase().includes(q)
      );
    });
    return sortPolizasByExpiracionAsc(filtered);
  });

  readonly totalFiltered = computed(() => this.filteredRows().length);

  /** Resultado filtrado recortado a la página actual. */
  readonly pagedRows = computed(() => {
    const all = this.filteredRows();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((pm) => {
      this.estadoFiltro.set(polizaEstadoFromQueryParam(pm.get('estado')));
    });

    this.recargarPolizas();

    effect(() => {
      this.searchQuery();
      this.estadoFiltro();
      this.ramoFiltro();
      untracked(() => this.pageIndex.set(0));
    });

    effect(() => {
      const total = this.filteredRows().length;
      const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
      if (this.pageIndex() > maxPage) {
        untracked(() => this.pageIndex.set(maxPage));
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.pageIndex.set(0);
    this.estadoFiltro.set('todos');
    this.ramoFiltro.set('todos')
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { estado: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
            this.recargarPolizas();
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

  onRenovar(row: PolizaListRow): void {
    console.log('[SICOP Pólizas] Renovar', row.numero, row);
  }

  private recargarPolizas(): void {
    this.polizaService.getList().subscribe({
      next: (data) => this.allRows.set(data),
      error: (err) => {
        this.allRows.set([]);
        this.notify.fromHttpError(err);
      },
    });
  }
}
