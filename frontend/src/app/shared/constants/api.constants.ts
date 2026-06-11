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
    ASEGURADORAS: {
      INDEX: '/aseguradoras',
      UNA: (id: string) => `/aseguradoras/${encodeURIComponent(id)}`
    },
    POLIZAS: {
      EMPRESAS: '/empresas',
      RAMOS: '/ramos',
      POLIZAS: '/polizas',
      USERS: '/users',
    },
    /** Rutas previstas para renovaciones; alinear con el contrato real del backend. */
    RENOVACIONES: {
      TODAS: '/renovaciones',
      UNA: (id: string) => `/renovaciones/${encodeURIComponent(id)}`,
      POLIZAS: {
        HISTORIAL: (polizaId: string) => `/renovaciones/poliza/${encodeURIComponent(polizaId)}`,
        LATEST: (polizaId: string) => `/renovaciones/poliza/${encodeURIComponent(polizaId)}/latest`
      },
      CONFIRMAR: (id: string) => `/renovaciones/${encodeURIComponent(id)}/validar`,
      RECHAZAR: (id: string) => `/renovaciones/${encodeURIComponent(id)}/rechazar`,
    },
    AUDITORIAS : {
      INDEX: '/auditorias'
    },
    NOTIFICACIONES: {
      INDEX: '/notificaciones',
      POR_POLIZA : (polizaId: string) => `/notificaciones/poliza/${encodeURIComponent(polizaId)}`
    },
    REPORTES: {
      CONTROL_MAESTRO: '/reportes/control-maestro',
      CONTROL_MAESTRO_PDF: '/reportes/control-maestro/pdf'
    }
  }
} as const;

