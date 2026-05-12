import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ESTADO_FILTRO_OPTIONS, PolizaEstado } from '../models/poliza-list.model';

@Component({
  selector: 'app-polizas-toolbar',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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

  cargarExcel = output<void>();
  nuevaPoliza = output<void>();
  limpiarFiltros = output<void>();

  readonly filtroOptions = ESTADO_FILTRO_OPTIONS;

  onSearchInput(value: string): void {
    this.searchQueryChange.emit(value);
  }

  onEstadoChange(value: PolizaEstado | 'todos'): void {
    this.estadoFiltroChange.emit(value);
  }

  onRamoChange(value: string | 'todos'): void {
    this.ramoFiltroChange.emit(value);
  }

  onCargarExcel(): void {
    this.cargarExcel.emit();
  }

  onNueva(): void {
    this.nuevaPoliza.emit();
  }

  onLimpiarFiltros(): void {
    this.limpiarFiltros.emit();
  }
}
