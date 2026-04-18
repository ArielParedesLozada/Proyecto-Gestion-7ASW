import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Pantalla reservada para el formulario de alta; UI completa al conectar backend. */
@Component({
  selector: 'app-empresas-nueva-page',
  imports: [RouterLink, MatIconModule],
  templateUrl: './empresas-nueva.page.html',
  styleUrl: './empresas-nueva.page.scss',
})
export class EmpresasNuevaPage {}
