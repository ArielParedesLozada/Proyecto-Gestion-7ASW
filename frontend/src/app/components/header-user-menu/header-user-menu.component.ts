import { Component, ViewEncapsulation, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';
import { AuthService } from '../../services/auth.service';
import { LogoutConfirmService } from '../../services/logout-confirm.service';

@Component({
  selector: 'app-header-user-menu',
  standalone: true,
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './header-user-menu.component.html',
  styleUrl: './header-user-menu.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderUserMenuComponent {
  private readonly auth = inject(AuthService);
  private readonly logoutConfirm = inject(LogoutConfirmService);

  profileTitle(): string {
    return this.auth.isAdmin() ? 'Administrador del sistema' : 'Usuario del sistema';
  }

  profileLevel(): string {
    return this.auth.isAdmin() ? 'Nivel: Administrador' : 'Nivel: Usuario';
  }

  requestLogout(trigger: MatMenuTrigger): void {
    trigger.closeMenu();
    this.logoutConfirm.confirmAndLogout();
  }
}
