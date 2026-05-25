import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Navegación lateral reutilizable (desktop colapsable + drawer móvil).
 * Mantiene data-testid para E2E.
 */
@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './app-sidebar-nav.html',
  styleUrl: './app-sidebar-nav.scss',
})
export class AppSidebarNav {
  /** En desktop colapsado oculta etiquetas; en móvil el layout fuerza labels visibles. */
  readonly labelsVisible = input(true);
  readonly showAdminLinks = input(false);
  readonly navItemActivated = output<void>();

  onNavClick(): void {
    this.navItemActivated.emit();
  }
}
