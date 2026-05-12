import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-nuevo-valor-renovacion-dialog-component',
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule
  ],
  standalone: true,
  templateUrl: './nuevo-valor-renovacion-dialog-component.html',
  styleUrl: './nuevo-valor-renovacion-dialog-component.scss',
})
export class NuevoValorRenovacionDialogComponent {
  valor: number;

  constructor(
    private ref: MatDialogRef<NuevoValorRenovacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { valorActual: number }
  ) {
    this.valor = data.valorActual;
  }

  cerrar(): void {
    this.ref.close();
  }

  guardar(): void {
    this.ref.close(this.valor);
  }
}
