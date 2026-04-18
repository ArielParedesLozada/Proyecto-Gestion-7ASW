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
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { EmpresaService } from '../../services/empresa.service';
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';

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
    PolizaStatusBadge,
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
    numero: ['', Validators.required],
    contratista: ['', Validators.required],
    obra: ['', Validators.required],
    ramo: ['', Validators.required],
    aseguradora: ['', Validators.required],
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null],
    valorOriginal: ['', Validators.required],
    valorActual: ['', Validators.required],
    observaciones: [''],
  });

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
      this.form.controls.fechaExpiracion.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.actualizarFechaExpiracionDesdeFormulario();
        syncPreview();
      });
    this.actualizarFechaExpiracionDesdeFormulario();
    syncPreview();
  }

  onCancel(): void {
    void this.router.navigate(['/polizas']);
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }
    this.actualizarFechaExpiracionDesdeFormulario();
    if (this.form.controls.fechaEmision.hasError('emisionFutura')) {
      this.form.markAllAsTouched();
      this.notify.warn('La fecha de emisión no puede ser posterior a la fecha actual.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

  private actualizarFechaExpiracionDesdeFormulario(): void {
    sincronizarFechaExpiracionPoliza(
      this.form.controls.fechaEmision.value,
      this.form.controls.ramo.value,
      this.ramos(),
      this.form.controls.fechaExpiracion,
    );
  }
}
