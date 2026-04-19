import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { API_CONFIG } from '../../shared/constants/api.constants';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-forgot-password',
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private readonly apiService = inject(ApiService)
  email = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  onSubmit(): void {
    const emailValue = this.email().trim();
    if (!emailValue) {
      this.errorMessage.set('Por favor, ingresa tu correo electrónico');
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.apiService.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, { email: emailValue }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set(
          'Si el correo existe, se ha enviado un enlace de recuperación'
        );
      },
      error: (error: string) => {
        this.isLoading.set(false);
        this.errorMessage.set('Email inválido');
      },
    })
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}
