import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { MatIconModule } from '@angular/material/icon';

/** Vista de edición; se completará con datos del servicio al integrar la API. */
@Component({
  selector: 'app-empresas-edit-page',
  imports: [MainLayout, RouterLink, MatIconModule],
  templateUrl: './empresas-edit.page.html',
  styleUrl: './empresas-edit.page.scss',
})
export class EmpresasEditPage {
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
}
