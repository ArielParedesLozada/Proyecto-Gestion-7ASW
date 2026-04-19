import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthUser } from '../../interfaces/auth.interface';
import { StorageService } from '../services/storage.service';

/** Solo sesión con `mustChangePassword`; el resto va al login o al dashboard. */
export const mandatoryPasswordGuard: CanActivateFn = () => {
  const storage = inject(StorageService);
  const router = inject(Router);

  if (!storage.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }

  const user = storage.getUser() as AuthUser | null;
  if (user?.mustChangePassword !== true) {
    void router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
