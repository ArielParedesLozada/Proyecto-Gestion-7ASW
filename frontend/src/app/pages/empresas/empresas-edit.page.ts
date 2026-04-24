import { Component, inject } from '@angular/core';
import { HeaderUserMenuComponent } from '../../components/header-user-menu/header-user-menu.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Vista de edición; se completará con datos del servicio al integrar la API. */
@Component({
  selector: 'app-empresas-edit-page',
  imports: [RouterLink, MatIconModule, HeaderUserMenuComponent],
  templateUrl: './empresas-edit.page.html',
  styleUrl: './empresas-edit.page.scss',
})
export class EmpresasEditPage {
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
}
