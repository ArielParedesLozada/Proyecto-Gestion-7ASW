import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PolizaImportPreview, PolizaImportPreviewRow } from '../models/poliza-import.model';
import { PolizaService } from '../../../services/poliza.service';
import { NotificationService } from '../../../shared/services/notification.service';

export type FiltroCategoriaImport = 'todas' | 'validas' | 'error' | 'incompletas' | 'ignoradas';

export interface PolizasExcelImportDialogData {
  preview: PolizaImportPreview;
}

/** Clasificación backend: cada fila tiene exactamente un <code>estadoAnalisis</code>. */
function esFilaValida(row: PolizaImportPreviewRow): boolean {
  return row.estadoAnalisis === 'paraInsertar' || row.estadoAnalisis === 'paraActualizar';
}

function coincideFiltro(row: PolizaImportPreviewRow, filtro: FiltroCategoriaImport): boolean {
  switch (filtro) {
    case 'todas':
      return true;
    case 'validas':
      return esFilaValida(row);
    case 'error':
      return row.estadoAnalisis === 'error';
    case 'incompletas':
      return row.estadoAnalisis === 'incompleta';
    case 'ignoradas':
      return row.estadoAnalisis === 'ignorada';
    default:
      return true;
  }
}

@Component({
  selector: 'app-polizas-excel-import-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
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
  readonly filtro = signal<FiltroCategoriaImport>('todas');

  readonly opcionesFiltro: { value: FiltroCategoriaImport; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'validas', label: 'Válidas (importar)' },
    { value: 'error', label: 'Con error' },
    { value: 'incompletas', label: 'Incompletas' },
    { value: 'ignoradas', label: 'Ignoradas' },
  ];

  readonly filasFiltradas = computed(() => {
    const items = this.data.preview.items;
    const f = this.filtro();
    return items.filter((row) => coincideFiltro(row, f));
  });

  /** Coincide conteos de API con recomputo desde <code>items</code> (auditoría de clasificación). */
  readonly auditoria = computed(() => {
    const p = this.data.preview;
    const items = p.items;
    const cValid = items.filter(esFilaValida).length;
    const cErr = items.filter((r) => r.estadoAnalisis === 'error').length;
    const cInc = items.filter((r) => r.estadoAnalisis === 'incompleta').length;
    const cIgn = items.filter((r) => r.estadoAnalisis === 'ignorada').length;
    const sumaCategorias = cValid + cErr + cInc + cIgn;
    return {
      cValid,
      cErr,
      cInc,
      cIgn,
      sumaCategorias,
      matchTotalRows: sumaCategorias === p.totalRows,
      matchValid: cValid === p.validRows,
      matchError: cErr === p.errorRows,
      matchIncomplete: cInc === p.incompleteRows,
      matchIgnored: cIgn === p.ignoredRows,
      ok:
        sumaCategorias === p.totalRows &&
        cValid === p.validRows &&
        cErr === p.errorRows &&
        cInc === p.incompleteRows &&
        cIgn === p.ignoredRows,
    };
  });

  readonly displayedColumns: string[] = [
    'excelRow',
    'sheetName',
    'numeroPoliza',
    'contratista',
    'obra',
    'ramo',
    'aseguradora',
    'fechaEmision',
    'fechaExpiracion',
    'estadoAnalisis',
    'empresaResolucion',
    'mensajes',
  ];

  readonly puedeConfirmar = computed(() => this.data.preview.validRows > 0 && !this.importing());

  filaEsImportable(row: PolizaImportPreviewRow): boolean {
    return esFilaValida(row);
  }

  onFiltroChange(value: FiltroCategoriaImport): void {
    this.filtro.set(value);
  }

  estadoLabel(codigo: string): string {
    switch (codigo) {
      case 'paraInsertar':
        return 'Válida (insertar)';
      case 'paraActualizar':
        return 'Válida (actualizar)';
      case 'error':
        return 'Error';
      case 'incompleta':
        return 'Incompleta';
      case 'ignorada':
        return 'Ignorada';
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

  /** Texto único para export / búsqueda (todos los motivos concatenados). */
  mensajesDetalle(row: PolizaImportPreviewRow): string {
    if (!row.mensajes?.length) {
      return '';
    }
    return row.mensajes.join(' | ');
  }

  exportarCsvErrores(): void {
    this.exportarCsvCategoria(
      (r) => r.estadoAnalisis === 'error',
      'errores',
    );
  }

  exportarCsvIncompletas(): void {
    this.exportarCsvCategoria(
      (r) => r.estadoAnalisis === 'incompleta',
      'incompletas',
    );
  }

  exportarCsvIgnoradas(): void {
    this.exportarCsvCategoria(
      (r) => r.estadoAnalisis === 'ignorada',
      'ignoradas',
    );
  }

  private exportarCsvCategoria(
    predicate: (r: PolizaImportPreviewRow) => boolean,
    etiquetaArchivo: string,
  ): void {
    const filas = this.data.preview.items.filter(predicate);
    if (filas.length === 0) {
      this.notify.info('No hay filas en esa categoría para exportar.');
      return;
    }
    const base = this.data.preview.fileName.replace(/\.[^.]+$/, '');
    const nombre = `${base}-import-${etiquetaArchivo}-${this.fechaArchivo()}.csv`;
    this.descargarCsv(filas, nombre);
    this.notify.success(`Exportado: ${filas.length} fila(s).`);
  }

  private fechaArchivo(): string {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
  }

  private descargarCsv(filas: PolizaImportPreviewRow[], nombreArchivo: string): void {
    const sep = ';';
    const headers = [
      'Fila Excel',
      'Hoja',
      'Número póliza',
      'Obra',
      'Contratista',
      'Ramo',
      'Aseguradora',
      'Fecha emisión',
      'Vigencia hasta',
      'Estado análisis',
      'Resolución empresa',
      'Mensajes validación',
    ];
    const lines = [headers.join(sep)];
    for (const row of filas) {
      const cells = [
        String(row.excelRow),
        row.sheetName,
        row.numeroPoliza,
        row.obra ?? '',
        row.contratista,
        row.ramo,
        row.aseguradora,
        row.fechaEmision ?? '',
        row.fechaExpiracion ?? '',
        this.estadoLabel(row.estadoAnalisis),
        this.empresaLabel(row.empresaResolucion),
        this.mensajesDetalle(row),
      ].map((c) => this.escapeCsvCell(c));
      lines.push(cells.join(sep));
    }
    const bom = '\uFEFF';
    const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escapeCsvCell(value: string): string {
    const s = value ?? '';
    if (/[";\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
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
        const mensaje =
          partes.length > 0
            ? `Importación completada: ${partes.join(', ')}.`
            : 'Importación completada.';
        if (r.failed > 0) {
          this.notify.warn(`${mensaje} Revisa las filas con error para corregir y reintentar.`);
        } else {
          this.notify.success(mensaje);
        }
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        this.importing.set(false);
        this.notify.fromHttpError(err);
      },
    });
  }
}
