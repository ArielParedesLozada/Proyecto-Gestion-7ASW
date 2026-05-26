import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import { NotificacionService } from '../../services/notificacion.service';
import {
  hasPendingNotificaciones,
  NotificationPopoverRow,
  toNotificationPopoverRow,
} from '../utils/notification-display.util';

const RECENT_LIMIT = 5;

@Injectable({ providedIn: 'root' })
export class NotificationPopoverFacade {
  private readonly api = inject(NotificacionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly rows = signal<NotificationPopoverRow[]>([]);
  readonly hasPending = signal(false);

  constructor() {
    this.refreshPendingIndicator();
  }

  toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.open.set(true);
    this.loadRecent();
  }

  close(): void {
    this.open.set(false);
  }

  refreshPendingIndicator(): void {
    this.api
      .getNotificacionesPendientes(1, RECENT_LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.hasPending.set(data.total > 0 || hasPendingNotificaciones(data.items)),
        error: () => this.hasPending.set(false),
      });
  }

  loadRecent(): void {
    this.loading.set(true);

    this.api
      .getUltimasNotificaciones(RECENT_LIMIT)
      .pipe(take(1))
      .subscribe({
        next: (items) => {
          this.rows.set(items.map(toNotificationPopoverRow));
          this.hasPending.set(hasPendingNotificaciones(items));
          this.loading.set(false);
        },
        error: () => {
          this.rows.set([]);
          this.loading.set(false);
        },
      });
  }
}
