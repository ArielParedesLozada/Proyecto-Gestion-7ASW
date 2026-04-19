/** Alineado con el rol en backend (`User.Role`). */
export type AppUserRole = 'ADMIN' | 'USER';

/** Valor del filtro desplegable en el listado. */
export type UserRolFiltro = 'todos' | AppUserRole;

/** Fila de listado (solo campos expuestos en la tabla). */
export interface UserListRow {
  id: string;
  username: string;
  email: string;
  role: AppUserRole;
  /** Solo mock / persistencia local; no se muestra en listado ni en edición. */
  password: string;
  mustChangePassword: boolean;
}

export function roleLabelEs(role: AppUserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'USER':
      return 'Usuario';
  }
}

export const ROL_FILTRO_OPTIONS: { value: UserRolFiltro; label: string }[] = [
  { value: 'todos', label: 'Todos los roles' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'USER', label: 'Usuario' },
];
