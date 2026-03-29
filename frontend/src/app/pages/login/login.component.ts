import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit(): void {
    const emailValue = this.email();
    const passwordValue = this.password();

    if (!emailValue || !passwordValue) {
      this.errorMessage.set('Por favor, completa todos los campos');
      return;
    }

    if (!this.isValidEmail(emailValue)) {
      this.errorMessage.set('Por favor, ingresa un email válido');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      email: emailValue,
      password: passwordValue
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Redirigir a la página principal después del login exitoso
        this.router.navigate(['/home']).catch(err => {
          console.error('Error al redirigir:', err);
        });
      },
      error: (error: string) => {
        this.isLoading.set(false);
        this.errorMessage.set(error);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}

