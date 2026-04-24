import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthUser } from '../../interfaces/auth.interface';
import { StorageService } from '../services/storage.service';

export const authGuard: CanActivateFn = (_route, _state) => {
  const storage = inject(StorageService);
  const router = inject(Router);
  if (!storage.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }

  const user = storage.getUser() as AuthUser | null;
  if (user?.mustChangePassword === true) {
    void router.navigate(['/mandatory-change-password'], { replaceUrl: true });
    return false;
  }

  return true;
};
