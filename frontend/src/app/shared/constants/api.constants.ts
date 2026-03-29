/** En `ng serve`, `/api` se reenvía al backend (ver `proxy.conf.json`, puerto 4780). */
export const API_CONFIG = {
  BASE_URL: '/api',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/login',
      REGISTER: '/auth/register'
    }
  }
} as const;

