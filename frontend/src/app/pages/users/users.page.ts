import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { UsersTable } from './users-table/users-table';
import { AppUserRole, ROL_FILTRO_OPTIONS, UserListRow, UserRolFiltro, roleLabelEs } from './models/user-list.model';
import { NotificationService } from '../../shared/services/notification.service';
import { UserService } from '../../services/user.service';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';
import { AuthService } from '../../services/auth.service';
import { USER_MAX } from '../../shared/constants/form-field-limits';

@Component({
  selector: 'app-users-page',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    UsersTable,
    PageHeaderActions,
  ],
  templateUrl: './users.page.html',
  styleUrl: './users.page.scss',
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  private readonly notify = inject(NotificationService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);

  readonly formularioModo = signal<'oculto' | 'crear' | 'editar'>('oculto');
  readonly usuarioEditandoId = signal<string | null>(null);
  /** Usuario en edición (fila); fallback si `getMe()` aún no devolvió el id. */
  readonly usuarioEditandoUsername = signal<string | null>(null);
  /** Id del usuario autenticado (`GET /auth/me`) para comparar con filas. */
  readonly currentUserId = signal<string | null>(null);
  /** Rol original al abrir edición; se reenvía en PUT si se edita el propio perfil. */
  readonly rolAlAbrirEdicion = signal<AppUserRole | null>(null);
  /** Evita envíos concurrentes sin tocar la plantilla. */
  readonly saving = signal(false);

  readonly userForm = this.fb.group({
    username: ['', [Validators.required, Validators.maxLength(USER_MAX.username)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(USER_MAX.email)]],
    role: ['USER' as AppUserRole, [Validators.required]],
    password: [''],
  });

  readonly userMax = USER_MAX;

  readonly allRows = signal<UserListRow[]>([]);

  readonly searchQuery = signal('');
  readonly rolFiltro = signal<UserRolFiltro>('todos');
  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filtroRolOptions = ROL_FILTRO_OPTIONS;

  readonly isEditingSelf = computed(() => {
    const uid = this.usuarioEditandoId();
    const me = this.currentUserId();
    const editUser = this.usuarioEditandoUsername()?.trim().toLowerCase();
    const sessionUser = this.authService.getCurrentUser()?.username?.trim().toLowerCase();

    const idMatch =
      !!uid &&
      !!me &&
      uid.trim().toLowerCase() === me.trim().toLowerCase();
    const usernameMatch = !!editUser && !!sessionUser && editUser === sessionUser;

    return idMatch || usernameMatch;
  });

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
    this.authService.getMe().subscribe({
      next: (p) => this.currentUserId.set(p.id),
      error: () => this.currentUserId.set(null),
    });
    this.recargarUsuarios();

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

    /** Si `getMe()` llega después de abrir edición, o por username se detecta “yo”, mantener el rol bloqueado. */
    effect(() => {
      const modo = this.formularioModo();
      const self = this.isEditingSelf();
      this.usuarioEditandoId();
      this.currentUserId();
      this.usuarioEditandoUsername();

      untracked(() => {
        if (modo !== 'editar' || this.saving()) {
          return;
        }
        if (self) {
          this.userForm.controls.role.disable({ emitEvent: false });
        } else {
          this.userForm.controls.role.enable({ emitEvent: false });
        }
      });
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
    this.usuarioEditandoUsername.set(null);
    this.rolAlAbrirEdicion.set(null);
    this.userForm.enable();
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
    this.usuarioEditandoUsername.set(null);
    this.rolAlAbrirEdicion.set(null);
    this.userForm.enable();
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
    if (this.saving()) {
      return;
    }
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      const c = this.userForm.controls;
      if (c.username.hasError('maxlength')) {
        this.notify.warn(`El usuario no puede superar los ${USER_MAX.username} caracteres.`);
        return;
      }
      if (c.email.hasError('maxlength')) {
        this.notify.warn(`El correo no puede superar los ${USER_MAX.email} caracteres.`);
        return;
      }
      this.notify.warn('Revisa los campos obligatorios antes de guardar.');
      return;
    }
    const raw = this.userForm.getRawValue();
    const modo = this.formularioModo();

    this.saving.set(true);
    this.userForm.disable();

    if (modo === 'crear') {
      this.userService
        .create({
          username: raw.username!.trim(),
          email: raw.email!.trim(),
          password: raw.password ?? '',
          role: raw.role as AppUserRole,
        })
        .pipe(
          finalize(() => {
            this.saving.set(false);
            this.userForm.enable();
            this.refreshRoleControlAfterFormEnable();
          }),
        )
        .subscribe({
          next: () => {
            this.notify.success('Usuario registrado correctamente.');
            this.recargarUsuarios();
            this.onCancelarFormulario();
          },
          error: (err: Error) => this.notify.error(err.message),
        });
      return;
    }

    if (modo === 'editar') {
      const id = this.usuarioEditandoId();
      if (!id) {
        this.saving.set(false);
        this.userForm.enable();
        this.refreshRoleControlAfterFormEnable();
        return;
      }
      const roleToSend = this.isEditingSelf()
        ? (this.rolAlAbrirEdicion() ?? (raw.role as AppUserRole))
        : (raw.role as AppUserRole);
      this.userService
        .update(id, {
          username: raw.username!.trim(),
          email: raw.email!.trim(),
          role: roleToSend,
        })
        .pipe(
          finalize(() => {
            this.saving.set(false);
            this.userForm.enable();
            this.refreshRoleControlAfterFormEnable();
          }),
        )
        .subscribe({
          next: () => {
            this.notify.success('Usuario actualizado correctamente.');
            this.recargarUsuarios();
            this.onCancelarFormulario();
          },
          error: (err: Error) => this.notify.error(err.message),
        });
      return;
    }

    this.saving.set(false);
    this.userForm.enable();
    this.refreshRoleControlAfterFormEnable();
  }

  onEditar(row: UserListRow): void {
    this.formularioModo.set('editar');
    this.usuarioEditandoId.set(row.id);
    this.usuarioEditandoUsername.set(row.username);
    this.rolAlAbrirEdicion.set(row.role);
    this.userForm.enable();
    this.userForm.controls.password.clearValidators();
    this.userForm.controls.password.setValue('');
    this.userForm.controls.password.updateValueAndValidity();
    this.userForm.patchValue({
      username: row.username,
      email: row.email,
      role: row.role,
    });
    this.refreshRoleControlAfterFormEnable();
  }

  private recargarUsuarios(): void {
    this.userService.getList().subscribe({
      next: (data) => this.allRows.set(data),
      error: (err: unknown) => {
        this.allRows.set([]);
        this.notify.fromHttpError(err);
      },
    });
  }

  /** Tras `enable()` masivo, volver a deshabilitar rol si se edita el propio usuario. */
  private refreshRoleControlAfterFormEnable(): void {
    if (this.formularioModo() === 'editar' && this.isEditingSelf()) {
      this.userForm.controls.role.disable({ emitEvent: false });
    } else {
      this.userForm.controls.role.enable({ emitEvent: false });
    }
  }
}
