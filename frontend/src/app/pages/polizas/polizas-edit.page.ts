import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { merge, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { PolizaContratistaSelectComponent } from './poliza-contratista-select/poliza-contratista-select.component';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { emisionDiaPermitidoEnCalendario, emisionNoFuturaValidator } from './utils/poliza-emision-validators';
import { calcularEstadoDesdeFechaExpiracion } from './utils/poliza-estado-derivado.util';
import { EmpresaService } from '../../services/empresa.service';
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';
import { POLIZA_MAX, polizaMensajeMaxLength } from './utils/poliza-form-limits';

@Component({
  selector: 'app-polizas-edit-page',
  imports: [
    DatePipe, ReactiveFormsModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, PolizaContratistaSelectComponent, PolizaStatusBadge
  ],
  templateUrl: './polizas-edit.page.html',
  styleUrl: './polizas-edit.page.scss',
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-CO' }]
})
export class PolizasEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly polizaService = inject(PolizaService);
  private readonly ramoService = inject(RamoService);
  private readonly empresaService = inject(EmpresaService);
  private readonly notify = inject(NotificationService);

  readonly empresas = toSignal(this.empresaService.getList(), { initialValue: [] });
  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });
  private readonly fechaExpPreview = signal<Date | null>(null);
  readonly estadoVistaPrevia = computed(() => calcularEstadoDesdeFechaExpiracion(this.fechaExpPreview()));

  readonly poliza = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('id') ?? ''),
      switchMap(id => id ? this.polizaService.getById(id).pipe(catchError(err => { this.notify.fromHttpError(err); return of(null); })) : of(null))
    ),
    { initialValue: null }
  );

  readonly form = this.fb.group({
    numero: [{ value: '', disabled: true }, Validators.required],
    contratista: ['', Validators.required],
    ramo: ['', Validators.required],
    obra: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.obra)]],
    aseguradora: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.aseguradora)]],
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null],
    valorOriginal: [0, Validators.required],
    valorActual: [{ value: 0, disabled: false }, Validators.required],
    observaciones: ['', Validators.maxLength(POLIZA_MAX.observaciones)]
  });

  readonly polizaMax = POLIZA_MAX;
  get maxFechaEmision(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  readonly emisionDateFilter = emisionDiaPermitidoEnCalendario;

  constructor() {
    const syncPreview = (): void => { this.fechaExpPreview.set(this.form.controls.fechaExpiracion.value); };
    merge(this.form.controls.fechaEmision.valueChanges, this.form.controls.ramo.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => { this.recalcularFechaExpiracion(); syncPreview(); });
    this.form.controls.valorOriginal.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => { this.sincronizarValorActual(); });
    effect(() => {
      const p = this.poliza();
      if (!p) return;
      untracked(() => {
        this.form.patchValue({
          numero: p.numero, contratista: p.contratistaId, ramo: p.ramoId, obra: p.obra,
          aseguradora: p.aseguradora, fechaEmision: this.toDate(p.fechaEmision),
          fechaExpiracion: this.toDate(p.fechaExpiracion), valorOriginal: p.valorOriginal,
          valorActual: p.valorActual, observaciones: p.observaciones
        }, { emitEvent: false });
        syncPreview();
        this.sincronizarValorActual();
      });
    });
  }

  onCancelar(): void {
    const p = this.poliza();
    if (!p) { void this.router.navigate(['/polizas']); return; }
    void this.router.navigate(['/polizas', p.id]);
  }
  onVolver(): void { this.onCancelar(); }

  onGuardar(): void {
    this.recalcularFechaExpiracion();
    if (this.form.controls.fechaEmision.hasError('emisionFutura')) {
      this.form.markAllAsTouched();
      this.notify.warn('La fecha de emisión no puede ser posterior a la fecha actual.');
      return;
    }
    if (this.form.invalid || !this.poliza()) {
      this.form.markAllAsTouched();
      const ctrl = this.form.controls;
      if (ctrl.obra.hasError('maxlength')) { this.notify.warn(polizaMensajeMaxLength('obra')); return; }
      if (ctrl.aseguradora.hasError('maxlength')) { this.notify.warn(polizaMensajeMaxLength('aseguradora')); return; }
      if (ctrl.observaciones.hasError('maxlength')) { this.notify.warn(polizaMensajeMaxLength('observaciones')); return; }
      this.notify.warn('Revisa los campos obligatorios antes de guardar.');
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.fechaExpiracion) {
      this.notify.warn(`No se pudo calcular la fecha de expiración. Usa un ramo con vigencia definida y una fecha válida.`);
      return;
    }
    const id = this.poliza()!.id;
    this.polizaService.actualizar(id, {
      contratista: raw.contratista!, obra: raw.obra!, ramo: raw.ramo!, aseguradora: raw.aseguradora!,
      fechaEmision: raw.fechaEmision, fechaExpiracion: raw.fechaExpiracion,
      valorOriginal: Number(raw.valorOriginal), valorActual: Number(raw.valorActual), observaciones: raw.observaciones ?? ''
    }).subscribe({
      next: () => { void this.router.navigate(['/polizas', id]).then(ok => { if (ok) queueMicrotask(() => this.notify.success('Póliza actualizada correctamente.')); }); },
      error: (err: unknown) => this.notify.fromHttpError(err)
    });
  }

  private extraerDiasDesdePeriodicidad(periodicity: string | undefined): number {
    if (!periodicity) return 0;
    const parts = periodicity.split('.');
    if (parts.length >= 1) { const days = parseInt(parts[0], 10); return isNaN(days) ? 0 : days; }
    return 0;
  }

  private recalcularFechaExpiracion(): void {
    const fechaEmision = this.form.controls.fechaEmision.value;
    const ramoId = this.form.controls.ramo.value;
    if (!fechaEmision || !ramoId) { this.form.controls.fechaExpiracion.setValue(null); return; }
    const ramo = this.ramos().find(r => r.id === ramoId);
    if (!ramo) { this.form.controls.fechaExpiracion.setValue(null); return; }
    const days = this.extraerDiasDesdePeriodicidad(ramo.periodicity);
    if (days === 0) { this.form.controls.fechaExpiracion.setValue(null); return; }
    const nuevaFecha = new Date(fechaEmision);
    nuevaFecha.setDate(nuevaFecha.getDate() + days);
    this.form.controls.fechaExpiracion.setValue(nuevaFecha, { emitEvent: false });
  }

  private sincronizarValorActual(): void {
    const original = this.form.controls.valorOriginal.value;
    if (original !== null && original !== undefined) {
      this.form.controls.valorActual.setValue(original, { emitEvent: false });
    }
  }

  private toDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}