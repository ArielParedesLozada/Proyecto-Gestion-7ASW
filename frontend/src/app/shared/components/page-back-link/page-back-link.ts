import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-back-link',
  imports: [RouterLink, MatIconModule],
  templateUrl: './page-back-link.html',
  styleUrl: './page-back-link.scss',
})
export class PageBackLink {
  /** Ruta de destino (string o segmentos para `routerLink`). */
  readonly link = input<string | readonly (string | number)[]>('/polizas');
  readonly label = input('Volver a pólizas');
}
