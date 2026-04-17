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
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import {
  emisionDiaPermitidoEnCalendario,
  emisionNoFuturaValidator,
} from './utils/poliza-emision-validators';
import { sincronizarFechaExpiracionPoliza } from './utils/poliza-fecha-expiracion.util';
import { calcularEstadoDesdeFechaExpiracion } from './utils/poliza-estado-derivado.util';
import { EmpresaService } from '../../services/empresa.service';
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-polizas-edit-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MainLayout,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    PolizaStatusBadge,
  ],
  templateUrl: './polizas-edit.page.html',
  styleUrl: './polizas-edit.page.scss',
  providers: [
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CO' },
  ],
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
      map((p) => p.get('id') ?? ''),
      switchMap((id) =>
        id
          ? this.polizaService.getById(id).pipe(
              catchError((err) => {
                this.notify.fromHttpError(err);
                return of(null);
              }),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  readonly form = this.fb.group({
    numero: [{ value: '', disabled: true }, Validators.required],
    contratista: ['', Validators.required],
    ramo: ['', Validators.required],
    obra: ['', Validators.required],
    aseguradora: ['', Validators.required],
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null],
    valorOriginal: [0, Validators.required],
    valorActual: [0, Validators.required],
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

    effect(() => {
      const p = this.poliza();
      if (!p) {
        return;
      }
      untracked(() => {
        this.form.patchValue(
          {
            numero: p.numero,
            contratista: p.contratistaId,
            ramo: p.ramoId,
            obra: p.obra,
            aseguradora: p.aseguradora,
            fechaEmision: this.toDate(p.fechaEmision),
            fechaExpiracion: this.toDate(p.fechaExpiracion),
            valorOriginal: p.valorOriginal,
            valorActual: p.valorActual,
            observaciones: p.observaciones,
          },
          { emitEvent: false },
        );
        syncPreview();
      });
    });
  }

  onCancelar(): void {
    const p = this.poliza();
    if (!p) {
      void this.router.navigate(['/polizas']);
      return;
    }
    void this.router.navigate(['/polizas', p.id]);
  }

  onGuardar(): void {
    this.actualizarFechaExpiracionDesdeFormulario();
    if (this.form.controls.fechaEmision.hasError('emisionFutura')) {
      this.form.markAllAsTouched();
      this.notify.warn('La fecha de emisión no puede ser posterior a la fecha actual.');
      return;
    }
    if (this.form.invalid || !this.poliza()) {
      this.form.markAllAsTouched();
      this.notify.warn('Revisa los campos obligatorios antes de guardar.');
      return;
    }
    const raw = this.form.getRawValue();
    if (!raw.fechaExpiracion) {
      this.notify.warn(
        'No se pudo calcular la fecha de expiración. Usa un ramo con vigencia definida (Buen Uso de Anticipo, Fiel Cumplimiento o Cumplimiento al Manejo Ambiental) y una fecha de emisión válida.',
      );
      return;
    }
    const id = this.poliza()!.id;
    this.polizaService
      .actualizar(id, {
        contratista: raw.contratista!,
        obra: raw.obra!,
        ramo: raw.ramo!,
        aseguradora: raw.aseguradora!,
        fechaEmision: raw.fechaEmision,
        fechaExpiracion: raw.fechaExpiracion,
        valorOriginal: Number(raw.valorOriginal),
        valorActual: Number(raw.valorActual),
        observaciones: raw.observaciones ?? '',
      })
      .subscribe({
        next: () => {
          void this.router.navigate(['/polizas', id]).then((ok) => {
            if (ok) {
              queueMicrotask(() => this.notify.success('Póliza actualizada correctamente.'));
            }
          });
        },
        error: (err: unknown) => this.notify.fromHttpError(err),
      });
  }

  onVolver(): void {
    this.onCancelar();
  }

  private actualizarFechaExpiracionDesdeFormulario(): void {
    sincronizarFechaExpiracionPoliza(
      this.form.controls.fechaEmision.value,
      this.form.controls.ramo.value,
      this.ramos(),
      this.form.controls.fechaExpiracion,
    );
  }

  private toDate(value: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
}
