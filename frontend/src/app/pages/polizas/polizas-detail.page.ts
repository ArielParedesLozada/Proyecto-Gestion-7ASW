import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { PolizaService } from '../../services/poliza.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-polizas-detail-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MainLayout,
    MatIconModule,
    MatButtonModule,
    PolizaStatusBadge,
  ],
  templateUrl: './polizas-detail.page.html',
  styleUrl: './polizas-detail.page.scss',
})
export class PolizasDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly polizaService = inject(PolizaService);
  private readonly notify = inject(NotificationService);

  readonly poliza = toSignal(
    this.route.paramMap.pipe(
      map((p) => p.get('id') ?? ''),
      switchMap((id) =>
        id
          ? this.polizaService.getById(id).pipe(
              catchError((err) => {
                this.notify.fromHttpError(err);
                return of(null);
              }),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  onVolver(): void {
    void this.router.navigate(['/polizas']);
  }

  onAction(accion: string): void {
    if (accion === 'Editar') {
      const id = this.poliza()?.id;
      if (id) {
        void this.router.navigate(['/polizas', id, 'editar']);
      }
      return;
    }
    this.notify.info(`La acción «${accion}» estará disponible próximamente.`);
  }
}
