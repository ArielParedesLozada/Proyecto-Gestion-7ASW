import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { VencimientoDateRangeFields } from '../../../../../shared/components/vencimiento-date-range-fields/vencimiento-date-range-fields';
import { ClearFiltersButton } from '../../../../../shared/components/clear-filters-button/clear-filters-button';
import { countControlMaestroAdvancedFilters } from '../../../../../shared/utils/control-maestro-filters.util';

@Component({
  selector: 'app-control-maestro-toolbar',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatLabel,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    VencimientoDateRangeFields,
    ClearFiltersButton,
  ],
  templateUrl: './control-maestro-toolbar.html',
  styleUrl: './control-maestro-toolbar.scss',
})
export class ControlMaestroToolbar {
  fechaDesde = input<Date | null>(null);
  fechaHasta = input<Date | null>(null);
  ramoId = input<string | null>(null);
  saldoInicial = input(0);

  ramos = input.required<{ id: string; nombre: string }[]>();

  fechaDesdeChange = output<Date | null>();
  fechaHastaChange = output<Date | null>();
  ramoIdChange = output<string | null>();
  saldoInicialChange = output<number>();
  limpiarFiltros = output<void>();
  cargar = output<void>();
  exportarPdf = output<void>();

  readonly filtersExpanded = signal(false);

  readonly activeFiltersCount = computed(() =>
    countControlMaestroAdvancedFilters({
      fechaDesde: this.fechaDesde(),
      fechaHasta: this.fechaHasta(),
      ramoId: this.ramoId(),
    }),
  );

  readonly filtersButtonLabel = computed(() => {
    const count = this.activeFiltersCount();
    return count > 0 ? `Filtros (${count})` : 'Filtros';
  });

  toggleFiltersPanel(): void {
    this.filtersExpanded.update((open) => !open);
  }

  onSaldoChange(value: string | number | null): void {
    const parsed = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
    this.saldoInicialChange.emit(Number.isFinite(parsed) ? parsed : 0);
  }

  onLimpiar(): void {
    this.filtersExpanded.set(false);
    this.limpiarFiltros.emit();
  }
}
