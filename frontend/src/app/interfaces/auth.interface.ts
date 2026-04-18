export interface LoginRequest {
  username: string;
  password: string;
}

/** Respuesta del backend en login (camelCase). */
export interface LoginResponse {
  username: string;
  role: string;
  email: string;
  mustChangePassword: boolean;
  token: string;
}

export interface AuthUser {
  username: string;
  email: string;
  mustChangePassword: boolean;
  role: string;
}

/** Perfil desde `GET /auth/me` (camelCase API). */
export interface AuthUserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Reservado para futuros endpoints; el login usa `AuthUser`. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  createdAt: string;
  isActive: boolean;
}
