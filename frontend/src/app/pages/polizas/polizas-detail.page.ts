import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { PolizaService } from '../../services/poliza.service';
import { NotificationService } from '../../shared/services/notification.service';
import { RenovacionService } from '../../services/renovacion.service';
import { RenovacionHistorialRow } from '../../interfaces/renovacion.interface';
import { PageEvent } from '@angular/material/paginator';
import { RenovacionesTable } from '../renovaciones/renovaciones-table/renovaciones-table';
import { LatestRenovation } from '../../shared/components/latest-renovation/latest-renovation';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NuevoValorRenovacionDialogComponent } from '../../shared/components/nuevo-valor-renovacion-dialog-component/nuevo-valor-renovacion-dialog-component';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';

@Component({
  selector: 'app-polizas-detail-page',
  imports: [
    DatePipe,
    DecimalPipe,
    MatIconModule,
    MatButtonModule,
    PolizaStatusBadge,
    PageHeaderActions,
    RenovacionesTable,
    LatestRenovation,
    MatDialogModule
  ],
  templateUrl: './polizas-detail.page.html',
  styleUrl: './polizas-detail.page.scss',
})
export class PolizasDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly polizaService = inject(PolizaService);
  private readonly renovacionService = inject(RenovacionService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  pageSize = 10;
  pageIndex = 0;
  ultimaRenovacion: RenovacionHistorialRow | null = null;
  procesandoRenovacion = false;
  historialRenovaciones: RenovacionHistorialRow[] = [];
  notificaciones = [];
  auditorias = [];

  ngOnInit(): void {
    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => id
        ? this.renovacionService.getByPolizaId(id)
        : of({ items: [], total: 0, page: 1, pageSize: 10 })
      ),
      catchError(err => {
        this.notify.fromHttpError(err);
        return of({ items: [], total: 0, page: 1, pageSize: 10 });
      })
    ).subscribe(result => {
      this.historialRenovaciones = result.items;
    });

    this.route.paramMap.pipe(
      map(params => params.get('id')),
      switchMap(id => id ? this.renovacionService.getLatestRenovacion(id) : of(null)),
      catchError(err => {
        this.notify.fromHttpError(err);
        return of(null);
      })
    ).subscribe(renovacion => {
      this.ultimaRenovacion = renovacion;
    });
  }

  readonly poliza = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('id') ?? ''),
      switchMap(id =>
        id
          ? this.polizaService.getById(id).pipe(catchError(err => {
            this.notify.fromHttpError(err);
            return of(null);
          }))
          : of(null)
      )
    ),
    { initialValue: null }
  );

  onVolver(): void {
    void this.router.navigate(['/polizas']);
  }

  onAction(accion: string): void {
    if (accion === 'Editar') {
      const id = this.poliza()?.id;
      if (id) void this.router.navigate(['/polizas', id, 'editar']);
      return;
    }
    if (accion === 'PDF') {
      const p = this.poliza();
      if (!p?.id) return;
      this.polizaService.downloadPdfPoliza(p.id, p.numero).subscribe({
        next: () => this.notify.success('PDF descargado.'),
        error: err => this.notify.fromHttpError(err),
      });
      return;
    }
    this.notify.info(`La acción «${accion}» estará disponible próximamente.`);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
  }

  onVerRenovacion(row: RenovacionHistorialRow): void {
    void this.router.navigate(['/renovaciones', row.id]);
  }

  // ----- Lógica de aprobación con modal -----
  onAprobarUltimaRenovacion(): void {
    if (!this.ultimaRenovacion) return;
    if (this.requiereNuevoValor()) {
      this.abrirModalNuevoValor();
      return;
    }
    this.confirmarRenovacion();
  }

  private requiereNuevoValor(): boolean {
    return this.poliza()?.cambiaValor || false;
  }

  private abrirModalNuevoValor(): void {
    const ref = this.dialog.open(NuevoValorRenovacionDialogComponent, {
      width: '420px',
      data: { valorActual: this.ultimaRenovacion?.valor }
    });
    ref.afterClosed().subscribe(valor => {
      if (valor !== undefined && valor !== null) {
        this.confirmarRenovacion(Number(valor));
      }
    });
  }

  private confirmarRenovacion(nuevoValor?: number): void {
    if (!this.ultimaRenovacion) return;
    this.procesandoRenovacion = true;
    this.renovacionService.confirmarRenovacion(this.ultimaRenovacion.id, nuevoValor).subscribe({
      next: () => {
        this.notify.success('Renovación aprobada');
        this.recargarUltimaRenovacion();
      },
      error: e => this.notify.fromHttpError(e),
      complete: () => { this.procesandoRenovacion = false; }
    });
  }

  onRechazarUltimaRenovacion(): void {
    if (!this.ultimaRenovacion) return;
    this.procesandoRenovacion = true;
    this.renovacionService.rechazarRenovacion(this.ultimaRenovacion.id).subscribe({
      next: () => {
        this.notify.success('Renovación rechazada');
        this.recargarUltimaRenovacion();
      },
      error: e => this.notify.fromHttpError(e),
      complete: () => { this.procesandoRenovacion = false; }
    });
  }

  private recargarUltimaRenovacion(): void {
    const id = this.poliza()?.id;
    if (!id) return;
    this.renovacionService.getLatestRenovacion(id).pipe(
      catchError(err => {
        this.notify.fromHttpError(err);
        return of(null);
      })
    ).subscribe(r => { this.ultimaRenovacion = r; });
  }
}