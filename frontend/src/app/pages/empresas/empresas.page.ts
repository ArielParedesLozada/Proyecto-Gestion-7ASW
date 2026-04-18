import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EmpresasTable } from './empresas-table/empresas-table';
import { EmpresaListRow } from './models/empresa-list.model';
import { EmpresaCreateRequest, EmpresaService } from '../../services/empresa.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-empresas-page',
  imports: [
    EmpresasTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './empresas.page.html',
  styleUrl: './empresas.page.scss',
})
export class EmpresasPage {
  private readonly fb = inject(FormBuilder);
  private readonly empresaService = inject(EmpresaService);
  private readonly notify = inject(NotificationService);

  /**
   * Un solo formulario para alta y edición: mismo `empresaForm`, distinto modo.
   * `editar` requiere `empresaEditandoId` para el futuro `PUT` al backend.
   */
  readonly formularioModo = signal<'oculto' | 'crear' | 'editar'>('oculto');
  readonly empresaEditandoId = signal<string | null>(null);

  readonly empresaForm = this.fb.group({
    nombre: ['', [Validators.required]],
    correo: ['', [Validators.required, Validators.email]],
  });

  /** Lista cargada desde la API vía `EmpresaService`. */
  readonly rows = signal<EmpresaListRow[]>([]);

  /** Misma búsqueda en tiempo real que en pólizas (`searchQuery` + filtro + paginación). */
  readonly searchQuery = signal('');

  /** Misma página que en pólizas: 10 filas por vista. */
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
        row.nombre.toLowerCase().includes(q) || row.correo.toLowerCase().includes(q),
    );
  });

  readonly totalFiltrado = computed(() => this.filteredRows().length);

  /** Tras filtrar, se pagina (como en pólizas). */
  readonly pagedRows = computed(() => {
    const all = this.filteredRows();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    this.recargarEmpresas();

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
    this.empresaEditandoId.set(null);
    this.empresaForm.reset({ nombre: '', correo: '' });
  }

  onCancelarFormulario(): void {
    this.formularioModo.set('oculto');
    this.empresaEditandoId.set(null);
    this.empresaForm.reset({ nombre: '', correo: '' });
  }

  onSubmitEmpresa(): void {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      this.notify.warn('Revisa el nombre y un correo electrónico válido antes de guardar.');
      return;
    }
    const datos = this.empresaForm.getRawValue() as EmpresaCreateRequest;
    const modo = this.formularioModo();
    if (modo === 'crear') {
      this.empresaService.create(datos).subscribe({
        next: () => {
          this.notify.success('Empresa registrada correctamente.');
          this.recargarEmpresas();
          this.onCancelarFormulario();
        },
        error: (err: Error) => this.notify.error(err.message),
      });
      return;
    }
    if (modo === 'editar') {
      const id = this.empresaEditandoId();
      if (id) {
        this.empresaService.update(id, datos).subscribe({
          next: () => {
            this.notify.success('Empresa actualizada correctamente.');
            this.recargarEmpresas();
            this.onCancelarFormulario();
          },
          error: (err: Error) => this.notify.error(err.message),
        });
      }
    }
  }

  private recargarEmpresas(): void {
    this.empresaService.getList().subscribe({
      next: (data) => this.rows.set(data),
      error: (err) => {
        console.error(err);
        this.rows.set([]);
        this.notify.fromHttpError(err);
      },
    });
  }

  /** Desde la tabla: abre el mismo formulario en modo edición y precarga la fila. */
  onEditar(row: EmpresaListRow): void {
    this.formularioModo.set('editar');
    this.empresaEditandoId.set(row.id);
    this.empresaForm.patchValue({
      nombre: row.nombre,
      correo: row.correo,
    });
  }
}
