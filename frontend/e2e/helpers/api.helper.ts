import { APIRequestContext } from '@playwright/test';
import { getAdminCredentials } from '../fixtures/test-data';

const API_BASE = process.env['E2E_API_URL'] ?? 'http://localhost:4780';

type LoginApiResponse = {
  token: string;
  mustChangePassword?: boolean;
};

export async function loginViaApi(
  request: APIRequestContext,
  username: string,
  password: string,
): Promise<LoginApiResponse> {
  const response = await request.post(`${API_BASE}/auth/login`, {
    data: { username, password },
  });
  if (!response.ok()) {
    throw new Error(`Login API falló (${response.status()}). ¿Backend en ${API_BASE}?`);
  }
  return (await response.json()) as LoginApiResponse;
}

export async function getAdminToken(request: APIRequestContext): Promise<string> {
  const { username, password } = getAdminCredentials();
  const body = await loginViaApi(request, username, password);
  return body.token;
}

export async function changePasswordViaApi(
  request: APIRequestContext,
  token: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await request.post(`${API_BASE}/auth/change-password`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      oldPassword,
      newPassword,
      confirmNewPassword: newPassword,
    },
  });
  if (!response.ok()) {
    const text = await response.text();
    throw new Error(`Cambio de contraseña API falló (${response.status()}): ${text}`);
  }
}

export async function registerUserViaApi(
  request: APIRequestContext,
  token: string,
  payload: { username: string; email: string; password: string; role: 'USER' | 'ADMIN' },
): Promise<void> {
  const response = await request.post(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: payload,
  });
  if (!response.ok() && response.status() !== 409) {
    const text = await response.text();
    throw new Error(`No se pudo registrar usuario (${response.status()}): ${text}`);
  }
}
