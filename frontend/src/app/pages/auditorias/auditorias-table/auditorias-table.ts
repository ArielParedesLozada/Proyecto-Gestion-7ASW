import { DatePipe, SlicePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LocalPaginatorComponent } from '../../../shared/components/local-paginator/local-paginator.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuditoriaItem } from '../../../services/auditoria.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-auditorias-table',
  imports: [
    SlicePipe,
    LocalPaginatorComponent,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './auditorias-table.html',
  styleUrl: './auditorias-table.scss',
})
export class AuditoriasTable {
  readonly rows = input.required<AuditoriaItem[]>();
  readonly paginatorLength = input.required<number>();
  readonly pageIndex = input.required<number>();
  readonly pageSize = input(10);
  readonly pageChange = output<PageEvent>();
  readonly verDetalles = output<AuditoriaItem>();

  getAccionClass(accion: string): string {
    const accionLower = accion.toLowerCase();
    const accionMap: Record<string, string> = {
      'create': 'create',
      'insert': 'create',
      'update': 'update',
      'modify': 'update',
      'delete': 'delete',
      'remove': 'delete',
      'validate': 'validate',
      'reject': 'reject'
    };

    for (const [key, value] of Object.entries(accionMap)) {
      if (accionLower.includes(key)) {
        return value;
      }
    }
    return 'update'; // default
  }

  onVerDetalles(row: AuditoriaItem): void {
    this.verDetalles.emit(row);
  }
}
