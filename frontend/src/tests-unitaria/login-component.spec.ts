/**
 * Tests unitarios: LoginComponent — lógica pura
 *
 * Qué se prueba: Señales (signals) del componente, validación de campos,
 *   flujo de autenticación, redirección según mustChangePassword.
 * Cómo se simula: Se instancia LoginComponent manualmente inyectando
 *   mocks de AuthService y Router vía reflexión. No se usa TestBed.
 * Resultado esperado: La lógica interna gestiona estados, errores y
 *   navegación sin conexión a API real.
 */
import { of, throwError } from 'rxjs';

class MockAuthService {
  loginFn: jest.Mock = jest.fn();
  isAuthenticatedValue = false;
  currentUserValue: any = null;

  login(creds: any) { return this.loginFn(creds); }
  isAuthenticated() { return this.isAuthenticatedValue; }
  getCurrentUser() { return this.currentUserValue; }
}

class MockRouter {
  navigate = jest.fn().mockResolvedValue(true);
}

function createLoginComponent(authSvc: MockAuthService, router: MockRouter) {
  const LoginComponent = require('../app/pages/login/login.component').LoginComponent;
  const comp = Object.create(LoginComponent.prototype);
  Object.defineProperty(comp, 'authService', { value: authSvc, writable: false });
  Object.defineProperty(comp, 'router', { value: router, writable: false });
  const { signal } = require('@angular/core');
  comp.username = signal('');
  comp.password = signal('');
  comp.isLoading = signal(false);
  comp.errorMessage = signal('');
  return comp;
}

const MOCK_RESPONSE = {
  username: 'admin', role: 'ADMIN', email: 'a@t.com',
  mustChangePassword: false, token: 'jwt',
};

describe('LoginComponent — lógica pura', () => {
  let auth: MockAuthService;
  let router: MockRouter;
  let comp: any;

  beforeEach(() => {
    auth = new MockAuthService();
    router = new MockRouter();
    comp = createLoginComponent(auth, router);
  });

  // ── 1. Campos vacíos → error sin llamar login ──────────────────────
  it('onSubmit con campos vacíos muestra error y no llama login', () => {
    comp.onSubmit();
    expect(comp.errorMessage()).toContain('completa todos los campos');
    expect(auth.loginFn).not.toHaveBeenCalled();
  });

  // ── 2. Login exitoso → navega a /dashboard ─────────────────────────
  it('onSubmit exitoso navega a /dashboard', () => {
    auth.loginFn.mockReturnValue(of(MOCK_RESPONSE));
    comp.username.set('admin');
    comp.password.set('Admin@123');
    comp.onSubmit();
    expect(auth.loginFn).toHaveBeenCalledWith({ username: 'admin', password: 'Admin@123' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard'], { replaceUrl: true });
    expect(comp.isLoading()).toBe(false);
  });

  // ── 3. mustChangePassword → navega a /mandatory-change-password ────
  it('onSubmit con mustChangePassword redirige a cambio obligatorio', () => {
    auth.loginFn.mockReturnValue(of({ ...MOCK_RESPONSE, mustChangePassword: true }));
    comp.username.set('admin');
    comp.password.set('Temp1');
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/mandatory-change-password'], { replaceUrl: true });
  });

  // ── 4. Error del servicio → errorMessage ───────────────────────────
  it('onSubmit con error muestra errorMessage', () => {
    auth.loginFn.mockReturnValue(throwError(() => 'Credenciales inválidas'));
    comp.username.set('admin');
    comp.password.set('wrong');
    comp.onSubmit();
    expect(comp.errorMessage()).toBe('Credenciales inválidas');
    expect(comp.isLoading()).toBe(false);
  });
});
