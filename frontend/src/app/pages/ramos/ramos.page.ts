import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RamosTable } from './ramos-table/ramos-table';
import { RamoListRow } from './models/ramo-list.model';
import { RamoCreateRequest, RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-ramos-page',
  imports: [
    MainLayout,
    RamosTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ramos.page.html',
  styleUrl: './ramos.page.scss',
})
export class RamosPage {
  private readonly fb = inject(FormBuilder);
  private readonly ramoService = inject(RamoService);
  private readonly notify = inject(NotificationService);

  readonly formularioModo = signal<'oculto' | 'crear' | 'editar'>('oculto');
  readonly ramoEditandoId = signal<string | null>(null);

  readonly ramoForm = this.fb.group({
    nombre: ['', [Validators.required]],
    descripcion: ['', [Validators.required]],
    cambioValor: [false as boolean],
  });

  readonly rows = signal<RamoListRow[]>([]);

  /** Mismo patrón que Pólizas/Empresas: búsqueda en cliente + paginación. */
  readonly searchQuery = signal('');

  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.rows();
    if (!q) {
      return all;
    }
    return all.filter(
      (row) =>
        row.nombre.toLowerCase().includes(q) || row.descripcion.toLowerCase().includes(q),
    );
  });

  readonly totalFiltrado = computed(() => this.filteredRows().length);

  readonly pagedRows = computed(() => {
    const all = this.filteredRows();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.recargarRamos();

    effect(() => {
      this.searchQuery();
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
  }

  abrirFormularioCrear(): void {
    this.formularioModo.set('crear');
    this.ramoEditandoId.set(null);
    this.ramoForm.reset({ nombre: '', descripcion: '', cambioValor: false });
  }

  onCancelarFormulario(): void {
    this.formularioModo.set('oculto');
    this.ramoEditandoId.set(null);
    this.ramoForm.reset({ nombre: '', descripcion: '', cambioValor: false });
  }

  onSubmitRamo(): void {
    if (this.ramoForm.invalid) {
      this.ramoForm.markAllAsTouched();
      this.notify.warn('Completa el nombre y la descripción antes de guardar.');
      return;
    }
    const datos = this.ramoForm.getRawValue() as RamoCreateRequest;
    const modo = this.formularioModo();
    if (modo === 'crear') {
      this.ramoService.create(datos).subscribe({
        next: () => {
          this.notify.success('Ramo registrado correctamente.');
          this.recargarRamos();
          this.onCancelarFormulario();
        },
        error: (err: Error) => this.notify.error(err.message),
      });
      return;
    }
    if (modo === 'editar') {
      const id = this.ramoEditandoId();
      if (id) {
        this.ramoService.update(id, datos).subscribe({
          next: () => {
            this.notify.success('Ramo actualizado correctamente.');
            this.recargarRamos();
            this.onCancelarFormulario();
          },
          error: (err: Error) => this.notify.error(err.message),
        });
      }
    }
  }

  private recargarRamos(): void {
    this.ramoService.getList().subscribe({
      next: (data) => this.rows.set(data),
      error: (err) => {
        console.error(err);
        this.rows.set([]);
        this.notify.fromHttpError(err);
      },
    });
  }

  onEditar(row: RamoListRow): void {
    this.formularioModo.set('editar');
    this.ramoEditandoId.set(row.id);
    this.ramoForm.patchValue({
      nombre: row.nombre,
      descripcion: row.descripcion,
      cambioValor: row.cambioValor,
    });
  }
}
