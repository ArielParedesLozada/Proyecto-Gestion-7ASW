import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NotificationPopoverFacade } from '../../services/notification-popover.facade';
import { NotificationPopoverPanel } from '../notification-popover-panel/notification-popover-panel';

@Component({
  selector: 'app-notification-bell',
  imports: [MatIconModule, NotificationPopoverPanel],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.scss',
})
export class NotificationBell {
  private readonly router = inject(Router);
  readonly facade = inject(NotificationPopoverFacade);

  /** Borde del indicador según fondo (página vs topbar móvil). */
  readonly dotBorderColor = input('#f5f7fb');

  @ViewChild('anchor', { static: true }) private readonly anchorRef!: ElementRef<HTMLElement>;

  onBellClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.facade.toggle();
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onViewAll(): void {
    void this.router.navigate(['/notificaciones']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.facade.open()) {
      return;
    }
    if (!this.anchorRef.nativeElement.contains(event.target as Node)) {
      this.facade.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.facade.close();
  }
}
