import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { AseguradoraListRow } from './models/aseguradora-list-row';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AseguradoraCreateRequest, AseguradoraService } from '../../services/aseguradora.service';
import { NotificationService } from '../../shared/services/notification.service';
import { PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';
import { ListPageToolbar } from '../../shared/components/list-page-toolbar/list-page-toolbar';
import { ClearFiltersButton } from '../../shared/components/clear-filters-button/clear-filters-button';
import { AseguradorasTable } from './aseguradoras-table/aseguradoras-table';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-aseguradoras.page',
  imports: [
    AseguradorasTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    PageHeaderActions,
    ListPageToolbar,
    ClearFiltersButton,
  ],
  templateUrl: './aseguradoras.page.html',
  styleUrl: './aseguradoras.page.scss',
})
export class AseguradorasPage {
  private readonly fb = inject(FormBuilder);
  private readonly aseguradoraService = inject(AseguradoraService);
  private readonly notify = inject(NotificationService);

  /**
   * Un solo formulario para alta y edición: mismo `aseguradoraForm`, distinto modo.
   * `editar` requiere `aseguradoraEditandoId` para el futuro `PUT` al backend.
   */
  readonly formularioModo = signal<'oculto' | 'crear' | 'editar'>('oculto');
  readonly aseguradoraEditandoId = signal<string | null>(null);

  readonly aseguradoraForm = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  /** Lista cargada desde la API vía `AseguradoraService`. */
  readonly rows = signal<AseguradoraListRow[]>([]);
  readonly total = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = 10;
  /** Misma búsqueda en tiempo real que en pólizas (`searchQuery` + filtro + paginación). */
  readonly searchQuery = signal('');
  constructor() {
    toObservable(this.searchQuery)
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.recargarAseguradoras();
      });

    this.recargarAseguradoras();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.recargarAseguradoras();
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.pageIndex.set(0);
  }

  abrirFormularioCrear(): void {
    this.formularioModo.set('crear');
    this.aseguradoraEditandoId.set(null);
    this.aseguradoraForm.reset({ nombre: '', email: '' });
  }

  onCancelarFormulario(): void {
    this.formularioModo.set('oculto');
    this.aseguradoraEditandoId.set(null);
    this.aseguradoraForm.reset({ nombre: '', email: '' });
  }

  onSubmitAseguradora(): void {
    if (this.aseguradoraForm.invalid) {
      this.aseguradoraForm.markAllAsTouched();
      this.notify.warn('Revisa el nombre y un email electrónico válido antes de guardar.');
      return;
    }
    const datos = this.aseguradoraForm.getRawValue() as AseguradoraCreateRequest;
    const modo = this.formularioModo();
    if (modo === 'crear') {
      this.aseguradoraService.create(datos).subscribe({
        next: () => {
          this.notify.success('Aseguradora registrada correctamente.');
          this.recargarAseguradoras();
          this.onCancelarFormulario();
        },
        error: (err: Error) => {
          console.log(err)
          this.notify.error(err.message)
        },
      });
      return;
    }
    if (modo === 'editar') {
      const id = this.aseguradoraEditandoId();
      if (id) {
        this.aseguradoraService.update(id, datos).subscribe({
          next: () => {
            this.notify.success('Aseguradora actualizada correctamente.');
            this.recargarAseguradoras();
            this.onCancelarFormulario();
          },
          error: (err: Error) => {
            console.log(err)
            this.notify.error(err.message)
          },
        });
      }
    }
  }

  private recargarAseguradoras(): void {
    this.aseguradoraService
      .getList(this.pageIndex() + 1, this.pageSize, this.searchQuery())
      .subscribe({
        next: (res) => {
          this.rows.set(res.items);
          this.total.set(res.total);
        },
        error: (err) => {
          console.error(err);
          this.rows.set([]);
          this.notify.fromHttpError(err);
        },
      });
  }

  /** Desde la tabla: abre el mismo formulario en modo edición y precarga la fila. */
  onEditar(row: AseguradoraListRow): void {
    this.formularioModo.set('editar');
    this.aseguradoraEditandoId.set(row.id);
    this.aseguradoraForm.patchValue({
      nombre: row.nombre,
      email: row.email,
    });
  }
}
