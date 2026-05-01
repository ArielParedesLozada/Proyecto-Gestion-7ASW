import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { EmpresasPage } from './pages/empresas/empresas.page';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { LoginComponent } from './pages/login/login.component';
import { MandatoryChangePasswordPage } from './pages/mandatory-change-password/mandatory-change-password.page';
import { PolizasDetailPage } from './pages/polizas/polizas-detail.page';
import { PolizasEditPage } from './pages/polizas/polizas-edit.page';
import { PolizasNuevaPage } from './pages/polizas/polizas-nueva.page';
import { PolizasPage } from './pages/polizas/polizas.page';
import { RamosPage } from './pages/ramos/ramos.page';
import { RenovacionesPage } from './pages/renovaciones/renovaciones.page';
import { ResetPassword } from './pages/reset-password/reset-password';
import { UsersPage } from './pages/users/users.page';
import { authGuard } from './shared/guards/auth-guard';
import { mandatoryPasswordGuard } from './shared/guards/mandatory-password.guard';
import { RenovacionDetailPage } from './pages/renovaciones/renovacion-detail/renovacion-detail.page';
import { AseguradorasPage } from './pages/aseguradoras/aseguradoras.page';

/**
 * Rutas públicas (sin MainLayout).
 * Shell autenticado: `path: ''` + MainLayout + `authGuard` (una sola vez); hijos = solo componentes de página.
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  {
    path: 'mandatory-change-password',
    component: MandatoryChangePasswordPage,
    canActivate: [mandatoryPasswordGuard],
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: Dashboard },
      { path: 'polizas/nueva', component: PolizasNuevaPage },
      { path: 'polizas/:id/editar', component: PolizasEditPage },
      { path: 'polizas/:id', component: PolizasDetailPage },
      { path: 'polizas', component: PolizasPage },
      { path: 'empresas', component: EmpresasPage },
      { path: 'aseguradoras', component: AseguradorasPage },
      { path: 'ramos', component: RamosPage },
      { path: 'renovaciones/:id', component: RenovacionDetailPage },
      { path: 'renovaciones', component: RenovacionesPage },
      { path: 'users', component: UsersPage },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
