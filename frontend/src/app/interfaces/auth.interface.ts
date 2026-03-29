export interface LoginRequest {
  username: string;
  password: string;
}

/** Respuesta del backend en login (camelCase). */
export interface LoginResponse {
  username: string;
  role: string;
  token: string;
}

export interface AuthUser {
  username: string;
  role: string;
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
