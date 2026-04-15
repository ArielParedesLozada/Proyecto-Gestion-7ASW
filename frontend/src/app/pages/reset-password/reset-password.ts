import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { API_CONFIG } from '../../shared/constants/api.constants';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reset-password',
  imports: [
    FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
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
        this.isLoading.set(false);
        this.successMessage.set('Contraseña actualizada correctamente');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
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
