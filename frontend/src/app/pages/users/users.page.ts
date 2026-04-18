import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsersTable } from './users-table/users-table';
import { AppUserRole, ROL_FILTRO_OPTIONS, UserListRow, UserRolFiltro, roleLabelEs } from './models/user-list.model';
import { MOCK_APP_USERS } from './data/users-mock.data';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-users-page',
  imports: [
    MainLayout,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    UsersTable,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);

  readonly formularioModo = signal<'oculto' | 'crear' | 'editar'>('oculto');
  readonly usuarioEditandoId = signal<string | null>(null);

  readonly userForm = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['USER' as AppUserRole, [Validators.required]],
    password: [''],
  });

  /** Lista en memoria; reemplazar por servicio al integrar API. */
  readonly allRows = signal<UserListRow[]>([...MOCK_APP_USERS]);

  readonly searchQuery = signal('');
  readonly rolFiltro = signal<UserRolFiltro>('todos');
  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filtroRolOptions = ROL_FILTRO_OPTIONS;

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const rol = this.rolFiltro();
    return this.allRows().filter((row) => {
      if (rol !== 'todos' && row.role !== rol) {
        return false;
      }
      if (!q) {
        return true;
      }
      const rolEs = roleLabelEs(row.role).toLowerCase();
      return (
        row.username.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.role.toLowerCase().includes(q) ||
        rolEs.includes(q)
      );
    });
  });

  readonly totalFiltered = computed(() => this.filteredRows().length);

  readonly pagedRows = computed(() => {
    const all = this.filteredRows();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      this.searchQuery();
      this.rolFiltro();
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
    this.rolFiltro.set('todos');
    this.pageIndex.set(0);
  }

  abrirFormularioCrear(): void {
    this.formularioModo.set('crear');
    this.usuarioEditandoId.set(null);
    this.userForm.reset({
      username: '',
      email: '',
      role: 'USER' as AppUserRole,
      password: '',
    });
    this.userForm.controls.password.setValidators([Validators.required, Validators.minLength(4)]);
    this.userForm.controls.password.updateValueAndValidity();
  }

  onCancelarFormulario(): void {
    this.formularioModo.set('oculto');
    this.usuarioEditandoId.set(null);
    this.userForm.reset({
      username: '',
      email: '',
      role: 'USER' as AppUserRole,
      password: '',
    });
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.updateValueAndValidity();
  }

  onSubmitUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.notify.warn('Revisa los campos obligatorios antes de guardar.');
      return;
    }
    const raw = this.userForm.getRawValue();
    const modo = this.formularioModo();

    if (modo === 'crear') {
      const nuevo: UserListRow = {
        id: crypto.randomUUID(),
        username: raw.username!.trim(),
        email: raw.email!.trim(),
        role: raw.role as AppUserRole,
        password: raw.password ?? '',
        mustChangePassword: true,
      };
      this.allRows.update((rows) => [nuevo, ...rows]);
      this.notify.success('Usuario registrado (mock). Conectar API para persistir.');
      this.onCancelarFormulario();
      return;
    }

    if (modo === 'editar') {
      const id = this.usuarioEditandoId();
      if (!id) {
        return;
      }
      this.allRows.update((rows) =>
        rows.map((r) =>
          r.id === id
            ? {
                ...r,
                username: raw.username!.trim(),
                email: raw.email!.trim(),
                role: raw.role as AppUserRole,
              }
            : r,
        ),
      );
      this.notify.success('Usuario actualizado (mock). Conectar API para persistir.');
      this.onCancelarFormulario();
    }
  }

  onEditar(row: UserListRow): void {
    this.formularioModo.set('editar');
    this.usuarioEditandoId.set(row.id);
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.setValue('');
    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.patchValue({
      username: row.username,
      email: row.email,
      role: row.role,
    });
  }
}
