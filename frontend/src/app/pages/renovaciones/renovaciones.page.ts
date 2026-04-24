import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RenovacionHistorialRow } from '../../interfaces/renovacion.interface';
import { RenovacionService } from '../../services/renovacion.service';
import { NotificationService } from '../../shared/services/notification.service';
import { RenovacionesTable } from './renovaciones-table/renovaciones-table';

@Component({
  selector: 'app-renovaciones-page',
  imports: [
    RenovacionesTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    DatePipe,
    DecimalPipe,
    FormsModule,
  ],
  templateUrl: './renovaciones.page.html',
  styleUrl: './renovaciones.page.scss',
})
export class RenovacionesPage {
  private readonly notify = inject(NotificationService);
  private readonly renovacionesApi = inject(RenovacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly historial = signal<RenovacionHistorialRow[]>([]);
  readonly selectedRenovacionId = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filteredHistorial = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.historial();
    if (!q) {
      return all;
    }
    return all.filter(
      (row) =>
        row.numeroPoliza.toLowerCase().includes(q) ||
        row.contratistaNombre.toLowerCase().includes(q)
    );
  });

  readonly totalFiltrado = computed(() => this.filteredHistorial().length);
  readonly selectedRenovacion = computed(() =>
    this.historial().find((row) => row.id === this.selectedRenovacionId()) ?? null,
  );
  readonly detalleEsEditable = computed(() => this.selectedRenovacion()?.estado === 'pendiente');

  readonly pagedHistorial = computed(() => {
    const all = this.filteredHistorial();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.renovacionesApi
      .getHistorialRenovaciones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => this.historial.set(Array.isArray(rows) ? rows : []),
        error: (err) => {
          this.historial.set([]);
          this.notify.fromHttpError(err);
        },
      });

    effect(() => {
      this.searchQuery();
      untracked(() => this.pageIndex.set(0));
    });

    effect(() => {
      const total = this.filteredHistorial().length;
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
  }

  onVer(row: RenovacionHistorialRow): void {
    this.selectedRenovacionId.set(row.id);
  }

  onVolverListado(): void {
    this.selectedRenovacionId.set(null);
  }

  confirmarRenovacionDetalle(): void {
    const selectedId = this.selectedRenovacionId();
    if (!selectedId) {
      return;
    }
    this.renovacionesApi
      .confirmarRenovacion(selectedId)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.historial.update((rows) =>
            rows.map((row) =>
              row.id === selectedId
                ? {
                    ...row,
                    estado: 'confirmada',
                  }
                : row,
            ),
          );
          this.notify.success('Renovación confirmada.');
        },
        error: (err) => this.notify.fromHttpError(err),
      });
  }
}
