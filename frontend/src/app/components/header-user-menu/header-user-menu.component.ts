import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header-user-menu',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './header-user-menu.component.html',
  styleUrl: './header-user-menu.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderUserMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  profileTitle(): string {
    return this.auth.isAdmin() ? 'Administrador del sistema' : 'Usuario del sistema';
  }

  profileLevel(): string {
    return this.auth.isAdmin() ? 'Nivel: Administrador' : 'Nivel: Usuario';
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
