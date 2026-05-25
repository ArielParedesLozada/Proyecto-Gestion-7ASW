import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { RenovacionService } from '../../../services/renovacion.service';
import { NotificationService } from '../../../shared/services/notification.service';
import { RenovacionHistorialRow } from '../../../interfaces/renovacion.interface';
import { take } from 'rxjs';
import { EstadoPipe } from '../pipes/estado-pipe';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderActions } from '../../../components/page-header-actions/page-header-actions';

@Component({
  selector: 'app-renovacion-detail.page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    EstadoPipe,
    MatIconModule,
    PageHeaderActions,
  ],
  templateUrl: './renovacion-detail.page.html',
  styleUrl: './renovacion-detail.page.scss',
})
export class RenovacionDetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private renovacionesApi = inject(RenovacionService);
  private notify = inject(NotificationService);

  readonly renovacion = signal<RenovacionHistorialRow | null>(null);

  readonly detalleEsEditable = computed(
    () => this.renovacion()?.estado === 'pendiente'
  );

  constructor() {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/renovaciones']);
      return;
    }

    // si tienes endpoint getById úsalo:
    this.renovacionesApi
      .getById(id)
      .pipe(take(1))
      .subscribe({
        next: r => this.renovacion.set(r),
        error: err => {
          this.notify.fromHttpError(err);
          void this.router.navigate(['/renovaciones']);
        }
      });
  }

  volver(): void {
    void this.router.navigate(['/renovaciones']);
  }

  confirmar(): void {

    const id = this.renovacion()?.id;

    if (!id) return;

    this.renovacionesApi
      .confirmarRenovacion(id)
      .pipe(take(1))
      .subscribe({
        next: () => {

          this.renovacion.update(r =>
            r
              ? {
                ...r,
                estado: 'confirmada'
              }
              : null
          );

          this.notify.success('Renovación confirmada');
        },
        error: err => this.notify.fromHttpError(err)
      });
  }
}
