import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Solo administradores; el resto vuelve al dashboard. */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }

  if (!auth.isAdmin()) {
    void router.navigate(['/dashboard'], { replaceUrl: true });
    return false;
  }

  return true;
};
