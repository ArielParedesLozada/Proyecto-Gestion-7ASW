/** En `ng serve`, `/api` se reenvía al backend (ver `proxy.conf.json`, puerto 4780). */
export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      FORGOT_PASSWORD:  '/auth/request-password-reset',
      RESET_PASSWORD: '/auth/reset-password'
    }
  }
} as const;

