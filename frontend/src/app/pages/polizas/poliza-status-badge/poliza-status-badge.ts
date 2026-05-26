import { Component, computed, input } from '@angular/core';
import { PolizaEstado } from '../models/poliza-list.model';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-poliza-status-badge',
  imports: [StatusBadge],
  templateUrl: './poliza-status-badge.html',
})
export class PolizaStatusBadge {
  estado = input.required<PolizaEstado>();

  label = computed(() => {
    const m: Record<PolizaEstado, string> = {
      vigente: 'Vigente',
      porVencer: 'Por vencer',
      expirado: 'Expirado',
    };
    return m[this.estado()];
  });
}
