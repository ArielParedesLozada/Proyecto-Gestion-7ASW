import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NotificationPopoverRow } from '../../utils/notification-display.util';

@Component({
  selector: 'app-notification-popover-item',
  imports: [MatIconModule],
  templateUrl: './notification-popover-item.html',
  styleUrl: './notification-popover-item.scss',
})
export class NotificationPopoverItem {
  readonly row = input.required<NotificationPopoverRow>();
}
