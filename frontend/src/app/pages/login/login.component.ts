import { Component, inject, OnInit, signal } from '@angular/core';
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


export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = signal<string>('');
  password = signal<string>('');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    const u = this.authService.getCurrentUser();
    if (u?.mustChangePassword) {
      void this.router.navigate(['/mandatory-change-password'], { replaceUrl: true });
      return;
    }
    void this.router.navigate(['/dashboard'], { replaceUrl: true });
  }

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
      next: (response) => {
        this.isLoading.set(false);
        if (response.mustChangePassword) {
          void this.router.navigate(['/mandatory-change-password'], { replaceUrl: true });
          return;
        }
        void this.router.navigate(['/dashboard'], { replaceUrl: true });
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

