import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RenovacionCreatePayload, RenovacionHistorialRow, RenovacionPolizaOption } from '../../interfaces/renovacion.interface';
import { NotificationService } from '../../shared/services/notification.service';
import { RENOVACIONES_HISTORIAL_MOCK, RENOVACIONES_POLIZAS_MOCK } from './data/renovaciones-mock.data';
import { RenovacionesTable } from './renovaciones-table/renovaciones-table';
import { toIsoDateOnlyLocal } from './utils/renovacion-date.util';

@Component({
  selector: 'app-renovaciones-page',
  imports: [
    RenovacionesTable,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './renovaciones.page.html',
  styleUrl: './renovaciones.page.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
})
export class RenovacionesPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  /** Oculto | crear: mismo patrón que Empresas/Ramos (toolbar solo en listado). */
  readonly formularioModo = signal<'oculto' | 'crear'>('oculto');

  readonly polizasDisponibles = signal<RenovacionPolizaOption[]>([...RENOVACIONES_POLIZAS_MOCK]);
  readonly historial = signal<RenovacionHistorialRow[]>([...RENOVACIONES_HISTORIAL_MOCK]);

  readonly renovacionForm = this.fb.group({
    polizaId: ['', [Validators.required]],
    nuevaFechaExpiracion: [null as Date | null, [Validators.required]],
    nuevoValorUsd: [null as number | null, [Validators.required, Validators.min(0.01)]],
    observaciones: [''],
  });

  readonly searchQuery = signal('');
  readonly pageSize = 10;
  readonly pageIndex = signal(0);

  readonly filteredHistorial = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const all = this.historial();
    if (!q) {
      return all;
    }
    return all.filter(
      (row) =>
        row.polizaNumero.toLowerCase().includes(q) ||
        row.contratista.toLowerCase().includes(q) ||
        row.obra.toLowerCase().includes(q),
    );
  });

  readonly totalFiltrado = computed(() => this.filteredHistorial().length);

  readonly pagedHistorial = computed(() => {
    const all = this.filteredHistorial();
    const start = this.pageIndex() * this.pageSize;
    return all.slice(start, start + this.pageSize);
  });

  constructor() {
    effect(() => {
      this.searchQuery();
      untracked(() => this.pageIndex.set(0));
    });

    effect(() => {
      const total = this.filteredHistorial().length;
      const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
      if (this.pageIndex() > maxPage) {
        untracked(() => this.pageIndex.set(maxPage));
      }
    });
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  limpiarFiltros(): void {
    this.searchQuery.set('');
    this.pageIndex.set(0);
  }

  abrirFormularioCrear(): void {
    this.formularioModo.set('crear');
    this.renovacionForm.reset({
      polizaId: '',
      nuevaFechaExpiracion: null,
      nuevoValorUsd: null,
      observaciones: '',
    });
  }

  onCancelarFormulario(): void {
    this.formularioModo.set('oculto');
    this.renovacionForm.reset({
      polizaId: '',
      nuevaFechaExpiracion: null,
      nuevoValorUsd: null,
      observaciones: '',
    });
  }

  onSubmitRenovacion(): void {
    if (this.renovacionForm.invalid) {
      this.renovacionForm.markAllAsTouched();
      this.notify.warn('Completa póliza, nueva fecha de expiración y valor antes de registrar.');
      return;
    }
    const { polizaId, nuevaFechaExpiracion, nuevoValorUsd, observaciones } = this.renovacionForm.getRawValue();
    const valorNumerico = Number(nuevoValorUsd);
    if (!polizaId || !nuevaFechaExpiracion || nuevoValorUsd == null || Number.isNaN(valorNumerico)) {
      return;
    }
    if (valorNumerico < 0.01) {
      this.renovacionForm.controls.nuevoValorUsd.markAsTouched();
      this.notify.warn('Ingrese un valor mayor a 0.');
      return;
    }

    const poliza = this.polizasDisponibles().find((p) => p.id === polizaId);
    if (!poliza) {
      this.notify.error('La póliza seleccionada ya no está disponible.');
      return;
    }

    const nuevoVencimientoIso = toIsoDateOnlyLocal(nuevaFechaExpiracion);
    const vencimientoAnterior = poliza.fechaExpiracionActual;
    const fechaRenovacionIso = toIsoDateOnlyLocal(new Date());

    const payload: RenovacionCreatePayload = {
      poliza_id: polizaId,
      fecha_expiracion: nuevoVencimientoIso,
      valor: valorNumerico,
      observaciones: observaciones?.trim() ? observaciones.trim() : null,
    };

    const nuevaFila: RenovacionHistorialRow = {
      id: `ren-${Date.now()}`,
      polizaId: poliza.id,
      polizaNumero: poliza.numero,
      contratista: poliza.contratista,
      obra: poliza.obra,
      fechaRenovacion: fechaRenovacionIso,
      vencimientoAnterior,
      nuevoVencimiento: nuevoVencimientoIso,
      valorNuevoUsd: payload.valor,
      observaciones: payload.observaciones ?? null,
    };

    this.historial.update((rows) => [nuevaFila, ...rows]);
    this.polizasDisponibles.update((list) =>
      list.map((p) =>
        p.id === polizaId
          ? { ...p, fechaExpiracionActual: nuevoVencimientoIso, valorActualUsd: valorNumerico }
          : p,
      ),
    );

    this.notify.success('Renovación registrada (vista previa local).');
    this.onCancelarFormulario();
  }

  /** Misma navegación que el listado de pólizas (`polizas.page.ts` → `/polizas/:id`). */
  onVer(row: RenovacionHistorialRow): void {
    void this.router.navigate(['/polizas', row.polizaId]);
  }

  textoOpcionPoliza(p: RenovacionPolizaOption): string {
    return `${p.numero} — ${p.contratista}`;
  }
}
