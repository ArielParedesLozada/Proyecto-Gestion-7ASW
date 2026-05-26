import { Component, computed, input } from '@angular/core';
import { resolveRenovacionEstadoDisplay } from '../../utils/renovacion-estado-display.util';
import { StatusBadge } from '../status-badge/status-badge';

@Component({
  selector: 'app-renovacion-status-badge',
  imports: [StatusBadge],
  templateUrl: './renovacion-status-badge.html',
})
export class RenovacionStatusBadge {
  readonly estado = input.required<number | string>();

  private readonly display = computed(() => resolveRenovacionEstadoDisplay(this.estado()));

  readonly variant = computed(() => this.display().variant);
  readonly label = computed(() => this.display().label);
}
