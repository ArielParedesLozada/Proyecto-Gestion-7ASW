import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, map, switchMap, of, finalize } from 'rxjs';
import { PolizaContratistaSelectComponent } from './poliza-contratista-select/poliza-contratista-select.component';
import { PolizaAseguradoraSelect } from './poliza-aseguradora-select/poliza-aseguradora-select';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { PageHeaderActions } from '../../components/page-header-actions/page-header-actions';
import { emisionDiaPermitidoEnCalendario, emisionNoFuturaValidator } from './utils/poliza-emision-validators';
import { calcularEstadoDesdeFechaExpiracion } from './utils/poliza-estado-derivado.util';
import { EmpresaService } from '../../services/empresa.service';
import { AseguradoraService } from '../../services/aseguradora.service';
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';
import { POLIZA_MAX, polizaMensajeMaxLength } from './utils/poliza-form-limits';
import { EmpresaListRow } from '../empresas/models/empresa-list.model';
import { AseguradoraListRow } from '../aseguradoras/models/aseguradora-list-row';
import { MatDialog } from '@angular/material/dialog';
import { CrearEntidadDialog } from '../../shared/components/crear-entidad-dialog/crear-entidad-dialog';

// Validador personalizado para fechas
function expiracionPosteriorEmisionValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const emision = control.get('fechaEmision')?.value;
    const expiracion = control.get('fechaExpiracion')?.value;

    if (emision && expiracion && expiracion <= emision) {
      return { expiracionAnteriorEmision: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-polizas-edit-page',
  imports: [
    RouterLink,
    DatePipe,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    PolizaContratistaSelectComponent,
    PolizaAseguradoraSelect,
    PolizaStatusBadge,
    PageHeaderActions,
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
  private readonly aseguradoraService = inject(AseguradoraService);
  private readonly notify = inject(NotificationService);

  readonly empresas = signal<EmpresaListRow[]>([]);
  readonly aseguradoras = signal<AseguradoraListRow[]>([]);
  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });

  readonly saving = signal(false);

  private readonly dialog = inject(MatDialog);
  private readonly fechaExpPreview = signal<Date | null>(null);
  readonly estadoVistaPrevia = computed(() => calcularEstadoDesdeFechaExpiracion(this.fechaExpPreview()));

  readonly poliza = toSignal(
    this.route.paramMap.pipe(
      map(p => p.get('id') ?? ''),
      switchMap(id => id ? this.polizaService.getById(id).pipe(
        catchError(err => {
          this.notify.fromHttpError(err);
          return of(null);
        })
      ) : of(null))
    ),
    { initialValue: null }
  );

  readonly form = this.fb.group({
    numero: [{ value: '', disabled: true }, Validators.required],
    contratista: ['', Validators.required],
    obra: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.obra)]],
    ramo: ['', Validators.required],
    aseguradoraId: ['', Validators.required], // CORREGIDO: ahora es Guid
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null, Validators.required],
    valorOriginal: [0, Validators.required],
    valorActual: [{ value: 0, disabled: false }, Validators.required],
    observaciones: ['', Validators.maxLength(POLIZA_MAX.observaciones)],
  }, { validators: expiracionPosteriorEmisionValidator() });

  readonly polizaMax = POLIZA_MAX;

  get maxFechaEmision(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  readonly emisionDateFilter = emisionDiaPermitidoEnCalendario;

  constructor() {
    // Sincronizar valor original con valor actual
    this.form.controls.valorOriginal.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.sincronizarValorActual());

    // Actualizar preview del estado cuando cambie la fecha de expiración
    this.form.controls.fechaExpiracion.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((fecha) => this.fechaExpPreview.set(fecha));

    // Cargar datos de la póliza cuando esté disponible
    effect(() => {
      const p = this.poliza();
      if (!p) return;

      untracked(() => {
        this.form.patchValue({
          numero: p.numero,
          contratista: p.contratistaId,
          obra: p.obra,
          ramo: p.ramoId,
          aseguradoraId: p.aseguradoraId, // CORREGIDO
          fechaEmision: this.toDate(p.fechaEmision),
          fechaExpiracion: this.toDate(p.fechaExpiracion),
          valorOriginal: p.valorOriginal,
          valorActual: p.valorActual,
          observaciones: p.observaciones
        }, { emitEvent: false });

        this.fechaExpPreview.set(this.toDate(p.fechaExpiracion));
        this.sincronizarValorActual();
      });
    });
    this.cargarAseguradoras()
    this.cargarEmpresas()
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
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.hasError('expiracionAnteriorEmision')) {
        this.notify.warn('La fecha de expiración debe ser posterior a la fecha de emisión.');
        return;
      }

      const ctrl = this.form.controls;
      if (ctrl.obra.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('obra'));
        return;
      }
      if (ctrl.observaciones.hasError('maxlength')) {
        this.notify.warn(polizaMensajeMaxLength('observaciones'));
        return;
      }
      this.notify.warn('Revisa los campos obligatorios antes de guardar.');
      return;
    }

    const raw = this.form.getRawValue();
    if (!raw.fechaEmision || !raw.fechaExpiracion) {
      this.notify.warn('Las fechas de emisión y expiración son obligatorias.');
      return;
    }

    const id = this.poliza()!.id;
    this.saving.set(true);

    this.polizaService.actualizar(id, {
      contratista: raw.contratista!,
      obra: raw.obra!,
      ramo: raw.ramo!,
      aseguradoraId: raw.aseguradoraId!, // CORREGIDO
      fechaEmision: raw.fechaEmision,
      fechaExpiracion: raw.fechaExpiracion,
      valorOriginal: Number(raw.valorOriginal),
      valorActual: Number(raw.valorActual),
      observaciones: raw.observaciones ?? ''
    }).pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/polizas', id]).then(ok => {
            if (ok) {
              queueMicrotask(() => this.notify.success('Póliza actualizada correctamente.'));
            }
          });
        },
        error: (err: unknown) => this.notify.fromHttpError(err)
      });
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

  private cargarEmpresas(): void {
    this.empresaService.getListSimple()
      .subscribe({
        next: (rows) => this.empresas.set(rows),
      });
  }

  private cargarAseguradoras(): void {
    this.aseguradoraService.getListSimple()
      .subscribe({
        next: (rows) => this.aseguradoras.set(rows),
      });
  }

  abrirModalContratista(): void {
    const ref = this.dialog.open(CrearEntidadDialog, {
      width: '500px',
      data: {
        tipo: 'contratista',
        titulo: 'Nuevo contratista',
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) return;

      this.cargarEmpresas();

      this.form.controls.contratista.setValue(created.id);

      this.notify.success('Contratista creado correctamente.');
    });
  }

  abrirModalAseguradora(): void {
    const ref = this.dialog.open(CrearEntidadDialog, {
      width: '500px',
      data: {
        tipo: 'aseguradora',
        titulo: 'Nueva aseguradora',
      },
    });

    ref.afterClosed().subscribe((created) => {
      if (!created) return;

      this.cargarAseguradoras();

      this.form.controls.aseguradoraId.setValue(created.id);

      this.notify.success('Aseguradora creada correctamente.');
    });
  }
}