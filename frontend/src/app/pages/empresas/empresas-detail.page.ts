import { Component, inject } from '@angular/core';
import { HeaderUserMenuComponent } from '../../components/header-user-menu/header-user-menu.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/** Vista de detalle; se completará con datos del servicio al integrar la API. */
@Component({
  selector: 'app-empresas-detail-page',
  imports: [RouterLink, MatIconModule, HeaderUserMenuComponent],
  templateUrl: './empresas-detail.page.html',
  styleUrl: './empresas-detail.page.scss',
})
export class EmpresasDetailPage {
  private readonly route = inject(ActivatedRoute);
  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
}
