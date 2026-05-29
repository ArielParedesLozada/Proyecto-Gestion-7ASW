import { Component, input } from '@angular/core';

/** Pastilla de estado reutilizable (Pólizas, Renovaciones, etc.). */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  readonly variant = input.required<string>();
  readonly label = input.required<string>();
}
