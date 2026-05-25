import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { NotificacionesTable } from './notificaciones-table/notificaciones-table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificationService } from '../../shared/services/notification.service';
import { NotificacionItem, NotificacionService } from '../../services/notificacion.service';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';

@Component({
  selector: 'app-notificaciones.page',
  imports: [
    NotificacionesTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    PageHeaderActions,
  ],
  templateUrl: './notificaciones.page.html',
  styleUrl: './notificaciones.page.scss',
})
export class NotificacionesPage {
  private readonly notify = inject(NotificationService);
  private readonly notificacionesApi = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly notificaciones = signal<NotificacionItem[]>([]);

  // Filtros
  readonly searchQuery = signal('');
  readonly estadoFilter = signal<number | undefined>(undefined);
  readonly tipoFilter = signal<number | undefined>(undefined);

  // Paginación
  readonly pageSize = 10;
  readonly pageIndex = signal(0);
  readonly totalRegistros = signal(0);
  readonly isLoading = signal(false);

  // Datos filtrados (cliente-side)
  readonly filteredNotificaciones = computed(() => {
    let items = this.notificaciones();
    const search = this.searchQuery().trim().toLowerCase();
    const estado = this.estadoFilter();
    const tipo = this.tipoFilter();

    if (search) {
      items = items.filter(
        (n) =>
          n.numeroPoliza.toLowerCase().includes(search) ||
          n.obra.toLowerCase().includes(search)
      );
    }

    if (estado !== undefined) {
      items = items.filter((n) => n.estado === estado);
    }

    if (tipo !== undefined) {
      items = items.filter((n) => n.tipo === tipo);
    }

    return items;
  });

  readonly totalFiltrado = computed(() => this.filteredNotificaciones().length);

  readonly pagedNotificaciones = computed(() => {
    const all = this.filteredNotificaciones();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.cargarNotificaciones();

    // Resetear página cuando cambian los filtros
    effect(() => {
      this.searchQuery();
      this.estadoFilter();
      this.tipoFilter();
      untracked(() => this.pageIndex.set(0));
    });

    // Ajustar página si excede el total
    effect(() => {
      const total = this.filteredNotificaciones().length;
      const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
      if (this.pageIndex() > maxPage) {
        untracked(() => this.pageIndex.set(maxPage));
      }
    });
  }

  private cargarNotificaciones(): void {
    this.isLoading.set(true);

    this.notificacionesApi.getNotificacionesPaginadas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          let items = data.items
          this.notificaciones.set(items);
          this.totalRegistros.set(items.length);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.notificaciones.set([]);
          this.totalRegistros.set(0);
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
    this.estadoFilter.set(undefined);
    this.tipoFilter.set(undefined);
    this.pageIndex.set(0);
  }
}
