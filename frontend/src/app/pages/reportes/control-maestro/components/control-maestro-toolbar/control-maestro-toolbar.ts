import { Component, input, output } from '@angular/core';
import { MatFormFieldModule, MatLabel } from "@angular/material/form-field";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-control-maestro-toolbar',
  imports: [
    MatInputModule,        // 🔴 ESTE ES CLAVE
    FormsModule,
    MatFormFieldModule,
    MatLabel,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './control-maestro-toolbar.html',
  styleUrl: './control-maestro-toolbar.scss',
})
export class ControlMaestroToolbar {
  fechaDesde = input<Date | null>();
  fechaHasta = input<Date | null>();
  ramoId = input<string | null>();

  ramos = input.required<{ id: string; nombre: string }[]>();

  fechaDesdeChange = output<Date | null>();
  fechaHastaChange = output<Date | null>();
  ramoIdChange = output<string | null>();
}
