import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Button } from '../../components/button/button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.getCurrentUser();

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
