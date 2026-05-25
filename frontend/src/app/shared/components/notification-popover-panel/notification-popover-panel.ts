import { Component, inject, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NotificationPopoverFacade } from '../../services/notification-popover.facade';
import { NotificationPopoverItem } from '../notification-popover-item/notification-popover-item';

@Component({
  selector: 'app-notification-popover-panel',
  imports: [MatIconModule, NotificationPopoverItem],
  templateUrl: './notification-popover-panel.html',
  styleUrl: './notification-popover-panel.scss',
})
export class NotificationPopoverPanel {
  readonly facade = inject(NotificationPopoverFacade);
  readonly viewAll = output<void>();

  onViewAll(): void {
    this.facade.close();
    this.viewAll.emit();
  }
}
