import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';

/** Campos «Vence desde» / «Vence hasta» reutilizables (Pólizas, Reportes). */
@Component({
  selector: 'app-vencimiento-date-range-fields',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  templateUrl: './vencimiento-date-range-fields.html',
  styleUrl: './vencimiento-date-range-fields.scss',
})
export class VencimientoDateRangeFields {
  readonly fechaDesde = input<Date | null>(null);
  readonly fechaHasta = input<Date | null>(null);
  readonly fieldClass = input('toolbar__search');

  readonly fechaDesdeChange = output<Date | null>();
  readonly fechaHastaChange = output<Date | null>();
}
