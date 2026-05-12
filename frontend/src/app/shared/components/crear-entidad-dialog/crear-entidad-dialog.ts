import { CommonModule } from '@angular/common';
import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EmpresaService } from '../../../services/empresa.service';
import { AseguradoraService } from '../../../services/aseguradora.service';
import { Observable } from 'rxjs';

export interface CrearEntidadDialogData {
  tipo: 'contratista' | 'aseguradora';
  titulo: string;
}

interface EntidadCreada {
  id: string;
}

@Component({
  selector: 'app-crear-entidad-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './crear-entidad-dialog.html',
  styleUrl: './crear-entidad-dialog.scss',
})
export class CrearEntidadDialog {
  private readonly fb = inject(FormBuilder);

  private readonly empresaService = inject(EmpresaService);

  private readonly aseguradoraService = inject(AseguradoraService);

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    correo: ['', [Validators.required, Validators.email]],
  });

  loading = false;

  constructor(
    private readonly dialogRef: MatDialogRef<CrearEntidadDialog>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: CrearEntidadDialogData,
  ) { }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.loading = true;

    const request : Observable<EntidadCreada> =
      this.data.tipo === 'contratista'
        ? this.empresaService.create({
          nombre: raw.nombre!,
          correo: raw.correo!,
        })
        : this.aseguradoraService.create({
          nombre: raw.nombre!,
          email: raw.correo!,
        });

    request.subscribe({ /**This expression is not callable.
  Each member of the union type '{ (observerOrNext?: Partial<Observer<AseguradoraListRow>> | ((value: AseguradoraListRow) => void) | undefined): Subscription; (next?: ((value: AseguradoraListRow) => void) | ... 1 more ... | undefined, error?: ((error: any) => void) | ... 1 more ... | undefined, complete?: (() => void) | ... 1 more ... | undefined):...' has signatures, but none of those signatures are compatible with each other. */
      next: (created) => { /**Parameter 'created' implicitly has an 'any' type. */
        this.dialogRef.close(created);
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
