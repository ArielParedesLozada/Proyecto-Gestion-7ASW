import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { finalize, merge } from 'rxjs';
import { emisionDiaPermitidoEnCalendario, emisionNoFuturaValidator } from './utils/poliza-emision-validators';
import { calcularEstadoDesdeFechaExpiracion } from './utils/poliza-estado-derivado.util';
import { HeaderUserMenuComponent } from '../../components/header-user-menu/header-user-menu.component';
import { PolizaContratistaSelectComponent } from './poliza-contratista-select/poliza-contratista-select.component';
import { PolizaStatusBadge } from './poliza-status-badge/poliza-status-badge';
import { EmpresaService } from '../../services/empresa.service';
import { AseguradoraService } from '../../services/aseguradora.service'; // NUEVO servicio
import { PolizaService } from '../../services/poliza.service';
import { RamoService } from '../../services/ramo.service';
import { NotificationService } from '../../shared/services/notification.service';
import { POLIZA_MAX, polizaMensajeMaxLength } from './utils/poliza-form-limits';
import { PolizaAseguradoraSelect } from './poliza-aseguradora-select/poliza-aseguradora-select';
import { EmpresaListRow } from '../empresas/models/empresa-list.model';
import { AseguradoraListRow } from '../aseguradoras/models/aseguradora-list-row';
import { MatDialog } from '@angular/material/dialog';
import { CrearEntidadDialog } from '../../shared/components/crear-entidad-dialog/crear-entidad-dialog';

// NUEVO: Validador personalizado para fechas
function expiracionPosteriorEmisionValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: boolean } | null => {
    const formGroup = control as any;
    const emision = formGroup.get('fechaEmision')?.value;
    const expiracion = formGroup.get('fechaExpiracion')?.value;

    if (emision && expiracion && expiracion <= emision) {
      return { expiracionAnteriorEmision: true };
    }
    return null;
  };
}

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
    PolizaAseguradoraSelect, // NUEVO
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
  private readonly aseguradoraService = inject(AseguradoraService); // NUEVO
  private readonly notify = inject(NotificationService);

  readonly empresas = signal<EmpresaListRow[]>([]);
  readonly aseguradoras = signal<AseguradoraListRow[]>([]);
  readonly ramos = toSignal(this.ramoService.getList(), { initialValue: [] });

  readonly saving = signal(false);

  private readonly dialog = inject(MatDialog);
  private readonly fechaExpPreview = signal<Date | null>(null);

  readonly estadoVistaPrevia = computed(() => calcularEstadoDesdeFechaExpiracion(this.fechaExpPreview()));

  readonly form = this.fb.group({
    numero: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.numero)]],
    contratista: ['', Validators.required],
    obra: ['', [Validators.required, Validators.maxLength(POLIZA_MAX.obra)]],
    ramo: ['', Validators.required],
    aseguradoraId: ['', Validators.required], // CORREGIDO: ahora es Guid
    fechaEmision: [null as Date | null, [Validators.required, emisionNoFuturaValidator()]],
    fechaExpiracion: [null as Date | null, Validators.required],
    valorOriginal: ['', Validators.required],
    valorActual: ['', Validators.required],
    observaciones: ['', Validators.maxLength(POLIZA_MAX.observaciones)],
  }, { validators: expiracionPosteriorEmisionValidator() }); // NUEVO: validación grupal

  readonly polizaMax = POLIZA_MAX;

  get maxFechaEmision(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  readonly emisionDateFilter = emisionDiaPermitidoEnCalendario;

  constructor() {
    // Ya NO calculamos fecha de expiración automáticamente
    // El usuario debe ingresar ambas fechas manualmente

    // Sincronizar valor original con valor actual
    this.form.controls.valorOriginal.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.sincronizarValorActual());

    // Actualizar preview del estado cuando cambie la fecha de expiración
    this.form.controls.fechaExpiracion.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((fecha) => this.fechaExpPreview.set(fecha));

    this.sincronizarValorActual();
    this.cargarAseguradoras()
    this.cargarEmpresas()

  }

  onCancel(): void {
    void this.router.navigate(['/polizas']);
  }

  onSubmit(): void {
    if (this.saving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();

      if (this.form.hasError('expiracionAnteriorEmision')) {
        this.notify.warn('La fecha de expiración debe ser posterior a la fecha de emisión.');
        return;
      }

      this.notify.warn('Completa los campos obligatorios antes de registrar.');
      return;
    }

    const raw = this.form.getRawValue();
    if (!raw.fechaEmision || !raw.fechaExpiracion) {
      this.notify.warn('Las fechas de emisión y expiración son obligatorias.');
      return;
    }

    this.saving.set(true);
    this.polizaService
      .registrar({
        numero: raw.numero!,
        contratista: raw.contratista!,        // GUID como string
        obra: raw.obra!,
        ramo: raw.ramo!,                      // GUID como string
        aseguradoraId: raw.aseguradoraId!,    // CORREGIDO: enviar GUID
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

  private sincronizarValorActual(): void {
    const original = this.form.controls.valorOriginal.value;
    if (original !== null && original !== undefined && original !== '') {
      this.form.controls.valorActual.setValue(original);
    }
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