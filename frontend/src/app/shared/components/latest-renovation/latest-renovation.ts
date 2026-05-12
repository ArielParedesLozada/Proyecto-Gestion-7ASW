import { Component, computed, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RenovacionHistorialRow } from '../../../interfaces/renovacion.interface';
import { EstadoPipe } from '../../../pages/renovaciones/pipes/estado-pipe';

@Component({
  selector: 'app-latest-renovation',
  standalone: true,
  imports: [DatePipe, DecimalPipe, MatIconModule, MatButtonModule, EstadoPipe],
  templateUrl: './latest-renovation.html',
  styleUrl: './latest-renovation.scss',
})
export class LatestRenovation {
  private readonly estadoPipe = new EstadoPipe();
  readonly renovacion = input<RenovacionHistorialRow | null>(null);
  readonly ramo = input<string | null>(null);   // nuevo input
  readonly loading = input(false);
  readonly aprobar = output<void>();
  readonly rechazar = output<void>();

  readonly puedeAccionar = computed(() => {
    const r = this.renovacion();
    if (!r) return false;
    const estadoText = this.estadoPipe.transform(r.estado);
    return estadoText === 'Por Vencer';
  });

  onAprobar(): void {
    if (!this.puedeAccionar() || this.loading()) return;
    this.aprobar.emit();
  }

  onRechazar(): void {
    if (!this.puedeAccionar() || this.loading()) return;
    this.rechazar.emit();
  }
}