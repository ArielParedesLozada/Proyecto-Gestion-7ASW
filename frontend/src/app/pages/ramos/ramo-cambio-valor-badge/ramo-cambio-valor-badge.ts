import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ramo-cambio-valor-badge',
  templateUrl: './ramo-cambio-valor-badge.html',
  styleUrl: './ramo-cambio-valor-badge.scss',
})
export class RamoCambioValorBadge {
  readonly cambioValor = input.required<boolean>();
}
