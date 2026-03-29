import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    redirectTo: '/login'
  },
  {
    path: 'forgot-password',
    redirectTo: '/login'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

