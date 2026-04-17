import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { PolizaImportPreview } from '../models/poliza-import.model';
import { PolizaService } from '../../../services/poliza.service';
import { NotificationService } from '../../../shared/services/notification.service';

export interface PolizasExcelImportDialogData {
  preview: PolizaImportPreview;
}

@Component({
  selector: 'app-polizas-excel-import-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './polizas-excel-import-dialog.html',
  styleUrl: './polizas-excel-import-dialog.scss',
})
export class PolizasExcelImportDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PolizasExcelImportDialogComponent, boolean>);
  private readonly polizaService = inject(PolizaService);
  private readonly notify = inject(NotificationService);

  readonly data = inject<PolizasExcelImportDialogData>(MAT_DIALOG_DATA);

  readonly importing = signal(false);

  readonly previewRows = computed(() => this.data.preview.items.slice(0, 50));

  readonly displayedColumns: string[] = [
    'excelRow',
    'sheetName',
    'numeroPoliza',
    'contratista',
    'ramo',
    'aseguradora',
    'fechaEmision',
    'fechaExpiracion',
    'estadoAnalisis',
    'empresaResolucion',
    'mensajes',
  ];

  readonly puedeConfirmar = computed(() => this.data.preview.validRows > 0 && !this.importing());

  estadoLabel(codigo: string): string {
    switch (codigo) {
      case 'paraInsertar':
        return 'Insertar';
      case 'paraActualizar':
        return 'Actualizar';
      case 'error':
        return 'Error';
      case 'incompleta':
        return 'Incompleta';
      default:
        return codigo;
    }
  }

  empresaLabel(codigo: string): string {
    switch (codigo) {
      case 'existente':
        return 'Empresa existente';
      case 'seCreara':
        return 'Se creará empresa';
      case 'ambiguo':
        return 'Empresa ambigua';
      case 'sinNombre':
        return 'Sin nombre';
      default:
        return codigo;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  confirmar(): void {
    if (!this.puedeConfirmar()) {
      return;
    }
    this.importing.set(true);
    this.polizaService.confirmImport(this.data.preview.token).subscribe({
      next: (r) => {
        this.importing.set(false);
        const partes: string[] = [];
        if (r.inserted > 0) partes.push(`${r.inserted} nueva(s)`);
        if (r.updated > 0) partes.push(`${r.updated} actualizada(s)`);
        if (r.failed > 0) partes.push(`${r.failed} con error`);
        this.notify.success(
          partes.length > 0
            ? `Importación completada: ${partes.join(', ')}.`
            : 'Importación completada.',
        );
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.importing.set(false);
        this.notify.fromHttpError(err);
      },
    });
  }
}
