import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs/operators';
import { Button } from '../../components/button/button';
import { AuthService } from '../../services/auth.service';
import { LogoutConfirmService } from '../../services/logout-confirm.service';
import { AppSidebarNav } from '../../shared/components/app-sidebar-nav/app-sidebar-nav';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';

/** Viewport ≤ 991px: drawer + barra superior con hamburguesa */
const MOBILE_LAYOUT_QUERY = '(max-width: 991px)';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Button, MatIconModule, MatButtonModule, AppSidebarNav, PageHeaderActions],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  private readonly logoutConfirm = inject(LogoutConfirmService);
  private readonly breakpoint = inject(BreakpointObserver);
  private readonly router = inject(Router);

  readonly user = this.auth.getCurrentUser();
  readonly isCollapsed = signal(false);
  readonly isMobile = signal(false);
  readonly mobileMenuOpen = signal(false);

  /** En móvil siempre mostrar etiquetas del menú dentro del drawer. */
  readonly sidebarLabelsVisible = computed(
    () => this.isMobile() || !this.isCollapsed(),
  );

  constructor() {
    this.breakpoint
      .observe([MOBILE_LAYOUT_QUERY])
      .pipe(takeUntilDestroyed())
      .subscribe(state => {
        const mobile = state.matches;
        this.isMobile.set(mobile);
        if (!mobile) {
          this.mobileMenuOpen.set(false);
        }
      });

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMobileMenu());
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.toggleMobileMenu();
      return;
    }
    this.isCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.logoutConfirm.confirmAndLogout();
  }

  canShowAdminStuff(): boolean {
    return this.auth.isAdmin();
  }
}
