import { Component, computed, input } from '@angular/core';

import { HeaderUserMenuComponent } from '../header-user-menu/header-user-menu.component';

import { NotificationBell } from '../../shared/components/notification-bell/notification-bell';



/** Iconos de notificaciones + perfil reutilizables (páginas y barra móvil del layout). */

@Component({

  selector: 'app-page-header-actions',

  imports: [HeaderUserMenuComponent, NotificationBell],

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



  readonly dotBorderColor = computed(() =>

    this.variant() === 'topbar' ? '#ffffff' : '#f5f7fb',

  );

}

