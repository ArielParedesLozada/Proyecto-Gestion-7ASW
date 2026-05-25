import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderUserMenuComponent } from '../header-user-menu/header-user-menu.component';

/** Iconos de notificaciones + perfil reutilizables (páginas y barra móvil del layout). */
@Component({
  selector: 'app-page-header-actions',
  imports: [MatIconModule, HeaderUserMenuComponent, RouterLink],
  templateUrl: './page-header-actions.html',
  styleUrl: './page-header-actions.scss',
  host: {
    class: 'page-header-actions',
    '[class.page-header-actions--topbar]': 'variant() === "topbar"',
  },
})
export class PageHeaderActions {
  /** `default`: cabecera de página; `topbar`: barra superior móvil del shell. */
  readonly variant = input<'default' | 'topbar'>('default');
  readonly showNotifications = input(true);
  readonly showUserMenu = input(true);
}
