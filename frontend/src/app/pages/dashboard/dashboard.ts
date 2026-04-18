import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HeaderUserMenuComponent } from '../../components/header-user-menu/header-user-menu.component';
import { PolizasTable } from '../polizas/polizas-table/polizas-table';
import { PolizaListRow } from '../polizas/models/poliza-list.model';
import { sortPolizasForDashboard } from '../polizas/utils/poliza-list-orden.util';
import { PolizaService } from '../../services/poliza.service';
import { NotificationService } from '../../shared/services/notification.service';

/** Máximo de filas en la vista ejecutiva del Dashboard (tras ordenar por prioridad). */
export const DASHBOARD_POLIZAS_LIMIT = 10;

@Component({
  selector: 'app-dashboard',
  imports: [PolizasTable, MatIconModule, HeaderUserMenuComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly router = inject(Router);
  private readonly polizaService = inject(PolizaService);
  private readonly notify = inject(NotificationService);

  private readonly allRows = signal<PolizaListRow[]>([]);

  /** Orden: expiradas → por vencer → vigentes; luego fecha exp. asc.; solo las primeras N. */
  readonly dashboardRows = computed(() =>
    sortPolizasForDashboard(this.allRows()).slice(0, DASHBOARD_POLIZAS_LIMIT),
  );

  constructor() {
    this.cargarPolizas();
  }

  onVerPoliza(row: PolizaListRow): void {
    void this.router.navigate(['/polizas', row.id]);
  }

  irNuevaPoliza(): void {
    void this.router.navigate(['/polizas/nueva']);
  }

  irReportes(): void {
    void this.router.navigate(['/reportes']);
  }

  irRenovaciones(): void {
    void this.router.navigate(['/renovaciones']);
  }

  private cargarPolizas(): void {
    this.polizaService.getList().subscribe({
      next: (data) => this.allRows.set(data),
      error: (err: unknown) => {
        this.allRows.set([]);
        this.notify.fromHttpError(err);
      },
    });
  }
}
