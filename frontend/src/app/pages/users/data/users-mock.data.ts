import { UserListRow } from '../models/user-list.model';

/**
 * Datos de ejemplo (solo frontend).
 * Sustituir por respuesta de API al integrar backend.
 */
export const MOCK_APP_USERS: UserListRow[] = [
  {
    id: 'u-001',
    username: 'admin.sicop',
    email: 'admin.sicop@gobierno.local',
    role: 'ADMIN',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-002',
    username: 'coordinador1',
    email: 'coordinador1@gobierno.local',
    role: 'USER',
    password: '',
    mustChangePassword: true,
  },
  {
    id: 'u-003',
    username: 'maria.garcia',
    email: 'maria.garcia@contratista.com',
    role: 'USER',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-004',
    username: 'carlos.lopez',
    email: 'carlos.lopez@contratista.com',
    role: 'USER',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-005',
    username: 'auditoria',
    email: 'auditoria@gobierno.local',
    role: 'ADMIN',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-006',
    username: 'invitado_demo',
    email: 'demo@sicop.local',
    role: 'USER',
    password: '',
    mustChangePassword: true,
  },
  {
    id: 'u-007',
    username: 'laura.mendez',
    email: 'laura.mendez@gobierno.local',
    role: 'USER',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-008',
    username: 'proveedor_externo',
    email: 'contacto@externo.com',
    role: 'USER',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-009',
    username: 'supervisor.obras',
    email: 'supervisor.obras@gobierno.local',
    role: 'ADMIN',
    password: '',
    mustChangePassword: false,
  },
  {
    id: 'u-010',
    username: 'consulta.solo',
    email: 'consulta@gobierno.local',
    role: 'USER',
    password: '',
    mustChangePassword: false,
  },
];
