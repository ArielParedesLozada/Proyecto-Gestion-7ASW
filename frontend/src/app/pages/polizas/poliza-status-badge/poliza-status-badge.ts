import { Component, computed, input } from '@angular/core';
import { PolizaEstado } from '../models/poliza-list.model';

@Component({
  selector: 'app-poliza-status-badge',
  imports: [],
  templateUrl: './poliza-status-badge.html',
  styleUrl: './poliza-status-badge.scss',
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
