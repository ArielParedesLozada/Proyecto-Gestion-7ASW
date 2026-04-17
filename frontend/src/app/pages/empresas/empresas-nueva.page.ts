import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { MatIconModule } from '@angular/material/icon';

/** Pantalla reservada para el formulario de alta; UI completa al conectar backend. */
@Component({
  selector: 'app-empresas-nueva-page',
  imports: [MainLayout, RouterLink, MatIconModule],
  templateUrl: './empresas-nueva.page.html',
  styleUrl: './empresas-nueva.page.scss',
})
export class EmpresasNuevaPage {}
