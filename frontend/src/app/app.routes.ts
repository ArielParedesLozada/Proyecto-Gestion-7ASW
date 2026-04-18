import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { authGuard } from './shared/guards/auth-guard';
import { ForgotPassword } from './pages/forgot-password/forgot-password';
import { ResetPassword } from './pages/reset-password/reset-password';
import { Dashboard } from './pages/dashboard/dashboard';
import { PolizasPage } from './pages/polizas/polizas.page';
import { PolizasNuevaPage } from './pages/polizas/polizas-nueva.page';
import { PolizasDetailPage } from './pages/polizas/polizas-detail.page';
import { PolizasEditPage } from './pages/polizas/polizas-edit.page';
import { EmpresasPage } from './pages/empresas/empresas.page';
import { EmpresasNuevaPage } from './pages/empresas/empresas-nueva.page';
import { EmpresasDetailPage } from './pages/empresas/empresas-detail.page';
import { EmpresasEditPage } from './pages/empresas/empresas-edit.page';
import { RamosPage } from './pages/ramos/ramos.page';
import { UsersPage } from './pages/users/users.page';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword
  },
  {
    path: 'reset-password',
    component: ResetPassword
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard]
  },
  {
    path: 'polizas/nueva',
    component: PolizasNuevaPage,
    canActivate: [authGuard]
  },
  {
    path: 'polizas/:id/editar',
    component: PolizasEditPage,
    canActivate: [authGuard]
  },
  {
    path: 'polizas/:id',
    component: PolizasDetailPage,
    canActivate: [authGuard]
  },
  {
    path: 'polizas',
    component: PolizasPage,
    canActivate: [authGuard]
  },
  {
    path: 'empresas/nueva',
    component: EmpresasNuevaPage,
    canActivate: [authGuard]
  },
  {
    path: 'empresas/:id/editar',
    component: EmpresasEditPage,
    canActivate: [authGuard]
  },
  {
    path: 'empresas/:id',
    component: EmpresasDetailPage,
    canActivate: [authGuard]
  },
  {
    path: 'empresas',
    component: EmpresasPage,
    canActivate: [authGuard]
  },
  {
    path: 'ramos',
    component: RamosPage,
    canActivate: [authGuard]
  },
  {
    path: 'users',
    component: UsersPage,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

