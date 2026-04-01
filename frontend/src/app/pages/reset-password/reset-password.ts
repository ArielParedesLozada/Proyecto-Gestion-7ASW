import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { API_CONFIG } from '../../shared/constants/api.constants';

@Component({
  selector: 'app-reset-password',
  imports: [],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  password = signal<string>('');
  confirmPassword = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);
  token: string = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    console.log(this.token)
    if (!this.token) {
      this.errorMessage.set('Token inválido o ausente');
    }
  }

  onSubmit(): void {
    if (!this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Completa todos los campos');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.api.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, {
      token: this.token,
      newPassword: this.password()
    }).subscribe({
      next: () => {
        console.log("papusdsadcsa")
        this.isLoading.set(false);
        this.successMessage.set('Contraseña actualizada correctamente');
        // setTimeout(() => {
        //   this.router.navigate(['/login']);
        // }, 2000);
      },
      error: (err) => {
        console.log("Nigger")
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.error?.message || 'Error al restablecer contraseña'
        );
      }
    });
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}
