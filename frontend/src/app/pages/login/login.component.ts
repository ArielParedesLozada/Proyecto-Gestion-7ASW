import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})


export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  onSubmit(): void {
    const usernameValue = this.username().trim();
    const passwordValue = this.password();

    if (!usernameValue || !passwordValue) {
      this.errorMessage.set('Por favor, completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login({
      username: usernameValue,
      password: passwordValue
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Redirigir a la página principal después del login exitoso
        this.router.navigate(['/dashboard']).catch(err => {
          console.error('Error al redirigir:', err);
        });
      },
      error: (error: string) => {
        this.isLoading.set(false);
        this.errorMessage.set(error);
      }
    });
  }

  clearError(): void {
    this.errorMessage.set('');
  }
}

