import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ESTADO_FILTRO_OPTIONS, PolizaEstado } from '../models/poliza-list.model';
import { VencimientoDateRangeFields } from '../../../shared/components/vencimiento-date-range-fields/vencimiento-date-range-fields';
import { countPolizasAdvancedFilters } from '../../../shared/utils/polizas-filters.util';

@Component({
  selector: 'app-polizas-toolbar',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    VencimientoDateRangeFields,
  ],
  templateUrl: './polizas-toolbar.html',
  styleUrl: './polizas-toolbar.scss',
})
export class PolizasToolbar {
  searchQuery = input.required<string>();
  estadoFiltro = input.required<PolizaEstado | 'todos'>();

  searchQueryChange = output<string>();
  estadoFiltroChange = output<PolizaEstado | 'todos'>();

  ramos = input.required<{ id: string; nombre: string }[]>();
  ramoFiltro = input.required<string | 'todos'>();
  ramoFiltroChange = output<string | 'todos'>();

  contratistaFiltro = input.required<string>();
  aseguradoraFiltro = input.required<string>();

  fechaDesde = input<Date | null>(null);
  fechaHasta = input<Date | null>(null);

  contratistaFiltroChange = output<string>();
  aseguradoraFiltroChange = output<string>();

  fechaDesdeChange = output<Date | null>();
  fechaHastaChange = output<Date | null>();

  cargarExcel = output<void>();
  nuevaPoliza = output<void>();
  limpiarFiltros = output<void>();

  readonly filtroOptions = ESTADO_FILTRO_OPTIONS;
  readonly filtersExpanded = signal(false);

  readonly activeFiltersCount = computed(() =>
    countPolizasAdvancedFilters({
      contratista: this.contratistaFiltro(),
      aseguradora: this.aseguradoraFiltro(),
      fechaDesde: this.fechaDesde(),
      fechaHasta: this.fechaHasta(),
      ramo: this.ramoFiltro(),
      estado: this.estadoFiltro(),
    }),
  );

  readonly filtersButtonLabel = computed(() => {
    const count = this.activeFiltersCount();
    return count > 0 ? `Filtros (${count})` : 'Filtros';
  });

  onSearchInput(value: string): void {
    this.searchQueryChange.emit(value);
  }

  onEstadoChange(value: PolizaEstado | 'todos'): void {
    this.estadoFiltroChange.emit(value);
  }

  onRamoChange(value: string | 'todos'): void {
    this.ramoFiltroChange.emit(value);
  }

  toggleFiltersPanel(): void {
    this.filtersExpanded.update((open) => !open);
  }

  onCargarExcel(): void {
    this.cargarExcel.emit();
  }

  onNueva(): void {
    this.nuevaPoliza.emit();
  }

  onLimpiarFiltros(): void {
    this.filtersExpanded.set(false);
    this.limpiarFiltros.emit();
  }
}
