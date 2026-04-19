import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-mandatory-change-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './mandatory-change-password.page.html',
  styleUrl: './mandatory-change-password.page.scss',
})
export class MandatoryChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
    confirmPassword: ['', Validators.required],
  });

  onSubmit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warn('Revisa los campos obligatorios antes de continuar.');
      return;
    }
    const { oldPassword, newPassword, confirmPassword } = this.form.getRawValue();
    if (newPassword !== confirmPassword) {
      this.formError.set('La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    if (newPassword === oldPassword) {
      this.formError.set('La nueva contraseña debe ser distinta de la actual.');
      return;
    }

    this.submitting.set(true);
    this.form.disable({ emitEvent: false });
    this.authService
      .changeMandatoryPassword({
        oldPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable({ emitEvent: false });
        }),
      )
      .subscribe({
        next: () => {
          this.notify.success('Contraseña actualizada. Ya puedes usar el sistema.');
          void this.router.navigate(['/dashboard'], { replaceUrl: true });
        },
        error: (msg: unknown) => {
          this.formError.set(typeof msg === 'string' ? msg : 'No se pudo actualizar la contraseña.');
        },
      });
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login'], { replaceUrl: true });
  }

  clearFormError(): void {
    this.formError.set(null);
  }
}
