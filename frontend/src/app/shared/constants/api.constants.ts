/** En `ng serve`, `/api` se reenvía al backend (ver `proxy.conf.json`, puerto 4780). */
export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      ME: '/auth/me',
      CHANGE_PASSWORD: '/auth/change-password',
      FORGOT_PASSWORD: '/auth/request-password-reset',
      RESET_PASSWORD: '/auth/reset-password'
    },
    POLIZAS: {
      EMPRESAS: '/empresas',
      RAMOS: '/ramos',
      POLIZAS: '/polizas',
      USERS: '/users',
    },
    /** Rutas previstas para renovaciones; alinear con el contrato real del backend. */
    RENOVACIONES: {
      HISTORIAL: '/renovaciones',
      HISTORIAL_POLIZA: '/renovaciones/poliza',
      VALIDAR: '/renovaciones/:id/validar',
      RECHAZAR: '/renovaciones/:id/rechazar',
    },
  }
} as const;

