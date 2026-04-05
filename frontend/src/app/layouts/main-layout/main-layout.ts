import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Button } from "../../components/button/button";
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterLink, RouterLinkActive, Button],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router);
  readonly user = this.auth.getCurrentUser()
  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.update(v => !v);
  }
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
  canShowAdminStuff(){
    return this.auth.isAdmin()
  }
}
