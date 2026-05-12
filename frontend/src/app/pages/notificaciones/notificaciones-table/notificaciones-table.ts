import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NotificacionItem } from '../../../services/notificacion.service';
import { PageEvent } from '@angular/material/paginator';
import { NotificacionEstadoPipe } from '../pipes/notificacion-estado-pipe';
import { NotificacionTipoPipe } from '../pipes/notificacion-tipo-pipe';
import { TruncatePipe } from '../pipes/truncate-pipe';

@Component({
  selector: 'app-notificaciones-table',
  imports: [
    DatePipe,
    LocalPaginatorComponent,
    MatIconModule,
    MatButtonModule,
    NotificacionEstadoPipe,
    NotificacionTipoPipe,
    TruncatePipe
  ],
  templateUrl: './notificaciones-table.html',
  styleUrl: './notificaciones-table.scss',
})
export class NotificacionesTable {
  readonly rows = input.required<NotificacionItem[]>();
  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);
  readonly pageChange = output<PageEvent>();

  getEstadoClass(estado: number): string {
    const estadoMap: Record<number, string> = {
      0: 'enviada',
      1: 'error',
      2: 'pendiente',
      3: 'invalidada'
    };
    return estadoMap[estado] || 'pendiente';
  }

  getTipoClass(tipo: number): string {
    const tipoMap: Record<number, string> = {
      0: 'renovacion',
      1: 'expiracion'
    };
    return tipoMap[tipo] || 'renovacion';
  }
}
