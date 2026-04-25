import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, merge } from 'rxjs';
import {
  emisionDiaPermitidoEnCalendario,
  emisionNoFuturaValidator,
} from './utils/poliza-emision-validators';
import { sincronizarFechaExpiracionPoliza } from './utils/poliza-fecha-expiracion.util';
import { calcularEstadoDesdeFechaExpiracion } from './utils/poliza-estado-derivado.util';
import { HeaderUserMenuComponent } from '../../components/header-user-menu/header-user-menu.component';
import { PolizaContratistaSelectComponent } from './poliza-contratista-select/poliza-contratista-select.component';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { EmpresaService } from '../../services/empresa.service';
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';
import { POLIZA_MAX, polizaMensajeMaxLength } from './utils/poliza-form-limits';

@Component({
  selector: 'app-polizas-nueva-page',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    PolizaContratistaSelectComponent,
    PolizaStatusBadge,
    HeaderUserMenuComponent,
  ],
  templateUrl: './polizas-nueva.page.html',
  styleUrl: './polizas-nueva.page.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
})
export class PolizasNuevaPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly polizaService = inject(PolizaService);
  private readonly ramoService = inject(RamoService);
  private readonly empresaService = inject(EmpresaService);
  private readonly notify = inject(NotificationService);

  readonly empresas = toSignal(this.empresaService.getList(), { initialValue: [] });

  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });

  readonly saving = signal(false);

  private readonly fechaExpPreview = signal<Date | null>(null);

  /** Vista previa según fechas del formulario (coincide con la regla del servidor). */
  readonly estadoVistaPrevia = computed(() => calcularEstadoDesdeFechaExpiracion(this.fechaExpPreview()));

  readonly form = this.fb.group({
    numero: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.numero)]],
    contratista: ['', Validators.required],
    obra: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.obra)]],
    ramo: ['', Validators.required],
    aseguradora: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.aseguradora)]],
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null],
    valorOriginal: ['', Validators.required],
    valorActual: ['', Validators.required],
    observaciones: ['', Validators.maxLength(POLIZA_MAX.observaciones)],
  });

  readonly polizaMax = POLIZA_MAX;

  get maxFechaEmision(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  readonly emisionDateFilter = emisionDiaPermitidoEnCalendario;

  constructor() {
    const syncPreview = (): void => {
      this.fechaExpPreview.set(this.form.controls.fechaExpiracion.value);
    };
    merge(
      this.form.controls.fechaEmision.valueChanges,
      this.form.controls.ramo.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.recalcularFechaExpiracion());
    this.form.controls.valorOriginal.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.sincronizarValorActual());

    // Ejecutar una vez al inicio por si ya hay valores precargados
    this.recalcularFechaExpiracion();
    this.sincronizarValorActual();
  }

  onCancel(): void {
    void this.router.navigate(['/polizas']);
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }
    if (this.form.controls.fechaEmision.hasError('emisionFutura')) {
      this.form.markAllAsTouched();
      this.notify.warn('La fecha de emisión no puede ser posterior a la fecha actual.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const ctrl = this.form.controls;
      if (ctrl.numero.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('numero'));
        return;
      }
      if (ctrl.obra.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('obra'));
        return;
      }
      if (ctrl.aseguradora.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('aseguradora'));
        return;
      }
      if (ctrl.observaciones.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('observaciones'));
        return;
      }
      this.notify.warn('Completa los campos obligatorios antes de registrar.');
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.fechaExpiracion) {
      this.notify.warn(
        'No se pudo calcular la fecha de expiración. Usa un ramo con vigencia definida (Buen Uso de Anticipo, Fiel Cumplimiento o Cumplimiento al Manejo Ambiental) y una fecha de emisión válida.',
      );
      return;
    }
    this.saving.set(true);
    this.polizaService
      .registrar({
        numero: raw.numero!,
        contratista: raw.contratista!,
        obra: raw.obra!,
        ramo: raw.ramo!,
        aseguradora: raw.aseguradora!,
        fechaEmision: raw.fechaEmision,
        fechaExpiracion: raw.fechaExpiracion,
        valorOriginal: raw.valorOriginal!,
        valorActual: raw.valorActual!,
        observaciones: raw.observaciones ?? '',
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/polizas']).then((ok) => {
            if (ok) {
              queueMicrotask(() => this.notify.success('Póliza registrada correctamente.'));
            }
          });
        },
        error: (err: unknown) => this.notify.fromHttpError(err),
      });
  }
  private extraerDiasDesdePeriodicidad(periodicity: string | undefined): number {
    if (!periodicity) return 0;
    const parts = periodicity.split('.');
    if (parts.length >= 1) {
      const days = parseInt(parts[0], 10);
      return isNaN(days) ? 0 : days;
    }
    return 0;
  }

  private recalcularFechaExpiracion(): void {
    const fechaEmision = this.form.controls.fechaEmision.value;
    const ramoId = this.form.controls.ramo.value;
    if (!fechaEmision || !ramoId) {
      this.form.controls.fechaExpiracion.setValue(null);
      return;
    }
    const ramo = this.ramos().find(r => r.id === ramoId);
    if (!ramo) {
      this.form.controls.fechaExpiracion.setValue(null);
      return;
    }
    const days = this.extraerDiasDesdePeriodicidad(ramo.periodicity);
    if (days === 0) {
      this.form.controls.fechaExpiracion.setValue(null);
      return;
    }
    const nuevaFecha = new Date(fechaEmision);
    nuevaFecha.setDate(nuevaFecha.getDate() + days);
    this.form.controls.fechaExpiracion.setValue(nuevaFecha);
  }
  private sincronizarValorActual(): void {
    const original = this.form.controls.valorOriginal.value;
    if (original !== null && original !== undefined && original !== '') {
      this.form.controls.valorActual.setValue(original);
    }
  }
}
