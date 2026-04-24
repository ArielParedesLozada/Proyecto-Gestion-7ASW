import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LogoutConfirmDialogComponent } from '../components/logout-confirm-dialog/logout-confirm-dialog.component';
import { AuthService } from './auth.service';

/**
 * Abre el diálogo de confirmación y, solo si el usuario confirma,
 * ejecuta logout + redirección a login (misma lógica en todo el sistema).
 */
@Injectable({
  providedIn: 'root',
})
export class LogoutConfirmService {
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  confirmAndLogout(): void {
    const ref = this.dialog.open(LogoutConfirmDialogComponent, {
      width: 'min(420px, 96vw)',
      maxWidth: '96vw',
      autoFocus: 'first-tabbable',
      disableClose: false,
      panelClass: 'sicop-logout-confirm-panel',
    });

    ref
      .afterClosed()
      .pipe(filter((v): v is boolean => v === true))
      .subscribe(() => {
        this.auth.logout();
        void this.router.navigate(['/login']);
      });
  }
}
