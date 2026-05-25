import { CommonModule, JsonPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { AuditoriasTable } from './auditorias-table/auditorias-table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AuditoriaItem, AuditoriaService } from '../../services/auditoria.service';
import { PageEvent } from '@angular/material/paginator';
import { NotificationService } from '../../shared/services/notification.service';
import { ListPageToolbar } from '../../shared/components/list-page-toolbar/list-page-toolbar';
import { ClearFiltersButton } from '../../shared/components/clear-filters-button/clear-filters-button';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-auditorias.page',
  imports: [
    CommonModule,
    AuditoriasTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    JsonPipe,
    ListPageToolbar,
    ClearFiltersButton,
    PageHeaderActions,
  ],
  templateUrl: './auditorias.page.html',
  styleUrl: './auditorias.page.scss',
})
export class AuditoriasPage {
  private readonly notify = inject(NotificationService);
  private readonly auditoriasApi = inject(AuditoriaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly auditorias = signal<AuditoriaItem[]>([]);

  // Filtros
  readonly searchQuery = signal('');
  readonly tablaFilter = signal<string | undefined>(undefined);
  readonly accionFilter = signal<string | undefined>(undefined);

  // Paginación
  readonly pageSize = 10;
  readonly pageIndex = signal(0);
  readonly isLoading = signal(false);

  // Modal
  readonly selectedAuditoria = signal<AuditoriaItem | null>(null);

  // Tablas disponibles para filtrar (se extraen de los datos)
  readonly tablasDisponibles = computed(() => {
    const tabs = new Set(this.auditorias().map(a => a.tabla));
    return Array.from(tabs).sort();
  });

  // Datos filtrados (cliente-side)
  readonly filteredAuditorias = computed(() => {
    let items = this.auditorias();
    const search = this.searchQuery().trim().toLowerCase();
    const tabla = this.tablaFilter();
    const accion = this.accionFilter();

    if (search) {
      items = items.filter(
        (a) =>
          a.username.toLowerCase().includes(search) ||
          a.tabla.toLowerCase().includes(search) ||
          a.accion.toLowerCase().includes(search)
      );
    }

    if (tabla) {
      items = items.filter((a) => a.tabla === tabla);
    }

    if (accion) {
      items = items.filter((a) => a.accion === accion);
    }

    return items;
  });

  readonly totalFiltrado = computed(() => this.filteredAuditorias().length);

  readonly pagedAuditorias = computed(() => {
    const all = this.filteredAuditorias();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.cargarAuditorias();

    // Resetear página cuando cambian los filtros
    effect(() => {
      this.searchQuery();
      this.tablaFilter();
      this.accionFilter();
      untracked(() => this.pageIndex.set(0));
    });

    // Ajustar página si excede el total
    effect(() => {
      const total = this.filteredAuditorias().length;
      const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
      if (this.pageIndex() > maxPage) {
        untracked(() => this.pageIndex.set(maxPage));
      }
    });
  }

  private cargarAuditorias(): void {
    this.isLoading.set(true);

    this.auditoriasApi.getAuditoriasPaginadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          let items = data.items
          this.auditorias.set(items);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.auditorias.set([]);
          this.isLoading.set(false);
          this.notify.fromHttpError(err);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.tablaFilter.set(undefined);
    this.accionFilter.set(undefined);
    this.pageIndex.set(0);
  }

  onVerDetalles(auditoria: AuditoriaItem): void {
    this.selectedAuditoria.set(auditoria);
  }

  cerrarDetalles(): void {
    this.selectedAuditoria.set(null);
  }
}
